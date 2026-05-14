import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ── Role → data fetching ──────────────────────────────────────────────────────

async function fetchERPContext(role: string) {
  const supabase = await createClient()

  if (role === 'director' || role === 'super_admin') {
    const [{ data: orders }, { data: prs }] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select('id, status, buyer, total_pieces, advance_amount_inr')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('purchase_requests')
        .select('id, status, item_name, quantity, created_at')
        .eq('status', 'pending')
        .limit(10),
    ])
    return { purchase_orders: orders ?? [], pending_purchase_requests: prs ?? [] }
  }

  if (role === 'store_manager') {
    const [{ data: inventory }, { data: orders }] = await Promise.all([
      supabase
        .from('inventory')
        .select('id, item_name, quantity_on_hand, low_stock_threshold')
        .limit(30),
      supabase
        .from('purchase_orders')
        .select('id, status, buyer, total_pieces, advance_amount_inr')
        .in('status', ['draft', 'pending_stock', 'material_released'])
        .limit(15),
    ])
    return { inventory: inventory ?? [], purchase_orders: orders ?? [] }
  }

  if (role === 'cutting_master') {
    const { data: orders } = await supabase
      .from('purchase_orders')
      .select('id, status, buyer, total_pieces, advance_amount_inr')
      .in('status', ['material_released', 'cutting'])
      .limit(15)
    return { purchase_orders: orders ?? [] }
  }

  if (role === 'production_supervisor') {
    const { data: orders } = await supabase
      .from('purchase_orders')
      .select('id, status, buyer, total_pieces, advance_amount_inr')
      .in('status', ['cutting', 'fusing', 'stitching', 'kaj_buttoning', 'finishing_ironing', 'qc', 'rework'])
      .limit(20)
    return { purchase_orders: orders ?? [] }
  }

  if (role === 'accounts_manager') {
    const [{ data: orders }, { data: payments }, { data: prs }] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select('id, status, buyer, total_pieces, advance_amount_inr')
        .in('status', ['packing', 'dispatched'])
        .limit(15),
      supabase
        .from('payments')
        .select('id, po_id, amount, created_at')
        .order('created_at', { ascending: false })
        .limit(15),
      supabase
        .from('purchase_requests')
        .select('id, status, item_name, quantity, created_at')
        .eq('status', 'pending')
        .limit(10),
    ])
    return {
      purchase_orders: orders ?? [],
      payments: payments ?? [],
      pending_purchase_requests: prs ?? [],
    }
  }

  return {}
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(role: string, language: string, erpContext: object) {
  const langInstructions: Record<string, string> = {
    hindi: `Respond ONLY in Hindi (Devanagari script). Use these domain terms exactly:
ऑर्डर (order), स्टॉक (inventory), कटाई (cutting), सिलाई (stitching),
गुणवत्ता जाँच (QC), भेजा गया (dispatched), बाकी है (pending).`,
    marathi: `Respond ONLY in Marathi (Devanagari script). Use these domain terms exactly:
ऑर्डर (order), माल साठा (inventory), कापणी (cutting), शिलाई (stitching),
गुणवत्ता तपासणी (QC), पाठवले (dispatched), बाकी आहे (pending).`,
    english: `Respond in English.`,
  }

  const langRule = langInstructions[language] ?? langInstructions.english

  const contextStr = JSON.stringify(erpContext)


  return `You are GarmentTracker AI, a concise ERP assistant for a garment factory.
User role: ${role}
${langRule}

Current ERP data (use ONLY this data — never invent numbers or orders):
${contextStr}

Rules:
1. Be brief. Factory workers are busy.
2. Never invent data not present in the ERP context above.
3. If the user asks you to perform an action (raise a purchase request, add stock,
   issue material to floor, update an order status, or log a payment), respond with
   ONLY a raw JSON block and nothing else, in this exact format:
   {"action":"ACTION_NAME","params":{}}
   Valid action names: GENERATE_PR, ADD_STOCK, ISSUE_TO_FLOOR, UPDATE_PO_STATUS, LOG_PAYMENT
4. Do not explain the JSON — output it alone with no surrounding text.
5. If the request is a question, answer it conversationally in the correct language.`
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, role, language, conversationHistory } = body as {
      message: string
      role: string
      language: string
      conversationHistory: { role: 'user' | 'assistant'; content: string }[]
    }

    if (!message || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch role-scoped ERP context
    const erpContext = await fetchERPContext(role)

    const systemPrompt = buildSystemPrompt(role, language ?? 'english', erpContext)

    // Keep only last 6 messages to stay within free-tier token budget
    const recentHistory = (conversationHistory ?? []).slice(-6)

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: message },
    ]

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      temperature: 0.3,
    })

    const reply = completion.choices[0]?.message?.content ?? ''
    return NextResponse.json({ reply })
  } catch (err: unknown) {
    // Groq rate-limit
    if (
      err &&
      typeof err === 'object' &&
      'status' in err &&
      (err as { status: number }).status === 429
    ) {
      return NextResponse.json({
        reply:
          '⚠️ थोडा थांबा... / एक मिनट रुको... / Please wait a moment and try again.',
      })
    }

    console.error('[chat/route] error:', err)
    return NextResponse.json(
      { reply: '⚠️ Something went wrong on the server. Please try again.' },
      { status: 500 }
    )
  }
}
