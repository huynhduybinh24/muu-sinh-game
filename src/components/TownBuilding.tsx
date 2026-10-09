import { memo } from 'react'
import type { JobId } from '../types/job'

export const TownBuilding = memo(function TownBuilding({ jobId, roof }: { jobId: JobId; roof: string }) {
  const stall = ['sugarcane', 'noodle', 'coffee', 'banhmi', 'florist', 'cashier'].includes(jobId)
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
    {jobId === 'it' ? <><path d="M30 78H77V108H30Z" fill="#7098aa" /><path d="M44 85L37 92L44 99M62 85L69 92L62 99" stroke="#fff1c2" fill="none" strokeWidth="3" /><path d="M52 109V119H68" stroke="#7098aa" strokeWidth="4" /></> : null}
    {jobId === 'accountant' ? <><path d="M30 78H63V119H30Z" fill="#79a58e" /><path d="M36 85H57V96H36Z" fill="#eff0cd" /><path d="M38 105H42M50 105H55M38 112H42M50 112H55" stroke="#eff0cd" strokeWidth="3" /><path d="M67 90H82V123H67Z" fill="#f7eed6" /></> : null}
    {jobId === 'police' ? <><path d="M29 75H50V125H29Z" fill="#6d8c96" />{['#dd9787', '#e8ca77', '#99bd86'].map((color, i) => <circle key={color} cx="39" cy={85 + i * 15} r="5" fill={color} />)}<path d="M110 110L153 94" stroke="#f8efcd" strokeWidth="4" strokeDasharray="4 5" /></> : null}
    {jobId === 'doctor' ? <><path d="M35 80H73V113H35Z" fill="#f7f7e8" /><path d="M49 86H59V95H67V105H59V113H49V105H41V95H49Z" fill="#d5998e" /></> : null}
    {jobId === 'teacher' ? <><path d="M29 79H79V111H29Z" fill="#6b9978" /><path d="M35 90H70M35 99H56" stroke="#faf2d3" strokeWidth="3" /><path d="M39 115H72V128H39Z" fill="#cfaa74" /></> : null}
    {jobId === 'taxi' ? <><path d="M23 110L34 97H65L76 110V126H23Z" fill="#e5c06e" /><path d="M37 98V91H59V98" fill="#f5ddab" /><path d="M33 103H63L69 111H28Z" fill="#c0deda" /><circle cx="35" cy="129" r="5" fill="#627d84" /><circle cx="65" cy="129" r="5" fill="#627d84" /></> : null}
    {jobId === 'banhmi' ? <g fill="#e3b66e" stroke="#a97a50"><ellipse cx="64" cy="89" rx="24" ry="9" /><path d="M48 87L55 91M62 85L69 90M77 86L83 89" /></g> : null}
    {jobId === 'gas' ? <><path d="M28 75H53V122H28Z" fill="#ce7f60" /><path d="M33 82H48V94H33Z" fill="#dbf0dd" /><path d="M53 86Q70 82 66 120H59" stroke="#5f7e7b" strokeWidth="4" fill="none" /></> : null}
    {jobId === 'cargo' ? <g fill="#cda373" stroke="#997a5c"><path d="M26 90H59V121H26ZM62 101H87V127H62ZM43 66H71V91H43Z" /><path d="M42 90V120M55 67V90M73 102V125" /></g> : null}
    {jobId === 'cleaning' ? <><path d="M142 77L113 127" stroke="#b79769" strokeWidth="5" /><path d="M109 111L129 121L115 139L95 128Z" fill="#dcb76d" /><path d="M27 101H46L43 133H30Z" fill="#8aac81" /></> : null}
    {jobId === 'electrician' ? <><circle cx="60" cy="89" r="12" fill="#f4d68a" /><path d="M54 101H66V111H54Z" fill="#9fb4ae" /><path d="M60 70V65M42 79L37 76M78 79L83 76" stroke="#efc879" strokeWidth="3" /></> : null}
    {jobId === 'florist' ? <g stroke="#7ba174" strokeWidth="3">{[45, 65, 85].map((x, i) => <g key={x}><path d={`M${x} 105V87`} /><circle cx={x} cy={84 - i % 2 * 5} r="10" fill={['#dfa0ac', '#ebc877', '#bca4d6'][i]} /></g>)}</g> : null}
    {jobId === 'security' ? <><path d="M30 81H69V107H30Z" fill="#536e7c" /><path d="M35 86H64V102H35Z" fill="#b8d1c3" /><path d="M45 107V116H59" stroke="#536e7c" strokeWidth="3" /></> : null}
    {jobId === 'photographer' ? <><path d="M32 86H80V112H32Z" fill="#829aa9" /><circle cx="58" cy="99" r="10" fill="#e3f0e9" stroke="#607c8a" strokeWidth="4" /><path d="M39 86V80H51V86" fill="#829aa9" /></> : null}
    {jobId === 'cashier' ? <><path d="M31 89H77V106H31Z" fill="#94b7a0" /><path d="M45 80H69V94H45Z" fill="#5e8581" /><path d="M35 109H70V120H35Z" fill="#f7ebc9" /></> : null}
    {jobId === 'harvest' ? <><ellipse cx="86" cy="25" rx="39" ry="30" fill="#92b879" /><path d="M85 43V89" stroke="#b4926e" strokeWidth="14" />{[66, 85, 105].map(x => <ellipse key={x} cx={x} cy="30" rx="7" ry="9" fill="#efc364" />)}<path d="M28 104H58L54 128H32Z" fill="#bd9463" /></> : null}
  </svg>
})
