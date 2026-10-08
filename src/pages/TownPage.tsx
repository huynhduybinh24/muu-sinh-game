import { useEffect, useRef, useState } from 'react'
import { ScreenShell } from '../components/ScreenShell'
import { BottomNav } from '../components/BottomNav'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { GameIcon } from '../components/GameIcon'
import { TownScenery } from '../components/TownScenery'
import { TownBuilding } from '../components/TownBuilding'
import { TOWN_SIZE, TOWN_START, TOWN_WALK_MS, townDistricts, townLocations } from '../data/town'
import { getTownAppearance, getTownDailyLocation, getTownLaunch, getTownPlayerTarget } from '../services/town'
import { jobsById } from '../data/jobs'
import { formatMoney } from '../services/formatters'
import { useProgressStore } from '../store/progressStore'
import type { TownLaunch, TownLocation } from '../types/town'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
interface TownPageProps { dateKey: string; onHome: () => void; onCareer: () => void; onProfile: () => void; onPlay: (launch: TownLaunch) => void }
export function TownPage({ dateKey, onHome, onCareer, onProfile, onPlay }: TownPageProps) {
  const progress = useProgressStore()
  const daily = getTownDailyLocation(dateKey)
  const [selected, setSelected] = useState<TownLocation | null>(null)
  const [position, setPosition] = useState(TOWN_START)
  const [walking, setWalking] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [requestDaily, setRequestDaily] = useState(false)
  const scroll = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const travelTimer = useRef<number | null>(null)
  const originButton = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const viewport = scroll.current
    if (viewport) viewport.scrollLeft = Math.max(0, (TOWN_SIZE.width - viewport.clientWidth) / 2)
    return () => { if (travelTimer.current !== null) window.clearTimeout(travelTimer.current) }
  }, [])
  useEffect(() => {
    if (!panelOpen) return
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [panelOpen])
  const closePanel = () => { dialog.current?.close(); setPanelOpen(false); originButton.current?.focus({ preventScroll: true }) }
  const focusLocation = (location: TownLocation) => {
    const viewport = scroll.current
    viewport?.scrollTo({ left: Math.max(0, location.position.x - viewport.clientWidth / 2),
      top: Math.max(0, location.position.y - viewport.clientHeight * 0.4), behavior: reducedMotion() ? 'instant' : 'smooth' })
  }
  const selectLocation = (location: TownLocation, button: HTMLElement) => {
    if (travelTimer.current !== null) window.clearTimeout(travelTimer.current)
    originButton.current = button
    const target = getTownPlayerTarget(location)
    const move = !reducedMotion() && (target.x !== position.x || target.y !== position.y)
    setSelected(location); setRequestDaily(false); setPanelOpen(false); setPosition(target); setWalking(move)
    focusLocation(location)
    if (!move) { setPanelOpen(true); return }
    travelTimer.current = window.setTimeout(() => { travelTimer.current = null; setWalking(false); setPanelOpen(true) }, TOWN_WALK_MS)
  }
  const selectedJob = selected ? jobsById[selected.jobId] : null
  const stats = selected ? progress.jobStats[selected.jobId] : null
  return <ScreenShell header={<button className="town-home" type="button" onClick={onHome}>← VỀ TRANG CHỦ</button>}
    contentClassName="town-content" footer={<BottomNav active="town" onHome={onHome} onCareer={onCareer} onProfile={onProfile} />}>
    <div className="town-heading"><div><p className="eyebrow">Một thị trấn · Mười câu chuyện</p><h1>THỊ TRẤN MƯU SINH</h1></div><span>10 nghề</span></div>
    <div className="town-toolbar"><p>Vuốt để khám phá · Chạm một địa điểm</p><button type="button" onClick={() => focusLocation(daily)}>TÌM NGHỀ HÔM NAY</button></div>
    <div className="town-scroll" ref={scroll} role="region" aria-label="Bản đồ thị trấn, cuộn ngang và dọc" tabIndex={0}>
      <div className="town-canvas" style={{ width: TOWN_SIZE.width, height: TOWN_SIZE.height }}>
        <TownScenery />
        {townLocations.map((location) => {
          const job = jobsById[location.jobId]
          const district = townDistricts.find((entry) => entry.id === location.districtId)!
          const isDaily = daily.jobId === job.id
          return <button key={location.id} type="button" data-job-id={job.id} data-daily={isDaily}
            className={`town-location${isDaily ? ' town-location--daily' : ''}${selected?.id === location.id ? ' town-location--selected' : ''}`}
            style={{ left: location.position.x - 80, top: location.position.y - 130 }}
            aria-label={`Địa điểm ${job.name}`} aria-pressed={selected?.id === location.id}
            aria-describedby={isDaily ? `${location.id}-daily` : undefined} onClick={(event) => selectLocation(location, event.currentTarget)}>
            <TownBuilding jobId={job.id} roof={district.roof} />
            <span className="town-location-name"><GameIcon name={job.id} size={22} />{job.name}</span>
            {isDaily ? <span className="town-daily-badge" id={`${location.id}-daily`}>NGHỀ HÔM NAY</span> : null}
          </button>
        })}
        <div className={`town-player${walking ? ' town-player--walking' : ''}`} data-x={position.x} data-y={position.y}
          style={{ transform: `translate3d(${position.x - 31}px, ${position.y - 75}px, 0)` }} aria-label={`Nhân vật trên bản đồ của ${progress.profile.playerName}`}>
          <PlayerAvatar appearance={getTownAppearance(progress.profile.appearance)} size={62} state={walking ? 'static' : 'idle'} />
        </div>
      </div>
    </div>
    <p className="town-travel-status" role="status" aria-live="polite">{walking && selected ? `Đang đến ${selected.name}…` : 'Chơi tự do nhận lương và XP; chọn nghề hôm nay để tính chuỗi.'}</p>
    <details className="town-directory"><summary>DANH SÁCH 10 NGHỀ</summary><div>
      {townDistricts.map((district) => <section key={district.id} aria-label={district.name}><h2>{district.name}</h2>
        {townLocations.filter((location) => location.districtId === district.id).map((location) => <button key={location.id} type="button"
          onClick={(event) => selectLocation(location, event.currentTarget)} aria-label={`Chọn ${jobsById[location.jobId].name}`}>
          <GameIcon name={location.jobId} size={26} /><span>{jobsById[location.jobId].name}<small>{location.name}</small></span>
          {daily.jobId === location.jobId ? <small>HÔM NAY</small> : null}</button>)}
      </section>)}
    </div></details>
    {panelOpen && selected && selectedJob && stats ? <dialog ref={dialog} className="town-job-panel" aria-labelledby="town-panel-title"
      onCancel={(event) => { event.preventDefault(); closePanel() }}>
      <div className="town-panel-heading"><GameIcon name={selected.jobId} size={54} /><div><p className="eyebrow">{townDistricts.find((entry) => entry.id === selected.districtId)!.name}</p><h2 id="town-panel-title">{selectedJob.name}</h2></div></div>
      <strong className="town-place-name">{selected.name}</strong><p className="town-place-description">{selected.description}</p>
      <span className="meta-pill">Độ khó: {selectedJob.difficulty}</span>
      <dl className="town-career-stats"><div><dt>Đã làm</dt><dd>{stats.timesPlayed} lần</dd></div><div><dt>Kỷ lục</dt><dd>{stats.bestScore.toLocaleString('vi-VN')}</dd></div>
        <div><dt>Thu nhập</dt><dd>{formatMoney(stats.totalMoneyEarned)}</dd></div></dl>
      {selected.jobId === daily.jobId ? <fieldset className="town-play-mode"><legend>Chọn chế độ</legend>
        <label><input type="radio" name="town-mode" checked={!requestDaily} onChange={() => setRequestDaily(false)} />Chơi tự do</label>
        <label><input type="radio" name="town-mode" checked={requestDaily} onChange={() => setRequestDaily(true)} />Nghề hôm nay</label>
      </fieldset> : null}
      <p className="town-mode-note">{requestDaily && selected.jobId === daily.jobId ? 'Ca này tính cho nghề hôm nay; mỗi ngày chỉ tính một lần.' : 'Chơi tự do không tăng chuỗi ngày đi làm. Lương, XP và nhiệm vụ vẫn được tính.'}</p>
      <div className="town-panel-actions"><button className="secondary-button" type="button" onClick={closePanel}>ĐÓNG</button>
        <button className="primary-button" type="button" onClick={() => {
          const launch = getTownLaunch(selected.jobId, dateKey, requestDaily)
          if (launch) onPlay(launch)
        }}>ĐI LÀM</button></div>
    </dialog> : null}
  </ScreenShell>
}
