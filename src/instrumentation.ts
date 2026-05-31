/**
 * instrumentation.ts
 * ------------------
 * Next.js server instrumentation hook (runs once when the server starts).
 *
 * All Node.js-specific logic lives in instrumentation.node.ts and is loaded
 * only when NEXT_RUNTIME === 'nodejs'. Turbopack never bundles that file for
 * the Edge runtime, which eliminates the child_process / fs / path warnings.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Guard: only run in the Node.js server runtime, never in Edge or build.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  // Dynamic import so Turbopack does NOT include instrumentation.node.ts
  // in the Edge bundle — the string literal must not be resolvable statically.
  const { startContentSync } = await import('./instrumentation.node')
  startContentSync()
}
