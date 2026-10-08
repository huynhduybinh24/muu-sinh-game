import type { ReactNode } from 'react'
import type { JobId } from '../types/job'

export type GameIconName = JobId | 'home' | 'career' | 'profile' | 'gift'
const drawings: Record<GameIconName, ReactNode> = {
  rubber: <><path d="M24 21H41V54H24Z" fill="#b49472" /><circle cx="31" cy="16" r="13" fill="#99ba81" /><path d="M26 30L39 39" stroke="#fff3ca" /><path d="M37 42H51L48 55H40Z" fill="#e6ebd8" /></>,
  mechanic: <><path d="M19 14L23 21L32 18L32 10Q45 16 39 28L21 52L12 44L31 24Q17 27 19 14Z" fill="#91b2bd" /><circle cx="18" cy="44" r="3" /></>,
  coffee: <><path d="M16 29H46V50Q31 57 16 50Z" fill="#c5a184" /><path d="M21 19H41V30H21ZM17 15H45" fill="#a8b3ac" /><path d="M47 33Q60 33 55 45H47M28 7L31 12" /><path d="M18 45H44" stroke="#f7ddac" /></>,
  fishing: <><path d="M13 54L35 10L54 28" stroke="#bb9167" /><path d="M54 28V46" /><ellipse cx="41" cy="48" rx="10" ry="6" fill="#91bdc1" /><path d="M31 48L23 42V54Z" fill="#91bdc1" /><circle cx="45" cy="46" r="1" /></>,
  sugarcane: <><path d="M19 24H46L42 53H23Z" fill="#c6dc83" /><path d="M18 24H47M24 29L26 47" /><path d="M37 32L45 10H53" stroke="#cf876b" /><circle cx="32" cy="39" r="6" fill="#e8b568" /><path d="M13 13L19 20M12 20L18 25" stroke="#76a176" /></>,
  construction: <><path d="M9 36H34V51H9ZM34 36H56V51H34ZM19 20H46V36H19Z" fill="#d99670" /><path d="M22 24H41M13 40H27M39 40H51" stroke="#ffe0aa" /><path d="M13 9H50M18 9V17M46 9V17" stroke="#91a9b8" /></>,
  shipper: <><circle cx="17" cy="48" r="8" fill="#718896" /><circle cx="48" cy="48" r="8" fill="#718896" /><path d="M11 35H37V45H15ZM43 44L46 22H53" fill="#f3c96b" /><path d="M35 29H45M23 28H35" /><path d="M15 15H29V28H15Z" fill="#ddaa76" /><path d="M22 15V23" /></>,
  noodle: <><path d="M10 30H54Q50 53 32 53Q14 53 10 30Z" fill="#83b3a8" /><ellipse cx="32" cy="30" rx="22" ry="7" fill="#ffdc8e" /><path d="M16 29Q25 25 29 29T44 28M24 12Q20 18 25 21M37 10Q33 16 38 20" stroke="#fff5d0" /><path d="M41 30L54 12M47 31L59 14" stroke="#bd8865" /></>,
  barber: <><circle cx="19" cy="45" r="8" fill="#d5b7e2" /><circle cx="45" cy="45" r="8" fill="#d5b7e2" /><path d="M24 39L49 12M40 39L15 12" stroke="#719eae" strokeWidth="5" /><circle cx="32" cy="30" r="3" fill="#ffdb94" /></>,
  carwash: <><path d="M10 30L17 18H45L53 30V47H10Z" fill="#8dbecd" /><path d="M19 22H42L46 31H15Z" fill="#e3f2eb" /><path d="M15 38H21M43 38H48" stroke="#ffdf9d" /><circle cx="19" cy="48" r="5" fill="#718594" /><circle cx="45" cy="48" r="5" fill="#718594" /><circle cx="53" cy="13" r="5" fill="#eafaf5" /></>,
  home: <><path d="M11 28L32 10L53 28V53H11Z" fill="#f4c987" /><path d="M25 53V35H39V53" fill="#b7c8c1" /><path d="M7 29L32 8L57 29" stroke="#d28b75" /></>,
  career: <><path d="M20 11H44V27Q44 41 32 41Q20 41 20 27Z" fill="#f2cf7b" /><path d="M20 15H10V24Q10 31 20 31M44 15H54V24Q54 31 44 31M32 41V51M22 54H42" stroke="#c99563" /></>,
  profile: <><circle cx="32" cy="22" r="12" fill="#ddbb9e" /><path d="M10 54Q10 36 32 36Q54 36 54 54Z" fill="#9dbeb0" /><path d="M23 13Q32 5 42 17" stroke="#8a7268" /></>,
  gift: <><path d="M13 27H51V54H13Z" fill="#f2cc81" /><path d="M10 22H54V32H10Z" fill="#e6b06e" /><path d="M32 22V54" stroke="#c97e76" strokeWidth="7" /><path d="M30 21Q8 20 17 10Q27 5 32 21Q37 5 47 10Q56 20 34 21" fill="#dfa3a0" /></>,
}
/** Original vector symbols; existing job data and PNG artwork are untouched. */
export function GameIcon({ name, size = 32 }: { name: GameIconName; size?: number }) {
  return <svg className="game-icon" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <rect x="1" y="1" width="62" height="62" rx="18" fill="#f6eddc" />
    <path d="M3 24Q3 3 24 3H40Q54 3 59 16" stroke="#fff9e8" strokeWidth="2" fill="none" />
    <g stroke="#715e5b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">{drawings[name]}</g>
  </svg>
}
