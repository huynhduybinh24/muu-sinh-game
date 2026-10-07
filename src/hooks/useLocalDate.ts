import { useEffect, useState } from 'react'
import { getLocalDateKey } from '../services/dailyChallenge'

export function useLocalDate(): string {
  const [, setDateKey] = useState(getLocalDateKey)
  useEffect(() => {
    const refresh = () => setDateKey(getLocalDateKey())
    const timer = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  // Also read on navigation/render, not only the timer (resume or midnight clicks).
  return getLocalDateKey()
}
