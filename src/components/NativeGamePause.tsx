import { useEffect, useRef } from 'react'

export function NativeGamePause({ onResume, onLeave }: { onResume: () => void; onLeave: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  return <dialog ref={dialog} className="save-dialog native-pause" aria-labelledby="native-pause-title"
    onCancel={(event) => { event.preventDefault() }}>
    <h2 id="native-pause-title">TẠM DỪNG CA LÀM</h2>
    <p>Tiếp tục ca làm hoặc trở về. Rời ca chưa hoàn thành sẽ không nhận kết quả.</p>
    <div className="save-dialog-actions"><button className="secondary-button" type="button" onClick={onLeave}>RỜI CA</button>
      <button className="primary-button" type="button" onClick={onResume}>TIẾP TỤC</button></div>
  </dialog>
}
