#!/usr/bin/env node
/**
 * sync-content.js
 * ---------------
 * Checks whether the k8slearn-content submodule is initialised and up-to-date.
 * - If the content/ directory is empty or missing  → git submodule update --init --recursive
 * - If content is present                          → git submodule update --remote --merge
 *
 * Exit codes:
 *   0  success
 *   1  git command failed
 *
 * Usage:
 *   node scripts/sync-content.js           (single run)
 *   npm run sync                            (same, via package.json)
 */

const { execSync } = require('child_process')
const fs           = require('fs')
const path         = require('path')

// ── Paths ────────────────────────────────────────────────────────────────────
const ROOT_DIR    = path.resolve(__dirname, '..')
const CONTENT_DIR = path.join(ROOT_DIR, 'content')
const LOG_FILE    = path.join(ROOT_DIR, 'content-sync.log')
const MAX_LOG_MB  = 5   // rotate when log exceeds this size

// ── Helpers ──────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString()
}

function log(level, msg) {
  const line = `[${timestamp()}] [${level.toUpperCase().padEnd(5)}] ${msg}`
  console.log(line)
  try {
    // Rotate log if it gets too large
    if (fs.existsSync(LOG_FILE)) {
      const { size } = fs.statSync(LOG_FILE)
      if (size > MAX_LOG_MB * 1024 * 1024) {
        fs.renameSync(LOG_FILE, LOG_FILE + '.old')
      }
    }
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8')
  } catch (_) {
    // Non-fatal — logging should never crash the sync
  }
}

function run(cmd, cwd = ROOT_DIR) {
  return execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' }).trim()
}

// ── Status checks ─────────────────────────────────────────────────────────────

/**
 * Returns true if the content directory exists and has at least one file/folder.
 */
function contentExists() {
  if (!fs.existsSync(CONTENT_DIR)) return false
  try {
    return fs.readdirSync(CONTENT_DIR).length > 0
  } catch (_) {
    return false
  }
}

/**
 * Returns the current local commit SHA of the submodule HEAD.
 * Returns null if submodule is not initialised.
 */
function localSubmoduleHead() {
  try {
    return run('git rev-parse HEAD', CONTENT_DIR)
  } catch (_) {
    return null
  }
}

/**
 * Fetches the remote HEAD of the submodule's tracked branch and returns its SHA.
 * Returns null on network/git error.
 */
function remoteSubmoduleHead() {
  try {
    // Pull down remote refs without merging
    run('git fetch origin', CONTENT_DIR)
    return run('git rev-parse FETCH_HEAD', CONTENT_DIR)
  } catch (_) {
    return null
  }
}

// ── Core sync logic ───────────────────────────────────────────────────────────

function syncContent() {
  log('info', '─── Content sync check started ───────────────────────────')

  // 1. Content directory is empty / submodule never initialised
  if (!contentExists()) {
    log('warn', 'content/ directory is empty or missing — initialising submodule...')
    try {
      const out = run('git submodule update --init --recursive')
      log('info', `Submodule initialised. ${out || '(no output)'}`)
    } catch (err) {
      log('error', `Failed to initialise submodule: ${err.message}`)
      process.exitCode = 1
    }
    log('info', '─── Sync complete ────────────────────────────────────────')
    return
  }

  // 2. Content exists — check whether we are behind remote
  log('info', 'content/ directory is present. Checking remote for updates...')

  const localSHA  = localSubmoduleHead()
  const remoteSHA = remoteSubmoduleHead()

  if (!remoteSHA) {
    log('warn', 'Could not reach remote — skipping pull (network issue or no remote configured).')
    log('info', '─── Sync complete (no changes) ───────────────────────────')
    return
  }

  if (localSHA === remoteSHA) {
    log('info', `Already up-to-date at ${localSHA ? localSHA.slice(0, 8) : 'unknown'}.`)
    log('info', '─── Sync complete (no changes) ───────────────────────────')
    return
  }

  log('info', `Behind remote (local: ${(localSHA || 'none').slice(0, 8)}, remote: ${remoteSHA.slice(0, 8)}) — pulling...`)

  try {
    const out = run('git submodule update --remote --merge')
    log('info', `Content updated successfully. ${out || '(no output)'}`)
  } catch (err) {
    log('error', `Pull failed: ${err.message}`)
    process.exitCode = 1
  }

  log('info', '─── Sync complete ────────────────────────────────────────')
}

// ── Entry point ───────────────────────────────────────────────────────────────

syncContent()
