// The System Ledger — a local, hash-chained, tamper-EVIDENT record of
// everything the Player earns and spends (gold, items, dungeon keys,
// shop purchases, titles, boss victories).
//
// Design, stated honestly: this is a blockchain *structure*, not magic.
// Blocks form an append-only chain in localStorage. Every block's hash
// is an HMAC-SHA256 (keyed with a per-install secret) over the block's
// contents plus the previous block's hash. Editing any entry — a gold
// amount, a dropped item — without the secret breaks the chain, and the
// break is detected on load: the reward UI locks and the Player is
// offered a restore that truncates the chain to its last valid block.
// Balances are never stored as mutable numbers; they are always derived
// by reducing the chain, so there is no balance field to edit.
//
// The module is pure and environment-free (WebCrypto via globalThis),
// so it can be exercised from a node sanity check as well as the app.

export type LedgerEntryType =
  | 'GENESIS'
  | 'MIGRATION'
  | 'GOLD_EARN'
  | 'GOLD_SPEND'
  | 'ITEM_DROP'
  | 'ITEM_USE'
  | 'PURCHASE'
  | 'REDEEM'
  | 'KEY_EARN'
  | 'BOSS_WIN'
  | 'TITLE_EARN'

/** Items that can sit in the Player's inventory. */
export type ItemKey = 'streak-shield' | 'double-xp-elixir' | 'rest-pass' | 'dungeon-key'

export interface LedgerBlock {
  index: number
  /** Epoch milliseconds when the block was appended. */
  timestamp: number
  type: LedgerEntryType
  payload: Record<string, unknown>
  prevHash: string
  hash: string
}

export interface LedgerPurchase {
  id: string
  name: string
  cost: number
  timestamp: number
  redeemed: boolean
}

export interface LedgerShadow {
  /** Name of the defeated boss. */
  name: string
  /** Local date (yyyy-mm-dd) of the victory. */
  date: string
}

export interface DerivedLedger {
  /** Spendable gold: every GOLD_EARN minus every GOLD_SPEND. */
  gold: number
  /** Total gold ever earned (feeds the Gold Hunter title). */
  lifetimeGoldEarned: number
  /** Inventory counts, derived from drops/earns minus uses. */
  items: Record<ItemKey, number>
  /** Shop purchases, oldest first, with redemption state. */
  purchases: LedgerPurchase[]
  /** Title ids in the order they were earned. */
  titles: string[]
  /** Bosses defeated, in victory order. */
  shadows: LedgerShadow[]
}

export const LEDGER_STORAGE_KEY = 'forge-ledger-v1'
export const LEDGER_SECRET_KEY = 'forge-ledger-secret-v1'

const ZERO_HASH = '0'.repeat(64)
const textEncoder = new TextEncoder()

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return Array.from(view, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** The exact string a block's hash commits to. */
function blockPreimage(block: Omit<LedgerBlock, 'hash'>): string {
  return [
    block.index,
    block.timestamp,
    block.type,
    JSON.stringify(block.payload),
    block.prevHash,
  ].join('|')
}

/**
 * HMAC-SHA256 of the block preimage, keyed with the per-install secret.
 * Without the secret a forged block cannot carry a valid hash.
 */
export async function computeBlockHash(
  secret: string,
  block: Omit<LedgerBlock, 'hash'>,
): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('WebCrypto is unavailable in this environment.')
  const key = await subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await subtle.sign('HMAC', key, textEncoder.encode(blockPreimage(block)))
  return toHex(signature)
}

/** Build the next block for a chain (does not mutate the chain). */
export async function buildBlock(
  chain: readonly LedgerBlock[],
  secret: string,
  type: LedgerEntryType,
  payload: Record<string, unknown>,
  timestamp: number = Date.now(),
): Promise<LedgerBlock> {
  const prev = chain[chain.length - 1]
  const draft: Omit<LedgerBlock, 'hash'> = {
    index: chain.length,
    timestamp,
    type,
    payload,
    prevHash: prev ? prev.hash : ZERO_HASH,
  }
  return { ...draft, hash: await computeBlockHash(secret, draft) }
}

export interface ChainVerification {
  valid: boolean
  /** Index of the first block that fails verification, or -1 when valid. */
  firstInvalidIndex: number
}

/**
 * Recompute every hash and every link. A single edited payload, amount
 * or timestamp anywhere in the chain invalidates that block (and the
 * link of the next one).
 */
export async function verifyChain(
  chain: readonly LedgerBlock[],
  secret: string,
): Promise<ChainVerification> {
  for (let i = 0; i < chain.length; i++) {
    const block = chain[i]
    if (!block || block.index !== i) return { valid: false, firstInvalidIndex: i }
    const expectedPrev = i === 0 ? ZERO_HASH : chain[i - 1].hash
    if (block.prevHash !== expectedPrev) return { valid: false, firstInvalidIndex: i }
    const recomputed = await computeBlockHash(secret, block)
    if (recomputed !== block.hash) return { valid: false, firstInvalidIndex: i }
  }
  return { valid: true, firstInvalidIndex: -1 }
}

function emptyItems(): Record<ItemKey, number> {
  return { 'streak-shield': 0, 'double-xp-elixir': 0, 'rest-pass': 0, 'dungeon-key': 0 }
}

function asItemKey(value: unknown): ItemKey | null {
  return value === 'streak-shield' ||
    value === 'double-xp-elixir' ||
    value === 'rest-pass' ||
    value === 'dungeon-key'
    ? value
    : null
}

function asAmount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

/**
 * Reduce a chain into the Player's reward state. This is the ONLY way
 * balances come into existence — nothing anywhere stores a gold total.
 */
export function deriveLedger(chain: readonly LedgerBlock[]): DerivedLedger {
  const derived: DerivedLedger = {
    gold: 0,
    lifetimeGoldEarned: 0,
    items: emptyItems(),
    purchases: [],
    titles: [],
    shadows: [],
  }
  const purchaseById = new Map<string, LedgerPurchase>()

  for (const block of chain) {
    const p = block.payload
    switch (block.type) {
      case 'GOLD_EARN': {
        const amount = asAmount(p.amount)
        derived.gold += amount
        derived.lifetimeGoldEarned += amount
        break
      }
      case 'GOLD_SPEND':
        derived.gold -= asAmount(p.amount)
        break
      case 'ITEM_DROP': {
        const item = asItemKey(p.item)
        if (item) derived.items[item] += 1
        break
      }
      case 'ITEM_USE': {
        const item = asItemKey(p.item)
        if (item) derived.items[item] = Math.max(0, derived.items[item] - 1)
        break
      }
      case 'KEY_EARN':
        derived.items['dungeon-key'] += 1
        break
      case 'PURCHASE': {
        const id = typeof p.purchaseId === 'string' ? p.purchaseId : ''
        if (!id) break
        const purchase: LedgerPurchase = {
          id,
          name: typeof p.name === 'string' ? p.name : 'Reward',
          cost: asAmount(p.cost),
          timestamp: block.timestamp,
          redeemed: false,
        }
        derived.purchases.push(purchase)
        purchaseById.set(id, purchase)
        break
      }
      case 'REDEEM': {
        const purchase = typeof p.purchaseId === 'string' ? purchaseById.get(p.purchaseId) : undefined
        if (purchase) purchase.redeemed = true
        break
      }
      case 'TITLE_EARN': {
        if (typeof p.titleId === 'string' && !derived.titles.includes(p.titleId)) {
          derived.titles.push(p.titleId)
        }
        break
      }
      case 'BOSS_WIN': {
        if (typeof p.boss === 'string') {
          derived.shadows.push({
            name: p.boss,
            date: typeof p.date === 'string' ? p.date : '',
          })
        }
        break
      }
      default:
        break
    }
  }
  return derived
}

/** True when the chain already holds an entry of `type` carrying `ref`. */
export function hasRef(chain: readonly LedgerBlock[], type: LedgerEntryType, ref: string): boolean {
  return chain.some((b) => b.type === type && b.payload.ref === ref)
}

/** True when a title has already been recorded as earned. */
export function hasTitle(chain: readonly LedgerBlock[], titleId: string): boolean {
  return chain.some((b) => b.type === 'TITLE_EARN' && b.payload.titleId === titleId)
}

// ---------------------------------------------------------------------------
// Browser storage (guarded so the module stays importable from node).

/** Load the per-install secret, creating one on first run. */
export function loadOrCreateSecret(): string {
  try {
    const existing = window.localStorage.getItem(LEDGER_SECRET_KEY)
    if (existing) return existing
    const bytes = new Uint8Array(32)
    globalThis.crypto.getRandomValues(bytes)
    const secret = toHex(bytes)
    window.localStorage.setItem(LEDGER_SECRET_KEY, secret)
    return secret
  } catch {
    // Storage unavailable (private mode, node) — an ephemeral secret
    // keeps the session consistent; nothing persists anyway.
    const bytes = new Uint8Array(32)
    globalThis.crypto.getRandomValues(bytes)
    return toHex(bytes)
  }
}

export function loadStoredChain(): LedgerBlock[] {
  try {
    const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (b): b is LedgerBlock =>
        b &&
        typeof b.index === 'number' &&
        typeof b.timestamp === 'number' &&
        typeof b.type === 'string' &&
        typeof b.prevHash === 'string' &&
        typeof b.hash === 'string' &&
        b.payload &&
        typeof b.payload === 'object',
    )
  } catch {
    return []
  }
}

export function storeChain(chain: readonly LedgerBlock[]): void {
  try {
    window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(chain))
  } catch {
    // Storage full/blocked — the in-memory chain still governs the session.
  }
}
