import { getAvatarOption } from '../data/avatar'
import type { HairId, PlayerAppearance } from '../types/profile'
import type { LifestyleState } from '../types/shop'
import { AvatarEquipment } from './AvatarEquipment'

interface PlayerAvatarProps {
  size?: number
  appearance: PlayerAppearance
  state?: 'idle' | 'static'
  lifestyle?: LifestyleState
}

const hairFront: Record<HairId, string> = {
  crop: 'M61 91 Q55 40 100 40 Q145 40 140 91 L130 70 Q100 77 70 68 Z',
  swoop: 'M60 92 Q52 42 99 39 Q148 36 140 94 L131 67 Q103 83 74 61 L68 93 Z',
  bob: 'M55 104 L56 67 Q60 36 101 38 Q143 40 145 73 L145 113 L135 111 L131 65 Q105 83 70 65 L66 111 Z',
  bun: 'M60 91 Q53 40 100 40 Q144 40 140 92 L131 69 Q105 60 70 69 L67 93 Z',
  curls: 'M59 93 Q43 83 55 69 Q44 53 61 50 Q63 30 82 38 Q98 22 110 37 Q132 28 137 49 Q154 51 146 69 Q158 84 141 96 L130 70 Q116 76 103 64 Q84 79 68 70 Z',
  long: 'M53 121 L55 70 Q56 35 99 36 Q145 36 146 73 L150 131 L135 137 L132 65 Q105 79 70 64 L66 132 Z',
  wave: 'M60 93Q42 69 62 50Q84 28 106 43Q146 33 144 92L130 67Q115 85 96 62Q81 87 68 70Z',
  braid: 'M59 91Q55 40 100 40Q145 40 141 93L129 68Q100 76 70 66Z',
}

/** Original layered SVG; no remote assets, fonts, or duplicated avatar markup. */
export function PlayerAvatar({ size = 160, appearance, state = 'idle', lifestyle }: PlayerAvatarProps) {
  const skin = getAvatarOption('skinToneId', appearance.skinToneId).color
  const hair = getAvatarOption('hairId', appearance.hairId).color
  const shirt = getAvatarOption('shirtId', appearance.shirtId).color
  const pants = getAvatarOption('pantsId', appearance.pantsId).color
  const isFemale = appearance.gender === 'female'

  return (
    <div className={`player-avatar player-avatar--${state}`} style={{ width: size }}>
      <svg viewBox="0 0 200 240" role="img" aria-label={`Nhân vật ${isFemale ? 'nữ' : 'nam'} của bạn`}>
        <ellipse cx="100" cy="223" rx="51" ry="9" fill="#373755" opacity=".12" />
        <g className="avatar-figure" strokeLinejoin="round">
          <AvatarEquipment life={lifestyle} back />
          {appearance.hairId === 'bun' ? <circle cx="103" cy="36" r="20" fill={hair} /> : null}
          {appearance.hairId === 'long' || appearance.hairId === 'bob' ? (
            <path d="M57 76 Q47 113 55 148 L145 148 Q156 111 143 76Z" fill={hair} />
          ) : null}
          <path d="M71 164 L130 164 L128 209 Q116 216 108 207 L101 181 L94 208 Q82 216 72 209Z" fill={pants} />
          <path d="M73 205 L94 205 L93 220 L66 220 Q62 210 73 205 M108 205 L127 205 Q140 211 135 220 L108 220Z" fill="#36394f" />
          {appearance.pantsId === 'shorts' && <path d="M72 185H94V205H73ZM108 185H128V205H109Z" fill={skin} />}
          <path d="M69 127 Q56 129 52 153 L50 171 Q53 181 62 175 L71 150 M131 127 Q146 130 148 153 L150 171 Q146 181 138 175 L130 150" fill={skin} />
          <path d={isFemale
            ? 'M77 121 L123 121 Q143 124 144 145 L130 152 L126 162 L133 178 Q100 186 67 178 L74 162 L70 152 L56 145 Q59 126 77 121Z'
            : 'M77 121 L123 121 Q140 121 146 145 L130 151 L130 177 Q100 184 70 177 L70 151 L54 145 Q60 122 77 121Z'} fill={shirt} />
          <path d="M80 132 Q99 144 121 132" stroke="#fff" strokeWidth="4" opacity=".3" fill="none" />
          {['polo','linen','blazer'].includes(appearance.shirtId) && <><path d="M84 122L92 139L100 131L108 139L117 122" fill="#f6ecd8" /><path d="M100 139V175" stroke="#455765" strokeWidth="2" /></>}
          {['hoodie','denim-jacket','raincoat'].includes(appearance.shirtId) && <path d="M87 129L82 147M114 129L120 147M80 162H120M100 141V178" stroke="#f8ecd1" strokeWidth="3" fill="none" />}
          <path d="M91 108 L109 108 L113 125 Q100 139 87 125Z" fill={skin} />
          <circle cx="62" cy="92" r="10" fill={skin} />
          <circle cx="138" cy="92" r="10" fill={skin} />
          <path d="M63 72 Q65 48 100 48 Q135 48 137 72 L135 98 Q130 125 101 126 Q71 126 65 100Z" fill={skin} />
          <path d={hairFront[appearance.hairId]} fill={hair} />
          <path d="M79 83 Q85 80 90 83 M111 83 Q117 80 123 83" stroke={hair} strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="85" cy="94" rx="4" ry="5" fill="#353044" />
          <ellipse cx="117" cy="94" rx="4" ry="5" fill="#353044" />
          <circle cx="86" cy="92" r="1.4" fill="#fff" />
          <circle cx="118" cy="92" r="1.4" fill="#fff" />
          {isFemale ? <path d="M79 90 L76 88 M122 90 L126 88" stroke="#353044" strokeWidth="2" strokeLinecap="round" /> : null}
          <ellipse cx="76" cy="105" rx="7" ry="4" fill="#e57e79" opacity=".36" />
          <ellipse cx="126" cy="105" rx="7" ry="4" fill="#e57e79" opacity=".36" />
          <path d="M98 99 L96 105 L102 105" fill="none" stroke="#a46754" strokeWidth="2" opacity=".5" strokeLinecap="round" />
          <path d="M91 111 Q101 120 112 111" stroke="#834d48" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M81 154 L88 149 L95 154 L91 163 L85 163Z" fill="#fff" opacity=".65" />
          <path d="M72 178Q100 186 129 178M73 198L89 198M112 198L127 198" stroke="#353044" strokeWidth="2" opacity=".12" fill="none" />
          <path d="M72 48Q86 40 106 43M76 129L68 140" stroke="#fff" strokeWidth="3" opacity=".22" fill="none" strokeLinecap="round" />
          {appearance.hairId === 'braid' && <path d="M138 79Q158 109 141 143" fill="none" stroke={hair} strokeWidth="12" strokeDasharray="8 3" />}
          <AvatarEquipment life={lifestyle} skin={skin} />
        </g>
      </svg>
    </div>
  )
}
