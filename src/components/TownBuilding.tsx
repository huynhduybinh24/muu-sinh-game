import { memo } from 'react'
import type { JobId } from '../types/job'

export const TownBuilding = memo(function TownBuilding({ jobId, roof }: { jobId: JobId; roof: string }) {
  const stall = ['sugarcane', 'noodle', 'coffee'].includes(jobId)
  return <svg viewBox="0 0 180 148" className="town-building" aria-hidden="true">
    <ellipse cx="92" cy="128" rx="77" ry="14" fill="#4b655c" opacity=".15" />
    <path d="M24 53L94 79L160 54V110L94 136L24 110Z" fill={stall ? '#ffe9c1' : '#eee3c8'} />
    <path d="M94 79L160 54V110L94 136Z" fill="#6e9283" opacity=".2" />
    <path d="M16 51L83 20L168 51L95 81Z" fill={roof} stroke="#fff4db" strokeWidth="2" />
    <path d="M83 20L96 70M25 51L95 75L158 51" fill="none" stroke="#fff7e2" opacity=".4" strokeWidth="2" />
    <path d="M51 86L77 96V125L51 116Z" fill="#83a39d" />
    <path d="M112 83L143 71V96L112 108Z" fill="#8fbec0" stroke="#faf6dc" strokeWidth="3" />
    <path d="M127 78V102M112 95L143 83" stroke="#ecf5de" strokeWidth="2" />
    <path d="M33 67L85 87V104L33 85Z" fill="#fff7df" />
    {stall ? <><path d="M23 56L94 82V99L23 73Z" fill="#fff1c9" />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${26 + i * 17} ${58 + i * 6.2}l9 3.5v17l-9-3.5z`} fill={roof} />)}
      <ellipse cx="39" cy="128" rx="12" ry="5" fill="#b49877" /><path d="M39 129V136M146 111V125" stroke="#ad957b" strokeWidth="3" /></> : null}
    {jobId === 'construction' ? <g stroke="#98827a" strokeWidth="3" fill="none"><path d="M18 42V128M158 35V125M18 79L159 77M18 44L77 118M103 47L158 118" /><path d="M14 30H168" stroke="#c9a86e" strokeWidth="5" /></g> : null}
    {jobId === 'mechanic' || jobId === 'carwash' ? <><path d="M97 88L152 67V112L97 133Z" fill="#668b93" />
      <path d="M106 101L145 87V106L106 120Z" fill="#8ab4b7" /><circle cx="116" cy="117" r="5" fill="#566871" /><circle cx="144" cy="106" r="5" fill="#566871" />
      {jobId === 'carwash' ? <g fill="#e8f9ef"><circle cx="145" cy="62" r="6" /><circle cx="160" cy="84" r="4" /></g> : null}</> : null}
    {jobId === 'barber' ? <><path d="M31 89V118" stroke="#fff3df" strokeWidth="8" /><path d="M27 92L35 96M27 104L35 108M27 115L35 119" stroke="#d58c88" strokeWidth="4" /></> : null}
    {jobId === 'rubber' ? <><ellipse cx="87" cy="30" rx="37" ry="31" fill="#83ac74" /><ellipse cx="109" cy="22" rx="25" ry="22" fill="#adc68e" />
      <path d="M85 43V94" stroke="#b4926e" strokeWidth="17" /><path d="M79 57L92 67" stroke="#f8eac6" strokeWidth="3" /><path d="M96 77H112L109 90H98Z" fill="#fff7e2" /></> : null}
    {jobId === 'fishing' ? <><path d="M28 109L154 116V131L28 124Z" fill="#cfaa7e" /><path d="M44 110V124M68 112V126M92 113V128M116 115V130" stroke="#aa895f" />
      <path d="M118 93L149 65L166 110" stroke="#b89567" strokeWidth="3" fill="none" /></> : null}
    {jobId === 'shipper' ? <g fill="#ce9c67" stroke="#9e7c5a"><path d="M27 102L43 108V126L27 120Z" /><path d="M36 97L52 103V121L36 115Z" /></g> : null}
  </svg>
})
