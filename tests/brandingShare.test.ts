import { afterEach, describe, expect, it, vi } from 'vitest'
import { createShareCardBlob } from '../src/services/shareCardImage'
import { createGameResult } from '../src/services/resultCalculator'
import { jobsById } from '../src/data/jobs'

afterEach(() => vi.unstubAllGlobals())

function mockCanvas() {
  const context = {
    beginPath: vi.fn(), roundRect: vi.fn(), fillRect: vi.fn(), arc: vi.fn(), fill: vi.fn(),
    fillText: vi.fn(), save: vi.fn(), restore: vi.fn(), strokeRect: vi.fn(), stroke: vi.fn(),
    measureText: (text: string) => ({ width: text.length * 20 }), drawImage: vi.fn(),
  }
  const canvas = {
    width: 0, height: 0, getContext: () => context,
    toBlob: (callback: BlobCallback) => callback(new Blob(['test'], { type: 'image/png' })),
  }
  vi.stubGlobal('document', { createElement: () => canvas })
  return { canvas, context }
}

describe('branded share export compatibility', () => {
  it('uses the local production PNG and preserves output dimensions', async () => {
    const { canvas, context } = mockCanvas()
    const decode = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('Image', class { src = ''; decode = decode })
    const blob = await createShareCardBlob(createGameResult('construction', 700), jobsById.construction)
    expect(blob.type).toBe('image/png')
    expect([canvas.width, canvas.height]).toEqual([1080, 1350])
    expect(context.drawImage).toHaveBeenCalledOnce()
    expect(context.drawImage.mock.calls[0][0]).toMatchObject({ src: '/branding/logo-horizontal.png' })
    expect(context.fillText).toHaveBeenCalledWith('PHỤ HỒ', 540, 660)
  })
  it('still exports when branding is unavailable in an older offline cache', async () => {
    const { context } = mockCanvas()
    vi.stubGlobal('Image', class { src = ''; decode = () => Promise.reject(new Error('missing-offline-asset')) })
    await expect(createShareCardBlob(createGameResult('construction', 0), jobsById.construction)).resolves.toBeInstanceOf(Blob)
    expect(context.drawImage).not.toHaveBeenCalled()
    expect(context.fillText).toHaveBeenCalledWith('MƯU SINH', 540, 130)
  })
})
