import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.muusinh.game', // Provisional: confirm ownership before publication.
  appName: 'Mưu Sinh',
  webDir: 'dist',
  backgroundColor: '#FFF5DF',
  plugins: {
    SystemBars: { insetsHandling: 'css', style: 'LIGHT', hidden: false },
  },
}
export default config
