import type { ShopItem } from '../types/shop'

/** Original small vector silhouettes, shared by cards, room and device previews. */
export function ProductShape({ item }: { item: ShopItem }) {
  const c = item.color ?? '#87a9a0', style = item.style ?? item.category
  const outline = '#425f64'
  if (item.category === 'vehicle') {
    const car = item.vehicleType === 'car', bike = item.vehicleType === 'bicycle'
    return <g stroke={outline} strokeWidth="3" strokeLinejoin="round">
      <ellipse cx="80" cy="126" rx="65" ry="8" fill="#5d7476" opacity=".12" stroke="none" />
      <circle cx="37" cy="112" r={bike ? 23 : 17} fill={bike ? '#f6efde' : outline} /><circle cx="123" cy="112" r={bike ? 23 : 17} fill={bike ? '#f6efde' : outline} />
      {bike ? <><path d="M37 112L61 69L88 111H37L100 71L123 112M61 69H100M54 63H73M96 71L101 57H114" fill="none" stroke={c} strokeWidth="6" /><circle cx="88" cy="111" r="7" fill={c} /></>
        : car ? <><path d={style === 'suv' ? 'M15 69L25 40H117L135 68L148 78V108H12V81Z' : 'M12 80L32 69L49 42H108L127 70L147 82V106H12Z'} fill={c} />
          <path d="M48 68L59 49H80V68ZM87 49H106L118 68H87Z" fill="#dceddf" /><path d="M83 74V104M102 78H110" fill="none" /><path d="M16 87H28M134 87H144" stroke="#ffe9a3" strokeWidth="7" /></>
          : <><path d={item.vehicleType === 'scooter' ? 'M22 95Q42 65 76 77L86 95H108L114 56H129L136 99H24Z' : 'M25 94L47 72L77 62L100 88L126 105H24Z'} fill={c} /><path d="M51 65H87M111 51H134" strokeWidth="7" /><path d="M120 56L123 112M47 91L37 112" /><circle cx="128" cy="63" r="6" fill="#ffe9a3" /></>}
      {!bike && <><circle cx="37" cy="112" r="7" fill="#d9e6e2" /><circle cx="123" cy="112" r="7" fill="#d9e6e2" /></>}
    </g>
  }
  if (item.category === 'phone' || item.category === 'electronics') {
    if (style === 'headphones') return <g stroke={outline} strokeWidth="6" fill={c}><path d="M39 91V69A41 41 0 0 1 121 69V91" fill="none" /><rect x="28" y="78" width="25" height="48" rx="12" /><rect x="107" y="78" width="25" height="48" rx="12" /></g>
    if (style === 'speaker') return <g stroke={outline} strokeWidth="3"><rect x="41" y="26" width="78" height="113" rx="16" fill={c} /><circle cx="80" cy="104" r="23" fill="#465b61" /><circle cx="80" cy="104" r="9" fill="#bac9bf" /><circle cx="80" cy="54" r="11" fill="#f0e1af" /></g>
    if (style === 'console') return <g stroke={outline} strokeWidth="3" fill={c}><rect x="17" y="50" width="126" height="71" rx="21" /><rect x="48" y="58" width="64" height="54" rx="7" fill="#d6e6d1" /><path d="M27 86H39M33 80V92" /><circle cx="128" cy="81" r="4" fill="#efd69a" /><circle cx="121" cy="94" r="4" fill="#efd69a" /></g>
    if (style === 'tablet') return <g stroke={outline} strokeWidth="3"><rect x="24" y="23" width="112" height="114" rx="13" fill={c} /><rect x="32" y="33" width="96" height="91" rx="5" fill="#d9ebdd" /><path d="M51 95L73 61L92 83L114 54" fill="none" stroke={c} strokeWidth="6" /><circle cx="80" cy="130" r="3" /></g>
    const laptop = style === 'laptop', desktop = style === 'desktop'
    return <g stroke={outline} strokeWidth="3">
      <rect x={laptop || desktop ? 25 : 45} y="22" width={laptop || desktop ? 110 : 70} height={laptop || desktop ? 77 : 112} rx="12" fill={c} />
      <rect x={laptop || desktop ? 32 : 52} y="33" width={laptop || desktop ? 96 : 56} height={style === 'keypad' ? 48 : laptop || desktop ? 59 : 88} rx="6" fill="#d9ebdd" />
      <path d="M62 62L72 72L93 47" fill="none" stroke={c} strokeWidth="7" />
      {laptop ? <path d="M25 100L12 124Q80 142 148 124L135 100Z" fill={c} /> : desktop ? <><path d="M72 101V124H89V101M52 130H108" /><rect x="117" y="88" width="25" height="45" rx="4" fill={c} /></> : <circle cx="80" cy="127" r="3" fill={outline} />}
      {style === 'keypad' && [0,1,2,3,4,5,6,7,8].map(i => <rect key={i} x={56 + i % 3 * 18} y={88 + Math.floor(i / 3) * 11} width="10" height="6" rx="2" fill="#f8efdc" stroke="none" />)}
    </g>
  }
  if (item.category === 'home') return <g stroke={outline} strokeWidth="3" strokeLinejoin="round" fill={c}>
    {style === 'bed' ? <><path d="M19 75H141V125H19Z" /><rect x="20" y="45" width="121" height="49" rx="10" /><rect x="27" y="51" width="42" height="25" rx="8" fill="#fff5dd" /><path d="M22 125V139M139 125V139" /></>
      : style === 'desk' ? <><path d="M17 77H143V91H17ZM29 91V139M132 91V139" /><rect x="96" y="47" width="30" height="29" rx="4" fill="#f4dda7" /><path d="M45 72H80" strokeWidth="8" /></>
      : style === 'chair' ? <><rect x="50" y="25" width="62" height="65" rx="13" /><path d="M35 89H125V108H35ZM46 108V140M114 108V140" /></>
      : style === 'wardrobe' || style === 'bookshelf' ? <><rect x="28" y="20" width="104" height="124" rx="9" /><path d="M80 25V139M31 78H129" />{style === 'wardrobe' ? <path d="M69 70V85M91 70V85" stroke="#f5dfac" strokeWidth="5" /> : [0,1,2,3].map(i => <rect key={i} x={38+i*22} y="40" width="14" height={32+i*3} fill={i%2 ? '#d8b176' : '#9aad83'} />)}</>
      : style === 'sofa' ? <><rect x="24" y="47" width="112" height="65" rx="18" /><rect x="14" y="79" width="23" height="44" rx="9" /><rect x="123" y="79" width="23" height="44" rx="9" /><path d="M38 105H123M30 124V137M130 124V137M80 55V104" /></>
      : style === 'tv' ? <><rect x="13" y="27" width="134" height="92" rx="9" /><rect x="21" y="35" width="118" height="76" rx="5" fill="#cbe0d5" /><path d="M48 124L39 138M111 124L122 138M30 87Q60 44 82 74Q110 44 137 84" fill="none" /></>
      : style === 'plant' ? <><path d="M50 101H111L103 143H58Z" /><path d="M80 106V37" /><ellipse cx="59" cy="64" rx="19" ry="30" transform="rotate(-35 59 64)" fill="#7da97a" /><ellipse cx="101" cy="49" rx="19" ry="30" transform="rotate(35 101 49)" fill="#acc98c" /></>
      : style === 'lamp' ? <><path d="M80 117V67M48 138H112M48 63L61 24H99L112 63Z" /><ellipse cx="80" cy="63" rx="32" ry="8" fill="#ffe8a4" /></>
      : style === 'fan' ? <><circle cx="80" cy="64" r="46" /><path d="M80 110V135H48M80 135H112" /><circle cx="80" cy="64" r="8" fill="#eee2bf" /><path d="M80 55Q50 12 59 57M87 66Q134 52 105 89M74 70Q49 112 57 73" fill="#e6efe0" /></>
      : <><rect x="24" y="21" width="112" height="123" rx="8" /><rect x="33" y="31" width="94" height="100" fill="#f3e6b6" /><circle cx="101" cy="52" r="12" fill="#e5b472" /><path d="M34 113L61 72L87 104L104 82L127 113" fill="#82a48b" /></>}
  </g>
  if (item.category === 'hair') return <g><ellipse cx="80" cy="91" rx="35" ry="41" fill="#e8bd98" /><path d="M43 90Q32 24 81 26Q131 27 118 93L103 54Q71 79 58 49Z" fill="#574038" /><path d="M60 98Q80 113 100 98" fill="none" stroke={outline} strokeWidth="3" /></g>
  if (item.category === 'shirt') return <g stroke={outline} strokeWidth="3"><path d="M51 31L69 25Q80 40 91 25L109 31L142 63L121 85L111 75V135H49V75L39 85L18 63Z" fill={c} /><path d="M65 29L73 48L80 42L88 48L96 29" fill="#f5ebd4" />{['hoodie','denim-jacket','raincoat','blazer','linen'].includes(item.category === 'shirt' ? item.appearanceValue : '') && <path d="M80 46V130M59 94H70M91 94H102" fill="none" />} </g>
  if (item.category === 'pants') return <g stroke={outline} strokeWidth="3"><path d="M41 27H119L125 137H92L80 64L68 137H35Z" fill={c} /><path d="M42 42H118M57 46L45 66M102 46L115 66M80 42V59" fill="none" /></g>
  if (item.category === 'shoes') return <g stroke={outline} strokeWidth="3"><path d={style === 'boot' ? 'M40 37H91V85L134 107Q148 119 133 132H28V100H40Z' : style === 'sandal' ? 'M25 104L45 78L88 104L132 111Q148 119 133 132H25Z' : style === 'loafer' ? 'M25 92L45 79L86 98Q108 88 133 108Q148 119 133 132H25Z' : 'M25 83L61 64L92 93L134 108Q148 119 133 132H25Z'} fill={c} />
    {style === 'sandal' ? <><path d="M46 90L83 106M69 107L127 116" stroke="#f7e1bb" strokeWidth="12" /><path d="M39 87L53 91M83 111L91 114" stroke={outline} strokeWidth="6" /></> : style === 'loafer' ? <path d="M70 106Q94 95 117 110" stroke="#e9cd91" strokeWidth="7" fill="none" /> : <path d="M65 83L81 76M75 94L89 86M86 102L99 93" stroke="#fff0d3" strokeWidth="5" fill="none" />}
    <path d="M25 125H139" fill="none" stroke="#fff0d3" strokeWidth="5" /></g>
  if (['glasses','sunglasses'].includes(style)) return <g stroke={outline} strokeWidth="5" fill={style === 'sunglasses' ? c : '#d8e9df'}><rect x="22" y="58" width="50" height="38" rx="15" /><rect x="88" y="58" width="50" height="38" rx="15" /><path d="M72 72H88M9 62H22M138 62H151" /></g>
  if (['cap','bucket','helmet','beanie'].includes(style)) return <g stroke={outline} strokeWidth="3" fill={c}><path d="M32 90Q27 27 80 27Q133 27 128 90Z" />
    {style === 'helmet' ? <><path d="M34 88H126V104L108 111V80H53V111L34 104Z" /><path d="M37 109L46 133H113L123 109" fill="none" /></> : style === 'beanie' ? <><rect x="27" y="87" width="105" height="24" rx="6" /><circle cx="80" cy="21" r="13" />{[43,61,80,99,117].map(x => <path key={x} d={`M${x} 89V109`} stroke="#fff0d3" />)}</> : <path d={style === 'bucket' ? 'M32 88H129L148 112H13Z' : 'M25 91H144L114 108H32Z'} />}
    <path d="M80 31V83" fill="none" stroke="#fff0d3" /></g>
  if (['backpack','delivery','school-bag','briefcase','toolbox'].includes(style)) return <g stroke={outline} strokeWidth="3" fill={c}><path d="M62 30V19H98V30" fill="none" /><rect x="31" y="30" width="98" height="110" rx={style === 'briefcase' || style === 'toolbox' ? 8 : 25} /><rect x="47" y="78" width="66" height="44" rx="10" /><path d="M31 61H129M80 33V58" stroke="#f2dfad" /></g>
  if (style === 'camera') return <g stroke={outline} strokeWidth="4" fill={c}><rect x="19" y="51" width="122" height="79" rx="13" /><path d="M43 51V35H80V51" /><circle cx="88" cy="90" r="29" fill="#536b79" /><circle cx="88" cy="90" r="16" fill="#adcbbf" /><rect x="31" y="63" width="17" height="10" fill="#f0d9a4" /></g>
  if (style === 'umbrella') return <g stroke={outline} strokeWidth="4"><path d="M80 20Q28 25 17 76Q47 60 80 77Q114 58 145 76Q132 25 80 20Z" fill={c} /><path d="M80 77V129Q80 152 57 135" fill="none" /></g>
  if (style === 'watch') return <g stroke={outline} strokeWidth="3" fill={c}><path d="M66 18H95V145H66Z" /><circle cx="80" cy="81" r="34" fill="#f8ebce" /><path d="M80 81V61M80 81L97 90" strokeWidth="5" /></g>
  if (style === 'bracelet') return <g fill="none" stroke={c} strokeWidth="12"><ellipse cx="80" cy="83" rx="46" ry="35" /><path d="M118 56L135 31M119 64L143 43" strokeWidth="6" /><circle cx="135" cy="31" r="5" fill="#ead6a4" stroke="none" /></g>
  if (style === 'gloves') return <g stroke={outline} strokeWidth="3" fill={c}><path d="M35 131L21 75Q17 58 29 56L33 76V39Q33 27 43 32L47 66V24Q56 13 60 30L64 66V29Q76 24 77 42L80 84Q100 56 108 67L92 108L79 131Z" /><path d="M98 123L122 134L146 73Q153 60 141 58L130 80L139 38Q136 24 126 39L116 76L126 29Q121 15 112 31L103 73Z" /></g>
  if (style === 'apron') return <g stroke={outline} strokeWidth="3" fill={c}><path d="M49 26H108L113 73L129 137H29L47 72Z" /><rect x="52" y="83" width="55" height="31" rx="5" /><path d="M50 31L28 54M110 31L133 55" fill="none" /></g>
  return <g stroke={outline} strokeWidth="3" fill={c}><rect x="48" y="39" width="64" height="102" rx="16" /><rect x="52" y="23" width="56" height="26" rx="6" /><path d="M62 67H99M63 127H98" stroke="#f5e9cb" /></g>
}
export function ProductArtwork({ item, size = 120 }: { item: ShopItem; size?: number }) {
  return <svg className="product-art" viewBox="0 0 160 160" width={size} height={size} role="img" aria-label={item.name}><ProductShape item={item} /></svg>
}
