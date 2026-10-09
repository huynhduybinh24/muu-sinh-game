import { getShopItem } from '../data/shop'
import { getLifestyle } from '../services/lifestyle'
import { ProductShape } from './ProductArtwork'
import { PlayerAvatar } from './PlayerAvatar'
import type { PlayerProfile } from '../types/profile'
import type { RoomSlot } from '../types/shop'

const positions: Record<RoomSlot, [number, number, number]> = {
  bed: [40,245,165], desk: [350,175,135], seat: [415,272,80], storage: [25,170,115],
  lounge: [340,290,130], screen: [375,70,110], plant: [505,245,72], light: [212,237,68], decor: [30,38,74],
}
export function RoomArtwork({ profile }: { profile: PlayerProfile }) {
  const life = getLifestyle(profile)
  return <div className="room-scene" aria-label="Phòng riêng của bạn">
    <svg className="room-art" viewBox="0 0 600 420" role="img" aria-label="Nội thất đã đặt trong phòng">
      <path d="M0 0H600V286L300 320L0 267Z" fill="#ece1c6" /><path d="M0 267L300 238L600 286V420H0Z" fill="#cda885" />
      <path d="M300 0V238L600 286V0Z" fill="#d7e4d6" /><path d="M0 267L300 238L600 286M300 0V238" stroke="#b4aa8c" strokeWidth="3" fill="none" />
      <g stroke="#ad8769" strokeWidth="2" opacity=".4"><path d="M0 327L315 295L600 346M0 391L320 353L600 414M132 253L154 420M422 260L449 420" /></g>
      <rect x="143" y="44" width="113" height="114" rx="12" fill="#fff7df" /><rect x="152" y="52" width="95" height="99" rx="8" fill="#a7cfcb" /><circle cx="221" cy="77" r="12" fill="#fff0b7" /><path d="M154 133L182 94L206 134L229 108L246 137" fill="#84ad91" /><path d="M199 53V150M154 102H247" stroke="#fff7df" strokeWidth="6" />
      <ellipse cx="280" cy="360" rx="77" ry="22" fill="#ead6b3" />
      {(Object.keys(positions) as RoomSlot[]).map(slot => {
        const id = life.room[slot], item = id ? getShopItem(id) : undefined
        const [x,y,size] = positions[slot]
        return item ? <svg key={slot} data-room-slot={slot} x={x} y={y} width={size} height={size} viewBox="0 0 160 160"><ProductShape item={item} /></svg> : null
      })}
      {life.computer && life.room.desk && <svg x="379" y="157" width="75" height="75" viewBox="0 0 160 160"><ProductShape item={getShopItem(life.computer)!} /></svg>}
      {life.phone && <svg data-room-phone x="307" y="280" width="46" height="46" viewBox="0 0 160 160"><ProductShape item={getShopItem(life.phone)!} /></svg>}
    </svg>
    <div className="room-avatar"><PlayerAvatar appearance={profile.appearance} lifestyle={profile.lifestyle} size={95} /></div>
  </div>
}
