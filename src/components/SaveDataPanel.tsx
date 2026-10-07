import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type ChangeEvent } from 'react'
import { downloadSaveBackup, copySaveBackup, readBackupFile, restoreSave, resetSave, saveErrorMessage } from '../services/saveService'
import { getStorageHealth, subscribeStorageHealth } from '../services/saveStorage'
import { RESET_CONFIRMATION } from '../data/save'
import { getLevelProgress } from '../services/level'
import { formatMoney } from '../services/formatters'
import type { PortableSave } from '../types/save'

function SaveDialog({ title, children, onCancel }: { title: string; children: ReactNode; onCancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return <dialog ref={dialog} className="save-dialog" aria-labelledby="save-dialog-title"
    onCancel={(event) => { event.preventDefault(); onCancel() }}>
    <h2 id="save-dialog-title">{title}</h2>{children}
  </dialog>
}
const healthMessages = {
  saved: 'Đã lưu trên thiết bị', unavailable: 'Chưa lưu được · Hãy tải backup', corrupted: 'Save bị lỗi · Hãy khôi phục backup',
  recovered: 'Đã phục hồi từ bản dự phòng', newer: 'Save thuộc phiên bản game mới hơn',
}

export function SaveDataPanel({ onReinitialize }: { onReinitialize: () => void }) {
  const health = useSyncExternalStore(subscribeStorageHealth, getStorageHealth, getStorageHealth)
  const [pending, setPending] = useState<PortableSave | null>(null)
  const [resetting, setResetting] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const reading = useRef(false)
  const committing = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const selectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file || reading.current) return
    reading.current = true
    setBusy(true)
    setMessage('')
    const result = await readBackupFile(file)
    input.value = ''
    reading.current = false
    setBusy(false)
    if (result.ok) setPending(result.save)
    else setMessage(saveErrorMessage(result.error))
  }
  const cancel = () => { setPending(null); setResetting(false); setConfirmation('') }
  const restore = () => {
    if (!pending || committing.current) return
    committing.current = true
    const result = restoreSave(pending)
    if (!result.ok) { committing.current = false; setMessage(saveErrorMessage(result.error)); cancel(); return }
    cancel()
    onReinitialize()
  }
  const reset = () => {
    if (committing.current) return
    committing.current = true
    const result = resetSave(confirmation)
    if (!result.ok) { committing.current = false; setMessage(saveErrorMessage(result.error)); cancel(); return }
    cancel()
    onReinitialize()
  }
  return <>
    <details className="save-data-panel">
      <summary><span><strong>DỮ LIỆU TRÒ CHƠI</strong><small>Dữ liệu: {healthMessages[health]}</small></span><span aria-hidden="true">⌄</span></summary>
      <div className="save-data-content">
        <p>Dữ liệu hiện được lưu trên thiết bị này. File sao lưu giúp chuyển máy hoặc giữ lại tiến trình.</p>
        <div className="save-actions">
          <button className="secondary-button" type="button" disabled={busy} onClick={() => {
            try { downloadSaveBackup(); setMessage('Đã chuẩn bị file sao lưu.') }
            catch { setMessage('Chưa thể tải file sao lưu. Bạn thử lại nhé!') }
          }}>TẢI FILE SAO LƯU</button>
          <button className="secondary-button" type="button" disabled={busy} onClick={() => fileInput.current?.click()}>
            {busy ? 'ĐANG ĐỌC FILE…' : 'KHÔI PHỤC DỮ LIỆU'}
          </button>
          {typeof navigator.clipboard?.writeText === 'function' ? <button className="text-button" type="button" disabled={busy}
            onClick={() => { void copySaveBackup().then((ok) => setMessage(ok ? 'Đã sao chép backup.' : 'Chưa thể sao chép. Bạn vẫn có thể tải file.')) }}>SAO CHÉP BACKUP</button> : null}
        </div>
        <input ref={fileInput} className="save-file-input" type="file" accept="application/json,.json" aria-label="Chọn file sao lưu JSON"
          disabled={busy} onChange={(event) => { void selectFile(event) }} />
        <p className="save-status" role="status" aria-live="polite">{message}</p>
        <button className="reset-data-link" type="button" disabled={busy} onClick={() => { setResetting(true); setConfirmation(''); setMessage('') }}>XÓA TOÀN BỘ DỮ LIỆU</button>
        <small>Backup chứa tên và tiến trình. Chỉ chia sẻ file với người bạn tin tưởng.</small>
      </div>
    </details>
    {pending ? <SaveDialog title="KHÔI PHỤC DỮ LIỆU?" onCancel={cancel}>
      <dl className="restore-summary">
        <div><dt>Tên</dt><dd>{pending.data.profile.playerName || 'Chưa tạo hồ sơ'}</dd></div>
        <div><dt>Level</dt><dd>{getLevelProgress(pending.data.xp).level}</dd></div>
        <div><dt>Tiền</dt><dd>{formatMoney(pending.data.money)}</dd></div>
        <div><dt>Nghề đã chơi</dt><dd>{pending.data.completedJobs.length} nghề</dd></div>
        <div><dt>Thành tựu</dt><dd>{pending.data.achievements.length}</dd></div>
        <div><dt>Ngày xuất backup</dt><dd>{new Date(pending.exportedAt).toLocaleString('vi-VN')}</dd></div>
      </dl>
      <p className="save-warning">Dữ liệu hiện tại sẽ được thay thế. Một bản dự phòng sẽ được giữ trên thiết bị.</p>
      <div className="save-dialog-actions"><button className="secondary-button" type="button" onClick={cancel}>HỦY</button>
        <button className="primary-button" type="button" onClick={restore}>KHÔI PHỤC</button></div>
    </SaveDialog> : null}
    {resetting ? <SaveDialog title="XÓA TOÀN BỘ DỮ LIỆU?" onCancel={cancel}>
      <p className="save-warning">Thao tác này xóa hồ sơ, tiến trình, tiền, trang phục, thành tựu và các chuỗi ngày. Hãy tải file sao lưu trước khi tiếp tục.</p>
      <label className="reset-confirm-label">Nhập {RESET_CONFIRMATION} để xác nhận
        <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} />
      </label>
      <div className="save-dialog-actions"><button className="secondary-button" type="button" onClick={cancel}>HỦY</button>
        <button className="danger-button" type="button" disabled={confirmation.trim().normalize('NFC') !== RESET_CONFIRMATION} onClick={reset}>XÓA DỮ LIỆU</button></div>
    </SaveDialog> : null}
  </>
}
