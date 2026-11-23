'use client'

import { rankTitle, type SystemNotificationData } from '@/lib/system/types'
import { SystemWindow } from './SystemWindow'

interface SystemNotificationProps {
  notification: SystemNotificationData
  onDismiss: () => void
}

/**
 * Modal System notification (welcome, quest reward, level up, rank up).
 * Level-up and rank-up are full moments: oversized modals, a hero
 * numeral/letter transition, bracketed System voice throughout, and one
 * large primary action.
 */
export function SystemNotification({ notification, onDismiss }: SystemNotificationProps) {
  const isLevelUp = notification.kind === 'levelup'
  const isRankUp = notification.kind === 'rankup'
  const isMoment = isLevelUp || isRankUp

  return (
    <div
      className="sl-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={notification.title}
    >
      <div className={`sl-modal${isLevelUp ? ' levelup' : ''}${isRankUp ? ' rankup' : ''}`}>
        {isLevelUp && <div className="sl-flare" aria-hidden />}
        <SystemWindow
          title={
            isLevelUp ? '[Level Up!]' : isRankUp ? '[Rank Up]' : notification.title
          }
          className={isLevelUp ? 'sl-window-levelup' : isRankUp ? 'sl-window-rankup' : ''}
        >
          {isLevelUp &&
            notification.levelFrom !== undefined &&
            notification.levelTo !== undefined && (
              <p className="sl-levelup-hero mb-5" aria-hidden>
                <span className="from">{notification.levelFrom}</span>
                <span className="arrow">→</span>
                <span className="to">{notification.levelTo}</span>
              </p>
            )}
          {isRankUp && notification.rankFrom && notification.rankTo && (
            <>
              <p className="sl-rankup-hero mb-4" aria-hidden>
                <span className="from">{notification.rankFrom}</span>
                <span className="arrow">→</span>
                <span className="to">{notification.rankTo}</span>
              </p>
              <p className="sl-display mb-5 text-center text-xl tracking-[0.2em]">
                {rankTitle(notification.rankTo)}
              </p>
            </>
          )}
          <div className="space-y-2.5 text-center">
            {notification.lines.map((line, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? 'text-[0.95rem] leading-relaxed text-[#dcefff]'
                    : 'sl-value sl-num text-sm font-bold tracking-[0.2em]'
                }
              >
                {isMoment ? `[${line}]` : line}
              </p>
            ))}
          </div>
          <div className="mt-7 flex justify-center">
            <button
              type="button"
              className={`sl-btn primary${isMoment ? ' accept-lg' : ''}`}
              onClick={onDismiss}
              autoFocus
            >
              Accept
            </button>
          </div>
        </SystemWindow>
      </div>
    </div>
  )
}
