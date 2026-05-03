/**
 * Structured error logger for GarmentTracker.
 *
 * TODAY: writes to console with structured context.
 * PRODUCTION: swap the `console.error` calls below for Sentry:
 *   1. Run: npx @sentry/wizard@latest -i nextjs
 *   2. Uncomment the Sentry lines and remove the console lines.
 *
 * Context fields (attach as many as available):
 *   po_id      - the purchase order being mutated
 *   action     - the server action name (e.g. 'updatePOStatus')
 *   user_role  - the authenticated user's role from user_metadata
 *   user_id    - the authenticated user's UUID
 */

export interface LogContext {
  po_id?: string
  action?: string
  user_role?: string
  user_id?: string
  [key: string]: string | undefined
}

/**
 * Log a caught error with structured context.
 * Replace the body of this function with Sentry when ready.
 */
export function captureError(err: unknown, ctx: LogContext = {}) {
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined

  // Structured console output (readable in Vercel/Supabase logs)
  console.error(JSON.stringify({
    level: 'error',
    message,
    ...ctx,
    stack,
    timestamp: new Date().toISOString(),
  }))

  // --- Uncomment when Sentry is installed ---
  // import * as Sentry from '@sentry/nextjs'
  // Sentry.withScope(scope => {
  //   scope.setTags(ctx)
  //   Sentry.captureException(err)
  // })
}

/**
 * Log a warning (non-fatal, but noteworthy — e.g. low stock, version conflict).
 */
export function captureWarning(message: string, ctx: LogContext = {}) {
  console.warn(JSON.stringify({
    level: 'warn',
    message,
    ...ctx,
    timestamp: new Date().toISOString(),
  }))
}
