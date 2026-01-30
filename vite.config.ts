import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 設定 Base Path 為儲存庫名稱，確保在 GitHub Pages 子目錄能正確讀取資源
  base: '/mylove-okane/',
})