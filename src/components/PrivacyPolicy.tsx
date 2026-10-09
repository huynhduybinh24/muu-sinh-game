import { privacyPolicy } from '../data/privacy'
import { isNativePlatform } from '../services/platform'
import { useEffect, useRef, useState } from 'react'

function NativePolicyDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return <dialog ref={dialog} className="privacy-dialog" aria-labelledby="privacy-dialog-title"
    onCancel={event => { event.preventDefault(); onClose() }}>
    <button className="secondary-button" type="button" onClick={onClose}>ĐÓNG CHÍNH SÁCH</button>
    <h2 id="privacy-dialog-title">Chính sách quyền riêng tư — MƯU SINH</h2>
    <p>{privacyPolicy.status}</p><p>{privacyPolicy.developer} · Rà soát {privacyPolicy.reviewedAt}</p>
    {privacyPolicy.sections.map(({ title, text }) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}
  </dialog>
}

/** Inline disclosure works offline and does not change screen/history or saves. */
export function PrivacyPolicy() {
  const [nativeOpen, setNativeOpen] = useState(false)
  return <details className="privacy-policy">
    <summary>CHÍNH SÁCH QUYỀN RIÊNG TƯ</summary>
    <article aria-label="Chính sách quyền riêng tư">
      <h2>Chính sách quyền riêng tư — MƯU SINH</h2>
      <p>{privacyPolicy.status}</p>
      <p>{privacyPolicy.developer} · Rà soát {privacyPolicy.reviewedAt}</p>
      <p><a href={isNativePlatform() ? '/privacy-policy.html' : '/privacy-policy'} target="_blank" rel="noopener noreferrer"
        onClick={event => { if (isNativePlatform()) { event.preventDefault(); setNativeOpen(true) } }}>XEM BẢN NHÁP HTML — CHỜ DUYỆT</a></p>
      {privacyPolicy.sections.map(({ title, text }) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}
    </article>
    {nativeOpen ? <NativePolicyDialog onClose={() => setNativeOpen(false)} /> : null}
  </details>
}
