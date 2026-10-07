import { useState } from 'react'
import { ScreenShell } from '../components/ScreenShell'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { appearanceKeys, appearanceLabels, avatarOptions } from '../data/avatar'
import type { PlayerAppearance } from '../types/profile'
import type { ItemId } from '../types/shop'
import { starterItemIds } from '../data/shop'
import { canUseAppearanceOption, ownedAppearance } from '../services/inventory'

interface CharacterCreatorPageProps {
  playerName: string
  initialAppearance: PlayerAppearance
  onSave: (appearance: PlayerAppearance) => void
  onBack: () => void
  editing?: boolean
  ownedItemIds?: readonly ItemId[]
}

export function CharacterCreatorPage({ playerName, initialAppearance, onSave, onBack, editing = false, ownedItemIds = starterItemIds }: CharacterCreatorPageProps) {
  const [appearance, setAppearance] = useState<PlayerAppearance>(() => ownedAppearance(initialAppearance, ownedItemIds))
  const availableOptions = <Key extends keyof PlayerAppearance>(key: Key) =>
    avatarOptions[key].filter((option) => canUseAppearanceOption(key, option.id, ownedItemIds))
  const cycle = <Key extends keyof PlayerAppearance>(key: Key, direction: number) => {
    const options = availableOptions(key)
    const index = options.findIndex((option) => option.id === appearance[key])
    const next = options[(index + direction + options.length) % options.length]
    setAppearance((current) => ({ ...current, [key]: next.id }))
  }
  return (
    <ScreenShell header={<span>Phong cách của bạn</span>} contentClassName="creator-content"
      footer={<>
        <button className="primary-button" type="button" onClick={() => onSave(appearance)}>HOÀN TẤT ✓</button>
        <button className="text-button" type="button" onClick={onBack}>{editing ? 'HỦY THAY ĐỔI' : '← ĐỔI TÊN'}</button>
      </>}>
      <div className="page-heading"><p className="eyebrow">Xin chào, {playerName}!</p><h1>TẠO NHÂN VẬT</h1></div>
      <div className="avatar-stage creator-avatar"><span className="stage-spark stage-spark--one">✦</span>
        <PlayerAvatar appearance={appearance} size={140} /><span className="stage-spark stage-spark--two">✧</span>
      </div>
      <div className="appearance-options">
        {appearanceKeys.map((key) => {
          const options = availableOptions(key)
          const index = options.findIndex((option) => option.id === appearance[key])
          const selected = options[index]
          return (
            <section className="appearance-option" key={key} aria-label={appearanceLabels[key]}>
              <div className="option-heading"><strong>{appearanceLabels[key]}</strong><small>{index + 1}/{options.length}</small></div>
              <div className="option-picker">
                <button type="button" aria-label={`${appearanceLabels[key]} trước`} onClick={() => cycle(key, -1)}>‹</button>
                <span aria-live="polite"><i className="option-swatch" style={{ background: selected.color }} />{selected.label}</span>
                <button type="button" aria-label={`${appearanceLabels[key]} tiếp theo`} onClick={() => cycle(key, 1)}>›</button>
              </div>
            </section>
          )
        })}
      </div>
    </ScreenShell>
  )
}
