// Inspect names in the Git index only; never open or print private credentials.
const { execFileSync } = require('node:child_process')
const path = require('node:path')

function isPrivateSigningPath(file) {
  const normalized = file.replaceAll('\\', '/').toLowerCase()
  const name = normalized.split('/').at(-1)
  return /\.(jks|keystore|p12|pfx|key)$/.test(name) ||
    /(?:signing|keystore).*\.properties$/.test(name) || name === 'key.properties' ||
    normalized === 'android/local.properties' ||
    (name === '.env' || name.startsWith('.env.')) && name !== '.env.example'
}
function assertNoTrackedSigningFiles(files) {
  const count = files.filter(isPrivateSigningPath).length
  if (count) throw new Error(`Tracked private signing/configuration files detected (${count}). Remove them from Git and rotate exposed credentials before release.`)
}
function main() {
  let files
  try {
    files = execFileSync('git', ['ls-files', '-z'], {
      cwd: path.resolve(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).split('\0').filter(Boolean)
  } catch { throw new Error('Unable to inspect Git tracking; release signing is blocked.') }
  assertNoTrackedSigningFiles(files)
  console.log('PASS: no private signing/configuration filenames in the Git index. This is not a content or Git-history secret scan.')
}
if (require.main === module) {
  try { main() } catch (error) { console.error(error.message); process.exitCode = 1 }
}
module.exports = { isPrivateSigningPath, assertNoTrackedSigningFiles }
