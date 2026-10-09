// Original editable geometry, not a crop/trace of the reference raster.
const { colors: c, name, tagline } = require('../src/data/brand.json')
const paths = {
  m: 'M24 219 L45 81 Q47 69 59 65 L85 57 Q96 54 103 66 L131 116 L158 71 Q165 58 178 63 L204 74 Q215 77 216 89 L236 220 Q237 232 223 230 L191 223 Q183 221 183 212 L175 148 L145 201 Q141 208 132 208 L123 208 Q115 208 111 200 L80 147 L70 213 Q69 222 60 225 L38 230 Q22 233 24 219 Z',
  road: 'M73 148 Q133 137 181 78 L166 73 Q160 70 167 64 L198 43 Q203 40 205 46 L217 80 Q219 88 212 85 L198 81 Q159 150 84 177 Z',
  coin: 'M207 47 A29 29 0 1 1 149 47 A29 29 0 1 1 207 47 Z',
  star: 'M178 31 L183 41 L194 43 L186 51 L188 63 L178 57 L168 63 L170 51 L162 43 L173 41 Z',
  town: 'M32 212 L37 181 L53 173 L65 182 L62 209 Z M185 207 L181 174 L196 161 L213 176 L219 217 Z',
}
const letters = [
  'M15 99 V22 L48 62 L82 22 V99',
  'M120 22 V73 Q120 103 151 103 Q182 103 182 73 V22 M182 25 Q211 25 208 5',
  'M230 22 V73 Q230 103 261 103 Q292 103 292 73 V22',
  'M400 29 Q359 7 343 33 Q328 57 371 62 Q413 67 399 92 Q384 114 345 94',
  'M445 22 V100',
  'M489 99 V22 L553 99 V22',
  'M596 22 V100 M655 22 V100 M596 61 H655',
].join(' ')

const defs = `<defs>
 <linearGradient id="gold" x2=".25" y2="1"><stop stop-color="#FFF09C"/><stop offset=".5" stop-color="${c.gold}"/><stop offset="1" stop-color="${c.orange}"/></linearGradient>
 <linearGradient id="road" x2="0" y2="1"><stop stop-color="#FFDA75"/><stop offset=".55" stop-color="${c.orange}"/><stop offset="1" stop-color="#DC5725"/></linearGradient>
 <linearGradient id="sky" x2=".3" y2="1"><stop stop-color="${c.teal}"/><stop offset="1" stop-color="#1686AD"/></linearGradient>
 </defs>`

function emblem({ town = false, mono = false } = {}) {
  const outline = mono ? '#FFFFFF' : c.navy
  if (mono) return `<path d="${paths.m}" fill="${outline}"/><path d="${paths.road}" fill="${outline}"/><path d="${paths.coin}" fill="${outline}"/>`
  return `<g stroke-linejoin="round">
 <path d="${paths.coin}" fill="url(#gold)" stroke="${c.navy}" stroke-width="7"/>
 <circle cx="178" cy="47" r="22" fill="none" stroke="#FFEAAA" stroke-width="3"/>
 <path d="${paths.star}" fill="#FFF2A4" stroke="#E59B1D" stroke-width="2"/>
 <path d="${paths.m}" transform="translate(0 5)" fill="${c.navy}" stroke="${c.navy}" stroke-width="12"/>
 <path d="${paths.m}" fill="url(#gold)" stroke="${c.navy}" stroke-width="9"/>
 <path d="M34 216 L55 85 Q55 80 63 77 L88 70 M194 89 L206 97 L221 215" fill="none" stroke="#FFF2BD" stroke-width="4" stroke-linecap="round"/>
 ${town ? `<path d="${paths.town}" fill="${c.navy}"/><path d="M43 185 V194 M53 183 V192 M194 178 V191 M207 185 V195" stroke="${c.gold}" stroke-width="5"/>` : ''}
 <path d="${paths.road}" fill="url(#road)" stroke="${c.navy}" stroke-width="7"/>
 <path d="M84 161 Q144 146 188 84" fill="none" stroke="${c.cream}" stroke-width="4" stroke-linecap="round" stroke-dasharray="9 11"/>
 </g>`
}

function wordmark() {
  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
 <path d="${letters}" stroke="${c.navy}" stroke-width="43" transform="translate(0 6)"/>
 <path d="${letters}" stroke="${c.navy}" stroke-width="39"/>
 <path d="${letters}" stroke="#FFF3C1" stroke-width="28"/>
 <path d="${letters}" stroke="url(#gold)" stroke-width="23"/>
 </g>`
}

function svg(width, height, content, title = name) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${title}</title>${defs}${content}</svg>`
}

function logo(kind) {
  if (kind === 'emblem') return svg(256, 256, emblem({ town: true }))
  if (kind === 'compact') return svg(720, 420, `<g transform="translate(267 0) scale(.72)">${emblem({ town: true })}</g><g transform="translate(28 212)">${wordmark()}</g><text x="360" y="390" text-anchor="middle" fill="${c.navy}" font-family="Arial, sans-serif" font-size="32" font-weight="700">${tagline}</text>`)
  const background = kind === 'light' ? `<rect width="960" height="280" rx="32" fill="${c.cream}"/>` : kind === 'dark' ? `<rect width="960" height="280" rx="32" fill="${c.navy}"/>` : ''
  const halo = kind === 'dark' ? `<rect x="8" y="8" width="944" height="264" rx="28" fill="none" stroke="${c.teal}" stroke-opacity=".4"/>` : ''
  return svg(960, 280, `${background}${halo}<g transform="translate(10 11)">${emblem({ town: true })}</g><g transform="translate(285 65) scale(.97)">${wordmark()}</g><path d="M318 204 Q590 182 906 202 L892 248 Q608 226 324 248 Z" fill="${c.cream}" stroke="${c.navy}" stroke-width="4"/><text x="612" y="226" text-anchor="middle" fill="${c.navy}" font-family="Arial, sans-serif" font-size="30" font-weight="700">${tagline}</text>`)
}

function icon({ maskable = false, round = false, foreground = false, mono = false } = {}) {
  // Adaptive foreground: bounding rectangle is inside the 66dp safe CIRCLE.
  const scale = foreground ? .19 : maskable ? 1.06 : 1.5
  const size = foreground ? 108 : 512
  const offsetX = (size - 256 * scale) / 2
  const offsetY = offsetX + (foreground ? 1 : 8)
  const background = foreground ? '' : `<rect width="512" height="512" rx="${round ? 256 : maskable ? 0 : 104}" fill="url(#sky)"/><path d="M0 391 Q240 296 512 426 V512 H0 Z" fill="${c.navy}" opacity=".35"/><circle cx="429" cy="63" r="122" fill="${c.cream}" opacity=".14"/>`
  return svg(size, size, `${background}<g transform="translate(${offsetX} ${offsetY}) scale(${scale})">${emblem({ mono })}</g>`, `${name} — biểu tượng ứng dụng`)
}

function townBackdrop() {
  return svg(720, 330, `<rect width="720" height="330" fill="#CEF3EF"/><circle cx="580" cy="76" r="42" fill="#FFDE85"/><path d="M0 99 Q80 38 147 99 Q223 17 314 87 Q421 41 474 106 Q621 25 720 104 V260 H0 Z" fill="#FFFFFF" opacity=".55"/>
 <path d="M0 276 Q220 223 420 271 T720 258 V330 H0 Z" fill="#79C5AC"/>
 <g stroke="${c.navy}" stroke-width="4" stroke-linejoin="round">
 <path d="M30 265 V159 H145 V265 Z" fill="#FFE7A4"/><path d="M20 159 L87 122 L155 159 Z" fill="${c.orange}"/>
 <path d="M36 183 H139 V204 H36 Z" fill="${c.cream}"/><path d="M36 183 H56 V204 H36 M76 183 H96 V204 H76 M116 183 H136 V204 H116" fill="${c.orange}" stroke="none"/>
 <path d="M51 226 H76 V265 H51 Z M101 224 H124 V243 H101 Z" fill="#1C8D9C"/>
 <path d="M534 271 V170 H652 V271 Z" fill="#FFE7A4"/><path d="M525 170 L593 133 L661 170 Z" fill="${c.orange}"/><path d="M555 200 H577 V225 H555 Z M610 200 H631 V225 H610 Z M579 237 H605 V271 H579 Z" fill="#1C8D9C"/>
 <path d="M645 271 V218 H705 V271 Z" fill="#FFF5DF"/><path d="M637 218 L675 190 L714 218 Z" fill="#FFAE57"/>
 </g><g fill="#269B81"><circle cx="185" cy="225" r="28"/><circle cx="169" cy="233" r="22"/><circle cx="688" cy="258" r="25"/></g><path d="M183 244 V286 M687 274 V299" stroke="${c.navy}" stroke-width="6"/><path d="M264 330 Q346 249 490 262 L559 330 Z" fill="#FFF0C9"/><path d="M326 330 Q385 282 464 276" stroke="#FFBE35" stroke-width="5" stroke-dasharray="18 16" fill="none"/>`, 'Phố nhỏ Việt Nam — phông nền Mưu Sinh')
}

function nativeVector({ mono = false, splash = false } = {}) {
  const color = mono ? '#FFFFFFFF' : c.navy
  const draw = (d, fill, stroke = null, width = 0) => `<path android:pathData="${d}" android:fillColor="${fill}"${stroke ? ` android:strokeColor="${stroke}" android:strokeWidth="${width}" android:strokeLineJoin="round"` : ''}/>`
  // 256-unit artwork at .19 fits entirely inside the central radius-33dp circle.
  return `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="${splash ? 288 : 108}dp" android:height="${splash ? 288 : 108}dp" android:viewportWidth="108" android:viewportHeight="108"><group android:translateX="29.68" android:translateY="30.68" android:scaleX="0.19" android:scaleY="0.19">${draw(paths.coin, mono ? color : c.gold, mono ? null : color, 7)}${draw(paths.star, mono ? color : '#FFF2A4')}${draw(paths.m, mono ? color : c.gold, mono ? null : color, 9)}${draw(paths.road, mono ? color : c.orange, mono ? null : color, 7)}${mono ? '' : draw('M84 161 Q144 146 188 84', '#00000000', c.cream, 4)}</group></vector>\n`
}

module.exports = { logo, icon, townBackdrop, nativeVector, colors: c }
