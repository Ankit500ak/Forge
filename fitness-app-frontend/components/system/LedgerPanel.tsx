'use client'

import type { LedgerBlock } from '@/lib/system/ledger'
import type { LedgerStatus } from '@/lib/system/use-ledger'
import { SystemWindow } from './SystemWindow'
import { CheckIcon } from './icons'

interface LedgerPanelProps {
  status: LedgerStatus
  entries: LedgerBlock[] | null
  firstInvalidIndex: number
  onRestore: () => void
}

/** How many of the newest blocks the viewer lists. */
const VISIBLE_BLOCKS = 8

function blockDetail(block: LedgerBlock): string {
  const p = block.payload
  switch (block.type) {
    case 'GOLD_EARN':
      return typeof p.source === 'string' ? p.source.replace(/-/g, ' ') : ''
    case 'GOLD_SPEND':
      return 'system shop'
    case 'ITEM_DROP':
    case 'ITEM_USE':
      return typeof p.item === 'string' ? p.item.replace(/-/g, ' ') : ''
    case 'PURCHASE':
    case 'REDEEM':
      return typeof p.name === 'string' ? p.name : ''
    case 'BOSS_WIN':
      return typeof p.boss === 'string' ? p.boss : ''
    case 'TITLE_EARN':
      return typeof p.name === 'string' ? p.name : ''
    case 'KEY_EARN':
      return 'dungeon key'
    default:
      return ''
  }
}

function blockAmount(block: LedgerBlock): { text: string; gold: boolean } | null {
  const p = block.payload
  if (block.type === 'GOLD_EARN' && typeof p.amount === 'number') {
    return { text: `+${p.amount} G`, gold: true }
  }
  if (block.type === 'GOLD_SPEND' && typeof p.amount === 'number') {
    return { text: `−${p.amount} G`, gold: true }
  }
  if (block.type === 'PURCHASE' && typeof p.cost === 'number') {
    return { text: `${p.cost} G`, gold: false }
  }
  return null
}

/**
 * The System Ledger viewer: the tamper-evident chain behind every gold
 * coin and item, shown plainly. When verification fails the panel says
 * so, rewards stay locked, and Restore truncates to the last valid
 * block — the chain is never silently accepted in a broken state.
 */
export function LedgerPanel({ status, entries, firstInvalidIndex, onRestore }: LedgerPanelProps) {
  const visible = entries ? [...entries].slice(-VISIBLE_BLOCKS).reverse() : []

  return (
    <SystemWindow title="System Ledger" style={{ animationDelay: '0.27s' }}>
      {status === 'loading' && (
        <p className="text-[0.8rem] text-[#9fc6e8]">
          <span className="sl-blink">▶</span> Verifying the chain…
        </p>
      )}

      {status === 'broken' && (
        <div className="sl-warning danger" role="alert">
          <p>
            [Integrity warning: the System Ledger failed verification at block{' '}
            {firstInvalidIndex}. A record was altered outside the System. All gold, items and
            purchases are locked. Restore to continue from the last valid block — balances are
            rebuilt from the verified chain only.]
          </p>
          <div className="mt-3 text-center">
            <button type="button" className="sl-btn danger" onClick={onRestore}>
              Restore From Last Valid Block
            </button>
          </div>
        </div>
      )}

      {status === 'verified' && entries && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="sl-integrity-ok">
              <CheckIcon />
              Chain Verified
            </span>
            <span className="sl-num text-[0.72rem] font-bold tracking-[0.14em] text-[#8fb8d8]">
              {entries.length} {entries.length === 1 ? 'BLOCK' : 'BLOCKS'}
            </span>
          </div>
          <p className="mt-2.5 text-[0.74rem] leading-relaxed text-[#8fb8d8]">
            [Every coin, item and title is a block in a hash-chained ledger, sealed with a key
            only this device holds. Edit a record and the chain breaks — loudly.]
          </p>
          <div className="mt-3">
            {visible.map((block) => {
              const amount = blockAmount(block)
              return (
                <div key={block.index} className="sl-ledger-row">
                  <span className="sl-ledger-type">
                    #{block.index} {block.type.replace(/_/g, ' ')}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{blockDetail(block)}</span>
                  <span className="flex-none text-[#5f87ad]">
                    {new Date(block.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {amount && (
                    <span className={`sl-ledger-amt${amount.gold ? ' gold' : ''}`}>
                      {amount.text}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </SystemWindow>
  )
}
