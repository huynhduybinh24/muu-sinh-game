import { getShopItem } from '../data/shop'
import { ProductShape } from './ProductArtwork'
import type { LifestyleState } from '../types/shop'

export function AvatarEquipment({ life, back = false, skin = '#eebe93' }: { life?: LifestyleState; back?: boolean; skin?: string }) {
  if (!life) return null
  const items = life.equipment
  const find = (id: string | null) => id ? getShopItem(id) : undefined
  const bag = find(items.back), shoes = find(items.shoes), hat = find(items.hat), face = find(items.face), hand = find(items.hand)
  if (back) return bag ? <g data-equipment="back" fill={bag.color}><rect x="54" y="125" width="93" height="57" rx="17" /><path d="M65 128V163M135 128V163" stroke="#425f64" strokeWidth="4" /></g> : null
  return <g strokeLinejoin="round">
    {shoes && <g data-equipment="shoes" fill={shoes.style === 'sandal' ? skin : shoes.color}><path d="M73 204H94V220H65Q62 212 73 204M108 204H128Q140 214 135 220H108Z" />
      {shoes.style === 'boot' && <path d="M72 192H94V213H72ZM108 192H129V213H108Z" />}
      {shoes.style === 'sandal' && <path d="M70 210H94M108 210H131M69 218H93M109 218H135" stroke={shoes.color} strokeWidth="4" />}
      <path d="M67 218H93M110 218H135" stroke="#fff2d5" strokeWidth="3" /></g>}
    {hat && <g data-equipment="hat" fill={hat.color}><path d={hat.style === 'helmet' ? 'M56 76Q53 31 100 31Q145 31 145 77L131 78V65H69V78Z' : 'M63 58Q60 23 100 23Q141 23 138 58Z'} />
      {hat.style === 'beanie' ? <><circle cx="100" cy="22" r="10" /><rect x="62" y="51" width="78" height="13" rx="4" /><path d="M75 54V62M90 54V62M106 54V62M124 54V62" stroke="#f5e2c6" strokeWidth="2" /></> : <path d={hat.style === 'bucket' ? 'M63 55H138L151 69H50Z' : 'M62 55H138L148 64H61Z'} />}
    </g>}
    {face && <g data-equipment="face" stroke={face.color} strokeWidth="3" fill={face.style === 'sunglasses' ? face.color : 'none'}><rect x="73" y="88" width="24" height="16" rx="6" /><rect x="106" y="88" width="24" height="16" rx="6" /><path d="M97 94H106M64 93H73M130 93H137" /></g>}
    {hand && (hand.style === 'apron' ? <g data-equipment="hand" fill={hand.color}><path d="M83 132H117L129 179H71Z" /><rect x="90" y="155" width="20" height="13" fill="#eee2bd" /></g> : hand.style === 'gloves' ? <g data-equipment="hand" fill={hand.color}><ellipse cx="55" cy="172" rx="8" ry="9" /><ellipse cx="145" cy="172" rx="8" ry="9" /></g> : hand.style === 'watch' || hand.style === 'bracelet' ? <rect data-equipment="hand" x="49" y="164" width="15" height={hand.style === 'bracelet' ? 4 : 9} rx="3" fill={hand.color} /> : <svg data-equipment="hand" x="137" y="143" width="41" height="41" viewBox="0 0 160 160"><ProductShape item={hand} /></svg>)}
  </g>
}
