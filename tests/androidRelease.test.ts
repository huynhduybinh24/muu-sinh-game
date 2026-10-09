import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { privacyPolicy } from '../src/data/privacy'
import { createRequire } from 'node:module'
import { inflateSync } from 'node:zlib'

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const { rgbaPng } = createRequire(import.meta.url)('../scripts/png-rgba.cjs') as { rgbaPng: (png: Buffer) => Buffer }
describe('Android release boundaries', () => {
  it('keeps approved identity, SDK 36 and original version', () => {
    const gradle = source('android/app/build.gradle')
    expect(gradle).toContain('applicationId "com.muusinh.game"')
    expect(gradle).toContain('versionCode 1')
    expect(gradle).toContain('versionName "1.0"')
    expect(source('android/variables.gradle')).toMatch(/targetSdkVersion\s*=\s*36/)
    expect(source('capacitor.config.ts')).not.toMatch(/server:\s*\{/)
  })
  it('requires external credentials and rejects debug certificates without changing debug builds', () => {
    const gradle = source('android/app/build.gradle')
    expect(gradle).toContain("System.getenv('MUU_SINH_SIGNING_PROPERTIES')")
    expect(gradle).toContain('startsWith(repository)')
    expect(gradle).toContain("contains('cn=android debug')")
    expect(gradle).toContain("gradleProperty('requireUploadSigning')")
    expect(gradle).not.toContain('signingConfig signingConfigs.debug')
    expect(source('scripts/android-release.ps1')).toContain('-PrequireUploadSigning=true')
    expect(source('scripts/android-release.ps1')).toContain('--require-signed')
  })
  it('does not add sensitive Android permissions or disable Android 16 behavior', () => {
    const manifest = source('android/app/src/main/AndroidManifest.xml')
    expect([...manifest.matchAll(/<uses-permission\s+android:name="([^"]+)"/g)].map(match => match[1])).toEqual(['android.permission.INTERNET'])
    expect(manifest).toContain('android:appCategory="game"')
    expect(manifest).toContain('android:screenOrientation="portrait"')
    expect(manifest).not.toContain('enableOnBackInvokedCallback="false"')
    expect(source('capacitor.config.ts')).toContain("insetsHandling: 'css'")
  })
  it('keeps private signing files and generated packages ignored', () => {
    const ignore = source('.gitignore')
    for (const entry of ['*.jks', '*.keystore', '*.p12', '*.pfx', 'signing.properties', 'upload-signing.properties', '*.apk', '*.aab', 'android/local.properties']) expect(ignore.split(/\r?\n/)).toContain(entry)
  })
  it('offers the same offline policy draft before and after profile creation', () => {
    expect(source('src/pages/WelcomePage.tsx')).toContain('<PrivacyPolicy />')
    expect(source('src/pages/ProfilePage.tsx')).toContain('<PrivacyPolicy />')
    expect(source('src/components/PrivacyPolicy.tsx')).toContain('<details')
    expect(source('src/components/PrivacyPolicy.tsx')).not.toMatch(/localStorage|fetch\(|https:\/\//)
    expect(privacyPolicy.developer).toBe('Muu Sinh Studio')
    expect(privacyPolicy.status).toContain('Bản nháp')
    expect(privacyPolicy.sections.at(-1)?.text).toContain('chưa được cung cấp')
    expect(privacyPolicy.sections.map(section => section.text).join(' ')).toContain('Manifest Android hiện cho phép sao lưu hệ thống')
  })
  it('ships a square 32-bit Play icon and losslessly preserves RGB pixels', () => {
    const png = readFileSync(new URL('../release-assets/app-icon.png', import.meta.url))
    expect([png.readUInt32BE(16), png.readUInt32BE(20), png[24], png[25]]).toEqual([512, 512, 8, 6])
    expect(png.length).toBeLessThanOrEqual(1024 * 1024)
    expect(rgbaPng(png)).toEqual(png)
    // Tiny RGB fixture exercises conversion independently of browser encoder filters.
    const original = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64')
    const converted = rgbaPng(original), idat: Buffer[] = []
    for (let offset = 8; offset < converted.length;) {
      const size = converted.readUInt32BE(offset)
      if (converted.toString('ascii', offset + 4, offset + 8) === 'IDAT') idat.push(converted.subarray(offset + 8, offset + 8 + size))
      offset += 12 + size
    }
    expect(inflateSync(Buffer.concat(idat))).toEqual(Buffer.from([0, 255, 0, 0, 255]))
  })
  it('keeps store copy within Play limits and never invents a policy URL', () => {
    const listing = source('release-assets/store-listing.vi.md')
    const section = (name: string) => listing.split(`## ${name}`)[1].split('##')[0].trim()
    expect(section('Title').length).toBeLessThanOrEqual(30)
    expect(section('Short description').length).toBeLessThanOrEqual(80)
    expect(section('Full description').length).toBeLessThanOrEqual(4000)
    expect(source('src/data/privacy.ts')).not.toMatch(/https?:\/\/|mailto:/)
  })
})
