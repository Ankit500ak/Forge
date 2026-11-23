// Inline stroke icons for the System layer (24x24, currentColor).
// Generic shapes only — sword, wind, heart, flame, eye, and quest glyphs.

import type { ReactNode } from 'react'

interface IconProps {
  className?: string
}

function Base({ className = '', children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** STR — sword. */
export function SwordIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
    </Base>
  )
}

/** AGI — wind. */
export function WindIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </Base>
  )
}

/** VIT — heart. */
export function HeartIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    </Base>
  )
}

/** END — flame. */
export function FlameIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Base>
  )
}

/** PER — eye. */
export function EyeIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  )
}

/** Push-ups — dumbbell (plates + bar). */
export function DumbbellIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M4 9v6" />
      <path d="M7 5.5v13" />
      <path d="M7 12h10" />
      <path d="M17 5.5v13" />
      <path d="M20 9v6" />
    </Base>
  )
}

/** Sit-ups — rotate / core cycle. */
export function CoreIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </Base>
  )
}

/** Squats — up/down arrows. */
export function SquatIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </Base>
  )
}

/** Run — lightning stride. */
export function BoltIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </Base>
  )
}

/** Check mark for completed states. */
export function CheckIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <polyline points="20 6 9 17 4 12" />
    </Base>
  )
}

/** Lock for the disabled claim-reward reason line. */
export function LockIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Base>
  )
}

/** Chevron for back navigation. */
export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <polyline points="15 18 9 12 15 6" />
    </Base>
  )
}

/** Gold — coin. */
export function CoinIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
    </Base>
  )
}

/** Dungeon key. */
export function KeyIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <circle cx="8" cy="15" r="4.5" />
      <path d="m11.2 11.8 8.3-8.3" />
      <path d="m17 6 2.5 2.5" />
      <path d="m14.5 8.5 2 2" />
    </Base>
  )
}

/** Streak shield. */
export function ShieldIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M12 3 5 5.8v5.4c0 4.3 2.9 7.4 7 9.3 4.1-1.9 7-5 7-9.3V5.8Z" />
      <polyline points="9 11.5 11.2 13.7 15 9.8" />
    </Base>
  )
}

/** Double XP elixir — flask. */
export function FlaskIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M10 3h4" />
      <path d="M10 3v5.2L5.4 17a2.4 2.4 0 0 0 2.1 3.5h9a2.4 2.4 0 0 0 2.1-3.5L14 8.2V3" />
      <path d="M7.5 14h9" />
    </Base>
  )
}

/** Pass / ticket (rest pass, shop rewards). */
export function TicketIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a2.5 2.5 0 0 0 0-5Z" />
      <path d="M13 6v2" />
      <path d="M13 11v2" />
      <path d="M13 16v2" />
    </Base>
  )
}

/** Title — crown. */
export function CrownIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="m3 8 4.5 4L12 5l4.5 7L21 8l-1.6 10H4.6Z" />
      <path d="M5 21h14" />
    </Base>
  )
}

/** Boss — skull. */
export function SkullIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M12 3a8 8 0 0 0-8 8c0 2.9 1.6 4.9 3.5 6V20a1.5 1.5 0 0 0 1.5 1.5h6A1.5 1.5 0 0 0 16.5 20v-3c1.9-1.1 3.5-3.1 3.5-6a8 8 0 0 0-8-8Z" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <path d="M12 15.5v2" />
    </Base>
  )
}
