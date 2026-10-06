import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

const INSTALL_DISMISSED_KEY = 'muu-sinh-install-dismissed-at'
const INSTALL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1_000

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as NavigatorWithStandalone).standalone)
  )
}

function installPromptIsCoolingDown(): boolean {
  try {
    const dismissedAt = Number(window.localStorage.getItem(INSTALL_DISMISSED_KEY))
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < INSTALL_COOLDOWN_MS
  } catch {
    return false
  }
}

function isIosSafari(): boolean {
  const userAgent = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(userAgent)
    || (/Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1)
  const isOtherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent)
  return isIos && /Safari/.test(userAgent) && !isOtherIosBrowser
}

export interface PwaInstallControls {
  canInstall: boolean
  showIosHint: boolean
  install: () => Promise<void>
}

export function usePwaInstall(): PwaInstallControls {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)')
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault()
      if (!isStandalone() && !installPromptIsCoolingDown()) {
        setInstallPrompt(event as BeforeInstallPromptEvent)
      }
    }
    const handleInstalled = () => {
      setInstalled(true)
      setInstallPrompt(null)
    }
    const handleDisplayModeChange = () => setInstalled(isStandalone())

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    displayMode.addEventListener('change', handleDisplayModeChange)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
      displayMode.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  const install = useCallback(async () => {
    if (!installPrompt) return
    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setInstalled(true)
      } else {
        try {
          window.localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()))
        } catch {
          // Installation remains optional when storage is unavailable.
        }
      }
    } catch {
      // A dismissed or unavailable browser prompt must not interrupt play.
    } finally {
      setInstallPrompt(null)
    }
  }, [installPrompt])

  return {
    canInstall: !installed && installPrompt !== null,
    showIosHint: !installed && isIosSafari(),
    install,
  }
}
