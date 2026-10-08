import { useEffect, useRef } from 'react'
import { isNativeAndroid } from '../services/platform'

export function useNativeApp(onBack: () => void, onInactive: () => void) {
  const callbacks = useRef({ onBack, onInactive })
  useEffect(() => { callbacks.current = { onBack, onInactive } }, [onBack, onInactive])
  useEffect(() => {
    if (!isNativeAndroid()) return
    let disposed = false
    const cleanups: (() => Promise<void>)[] = []
    void import('@capacitor/app').then(async ({ App }) => {
      const keep = async (handle: { remove: () => Promise<void> }) => {
        if (disposed) await handle.remove()
        else cleanups.push(() => handle.remove())
      }
      await keep(await App.addListener('backButton', () => callbacks.current.onBack()))
      if (disposed) return
      await keep(await App.addListener('appStateChange', ({ isActive }) => { if (!isActive) callbacks.current.onInactive() }))
      if (disposed) return
      await keep(await App.addListener('pause', () => callbacks.current.onInactive()))
    }).catch(() => { /* Web has no native listeners; native setup failures never mutate saves. */ })
    return () => { disposed = true; cleanups.forEach((remove) => { void remove() }) }
  }, [])
}
