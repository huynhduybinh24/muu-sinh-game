import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { privacyPolicy } from '../src/data/privacy'

const source = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
const { isPrivateSigningPath, assertNoTrackedSigningFiles } = createRequire(import.meta.url)('../scripts/signing-hygiene.cjs') as {
  isPrivateSigningPath: (file: string) => boolean
  assertNoTrackedSigningFiles: (files: string[]) => void
}
describe('final release gates', () => {
  it('recognizes private signing files including Windows paths and case variants', () => {
    for (const file of ['key.JKS', 'private/upload.keystore', 'private/key.p12', 'key.pfx', 'upload.KEY',
      'private/release-signing.properties', 'my-keystore.properties', 'key.properties',
      'android\\local.properties', '.env', 'private/.env.production']) expect(isPrivateSigningPath(file)).toBe(true)
  })
  it('does not reject legitimate source, examples or public certificate evidence', () => {
    for (const file of ['.env.example', 'android/app/build.gradle', 'scripts/android-release.ps1',
      'release-assets/RELEASE.md', 'upload-certificate.pem']) expect(isPrivateSigningPath(file)).toBe(false)
    expect(() => assertNoTrackedSigningFiles(['android/app/build.gradle'])).not.toThrow()
  })
  it('blocks tracked private files with a sanitized error, without echoing paths or contents', () => {
    expect(() => assertNoTrackedSigningFiles(['private/owner-sensitive-name.jks'])).toThrow('detected (1)')
    try { assertNoTrackedSigningFiles(['private/owner-sensitive-name.jks']) }
    catch (error) { expect(String(error)).not.toContain('owner-sensitive-name') }
  })
  it('runs tracking hygiene before the signed build and keeps the explicit signing gate', () => {
    const script = source('scripts/android-release.ps1')
    expect(script.indexOf('signing-hygiene.cjs')).toBeLessThan(script.indexOf('npm.cmd run release:check'))
    expect(script).toContain('-PrequireUploadSigning=true')
    expect(script).toContain('--require-signed')
  })
  it('discloses retained recovery data instead of promising reset erases every copy', () => {
    const section = privacyPolicy.sections.find(section => section.title === 'Lưu giữ, xóa và sao lưu')
    expect(section?.text).toContain('giữ một bản recovery cục bộ')
    expect(section?.text).toContain('không có thời hạn tự xóa')
    expect(section?.text).toContain('xóa dữ liệu ứng dụng')
    expect(source('src/services/saveService.ts')).toContain('repository.writeRecovery(snapshot)')
    expect(source('src/components/SaveDataPanel.tsx')).toContain('Một bản recovery cục bộ')
    expect(source('src/components/SaveDataPanel.tsx')).not.toContain('XÓA TOÀN BỘ DỮ LIỆU')
  })
  it('keeps the HTML and Markdown draft identical to offline in-app disclosures', () => {
    const html = source('public/privacy-policy.html'), markdown = source('release-assets/privacy-policy-draft.md')
    expect(html).toContain('<html lang="vi">')
    expect(html).toContain('<meta name="robots" content="noindex">')
    expect(html).not.toMatch(/<script|https?:\/\/|mailto:/)
    for (const { title, text } of privacyPolicy.sections) {
      expect(html).toContain(`<h2>${title}</h2><p>${text}</p>`)
      expect(markdown).toContain(text)
    }
    expect(html).toContain(privacyPolicy.status)
  })
  it('provides a visible native-local/web policy link without adding a remote URL', () => {
    const component = source('src/components/PrivacyPolicy.tsx')
    expect(component).toContain("isNativePlatform() ? '/privacy-policy.html' : '/privacy-policy'")
    expect(component).toContain('rel="noopener noreferrer"')
    expect(component).toContain('event.preventDefault(); setNativeOpen(true)')
    expect(component).toContain('onCancel={event => { event.preventDefault(); onClose() }}')
    expect(privacyPolicy.sections[2].text).toContain('PNG hiện không chứa tên nhân vật')
  })
  it('rejects expired upload certificates and makes public certificate parsing locale-independent', () => {
    expect(source('android/app/build.gradle')).toContain('certificate.checkValidity()')
    expect(source('scripts/verify-android-artifacts.cjs')).toContain('-J-Duser.language=en')
  })
})
