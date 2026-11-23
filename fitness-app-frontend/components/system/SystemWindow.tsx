import type { CSSProperties, ReactNode } from 'react'

interface SystemWindowProps {
  title: string
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Skip the header row — for panels whose own voice strip is the header. */
  bare?: boolean
  /** Anchor id on the outer section (e.g. for scroll-to after level-up). */
  id?: string
}

/**
 * The "System window" chrome: a glassmorphism panel with a 1px gradient
 * border, deep shadow and a centred gradient title flanked by rules and
 * diamonds. Styling lives in ./system.css and is scoped under .sl-system.
 */
export function SystemWindow({ title, children, className = '', style, bare, id }: SystemWindowProps) {
  return (
    <section
      id={id}
      className={`sl-window ${className}`}
      style={style}
      aria-label={bare ? title : undefined}
    >
      <span className="sl-corner tl" aria-hidden />
      <span className="sl-corner tr" aria-hidden />
      <span className="sl-corner bl" aria-hidden />
      <span className="sl-corner br" aria-hidden />
      <div className="sl-window-inner">
        {!bare && (
          <header className="sl-window-header">
            <span className="sl-rule" />
            <span className="sl-diamond" aria-hidden />
            <h2 className="sl-window-title">{title}</h2>
            <span className="sl-diamond" aria-hidden />
            <span className="sl-rule" />
          </header>
        )}
        {children}
      </div>
    </section>
  )
}
