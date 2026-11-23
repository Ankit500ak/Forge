'use client'

import { currentStreak, shiftDateKey, type SystemState } from '@/lib/system/types'
import type { LedgerShadow } from '@/lib/system/ledger'
import { SystemWindow } from './SystemWindow'
import { CheckIcon, FlameIcon, ShieldIcon, SkullIcon } from './icons'

/** How many days back the records calendar shows (5 weeks). */
const CALENDAR_DAYS = 35

/** How many days the XP graph spans (a fortnight). */
const XP_GRAPH_DAYS = 14

interface ProgressRecordsProps {
  state: SystemState
  /** Bosses defeated, from the System Ledger (the Shadow Collection). */
  shadows?: LedgerShadow[]
}

/**
 * Records window: current streak, lifetime clears and a five-week quest
 * completion calendar — all read from the per-day quest history the
 * System records locally.
 */
export function ProgressRecords({ state, shadows }: ProgressRecordsProps) {
  const today = state.questDate
  const streak = currentStreak(state.questHistory, today)

  const days: {
    key: string
    status: 'claimed' | 'recovered' | 'shielded' | 'rested' | 'missed' | 'none'
    isToday: boolean
  }[] = []
  for (let back = CALENDAR_DAYS - 1; back >= 0; back--) {
    const key = shiftDateKey(today, -back)
    const recorded = key in state.questHistory
    days.push({
      key,
      status: state.recoveredDates.includes(key)
        ? 'recovered'
        : state.shieldedDates.includes(key)
          ? 'shielded'
          : state.restedDates.includes(key)
            ? 'rested'
            : state.questHistory[key]
              ? 'claimed'
              : recorded
                ? 'missed'
                : 'none',
      isToday: back === 0,
    })
  }
  const claimedThisWeek = days
    .slice(-7)
    .filter((d) => d.status === 'claimed' || d.status === 'recovered').length

  // XP graph: XP gained per day over the last fortnight, from the
  // per-day XP record. Days before recording began simply read zero.
  const xpDays: { key: string; xp: number; label: string }[] = []
  for (let back = XP_GRAPH_DAYS - 1; back >= 0; back--) {
    const key = shiftDateKey(today, -back)
    xpDays.push({ key, xp: state.xpByDay[key] ?? 0, label: key.slice(8) })
  }
  const xpMax = Math.max(1, ...xpDays.map((d) => d.xp))
  const xpTotal = xpDays.reduce((sum, d) => sum + d.xp, 0)

  return (
    <SystemWindow title="Records" style={{ animationDelay: '0.24s' }}>
      <p className="sl-strip" role="note">
        <span className="sl-strip-bracket" aria-hidden>
          [
        </span>
        <span className="sl-strip-text">
          {streak > 0
            ? `Streak: ${streak} ${streak === 1 ? 'day' : 'days'}. The System acknowledges you.`
            : 'No active streak. Clear today\u2019s quest.'}
        </span>
        <span className="sl-strip-bracket" aria-hidden>
          ]
        </span>
      </p>

      <div className="sl-records-stats mt-5">
        <div className="sl-record-cell">
          <p className="sl-label">Streak</p>
          <p className="sl-num sl-record-value">
            <FlameIcon className="sl-record-flame" />
            {streak}
            <span className="sl-record-unit">{streak === 1 ? 'day' : 'days'}</span>
          </p>
        </div>
        <div className="sl-record-cell">
          <p className="sl-label">Quests Cleared</p>
          <p className="sl-num sl-record-value">{state.questsCompleted}</p>
        </div>
        <div className="sl-record-cell">
          <p className="sl-label">Last 7 Days</p>
          <p className="sl-num sl-record-value">
            {claimedThisWeek}
            <span className="sl-record-unit">/ 7</span>
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="sl-label mb-2.5">Quest Calendar — Last {CALENDAR_DAYS} Days</p>
        <div className="sl-cal" role="img" aria-label={`Quest completions over the last ${CALENDAR_DAYS} days`}>
          {days.map((day) => (
            <span
              key={day.key}
              className={`sl-cal-day ${day.status}${day.isToday ? ' today' : ''}`}
              title={`${day.key}${
                day.status === 'claimed'
                  ? ' — quest cleared'
                  : day.status === 'recovered'
                    ? ' — missed, record restored by recovery quest'
                    : day.status === 'shielded'
                      ? ' — missed, record protected by a Streak Shield'
                      : day.status === 'rested'
                        ? ' — rest day taken with a Rest Pass'
                        : day.status === 'missed'
                          ? ' — quest missed'
                          : ''
              }`}
            >
              {(day.status === 'claimed' || day.status === 'recovered') && (
                <CheckIcon className="h-2.5 w-2.5" />
              )}
              {day.status === 'shielded' && <ShieldIcon className="h-2.5 w-2.5" />}
            </span>
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[0.66rem] tracking-wider text-[#8fb8d8]">
          <span className="inline-flex items-center gap-1.5">
            <span className="sl-cal-day claimed legend" aria-hidden />
            Cleared
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="sl-cal-day recovered legend" aria-hidden />
            Recovered
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="sl-cal-day shielded legend" aria-hidden />
            Shielded
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="sl-cal-day rested legend" aria-hidden />
            Rested
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="sl-cal-day missed legend" aria-hidden />
            Missed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="sl-cal-day none legend" aria-hidden />
            No record
          </span>
        </div>
      </div>

      <div className="mt-6">
        <p className="sl-label mb-2.5">XP Gained — Last {XP_GRAPH_DAYS} Days</p>
        {xpTotal > 0 ? (
          <div
            className="sl-xp-graph"
            role="img"
            aria-label={`XP gained over the last ${XP_GRAPH_DAYS} days, ${xpTotal} XP in total`}
          >
            {xpDays.map((day) => (
              <div key={day.key} className="sl-xp-col" title={`${day.key} — ${day.xp} XP`}>
                <div
                  className={`sl-xp-bar${day.xp === 0 ? ' zero' : ''}`}
                  style={{ height: `${Math.max(4, (day.xp / xpMax) * 62)}px` }}
                />
                <span className="sl-xp-day">{day.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[0.78rem] leading-relaxed text-[#8fb8d8]">
            [No XP recorded yet. Clear a quest and the record begins.]
          </p>
        )}
      </div>

      {/* Shadow Collection — every boss defeated, sealed in the Ledger. */}
      <div className="mt-6">
        <p className="sl-label mb-2.5">Shadow Collection</p>
        {shadows && shadows.length > 0 ? (
          <ul className="space-y-2">
            {shadows.map((shadow, i) => (
              <li key={`${shadow.name}-${shadow.date}-${i}`} className="sl-shadow-card">
                <SkullIcon />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-white">{shadow.name}</p>
                  <p className="text-[0.72rem] text-[#a9cdec]">
                    Shadow extracted{shadow.date ? ` — ${shadow.date}` : ''}
                  </p>
                </div>
                <span className="flex-none text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#c4b5fd]">
                  Arise
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[0.78rem] leading-relaxed text-[#8fb8d8]">
            [No shadows yet. Defeat a boss at the dungeon gate and its shadow will serve you
            here.]
          </p>
        )}
      </div>
    </SystemWindow>
  )
}
