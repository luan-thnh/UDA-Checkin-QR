import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import zaloMiniApp from 'vite-plugin-zalo-mini-app';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    zaloMiniApp({
      app: {
        title: 'UDA Checkin QR',
        headerTitle: 'Check-in Sinh Viên',
        headerColor: '#00a457',
        textColor: 'white',
        statusBar: 'normal',
        actionBarHidden: false,
        hideAndroidBottomNavigationBar: true,
        hideIOSSafeAreaBottom: true,
      },
    }),
  ],
  build: { outDir: 'www' },
  server: { port: 3002 },
});
