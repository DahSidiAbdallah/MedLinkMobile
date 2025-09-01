import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'telemetry_queue_v1'

export type ScanEvent = { [k: string]: any; timestamp?: number }

type Config = {
  endpoint: string
  batchSize?: number
  flushIntervalMs?: number
  maxRetries?: number
  maxQueueSize?: number
  authToken?: string | null
}

const defaultConfig: Config = { endpoint: 'https://example.com/telemetry', batchSize: 20, flushIntervalMs: 30000, maxRetries: 3, maxQueueSize: 1000, authToken: null }

class TelemetryService {
  private queue: ScanEvent[] = []
  private readonly config: Config
  private timer: NodeJS.Timeout | null = null
  private retryCounts: Record<number, number> = {}
  private retryCountsByBatchId: Record<string, number> = {}
  private shuttingDown = false

  constructor(cfg?: Partial<Config>) {
    this.config = { ...defaultConfig, ...(cfg || {}) }
    this.startTimer()
  }

  async init() {
    try {
      await this.loadQueue()
    } catch (e) {
      console.warn('telemetry loadQueue failed', e)
    }
  }

  private startTimer() {
    if (this.timer) return
  this.timer = setInterval(() => this.flush().catch(() => {}), this.config.flushIntervalMs)
  // allow Node.js to exit even if timer exists (helps Jest shutdown)
  try { if ((this.timer as any)?.unref) (this.timer as any).unref() } catch (e) {}
  }

  private stopTimer() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  async loadQueue() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) this.queue = JSON.parse(raw)
    } catch (e) {
      console.warn('telemetry loadQueue parse failed', e)
      this.queue = []
    }
  }

  async persistQueue() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue))
    } catch {}
  }

  record(event: ScanEvent) {
    const entry = { timestamp: Date.now(), ...event }
    // Backpressure: drop oldest if queue exceeds maxQueueSize
    if (this.queue.length >= (this.config.maxQueueSize || 1000)) {
      // drop oldest 10% to relieve pressure
      const drop = Math.ceil((this.config.maxQueueSize || 1000) * 0.1)
      this.queue = this.queue.slice(drop)
    }
    this.queue.push(entry)
    this.persistQueue().catch(() => {})
    if (this.queue.length >= (this.config.batchSize || 20)) this.flush().catch(() => {})
    return entry
  }

  async flush() {
    if (this.shuttingDown) return
    if (this.queue.length === 0) return
    const batchStart = 0
    const batch = this.queue.slice(batchStart, batchStart + (this.config.batchSize || 20))
    // create a per-batch id so retry bookkeeping survives ordering changes
    const batchId = `b_${Date.now()}_${Math.floor(Math.random() * 100000)}`
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      // expose batch id to server for idempotency/debugging
      headers['X-Telemetry-Batch-Id'] = batchId
      if (this.config.authToken) headers['Authorization'] = `Bearer ${this.config.authToken}`
      const resp = await fetch(this.config.endpoint, { method: 'POST', headers, body: JSON.stringify({ batchId, events: batch }) })
      if (!resp.ok) throw new Error('upload failed')
      // remove sent
      this.queue = this.queue.slice(batchStart + batch.length)
      await this.persistQueue()
      // reset retry count for this batch id
      delete this.retryCountsByBatchId[batchId]
    } catch (e) {
      // jittered exponential backoff bookkeeping per batchId
      this.retryCountsByBatchId[batchId] = (this.retryCountsByBatchId[batchId] || 0) + 1
      const retryNum = this.retryCountsByBatchId[batchId]
      const maxRetries = this.config.maxRetries || 3
      if (retryNum > maxRetries) {
        // drop the batch after too many retries to avoid blocking newer events
        this.queue = this.queue.slice(batch.length)
        await this.persistQueue()
        delete this.retryCountsByBatchId[batchId]
      } else {
        // base backoff (ms)
        const base = 500 * Math.pow(2, retryNum)
        const capped = Math.min(30000, base)
        // jitter between 0.5x and 1.5x
        const jitter = (0.5 + Math.random())
        const backoffMs = Math.floor(capped * jitter)
        await new Promise(r => setTimeout(r, backoffMs))
      }
      // bubble error upwards for logging
      console.error('Telemetry upload failed', e)
      throw e
    }
  }

  async drainForTest() {
    // attempt immediate flush until empty
    try {
      while (this.queue.length > 0) {
        try { await this.flush() } catch { break }
      }
    } catch (e) { console.warn('drainForTest error', e) }
  }

  getQueue() { return [...this.queue] }

  // Test and lifecycle helpers
  shutdown() {
    this.shuttingDown = true
    this.stopTimer()
  }

  async clearAndPersistForTest() {
    this.queue = []
    await this.persistQueue()
  }
}

// Helper to build a structured scan telemetry event
export function makeScanTelemetryEvent(params: { scanType: string; decodeTimeMs?: number; verificationTelemetry?: any; cacheHit?: boolean; sourceBadges?: string[]; errorCodes?: string[] }) {
  return {
    scanType: params.scanType,
    decodeTimeMs: params.decodeTimeMs,
    lookupLatencyMs: params.verificationTelemetry?.latencies || {},
    lookupCacheHits: params.verificationTelemetry?.cacheHits || {},
    cacheHit: params.cacheHit || false,
    sourceBadges: params.sourceBadges || [],
    errorCodes: params.errorCodes || [],
    ts: Date.now(),
  }
}

// For tests and app startup: allow creating a configurable instance
export function createTelemetryService(cfg?: Partial<Config>) { return new TelemetryService(cfg) }

// App-level singleton management: the service should be explicitly created and
// initialized in app startup to avoid side-effects during module import (helps tests)
let _appTelemetry: TelemetryService | null = null
export function setTelemetryService(svc: TelemetryService) { _appTelemetry = svc }
export function getTelemetryService() { return _appTelemetry }
export { TelemetryService }
