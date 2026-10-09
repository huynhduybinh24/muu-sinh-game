import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(path), 'utf8')
const brand = JSON.parse(read('src/data/brand.json')) as { name: string; tagline: string; colors: Record<string, string> }
function luminance(hex: string) {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4)
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
}
function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (values[0] + .05) / (values[1] + .05)
}

describe('original game branding', () => {
  it('preserves exact Vietnamese wording and generates tokens from one palette', () => {
    expect(brand.name).toBe('MƯU SINH')
    expect(brand.tagline).toBe('Mỗi Ngày Một Nghề')
    for (const [key, value] of Object.entries(brand.colors)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/i)
      expect(read('src/brand-tokens.css')).toContain(`--brand-${key}: ${value}`)
    }
  })
  it('uses accessible primary text/CTA contrasts', () => {
    expect(contrast(brand.colors.navy, brand.colors.cream)).toBeGreaterThan(10)
    expect(contrast(brand.colors.action, '#FFFFFF')).toBeGreaterThan(4.5)
    expect(contrast(brand.colors.muted, brand.colors.cream)).toBeGreaterThan(4.5)
    expect(contrast(brand.colors.success, '#FFFFFF')).toBeGreaterThan(4.5)
  })
  it('keeps Town branding independent of outdated profession counts', () => {
    const town = read('src/pages/TownPage.tsx')
    expect(town).toContain('Một thị trấn · Mỗi ngày một nghề')
    expect(town).not.toContain('Hai mươi câu chuyện')
    expect(town).toContain('{townLocations.length} nghề')
  })
  it.each(['horizontal', 'compact', 'emblem', 'light', 'dark', 'transparent'])('exports editable %s SVG and matching PNG', (variant) => {
    const svg = read(`public/branding/logo-${variant}.svg`)
    expect(svg).toContain('<path')
    expect(svg).toContain('<title id="title">MƯU SINH</title>')
    if (variant !== 'emblem') expect(svg).toContain(brand.tagline)
    expect(svg).not.toMatch(/<image|<script|https?:\/\/[^" ]+\.(png|jpg)|data:image/)
    const bytes = readFileSync(resolve(`public/branding/logo-${variant}.png`))
    const sizes = variant === 'emblem' ? [512, 512] : variant === 'compact' ? [1080, 630] : [1920, 560]
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual(sizes)
  })
  it.each([['pwa-icon-192.png', 192], ['pwa-icon-512.png', 512], ['pwa-maskable-512.png', 512], ['apple-touch-icon.png', 180], ['favicon-48.png', 48]] as const)('validates %s dimensions', (filename, size) => {
    const bytes = readFileSync(resolve('public', filename))
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([size, size])
  })
  it('keeps maskable distinct and supplies all native icon layers', () => {
    expect(readFileSync('public/pwa-maskable-512.png').equals(readFileSync('public/pwa-icon-512.png'))).toBe(false)
    for (const name of ['ic_launcher', 'ic_launcher_round']) {
      expect(read(`android/app/src/main/res/mipmap-anydpi-v26/${name}.xml`)).toContain('@drawable/ic_launcher_foreground')
      expect(read(`android/app/src/main/res/mipmap-anydpi-v33/${name}.xml`)).toContain('@drawable/ic_launcher_monochrome')
    }
    const activity = read('android/app/src/main/java/com/muusinh/game/MainActivity.java')
    expect(activity.indexOf('SplashScreen.installSplashScreen(this)')).toBeLessThan(activity.indexOf('super.onCreate(savedInstanceState)'))
    expect(read('android/app/src/main/res/values/styles.xml')).toContain('postSplashScreenTheme')
    expect(read('android/app/src/main/res/values-night/brand.xml')).toContain('#123653')
  })
  it('disables new animations for reduced motion and does not touch storage', () => {
    const css = read('src/branding.css')
    expect(css).toContain('prefers-reduced-motion: reduce')
    expect(css).toContain('animation: none !important')
    // Toasts already use translateX for centering; entrance must not overwrite it.
    expect(css).toContain('.achievement-toast, .level-up-toast { animation: brand-panel')
    expect(read('src/components/BrandLogo.tsx')).not.toMatch(/localStorage|setInterval|setTimeout/)
  })
})
