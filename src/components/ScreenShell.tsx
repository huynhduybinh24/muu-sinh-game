import type { ReactNode } from 'react'
import { SoundToggle } from './SoundToggle'

interface ScreenShellProps {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  contentClassName?: string
}

export function ScreenShell({
  children,
  header,
  footer,
  contentClassName = '',
}: ScreenShellProps) {
  return (
    <main className="app-shell">
      <header className="screen-header">
        <div className="screen-header-content">{header}</div>
        <SoundToggle />
      </header>
      <section className={`screen-content ${contentClassName}`.trim()}>{children}</section>
      {footer ? <footer className="screen-footer">{footer}</footer> : null}
    </main>
  )
}
