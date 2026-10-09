import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.muusinh.game', // Confirmed by the owner for Task 23; verify Play Console availability.
  appName: 'Mưu Sinh',
  webDir: 'dist',
  backgroundColor: '#FFF5DF',
  plugins: {
    SystemBars: { insetsHandling: 'css', style: 'LIGHT', hidden: false },
  },
}
export default config
