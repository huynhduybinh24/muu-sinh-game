import { beforeEach, vi } from 'vitest'

// Persist middleware operates only on this isolated in-memory test storage.
const values = new Map<string, string>()
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
  clear: () => values.clear(),
}
vi.stubGlobal('localStorage', storage)
vi.stubGlobal('window', { localStorage: storage })
beforeEach(() => values.clear())
