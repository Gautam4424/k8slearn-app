/**
 * instrumentation.node.ts
 * -----------------------
 * Node.js-only content-sync logic, dynamically imported by instrumentation.ts.
 * This file is NEVER evaluated by the Edge runtime.
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// ── Config ─────────────────────────────────────────────────────────────────
const SYNC_INTERVAL_MS = 5 * 60 * 1000   // 5 minutes
const ROOT_DIR         = process.cwd()
const CONTENT_DIR      = path.join(ROOT_DIR, 'content')
const LOG_FILE         = path.join(ROOT_DIR, 'content-sync.log')
const MAX_LOG_BYTES    = 5 * 1024 * 1024  // 5 MB before rotation

// ── Logging ─────────────────────────────────────────────────────────────────
function log(level: string, msg: string) {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase().padEnd(5)}] ${msg}`
  console.log(`[content-sync] ${line}`)
  try {
    if (fs.existsSync(LOG_FILE)) {
      const { size } = fs.statSync(LOG_FILE)
      if (size > MAX_LOG_BYTES) {
        fs.renameSync(LOG_FILE, LOG_FILE + '.old')
      }
    }
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8')
  } catch (_) {
    // Non-fatal
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function run(cmd: string, cwd: string = ROOT_DIR): string {
  return execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' }).trim()
}

function contentExists(): boolean {
  if (!fs.existsSync(CONTENT_DIR)) return false
  try {
    return fs.readdirSync(CONTENT_DIR).length > 0
  } catch (_) {
    return false
  }
}

function localHead(): string | null {
  try { return run('git rev-parse HEAD', CONTENT_DIR) } catch (_) { return null }
}

function remoteHead(): string | null {
  try {
    run('git fetch origin', CONTENT_DIR)
    return run('git rev-parse FETCH_HEAD', CONTENT_DIR)
  } catch (_) { return null }
}

// ── Core sync ────────────────────────────────────────────────────────────────
function syncContent() {
  log('info', '── sync check ──────────────────────────────────────────────')

  if (!contentExists()) {
    log('warn', 'content/ is empty or missing — initialising submodule...')
    try {
      run('git submodule update --init --recursive')
      log('info', 'Submodule initialised successfully.')
    } catch (err: unknown) {
      log('error', `Init failed: ${(err as Error).message}`)
    }
    return
  }

  log('info', 'content/ present — checking remote for updates...')
  const local  = localHead()
  const remote = remoteHead()

  if (!remote) {
    log('warn', 'Cannot reach remote — skipping pull.')
    return
  }

  if (local === remote) {
    log('info', `Up-to-date at ${(local ?? 'unknown').slice(0, 8)}.`)
    return
  }

  log('info', `Behind remote (local: ${(local ?? 'none').slice(0, 8)}, remote: ${remote.slice(0, 8)}) — pulling...`)
  try {
    run('git submodule update --remote --merge')
    log('info', 'Content updated successfully.')
  } catch (err: unknown) {
    log('error', `Pull failed: ${(err as Error).message}`)
  }
}

// ── Entry point called from instrumentation.ts ───────────────────────────────
export function startContentSync() {
  const intervalMin = Math.round(SYNC_INTERVAL_MS / 60_000)
  console.log(`[content-sync] Starting — will sync content every ${intervalMin} minute(s).`)

  // Run immediately on server start
  try { syncContent() } catch (err) {
    console.error('[content-sync] Startup sync error:', err)
  }

  // Then repeat every SYNC_INTERVAL_MS
  const timer = setInterval(() => {
    try { syncContent() } catch (err) {
      console.error('[content-sync] Scheduled sync error:', err)
    }
  }, SYNC_INTERVAL_MS)

  // Prevent the timer from keeping the process alive if Next.js shuts down cleanly
  if (timer.unref) timer.unref()

  console.log(`[content-sync] Cron registered — next run in ${intervalMin} minute(s). Log → content-sync.log`)
}
