'use client'

import { useEffect, useState } from 'react'
import {
  DEFAULT_SHOP_ITEMS,
  ITEM_DEFS,
  loadCustomShopItems,
  storeCustomShopItems,
  type ShopItem,
} from '@/lib/system/rewards'
import type { ItemKey, LedgerPurchase } from '@/lib/system/ledger'
import { SystemWindow } from './SystemWindow'
import { ITEM_ICONS } from './RewardModal'
import { CheckIcon, CoinIcon, KeyIcon, TicketIcon } from './icons'

interface SystemShopProps {
  /** True while the ledger is loading or broken — nothing may move. */
  locked: boolean
  gold: number
  items: Record<ItemKey, number>
  elixirArmed: boolean
  purchases: LedgerPurchase[]
  onBuy: (name: string, cost: number) => Promise<boolean>
  onRedeem: (purchaseId: string) => void
  onUseItem: (item: ItemKey) => void
}

const INVENTORY_ORDER: ItemKey[] = [
  'streak-shield',
  'double-xp-elixir',
  'rest-pass',
  'dungeon-key',
]

/**
 * The System Shop: gold earned in training is spent here on rewards the
 * Player defines. Purchases and redemptions are ledger entries; the
 * catalog itself (names + prices) is plain local config.
 */
export function SystemShop({
  locked,
  gold,
  items,
  elixirArmed,
  purchases,
  onBuy,
  onRedeem,
  onUseItem,
}: SystemShopProps) {
  const [customItems, setCustomItems] = useState<ShopItem[]>([])
  const [newName, setNewName] = useState('')
  const [newCost, setNewCost] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setCustomItems(loadCustomShopItems())
  }, [])

  const saveCustom = (next: ShopItem[]) => {
    setCustomItems(next)
    storeCustomShopItems(next)
  }

  const handleBuy = async (item: ShopItem) => {
    const bought = await onBuy(item.name, item.cost)
    setNotice(
      bought
        ? `[${item.name} acquired. It waits in My Rewards.]`
        : '[The System refuses: not enough gold.]',
    )
  }

  const handleAddCustom = () => {
    const name = newName.trim()
    const cost = Math.floor(Number(newCost))
    if (!name || !Number.isFinite(cost) || cost <= 0) {
      setNotice('[A reward needs a name and a gold cost above zero.]')
      return
    }
    if (editingId) {
      saveCustom(customItems.map((i) => (i.id === editingId ? { ...i, name, cost } : i)))
      setEditingId(null)
      setNotice(`[${name} updated in your shop.]`)
    } else {
      saveCustom([...customItems, { id: `custom-${Date.now()}`, name, cost }])
      setNotice(`[${name} added to your shop.]`)
    }
    setNewName('')
    setNewCost('')
  }

  const unredeemed = purchases.filter((p) => !p.redeemed)
  const redeemed = purchases.filter((p) => p.redeemed)
  const inventoryHeld = INVENTORY_ORDER.filter((key) => items[key] > 0)

  return (
    <SystemWindow title="System Shop" style={{ animationDelay: '0.21s' }}>
      <div className="flex flex-col gap-3">
        <p className="sl-strip" role="note">
          <span className="sl-strip-bracket" aria-hidden>
            [
          </span>
          <span className="sl-strip-text">
            Gold is earned in training and spent only here. Every coin is recorded.
          </span>
          <span className="sl-strip-bracket" aria-hidden>
            ]
          </span>
        </p>
        <span
          className="sl-gold-chip self-end"
          title="Your gold balance, derived from the System Ledger"
        >
          <CoinIcon />
          Gold <span className="sl-num">{gold}</span>
        </span>
      </div>

      {/* Shop stock */}
      <div className="sl-shop-grid mt-5">
        {[...DEFAULT_SHOP_ITEMS, ...customItems].map((item) => {
          const isCustom = customItems.some((c) => c.id === item.id)
          const affordable = gold >= item.cost
          return (
            <div key={item.id} className="sl-shop-card">
              <p className="flex items-start gap-2 font-bold text-white">
                <TicketIcon className="mt-0.5 h-4 w-4 flex-none text-[#ffd166]" />
                <span className="min-w-0 flex-1">{item.name}</span>
              </p>
              <p className="sl-price">
                <CoinIcon />
                <span className="sl-num">{item.cost} G</span>
              </p>
              <div className="mt-auto flex items-center gap-2">
                <button
                  type="button"
                  className="sl-btn gold"
                  disabled={locked || !affordable}
                  onClick={() => handleBuy(item)}
                >
                  Buy
                </button>
                {isCustom && (
                  <>
                    <button
                      type="button"
                      className="sl-btn ghost"
                      onClick={() => {
                        setEditingId(item.id)
                        setNewName(item.name)
                        setNewCost(String(item.cost))
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="sl-btn ghost"
                      onClick={() => saveCustom(customItems.filter((c) => c.id !== item.id))}
                      aria-label={`Delete ${item.name}`}
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
              {!affordable && !locked && (
                <p className="text-[0.68rem] tracking-wider text-[#8fb8d8]">
                  {item.cost - gold} more gold needed
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Add your own reward */}
      <div className="mt-5 border-t border-white/[0.07] pt-4">
        <p className="sl-label mb-2.5">{editingId ? 'Edit your reward' : 'Add your own reward'}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="sl-input flex-1"
            placeholder="Reward name — e.g. Cheat Meal Pass"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={48}
          />
          <input
            className="sl-input sm:w-32"
            placeholder="Cost (gold)"
            inputMode="numeric"
            value={newCost}
            onChange={(e) => setNewCost(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <button type="button" className="sl-btn" onClick={handleAddCustom}>
            {editingId ? 'Save' : 'Add'}
          </button>
          {editingId && (
            <button
              type="button"
              className="sl-btn ghost"
              onClick={() => {
                setEditingId(null)
                setNewName('')
                setNewCost('')
              }}
            >
              Cancel
            </button>
          )}
        </div>
        {notice && (
          <p className="mt-3 text-[0.74rem] leading-relaxed text-[#9fc6e8]">{notice}</p>
        )}
      </div>

      {/* Inventory */}
      <div className="mt-6 border-t border-white/[0.07] pt-4">
        <p className="sl-label mb-2.5">Inventory</p>
        {inventoryHeld.length === 0 ? (
          <p className="text-[0.78rem] leading-relaxed text-[#8fb8d8]">
            [Your inventory is empty. Loot drops when daily rewards are claimed — and the Weekly
            Quest pays a Dungeon Key.]
          </p>
        ) : (
          <ul className="space-y-2">
            {inventoryHeld.map((key) => {
              const def = ITEM_DEFS[key]
              const Icon = ITEM_ICONS[key]
              return (
                <li key={key} className="sl-item-row">
                  <span className={`sl-item-icon${key === 'dungeon-key' ? ' gold' : ''}`}>
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white">{def.name}</p>
                    <p className="text-[0.72rem] leading-snug text-[#8fb8d8]">{def.desc}</p>
                  </div>
                  <span className="sl-item-count sl-num">×{items[key]}</span>
                  {key === 'double-xp-elixir' && (
                    <button
                      type="button"
                      className="sl-btn"
                      disabled={locked || elixirArmed}
                      onClick={() => onUseItem(key)}
                    >
                      {elixirArmed ? 'Armed' : 'Use'}
                    </button>
                  )}
                  {key === 'rest-pass' && (
                    <button
                      type="button"
                      className="sl-btn"
                      disabled={locked}
                      onClick={() => onUseItem(key)}
                    >
                      Use
                    </button>
                  )}
                  {key === 'streak-shield' && (
                    <span className="flex-none text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#7df0cd]">
                      Automatic
                    </span>
                  )}
                  {key === 'dungeon-key' && (
                    <span className="flex-none text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#ffd166]">
                      <KeyIcon className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
                      At the gate
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* My Rewards */}
      <div className="mt-6 border-t border-white/[0.07] pt-4">
        <p className="sl-label mb-2.5">My Rewards</p>
        {purchases.length === 0 ? (
          <p className="text-[0.78rem] leading-relaxed text-[#8fb8d8]">
            [Nothing bought yet. Spend gold above and your rewards wait here until you redeem
            them in the real world.]
          </p>
        ) : (
          <ul className="space-y-2">
            {unredeemed.map((p) => (
              <li key={p.id} className="sl-item-row">
                <span className="sl-item-icon gold">
                  <TicketIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white">{p.name}</p>
                  <p className="text-[0.72rem] text-[#8fb8d8]">
                    Bought for <span className="sl-num">{p.cost} G</span> — redeem it when you
                    take it.
                  </p>
                </div>
                <button
                  type="button"
                  className="sl-btn gold"
                  disabled={locked}
                  onClick={() => onRedeem(p.id)}
                >
                  Redeem
                </button>
              </li>
            ))}
            {redeemed.map((p) => (
              <li key={p.id} className="sl-item-row" style={{ opacity: 0.55 }}>
                <span className="sl-item-icon">
                  <CheckIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white">{p.name}</p>
                  <p className="text-[0.72rem] text-[#8fb8d8]">Redeemed</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SystemWindow>
  )
}
