import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isNativeAndroid, isNativePlatform } from '../src/services/platform'
import { backAction, gameReturnScreen, initialNavigation, navigateScreen, previousScreen } from '../src/services/navigation'
import { isShareCancellation, safeExportFilename, shareNativeFile, saveNativeFile } from '../src/services/nativeFiles'
import { downloadShareCard, shareResultCard } from '../src/services/shareCardImage'
import { downloadSaveBackup, serializeSave, migrateImportedSave } from '../src/services/saveService'
import { createGameResult } from '../src/services/resultCalculator'
import { jobsById } from '../src/data/jobs'
import { migratePersistedProgress } from '../src/services/saveMigration'

const mocks = vi.hoisted(() => ({
  native: vi.fn(() => false), platform: vi.fn(() => 'web'), canShare: vi.fn(), share: vi.fn(),
  readdir: vi.fn(), rmdir: vi.fn(), writeFile: vi.fn(),
  available: vi.fn(() => true), save: vi.fn(),
}))
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: mocks.native, getPlatform: mocks.platform, isPluginAvailable: mocks.available }, registerPlugin: () => ({ save: mocks.save }) }))
vi.mock('@capacitor/share', () => ({ Share: { canShare: mocks.canShare, share: mocks.share } }))
vi.mock('@capacitor/filesystem', () => ({ Directory: { Cache: 'CACHE' }, Filesystem: { readdir: mocks.readdir, rmdir: mocks.rmdir, writeFile: mocks.writeFile } }))
beforeEach(() => {
  vi.clearAllMocks(); mocks.native.mockReturnValue(false); mocks.platform.mockReturnValue('web')
  mocks.canShare.mockResolvedValue({ value: true }); mocks.share.mockResolvedValue({})
  mocks.readdir.mockResolvedValue({ files: [] }); mocks.rmdir.mockResolvedValue(undefined)
  mocks.writeFile.mockResolvedValue({ uri: 'file:///private/cache/export.png' })
  mocks.available.mockReturnValue(true); mocks.save.mockResolvedValue({ saved: true })
})
afterEach(() => vi.restoreAllMocks())
describe('native platform boundary', () => {
  it('keeps ordinary browser/PWA on web APIs', () => { expect(isNativePlatform()).toBe(false); expect(isNativeAndroid()).toBe(false) })
  it('detects Android only with an actual native runtime', () => {
    mocks.platform.mockReturnValue('android'); expect(isNativeAndroid()).toBe(false)
    mocks.native.mockReturnValue(true); expect(isNativeAndroid()).toBe(true)
    mocks.platform.mockReturnValue('ios'); expect(isNativeAndroid()).toBe(false)
  })
})
describe('screen back navigation', () => {
  it('returns from Profile to Town without URL routing', () => {
    const town = navigateScreen(initialNavigation, 'town')
    expect(previousScreen(navigateScreen(town, 'profile'))).toEqual(town)
  })
  it('does not revive completed games via Back', () => {
    let state = navigateScreen(initialNavigation, 'career')
    state = navigateScreen(navigateScreen(state, 'reveal'), 'game')
    const result = navigateScreen(state, 'result')
    expect(result.history).toEqual(['home', 'career'])
    expect(previousScreen(result).screen).toBe('career')
  })
  it('abandoning a paused game returns safely to its originating hub', () => {
    const game = navigateScreen(navigateScreen(navigateScreen(initialNavigation, 'town'), 'reveal'), 'game')
    expect(gameReturnScreen(game)).toBe('town')
    expect(navigateScreen(game, gameReturnScreen(game))).toEqual(navigateScreen(initialNavigation, 'town'))
  })
  it('Back prioritizes keyboard/dialog, protects gameplay and minimizes only Home', () => {
    expect(backAction('profile', true, true)).toBe('keyboard')
    expect(backAction('game', true, false)).toBe('dialog')
    expect(backAction('game', false, false)).toBe('pause')
    expect(backAction('home', false, false)).toBe('minimize')
    expect(backAction('town', false, false)).toBe('navigate')
    expect(previousScreen(initialNavigation)).toEqual(initialNavigation)
  })
  it('Home resets navigation and same-screen actions do not accumulate history', () => {
    const town = navigateScreen(initialNavigation, 'town')
    expect(navigateScreen(town, 'town')).toBe(town)
    expect(navigateScreen(town, 'home')).toEqual(initialNavigation)
  })
})
describe('private native export and web fallback', () => {
  it('retains browser blob downloads for both PNG and JSON, without native calls', async () => {
    const anchor = { href: '', download: '', click: vi.fn(), remove: vi.fn() }
    vi.stubGlobal('document', { createElement: () => anchor, body: { append: vi.fn() } })
    vi.stubGlobal('window', { localStorage, setTimeout: vi.fn() })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:browser-export')
    await downloadShareCard(new Blob(['png']), 'result.png')
    expect(anchor.download).toBe('result.png')
    await downloadSaveBackup()
    expect(anchor.download).toMatch(/^muu-sinh-save-.*\.json$/)
    expect(anchor.click).toHaveBeenCalledTimes(2)
    expect(anchor.remove).toHaveBeenCalledTimes(2)
    expect(mocks.writeFile).not.toHaveBeenCalled()
  })
  it('returns unsupported when ordinary browser sharing is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    expect(await shareResultCard(new Blob(['png']), createGameResult('sugarcane', 0), jobsById.sugarcane)).toBe('unsupported')
  })
  it('retains browser file sharing when supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share, canShare: () => true })
    expect(await shareResultCard(new Blob(['png']), createGameResult('sugarcane', 0), jobsById.sugarcane)).toBe('shared')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ files: [expect.any(File)] }))
    expect(mocks.share).not.toHaveBeenCalled()
  })
  it('keeps the browser text-only fallback when file sharing is unsupported', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share, canShare: () => false })
    expect(await shareResultCard(new Blob(['png']), createGameResult('sugarcane', 0), jobsById.sugarcane)).toBe('text-shared')
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining('MƯU SINH') }))
    expect(share.mock.calls[0][0]).not.toHaveProperty('files')
  })
  it('retains silent browser share cancellation', async () => {
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(Object.assign(new Error('cancel'), { name: 'AbortError' })) })
    expect(await shareResultCard(new Blob(['png']), createGameResult('sugarcane', 0), jobsById.sugarcane)).toBe('cancelled')
  })
  it('never invokes native file plugins on web', async () => {
    expect(await shareNativeFile(new Blob(['file']), 'result.png')).toBe('unsupported')
    expect(mocks.writeFile).not.toHaveBeenCalled()
    expect(mocks.canShare).not.toHaveBeenCalled()
  })
  it.each(['../save.json', 'file.exe', 'folder/save.json', 'file.png/../../save.json'])('rejects unsafe filename %s', (name) => expect(() => safeExportFilename(name)).toThrow())
  it('exports UTF-8 JSON via private cache and native share without storage permissions', async () => {
    mocks.native.mockReturnValue(true)
    expect(await shareNativeFile(new Blob(['Mưu Sinh 🧱']), 'muu-sinh-save-2026-10-08.json')).toBe('shared')
    const [options] = mocks.writeFile.mock.calls[0] as [{ data: string; directory: string; path: string }]
    expect(new TextDecoder().decode(Uint8Array.from(atob(options.data), (character) => character.charCodeAt(0)))).toBe('Mưu Sinh 🧱')
    expect(options.directory).toBe('CACHE')
    expect(options.path).toMatch(/^muu-sinh-exports\/\d+-\d+\/muu-sinh-save-2026-10-08.json$/)
    expect(mocks.share).toHaveBeenCalledWith(expect.objectContaining({ files: ['file:///private/cache/export.png'] }))
  })
  it('uses distinct paths without deleting exports that another app may still read', async () => {
    mocks.native.mockReturnValue(true)
    await shareNativeFile(new Blob(['first']), 'result.png'); await shareNativeFile(new Blob(['second']), 'result.png')
    expect(mocks.writeFile.mock.calls[0][0].path).not.toBe(mocks.writeFile.mock.calls[1][0].path)
    expect(mocks.rmdir).not.toHaveBeenCalled()
  })
  it('cleans only expired timestamp folders inside the private export cache', async () => {
    mocks.native.mockReturnValue(true)
    const old = `${Date.now() - 172_800_000}-1`
    mocks.readdir.mockResolvedValue({ files: [{ name: old }, { name: 'other-files' }, { name: `${Date.now()}-2` }] })
    await shareNativeFile(new Blob(['png']), 'result.png')
    expect(mocks.rmdir).toHaveBeenCalledExactlyOnceWith({ path: `muu-sinh-exports/${old}`, directory: 'CACHE', recursive: true })
  })
  it('reports cancellation without claiming file delivery', async () => {
    mocks.native.mockReturnValue(true); mocks.share.mockRejectedValueOnce(new Error('Share canceled'))
    expect(await shareNativeFile(new Blob(['file']), 'result.png')).toBe('cancelled')
    expect(isShareCancellation({ message: 'Share canceled' })).toBe(true)
  })
  it('propagates real failures instead of pretending native download succeeded', async () => {
    mocks.native.mockReturnValue(true); mocks.writeFile.mockRejectedValueOnce(new Error('disk-full'))
    await expect(downloadShareCard(new Blob(['file']), 'result.png')).rejects.toThrow('disk-full')
  })
  it('reports unavailable native document picker and does not write files', async () => {
    mocks.native.mockReturnValue(true); mocks.available.mockReturnValue(false)
    await expect(downloadShareCard(new Blob(['file']), 'result.png')).rejects.toThrow('native-file-export-unavailable')
    expect(mocks.writeFile).not.toHaveBeenCalled()
  })
  it('native saving does not require a share target app', async () => {
    mocks.native.mockReturnValue(true); mocks.canShare.mockResolvedValue({ value: false })
    expect(await saveNativeFile(new Blob(['png']), 'result.png')).toBe('saved')
    expect(mocks.save).toHaveBeenCalledWith({ uri: 'file:///private/cache/export.png', filename: 'result.png' })
    expect(mocks.share).not.toHaveBeenCalled()
  })
  it('native picker cancellation is not reported as a saved download', async () => {
    mocks.native.mockReturnValue(true); mocks.save.mockResolvedValue({ saved: false })
    expect(await downloadShareCard(new Blob(['png']), 'result.png')).toBe(false)
    expect(await downloadSaveBackup()).toBe(false)
  })
  it('handles unavailable native sharing separately from document saving', async () => {
    mocks.native.mockReturnValue(true); mocks.canShare.mockResolvedValue({ value: false })
    expect(await shareNativeFile(new Blob(['png']), 'result.png')).toBe('unsupported')
    expect(mocks.writeFile).not.toHaveBeenCalled()
  })
  it('shares native PNG without relying on navigator.share', async () => {
    mocks.native.mockReturnValue(true)
    const result = createGameResult('construction', 100)
    expect(await shareResultCard(new Blob(['png']), result, jobsById.construction)).toBe('shared')
  })
  it('exports the same portable v5 save on native', async () => {
    mocks.native.mockReturnValue(true); await downloadSaveBackup()
    expect(mocks.writeFile).toHaveBeenCalled()
  })
})
describe('storage origin isolation', () => {
  it('v5 JSON transfers without changing schema or implying automatic synchronization', () => {
    const web = new Map<string, string>(), native = new Map<string, string>()
    const progress = { ...migratePersistedProgress(undefined), money: 12345, xp: 678 }
    const json = serializeSave(progress)
    web.set('web-backup', json)
    expect(native.size).toBe(0)
    const imported = migrateImportedSave(web.get('web-backup'))
    expect(imported.ok && imported.save.version).toBe(5)
    expect(imported.ok && imported.save.data).toEqual(progress)
  })
})
