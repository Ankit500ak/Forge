// Reward economy for the System: gold, loot, the shop, titles and the
// boss gate. Every value here is written to the tamper-evident ledger
// (ledger.ts) — this file only holds the balance constants and the
// pure rules that decide what has been earned.

import type { ItemKey } from './ledger'
import { currentStreak, type QuestKey } from './types'

// ---------------------------------------------------------------------------
// Gold

/** Gold earned per rep applied to a quest from an AI Training session. */
export const GOLD_PER_TRAINING_REP = 1
/** Gold granted when the daily quest reward is claimed. */
export const DAILY_CLAIM_GOLD = 50
/** Gold granted when the weekly quest reward is claimed. */
export const WEEKLY_CLAIM_GOLD = 150
/** Gold granted for a boss victory. */
export const BOSS_GOLD_REWARD = 300

// ---------------------------------------------------------------------------
// Items & loot

export interface ItemDef {
  key: ItemKey
  name: string
  /** One-line System-voice description of what the item does. */
  desc: string
}

export const ITEM_DEFS: Record<ItemKey, ItemDef> = {
  'streak-shield': {
    key: 'streak-shield',
    name: 'Streak Shield',
    desc: 'Automatically protects your record on a missed day. The streak survives.',
  },
  'double-xp-elixir': {
    key: 'double-xp-elixir',
    name: 'Double XP Elixir',
    desc: 'Use it, and your next Daily Quest claim grants double XP.',
  },
  'rest-pass': {
    key: 'rest-pass',
    name: 'Rest Pass',
    desc: 'Use it to mark today as rested: no penalty, and the streak is preserved.',
  },
  'dungeon-key': {
    key: 'dungeon-key',
    name: 'Dungeon Key',
    desc: 'Opens a Boss Quest gate. Earned by clearing the Weekly Quest.',
  },
}

/** Chance that claiming the daily reward also drops a loot item. */
export const LOOT_DROP_CHANCE = 0.25

/** Items that can drop from a daily claim, chosen uniformly. */
export const LOOT_POOL: ItemKey[] = ['streak-shield', 'double-xp-elixir', 'rest-pass']

/** Roll a loot drop. Plain Math.random — the System does not rig its drops. */
export function rollLootDrop(): ItemKey | null {
  if (Math.random() >= LOOT_DROP_CHANCE) return null
  return LOOT_POOL[Math.floor(Math.random() * LOOT_POOL.length)]
}

// ---------------------------------------------------------------------------
// System Shop

export interface ShopItem {
  id: string
  name: string
  cost: number
}

/** Built-in shop stock. The Player can add their own alongside these. */
export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  { id: 'default-cheat-meal', name: 'Cheat Meal Pass', cost: 500 },
  { id: 'default-movie-night', name: 'Movie Night', cost: 1000 },
  { id: 'default-rest-day', name: 'Full Rest Day', cost: 2000 },
]

const SHOP_CATALOG_KEY = 'forge-shop-catalog-v1'

/** The Player's own shop items (name + cost), stored as plain config. */
export function loadCustomShopItems(): ShopItem[] {
  try {
    const raw = window.localStorage.getItem(SHOP_CATALOG_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (i): i is ShopItem =>
        i &&
        typeof i.id === 'string' &&
        typeof i.name === 'string' &&
        typeof i.cost === 'number' &&
        i.cost > 0,
    )
  } catch {
    return []
  }
}

export function storeCustomShopItems(items: ShopItem[]): void {
  try {
    window.localStorage.setItem(SHOP_CATALOG_KEY, JSON.stringify(items))
  } catch {
    // Storage unavailable — the catalog simply will not persist.
  }
}

// ---------------------------------------------------------------------------
// Titles — earned from real records, never bought.

export interface TitleDef {
  id: string
  name: string
  /** The real record that earns it. */
  desc: string
}

export const TITLE_DEFS: TitleDef[] = [
  { id: 'iron-fist', name: 'Iron Fist', desc: '1,000 lifetime push-ups' },
  { id: 'wolf-slayer', name: 'Wolf Slayer', desc: '7-day streak' },
  { id: 'monarch-of-consistency', name: 'Monarch of Consistency', desc: '30-day streak' },
  { id: 'shadow-collector', name: 'Shadow Collector', desc: 'First boss victory' },
  { id: 'gold-hunter', name: 'Gold Hunter', desc: '10,000 lifetime gold earned' },
]

export interface TitleProgress {
  /** Lifetime reps per exercise (from System state). */
  lifetimeReps: Record<QuestKey, number>
  /** Best streak ever held (from quest history). */
  bestStreak: number
  /** Bosses defeated (from the ledger). */
  bossWins: number
  /** Lifetime gold earned (from the ledger). */
  lifetimeGoldEarned: number
}

/** Longest run of consecutive claimed days anywhere in the history. */
export function bestStreak(history: Record<string, boolean>, today: string): number {
  let best = currentStreak(history, today)
  const dates = Object.keys(history).sort()
  let run = 0
  let prev: string | null = null
  for (const date of dates) {
    if (!history[date]) {
      run = 0
      prev = null
      continue
    }
    run = prev !== null && isNextDay(prev, date) ? run + 1 : 1
    if (run > best) best = run
    prev = date
  }
  return best
}

function isNextDay(a: string, b: string): boolean {
  const [ay, am, ad] = a.split('-').map(Number)
  const date = new Date(ay || 1970, (am || 1) - 1, ad || 1)
  date.setDate(date.getDate() + 1)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}` === b
}

/** Title ids whose conditions the given records satisfy. */
export function earnedTitleIds(progress: TitleProgress): string[] {
  const earned: string[] = []
  if (progress.lifetimeReps.pushups >= 1000) earned.push('iron-fist')
  if (progress.bestStreak >= 7) earned.push('wolf-slayer')
  if (progress.bestStreak >= 30) earned.push('monarch-of-consistency')
  if (progress.bossWins >= 1) earned.push('shadow-collector')
  if (progress.lifetimeGoldEarned >= 10000) earned.push('gold-hunter')
  return earned
}

// ---------------------------------------------------------------------------
// Boss Quest — the dungeon gate.

/** The boss gate always tests push-ups: a single big total for one day. */
export const BOSS_EXERCISE: QuestKey = 'pushups'

/** Boss target at level 1, and the growth per level above 1. */
export const BOSS_BASE_TARGET = 100
export const BOSS_PER_LEVEL = 10

export function bossTarget(level: number): number {
  return BOSS_BASE_TARGET + BOSS_PER_LEVEL * (level - 1)
}

/** Boss names, chosen deterministically from the date so a day has one boss. */
export const BOSS_NAMES = [
  'Iron Golem',
  'Crimson Wolf',
  'Stone Titan',
  'Venom Serpent',
  'Ashen Knight',
  'Frost Revenant',
  'Obsidian Minotaur',
  'Thorn Hydra',
]

export function bossNameForDate(dateKey: string): string {
  let hash = 0
  for (let i = 0; i < dateKey.length; i++) hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0
  return BOSS_NAMES[hash % BOSS_NAMES.length]
}
