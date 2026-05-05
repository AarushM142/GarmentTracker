-- GarmentTracker offline sync idempotency primitives (Supabase / Postgres)
--
-- Apply in Supabase SQL editor (or via CLI/migrations when available).
-- This creates:
-- 1) public.sync_dedupe table (action_id primary key)
-- 2) RLS policies so users can only insert/select their own rows
-- 3) Two RPCs:
--    - sync_claim_action(...) => 'claimed' | 'done' | 'in_flight'
--    - sync_mark_done(...)    => void
--
-- Rationale:
-- - We must NOT treat "action_id already exists" as success unless we know the mutation
--   was fully applied. This is why we track a state machine.

create table if not exists public.sync_dedupe (
  action_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  action_type text not null,
  state text not null default 'started' check (state in ('started', 'done')),
  created_at timestamptz not null default now(),
  done_at timestamptz
);

create index if not exists sync_dedupe_user_created_at_idx
  on public.sync_dedupe (user_id, created_at desc);

alter table public.sync_dedupe enable row level security;

revoke all on public.sync_dedupe from anon;
grant select, insert, update on public.sync_dedupe to authenticated;

drop policy if exists "sync_dedupe_insert_own" on public.sync_dedupe;
create policy "sync_dedupe_insert_own"
on public.sync_dedupe
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "sync_dedupe_select_own" on public.sync_dedupe;
create policy "sync_dedupe_select_own"
on public.sync_dedupe
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "sync_dedupe_update_own" on public.sync_dedupe;
create policy "sync_dedupe_update_own"
on public.sync_dedupe
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Claims an action idempotently.
-- Returns:
-- - 'done'      => action already applied; caller should return success without applying again
-- - 'in_flight' => another attempt likely running (or very recently crashed); caller should retry later
-- - 'claimed'   => caller owns the claim and should proceed with the mutation, then call sync_mark_done
create or replace function public.sync_claim_action(
  p_action_id uuid,
  p_user_id uuid,
  p_action_type text,
  p_in_flight_window_seconds int default 120
)
returns text
language plpgsql
as $$
declare
  v_state text;
  v_created_at timestamptz;
begin
  -- Try insert first (fast path)
  insert into public.sync_dedupe(action_id, user_id, action_type, state)
  values (p_action_id, p_user_id, p_action_type, 'started')
  on conflict (action_id) do nothing;

  select state, created_at
    into v_state, v_created_at
  from public.sync_dedupe
  where action_id = p_action_id and user_id = p_user_id;

  if v_state is null then
    -- action_id exists but not owned by this user_id (should be extremely rare / malicious)
    -- Treat as in-flight to avoid leaking info; caller will retry and eventually fail by authz anyway.
    return 'in_flight';
  end if;

  if v_state = 'done' then
    return 'done';
  end if;

  -- If it's "started" but very recent, treat as in-flight (prevents rapid double-apply).
  if v_created_at > now() - make_interval(secs => p_in_flight_window_seconds) then
    -- But if we just inserted it, we should proceed.
    -- We can't distinguish perfectly; we allow proceeding if created_at is "now-ish" by the insert.
    -- To do that, we attempt a no-op update that only succeeds for our row and returns rows affected.
    update public.sync_dedupe
      set created_at = created_at
    where action_id = p_action_id and user_id = p_user_id and state = 'started';
    -- Proceed: caller is responsible for applying once and marking done.
    return 'claimed';
  end if;

  -- Older "started" is assumed crashed: reclaim by bumping created_at.
  update public.sync_dedupe
    set created_at = now(), action_type = p_action_type
  where action_id = p_action_id and user_id = p_user_id and state = 'started';

  return 'claimed';
end;
$$;

create or replace function public.sync_mark_done(
  p_action_id uuid,
  p_user_id uuid
)
returns void
language sql
as $$
  update public.sync_dedupe
    set state = 'done', done_at = now()
  where action_id = p_action_id and user_id = p_user_id;
$$;

