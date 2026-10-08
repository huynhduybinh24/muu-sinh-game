import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.muusinh.game', // Provisional: confirm ownership before publication.
  appName: 'Mưu Sinh',
  webDir: 'dist',
  backgroundColor: '#fffaf0',
  plugins: {
    SystemBars: { insetsHandling: 'css', style: 'LIGHT', hidden: false },
  },
}
export default config
