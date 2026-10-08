import { isNativePlatform } from './platform'
import { Capacitor, registerPlugin } from '@capacitor/core'

export type NativeFileOutcome = 'shared' | 'cancelled' | 'unsupported'
type NativeSaveOutcome = 'saved' | 'cancelled' | 'unsupported'
const DIRECTORY = 'muu-sinh-exports'
let sequence = 0
const FileExport = registerPlugin<{ save: (options: { uri: string; filename: string }) => Promise<{ saved: boolean }> }>('FileExport')
export function safeExportFilename(filename: string): string {
  if (!/^[a-z0-9][a-z0-9_-]*\.(png|json)$/i.test(filename)) throw new Error('invalid-export-filename')
  return filename
}
export function isShareCancellation(error: unknown): boolean {
  if (error instanceof Error && error.name === 'AbortError') return true
  const message = error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : ''
  return /cancel(?:led|ed|ation)?|canceled/i.test(message)
}
export async function shareNativeFile(blob: Blob, filename: string, text = ''): Promise<NativeFileOutcome> {
  if (!isNativePlatform()) return 'unsupported'
  safeExportFilename(filename)
  const { Share } = await import('@capacitor/share')
  if (!(await Share.canShare()).value) return 'unsupported'
  try {
    const uri = await writeCachedExport(blob, filename)
    await Share.share({ title: 'MƯU SINH', text, files: [uri], dialogTitle: 'Chia sẻ file Mưu Sinh' })
    return 'shared'
  } catch (error) {
    if (isShareCancellation(error)) return 'cancelled'
    throw error
  }
}
export async function saveNativeFile(blob: Blob, filename: string): Promise<NativeSaveOutcome> {
  if (!isNativePlatform() || !Capacitor.isPluginAvailable('FileExport')) return 'unsupported'
  const uri = await writeCachedExport(blob, filename)
  return (await FileExport.save({ uri, filename })).saved ? 'saved' : 'cancelled'
}
async function writeCachedExport(blob: Blob, filename: string): Promise<string> {
  safeExportFilename(filename)
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  // Unique URI per share: a receiving app may read the file after the chooser closes.
  const now = Date.now()
  const path = `${DIRECTORY}/${now}-${sequence++}/${filename}`
  const previous = await Filesystem.readdir({ path: DIRECTORY, directory: Directory.Cache }).catch(() => ({ files: [] }))
  for (const file of previous.files) {
    if (/^\d{13}-\d+$/.test(file.name) && now - Number(file.name.split('-')[0]) > 86_400_000) {
      await Filesystem.rmdir({ path: `${DIRECTORY}/${file.name}`, directory: Directory.Cache, recursive: true })
    }
  }
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const chunks: string[] = []
  for (let offset = 0; offset < bytes.length; offset += 8192) chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)))
  const saved = await Filesystem.writeFile({ path, directory: Directory.Cache, data: btoa(chunks.join('')), recursive: true })
  return saved.uri
}
