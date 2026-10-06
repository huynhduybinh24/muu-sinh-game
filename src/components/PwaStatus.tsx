import { useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

type ConnectionNotice = 'offline' | 'reconnected' | null

export function PwaStatus() {
  const [connectionNotice, setConnectionNotice] = useState<ConnectionNotice>(
    navigator.onLine ? null : 'offline',
  )
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const updateRequested = useRef(false)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    // Handle controller changes below, including updates installed shortly
    // after the initial load (which Workbox can classify as external).
    onNeedReload() {},
    onRegisteredSW(_url, registeredWorker) {
      if (registeredWorker) setRegistration(registeredWorker)
    },
  })

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const reloadAfterUpdate = () => {
      if (!updateRequested.current) return
      updateRequested.current = false
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', reloadAfterUpdate)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', reloadAfterUpdate)
  }, [])

  useEffect(() => {
    if (!offlineReady) return
    const timeout = window.setTimeout(() => {
      setOfflineReady(false)
    }, 4_000)
    return () => window.clearTimeout(timeout)
  }, [offlineReady, setOfflineReady])

  useEffect(() => {
    if (!registration) return
    const checkForUpdate = () => {
      if (navigator.onLine && document.visibilityState === 'visible') {
        void registration.update().catch(() => undefined)
      }
    }
    const interval = window.setInterval(checkForUpdate, 60 * 60 * 1_000)
    window.addEventListener('online', checkForUpdate)
    document.addEventListener('visibilitychange', checkForUpdate)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('online', checkForUpdate)
      document.removeEventListener('visibilitychange', checkForUpdate)
    }
  }, [registration])

  useEffect(() => {
    let connectedTimeout: number | undefined
    const handleOffline = () => {
      if (connectedTimeout) window.clearTimeout(connectedTimeout)
      setConnectionNotice('offline')
    }
    const handleOnline = () => {
      if (connectedTimeout) window.clearTimeout(connectedTimeout)
      setConnectionNotice('reconnected')
      connectedTimeout = window.setTimeout(() => setConnectionNotice(null), 3_000)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      if (connectedTimeout) window.clearTimeout(connectedTimeout)
    }
  }, [])

  const handleUpdate = async () => {
    if (!registration?.waiting) {
      setNeedRefresh(false)
      return
    }
    setUpdateError(false)
    setUpdating(true)
    updateRequested.current = true
    try {
      await updateServiceWorker(true)
    } catch {
      updateRequested.current = false
      setUpdateError(true)
      setUpdating(false)
    }
  }

  return (
    <>
      {needRefresh ? (
        <aside className="pwa-update" role="status">
          <div>
            <strong>CÓ PHIÊN BẢN MỚI</strong>
            <span>{updateError ? 'Chưa thể cập nhật. Bạn thử lại khi có mạng nhé!' : 'Cập nhật khi đã xong ca làm nhé!'}</span>
          </div>
          <button type="button" onClick={handleUpdate} disabled={updating}>
            {updating ? 'ĐANG CẬP NHẬT…' : 'CẬP NHẬT'}
          </button>
          <button
            className="pwa-update-close"
            type="button"
            onClick={() => setNeedRefresh(false)}
            aria-label="Để sau"
          >×</button>
        </aside>
      ) : null}
      {connectionNotice && !needRefresh ? (
        <div className={`connection-notice connection-notice--${connectionNotice}`} role="status">
          {connectionNotice === 'offline' ? '📴 ĐANG CHƠI OFFLINE' : '✓ ĐÃ KẾT NỐI LẠI'}
        </div>
      ) : null}
      {offlineReady && !connectionNotice && !needRefresh ? (
        <button
          className="offline-ready"
          type="button"
          onClick={() => setOfflineReady(false)}
        >
          ✓ SẴN SÀNG CHƠI OFFLINE
        </button>
      ) : null}
    </>
  )
}
