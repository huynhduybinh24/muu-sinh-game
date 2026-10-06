const { spawn } = require('node:child_process')
const path = require('node:path')
const { verifyProductionAssets } = require('./static-qa.cjs')

async function main() {
  await verifyProductionAssets()
  try {
    require.resolve(process.env.PWA_QA_PLAYWRIGHT || 'playwright')
  } catch {
    throw new Error('PWA QA needs an existing Playwright installation. Set PWA_QA_PLAYWRIGHT to its package directory; see README.')
  }
  const { preview } = await import('vite')
  const server = await preview({
    root: path.resolve(__dirname, '..'),
    preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false },
  })
  let child
  const stop = () => child?.kill()
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  try {
    const address = server.httpServer.address()
    child = spawn(process.execPath, [path.join(__dirname, 'pwa-qa.cjs'), ...process.argv.slice(2)], {
      cwd: path.resolve(__dirname, '..'),
      windowsHide: true,
      stdio: 'inherit',
      env: { ...process.env, PWA_QA_URL: `http://127.0.0.1:${address.port}` },
    })
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject)
      child.once('exit', (exitCode) => resolve(exitCode ?? 1))
    })
    process.exitCode = code
  } finally {
    process.removeListener('SIGINT', stop)
    process.removeListener('SIGTERM', stop)
    await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
