// Lossless RGB8 -> RGBA8 encoding for generated Play artwork; no pixel/style changes.
const assert = require('node:assert/strict')
const zlib = require('node:zlib')
function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]), header = Buffer.alloc(4), tail = Buffer.alloc(4)
  header.writeUInt32BE(data.length); tail.writeUInt32BE(crc32(body))
  return Buffer.concat([header, body, tail])
}
function rgbaPng(png) {
  const signature = png.subarray(0, 8), header = Buffer.from(png.subarray(16, 29))
  assert.equal(header[8], 8); assert.equal(header[12], 0)
  if (header[9] === 6) return png
  assert.equal(header[9], 2, 'Only generated RGB8 or RGBA8 PNGs supported')
  const width = header.readUInt32BE(0), height = header.readUInt32BE(4), compressed = []
  for (let offset = 8; offset < png.length;) {
    const size = png.readUInt32BE(offset), type = png.toString('ascii', offset + 4, offset + 8)
    if (type === 'IDAT') compressed.push(png.subarray(offset + 8, offset + 8 + size))
    offset += size + 12
  }
  const scanlines = zlib.inflateSync(Buffer.concat(compressed)), stride = width * 3
  assert.equal(scanlines.length, (stride + 1) * height)
  const output = Buffer.alloc((width * 4 + 1) * height)
  let previous = Buffer.alloc(stride)
  for (let y = 0; y < height; y++) {
    const filter = scanlines[y * (stride + 1)], row = Buffer.alloc(stride)
    assert.ok(filter <= 4)
    for (let x = 0; x < stride; x++) {
      const left = x >= 3 ? row[x - 3] : 0, up = previous[x], corner = x >= 3 ? previous[x - 3] : 0
      const p = left + up - corner, a = Math.abs(p - left), b = Math.abs(p - up), c = Math.abs(p - corner)
      const prediction = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : a <= b && a <= c ? left : b <= c ? up : corner
      row[x] = (scanlines[y * (stride + 1) + 1 + x] + prediction) & 255
    }
    const start = y * (width * 4 + 1) + 1
    for (let x = 0; x < width; x++) { row.copy(output, start + x * 4, x * 3, x * 3 + 3); output[start + x * 4 + 3] = 255 }
    previous = row
  }
  header[9] = 6
  return Buffer.concat([signature, chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(output)), chunk('IEND', Buffer.alloc(0))])
}
module.exports = { rgbaPng }
