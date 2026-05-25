import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// This source lives inside the bunn-preview repo. It builds the UAE
// real-estate page that is served at bunn.world/uaerealeastate, so:
//  • base '/uaerealeastate/' — every emitted asset URL is rooted under
//    that path (no collision with the on-chain-bank root files).
//  • outDir '../uaerealeastate' — build straight into the sibling
//    folder the static site serves at /uaerealeastate.
export default defineConfig({
  base: '/uaerealeastate/',
  plugins: [react()],
  build: {
    outDir: '../uaerealeastate',
    emptyOutDir: true,
  },
  server: {
    port: parseInt(process.env.PORT || '5173', 10),
  },
})
