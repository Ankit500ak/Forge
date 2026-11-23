'use client'

import { ITEM_DEFS, type TitleDef } from '@/lib/system/rewards'
import type { ItemKey } from '@/lib/system/ledger'
import { SystemWindow } from './SystemWindow'
import { CrownIcon, FlaskIcon, KeyIcon, ShieldIcon, TicketIcon } from './icons'
import type { ComponentType } from 'react'

export const ITEM_ICONS: Record<ItemKey, ComponentType<{ className?: string }>> = {
  'streak-shield': ShieldIcon,
  'double-xp-elixir': FlaskIcon,
  'rest-pass': TicketIcon,
  'dungeon-key': KeyIcon,
}

export type RewardModalData =
  | { kind: 'loot'; item: ItemKey }
  | { kind: 'title'; title: TitleDef }

interface RewardModalProps {
  data: RewardModalData
  onDismiss: () => void
}

/**
 * The moment a reward lands outside the normal claim flow: a loot drop
 * rolled at claim time, or a title earned from the Player's records.
 * Same modal language as the System notifications, gold-flared for loot.
 */
export function RewardModal({ data, onDismiss }: RewardModalProps) {
  const isLoot = data.kind === 'loot'
  const Icon = isLoot ? ITEM_ICONS[data.item] : CrownIcon
  const headline = isLoot ? ITEM_DEFS[data.item].name : data.title.name
  const detail = isLoot ? ITEM_DEFS[data.item].desc : data.title.desc

  return (
    <div
      className="sl-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={isLoot ? 'Loot acquired' : 'Title acquired'}
    >
      <div className={`sl-modal${isLoot ? ' loot' : ''}`}>
        {isLoot && <div className="sl-flare" aria-hidden />}
        <SystemWindow title={isLoot ? '[Loot Acquired]' : '[Title Acquired]'}>
          <div className="sl-loot-item">
            <span className="sl-item-icon">
              <Icon />
            </span>
            <p className="sl-display text-center text-2xl tracking-[0.14em]">{headline}</p>
          </div>
          <p className="mt-2 text-center text-[0.9rem] leading-relaxed text-[#dcefff]">
            {isLoot
              ? 'The System has dropped an item into your inventory.'
              : 'Your record has earned a new title, Player.'}
          </p>
          <p className="sl-value sl-num mt-2 text-center text-[0.78rem] font-bold tracking-[0.14em]">
            [{detail}]
          </p>
          <div className="mt-7 flex justify-center">
            <button type="button" className="sl-btn primary" onClick={onDismiss} autoFocus>
              Accept
            </button>
          </div>
        </SystemWindow>
      </div>
    </div>
  )
}
