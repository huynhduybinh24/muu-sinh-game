const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const zlib = require('node:zlib')
const { execFileSync } = require('node:child_process')
const assert = require('node:assert/strict')
const root = path.resolve(__dirname, '..')
function zipEntries(file) {
  const bytes = fs.readFileSync(file), entries = new Map()
  let end = bytes.length - 22
  while (end >= Math.max(0, bytes.length - 65557) && bytes.readUInt32LE(end) !== 0x06054b50) end--
  assert.ok(end >= 0, 'ZIP end record missing')
  let offset = bytes.readUInt32LE(end + 16)
  for (let i = 0; i < bytes.readUInt16LE(end + 10); i++) {
    assert.equal(bytes.readUInt32LE(offset), 0x02014b50)
    const method = bytes.readUInt16LE(offset + 10), size = bytes.readUInt32LE(offset + 20)
    const nameLength = bytes.readUInt16LE(offset + 28), extra = bytes.readUInt16LE(offset + 30), comment = bytes.readUInt16LE(offset + 32)
    const name = bytes.subarray(offset + 46, offset + 46 + nameLength).toString('utf8')
    const local = bytes.readUInt32LE(offset + 42)
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28)
    const data = bytes.subarray(start, start + size)
    entries.set(name, method === 8 ? zlib.inflateRawSync(data) : (assert.equal(method, 0), data))
    offset += 46 + nameLength + extra + comment
  }
  return entries
}
function distFiles(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = `${prefix}${entry.name}`
    return entry.isDirectory() ? distFiles(path.join(directory, entry.name), `${relative}/`) : [relative]
  })
}
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
function jdkTool(name) { return process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', `${name}${process.platform === 'win32' ? '.exe' : ''}`) : name }
function main() {
  const bundletool = process.env.BUNDLETOOL_JAR
  assert.ok(bundletool && fs.existsSync(bundletool), 'Set BUNDLETOOL_JAR to the official bundletool-all JAR (see RELEASE.md).')
  const runBundletool = args => execFileSync(jdkTool('java'), ['-jar', bundletool, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const file = path.join(root, 'android/app/build/outputs/bundle/release/app-release.aab')
  assert.ok(fs.existsSync(file), 'Release AAB is missing')
  runBundletool(['validate', `--bundle=${file}`])
  const manifest = runBundletool(['dump', 'manifest', `--bundle=${file}`, '--module=base'])
  const attribute = name => manifest.match(new RegExp(`${name}="([^"]+)"`))?.[1]
  assert.equal(attribute('package'), 'com.muusinh.game')
  assert.equal(attribute('android:versionCode'), '1')
  assert.equal(attribute('android:versionName'), '1.0')
  assert.equal(attribute('android:minSdkVersion'), '24')
  assert.equal(attribute('android:targetSdkVersion'), '36')
  assert.equal(attribute('android:compileSdkVersion'), '36')
  assert.ok(!manifest.includes('android:debuggable="true"'))
  const permissions = [...manifest.matchAll(/<uses-permission\b[^>]*android:name="([^"]+)"/g)].map(match => match[1]).sort()
  assert.deepEqual(permissions, ['android.permission.INTERNET', 'com.muusinh.game.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'])
  const entries = zipEntries(file), bundled = distFiles(path.join(root, 'dist'))
  const capacitorConfig = JSON.parse(entries.get('base/assets/capacitor.config.json').toString('utf8'))
  assert.equal(capacitorConfig.appId, 'com.muusinh.game')
  assert.equal(capacitorConfig.webDir, 'dist')
  assert.ok(!capacitorConfig.server?.url, 'Production app cannot use a remote server URL')
  for (const relative of bundled) {
    const packaged = entries.get(`base/assets/public/${relative}`)
    assert.ok(packaged, `Missing bundled web asset: ${relative}`)
    assert.equal(hash(packaged), hash(fs.readFileSync(path.join(root, 'dist', relative))), `Stale web asset: ${relative}`)
  }
  const libraries = [...entries.keys()].filter(name => name.endsWith('.so'))
  assert.equal(libraries.length, 0, 'Native libraries require explicit 16KB ELF/ZIP alignment verification')
  // Parsing below must not depend on the owner's Windows/JDK display language.
  const publicToolLocale = ['-J-Duser.language=en', '-J-Duser.country=US']
  const verification = execFileSync(jdkTool('jarsigner'), [...publicToolLocale, '-verify', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const signed = /jar verified/i.test(verification) && !/unsigned/i.test(verification)
  let certificateSha256 = null
  let certificateSha1 = null
  if (signed) {
    const cert = execFileSync(jdkTool('keytool'), [...publicToolLocale, '-printcert', '-jarfile', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    assert.ok(!/CN=Android Debug/i.test(cert), 'Debug certificate cannot be used for release')
    certificateSha256 = cert.match(/SHA256:\s*([A-F0-9:]+)/i)?.[1]?.replaceAll(':', '').toLowerCase()
    certificateSha1 = cert.match(/SHA1:\s*([A-F0-9:]+)/i)?.[1]?.replaceAll(':', '').toLowerCase() ?? null
    assert.ok(certificateSha256, 'Upload certificate fingerprint missing')
  }
  if (process.argv.includes('--require-signed')) {
    assert.ok(signed, 'AAB is UNSIGNED and cannot be uploaded')
    const approvedFingerprint = process.env.MUU_SINH_UPLOAD_CERT_SHA256?.replaceAll(':', '').toLowerCase()
    assert.equal(certificateSha256, approvedFingerprint, 'Set MUU_SINH_UPLOAD_CERT_SHA256 to the owner-approved public upload certificate fingerprint')
  }
  const report = { checkedAt: new Date().toISOString(), path: file, bytes: fs.statSync(file).size, sha256: hash(fs.readFileSync(file)),
    applicationId: attribute('package'), versionCode: attribute('android:versionCode'), versionName: attribute('android:versionName'),
    minSdk: attribute('android:minSdkVersion'), targetSdk: attribute('android:targetSdkVersion'), compileSdk: attribute('android:compileSdkVersion'), permissions,
    bundletool: 'PASS', bundledWebFiles: bundled.length, nativeLibraries: libraries, signing: signed ? 'SIGNED_VERIFIED' : 'UNSIGNED_NOT_UPLOAD_READY', certificateSha256, certificateSha1 }
  const apk = path.join(root, 'android/app/build/outputs/apk/debug/app-debug.apk')
  if (fs.existsSync(apk)) {
    const apkEntries = zipEntries(apk)
    for (const relative of bundled) assert.equal(hash(apkEntries.get(`assets/public/${relative}`)), hash(fs.readFileSync(path.join(root, 'dist', relative))))
    assert.equal([...apkEntries.keys()].filter(name => name.endsWith('.so')).length, 0)
    report.debugApk = { path: apk, bytes: fs.statSync(apk).size, sha256: hash(fs.readFileSync(apk)), bundledWebFiles: bundled.length }
  }
  const output = path.join(root, 'node_modules/.tmp/task-23'); fs.mkdirSync(output, { recursive: true })
  fs.writeFileSync(path.join(output, 'android-artifacts.json'), JSON.stringify(report, null, 2))
  fs.writeFileSync(path.join(output, 'release-manifest.xml'), manifest)
  console.log(JSON.stringify(report, null, 2))
}
if (require.main === module) { try { main() } catch (error) { console.error(error.message); process.exitCode = 1 } }
module.exports = { zipEntries }
