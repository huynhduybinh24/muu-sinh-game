import { memo } from 'react'
import { TOWN_SIZE, townDistricts } from '../data/town'

export const TownScenery = memo(function TownScenery() {
  return <svg className="town-scenery" viewBox={`0 0 ${TOWN_SIZE.width} ${TOWN_SIZE.height}`} aria-hidden="true">
    <defs>
      <linearGradient id="town-grass" x2=".7" y2="1"><stop stopColor="#f3e9c4" /><stop offset="1" stopColor="#ccdfa9" /></linearGradient>
      <linearGradient id="town-water" x2="1" y2=".8"><stop stopColor="#8ecac5" /><stop offset="1" stopColor="#579db0" /></linearGradient>
      <g id="town-tree"><ellipse cx="3" cy="22" rx="20" ry="7" fill="#6c8664" opacity=".18" /><path d="M-3 7H4V25H-3Z" fill="#a48463" /><g className="town-tree-crown"><ellipse cy="-8" rx="23" ry="27" fill="#78a67a" /><ellipse cx="-7" cy="-18" rx="16" ry="15" fill="#a1c28a" /><path d="M-12 1Q-5-13 6-16" fill="none" stroke="#bcd7a0" strokeWidth="2" /></g></g>
      <g id="town-lamp"><ellipse cy="28" rx="13" ry="5" fill="#455e62" opacity=".1" /><path d="M0 28V-12H13" fill="none" stroke="#78918d" strokeWidth="4" /><path d="M7-12H20L17-4H10Z" fill="#fff0b4" stroke="#8e9882" /></g>
      <g id="town-bench"><path d="M-24 0H24V8H-24Z" fill="#be9b76" /><path d="M-25-11H25V-5H-25Z" fill="#d6b58b" /><path d="M-18 8V16M18 8V16" stroke="#8a8b79" strokeWidth="4" /></g>
    </defs>
    <rect width="720" height="1220" rx="30" fill="url(#town-grass)" />
    <path d="M22 126Q30 114 54 118H670Q699 122 699 146V1120Q691 1196 616 1199H104Q21 1198 21 1120Z" fill="#edf1d3" opacity=".5" />
    {townDistricts.slice(0, 3).map((district, i) => <rect key={district.id} x="27" y={126 + i * 260} width="666" height="195" rx="30" fill={district.color} />)}
    <rect x="27" y="898" width="310" height="248" rx="32" fill="#bfd699" />
    <path d="M398 879Q525 917 682 885L703 1144Q595 1185 399 1150Z" fill="url(#town-water)" />
    <g className="town-ripples" fill="none" stroke="#daf5df" strokeWidth="3" opacity=".6">
      <path d="M436 967Q466 956 494 966M562 1160Q589 1150 620 1160M652 952Q670 945 690 952M425 1105Q449 1095 465 1105" />
    </g>
    <path d="M42 350H677M42 610H677M42 868H677M362 67V1180" fill="none" stroke="#b2b8a5" strokeWidth="54" strokeLinecap="round" />
    <path d="M42 347H677M42 607H677M42 865H677M359 67V1180" fill="none" stroke="#e9e7cc" strokeWidth="42" strokeLinecap="round" />
    <path d="M50 347H671M50 607H671M50 865H671M359 67V1173" fill="none" stroke="#fff9e4" strokeWidth="3" strokeDasharray="13 13" />
    <path d="M388 978H487V999H388Z" fill="#d3ae84" /><path d="M394 980V997M415 980V997M436 980V997M457 980V997M478 980V997" stroke="#ab8a66" strokeWidth="2" />
    <g fill="#fcf3d8" stroke="#bcae85" strokeWidth="1"><ellipse cx="359" cy="83" rx="80" ry="27" /><ellipse cx="359" cy="79" rx="80" ry="27" /></g>
    <text x="359" y="85" textAnchor="middle" fill="#9b6650" fontSize="15" fontWeight="900">MƯU SINH TOWN</text>
    {townDistricts.map((district) => <g key={district.id} transform={`translate(${district.label.x} ${district.label.y})`}>
      <rect x="-100" y="-18" width="200" height="30" rx="15" fill="#fffbe9" opacity=".92" />
      <text textAnchor="middle" fill="#60785f" fontWeight="850" fontSize="13">{district.name}</text>
    </g>)}
    {[{ x: 34, y: 75 }, { x: 678, y: 75 }, { x: 55, y: 322 }, { x: 669, y: 322 }, { x: 56, y: 580 }, { x: 671, y: 580 }, { x: 47, y: 861 }, { x: 688, y: 853 }, { x: 55, y: 954 }, { x: 291, y: 950 }, { x: 83, y: 1113 }, { x: 290, y: 1122 }].map(({ x, y }) => <use key={`${x}-${y}`} href="#town-tree" x={x} y={y} />)}
    {[130, 588].flatMap((x) => [349, 609, 869].map((y) => <use key={`${x}-${y}`} href="#town-lamp" x={x} y={y} />))}
    <use href="#town-bench" x="259" y="82" /><use href="#town-bench" x="608" y="1150" />
    <g fill="#f4dd92"><circle cx="70" cy="101" r="3" /><circle cx="650" cy="661" r="3" /><circle cx="41" cy="897" r="4" /></g>
    <g stroke="#789271" strokeWidth="2" fill="none"><path d="M153 69q5-8 10 0q5-8 10 0M601 103q4-6 8 0q4-6 8 0" /></g>
  </svg>
})
