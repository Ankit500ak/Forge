'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildBlock,
  deriveLedger,
  hasRef,
  hasTitle,
  loadOrCreateSecret,
  loadStoredChain,
  storeChain,
  verifyChain,
  type DerivedLedger,
  type ItemKey,
  type LedgerBlock,
  type LedgerEntryType,
} from './ledger'

export type LedgerStatus = 'loading' | 'verified' | 'broken'

export interface UseLedger {
  status: LedgerStatus
  /** The full chain, oldest first. Null until loaded. */
  entries: LedgerBlock[] | null
  /** Balances derived from the valid chain (or its valid prefix). */
  derived: DerivedLedger | null
  /** Index of the first invalid block when the chain is broken. */
  firstInvalidIndex: number
  /** True whenever rewards must not move (loading or broken chain). */
  locked: boolean
  /** Truncate the chain to its last valid block and unlock. */
  restore: () => Promise<void>
  earnGold: (amount: number, source: string, ref?: string) => Promise<void>
  dropItem: (item: ItemKey) => Promise<void>
  useItem: (item: ItemKey, extra?: Record<string, unknown>) => Promise<boolean>
  earnKey: (weekKey: string) => Promise<void>
  buyReward: (name: string, cost: number) => Promise<boolean>
  redeemReward: (purchaseId: string) => Promise<void>
  recordBossWin: (boss: string, date: string) => Promise<void>
  earnTitle: (titleId: string, name: string) => Promise<void>
}

const SYSTEM_STATE_KEY = 'forge-system-state-v1'

/**
 * React face of the System Ledger. Loads the chain, verifies every
 * hash on mount, and serialises appends (HMAC is async, so appends
 * queue behind one another). While the chain is broken every mutator
 * is a no-op — the Player restores first, or earns nothing.
 */
export function useLedger(): UseLedger {
  const [status, setStatus] = useState<LedgerStatus>('loading')
  const [entries, setEntries] = useState<LedgerBlock[] | null>(null)
  const [derived, setDerived] = useState<DerivedLedger | null>(null)
  const [firstInvalidIndex, setFirstInvalidIndex] = useState(-1)

  const secretRef = useRef<string | null>(null)
  const chainRef = useRef<LedgerBlock[]>([])
  const statusRef = useRef<LedgerStatus>('loading')
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const purchaseCounterRef = useRef(0)

  const publish = useCallback((chain: LedgerBlock[]) => {
    chainRef.current = chain
    setEntries(chain)
    setDerived(deriveLedger(chain))
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const secret = loadOrCreateSecret()
      secretRef.current = secret
      let chain = loadStoredChain()

      if (chain.length === 0) {
        // First run of the ledger. A pre-existing System save means this
        // is a migration: the opening block says so, and the Player's
        // XP/level history stays where it always lived (System state).
        let type: LedgerEntryType = 'GENESIS'
        let payload: Record<string, unknown> = { note: 'System Ledger initialised.' }
        try {
          const rawSystem = window.localStorage.getItem(SYSTEM_STATE_KEY)
          if (rawSystem) {
            const parsed = JSON.parse(rawSystem) as { level?: number; totalXp?: number }
            type = 'MIGRATION'
            payload = {
              note: 'Reward ledger opened over an existing System save. XP and level remain in System state.',
              levelAtMigration: parsed.level ?? null,
              totalXpAtMigration: parsed.totalXp ?? null,
            }
          }
        } catch {
          // Unreadable save — a plain genesis is the honest fallback.
        }
        chain = [await buildBlock(chain, secret, type, payload)]
        storeChain(chain)
      }

      const result = await verifyChain(chain, secret)
      if (cancelled) return
      if (result.valid) {
        statusRef.current = 'verified'
        setStatus('verified')
        publish(chain)
      } else {
        statusRef.current = 'broken'
        setStatus('broken')
        setFirstInvalidIndex(result.firstInvalidIndex)
        // Balances shown while broken come from the valid prefix only.
        publish(chain.slice(0, result.firstInvalidIndex))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [publish])

  /** Serialise an append behind every earlier one. Resolves false when locked. */
  const append = useCallback(
    (type: LedgerEntryType, payload: Record<string, unknown>): Promise<boolean> => {
      let result = false
      const task = queueRef.current.then(async () => {
        if (statusRef.current !== 'verified' || !secretRef.current) return
        const block = await buildBlock(chainRef.current, secretRef.current, type, payload)
        const next = [...chainRef.current, block]
        storeChain(next)
        publish(next)
        result = true
      })
      queueRef.current = task.catch(() => undefined)
      return task.then(() => result)
    },
    [publish],
  )

  const restore = useCallback(async () => {
    const task = queueRef.current.then(async () => {
      if (statusRef.current !== 'broken' || !secretRef.current) return
      const full = loadStoredChain()
      const cut = Math.max(0, firstInvalidIndex)
      let next = full.slice(0, cut)
      if (next.length === 0) {
        next = [
          await buildBlock(next, secretRef.current, 'GENESIS', {
            note: 'Ledger restarted after integrity failure.',
          }),
        ]
      }
      storeChain(next)
      const check = await verifyChain(next, secretRef.current)
      if (check.valid) {
        statusRef.current = 'verified'
        setStatus('verified')
        setFirstInvalidIndex(-1)
        publish(next)
      }
    })
    queueRef.current = task.catch(() => undefined)
    return task
  }, [firstInvalidIndex, publish])

  const earnGold = useCallback(
    async (amount: number, source: string, ref?: string) => {
      if (amount <= 0) return
      // Idempotent per ref: a daily claim for a date pays out once, ever.
      if (ref && hasRef(chainRef.current, 'GOLD_EARN', ref)) return
      await append('GOLD_EARN', { amount, source, ...(ref ? { ref } : {}) })
    },
    [append],
  )

  const dropItem = useCallback(
    async (item: ItemKey) => {
      await append('ITEM_DROP', { item })
    },
    [append],
  )

  const useItem = useCallback(
    async (item: ItemKey, extra?: Record<string, unknown>) => {
      const held = deriveLedger(chainRef.current).items[item]
      if (held <= 0) return false
      return append('ITEM_USE', { item, ...(extra ?? {}) })
    },
    [append],
  )

  const earnKey = useCallback(
    async (weekKey: string) => {
      if (hasRef(chainRef.current, 'KEY_EARN', weekKey)) return
      await append('KEY_EARN', { ref: weekKey })
    },
    [append],
  )

  const buyReward = useCallback(
    async (name: string, cost: number) => {
      if (cost <= 0) return false
      // Balance is re-derived inside the purchase so a stale UI can
      // never overspend: the spend and the purchase land together.
      purchaseCounterRef.current += 1
      const purchaseId = `purchase-${Date.now()}-${purchaseCounterRef.current}`
      let bought = false
      const task = queueRef.current.then(async () => {
        if (statusRef.current !== 'verified' || !secretRef.current) return
        if (deriveLedger(chainRef.current).gold < cost) return
        const secret = secretRef.current
        const spend = await buildBlock(chainRef.current, secret, 'GOLD_SPEND', {
          amount: cost,
          source: 'shop',
          purchaseId,
        })
        const withSpend = [...chainRef.current, spend]
        const purchase = await buildBlock(withSpend, secret, 'PURCHASE', {
          purchaseId,
          name,
          cost,
        })
        const next = [...withSpend, purchase]
        storeChain(next)
        publish(next)
        bought = true
      })
      queueRef.current = task.catch(() => undefined)
      await task
      return bought
    },
    [publish],
  )

  const redeemReward = useCallback(
    async (purchaseId: string) => {
      await append('REDEEM', { purchaseId })
    },
    [append],
  )

  const recordBossWin = useCallback(
    async (boss: string, date: string) => {
      if (hasRef(chainRef.current, 'BOSS_WIN', date)) return
      await append('BOSS_WIN', { boss, date, ref: date })
    },
    [append],
  )

  const earnTitle = useCallback(
    async (titleId: string, name: string) => {
      if (hasTitle(chainRef.current, titleId)) return
      await append('TITLE_EARN', { titleId, name })
    },
    [append],
  )

  return {
    status,
    entries,
    derived,
    firstInvalidIndex,
    locked: status !== 'verified',
    restore,
    earnGold,
    dropItem,
    useItem,
    earnKey,
    buyReward,
    redeemReward,
    recordBossWin,
    earnTitle,
  }
}
