import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// This source lives inside the bunn-preview repo. It builds the UAE
// real-estate page that is served at bunn.world/uaerealestate, so:
//  • base '/uaerealestate/' — every emitted asset URL is rooted under
//    that path (no collision with the on-chain-bank root files).
//  • outDir '../uaerealestate' — build straight into the sibling
//    folder the static site serves at /uaerealestate.
export default defineConfig({
  base: '/uaerealestate/',
  plugins: [react()],
  build: {
    outDir: '../uaerealestate',
    emptyOutDir: true,
  },
  server: {
    port: parseInt(process.env.PORT || '5173', 10),
  },
})
