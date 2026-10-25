import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/* The built files of two lazy chunks, as JSON in index.html
 * (<script type="application/json" id="chunk-files">), for the entry
 * bundle to read at run time — a dynamic import() only ever hands it
 * the module, never the URLs:
 *  • belowFold: BelowFold.tsx's chunk (first), the chunks only it
 *    pulls in (gsap) and their CSS;
 *  • contactPopup: the popup's chunk (its CSS ships in the entry).
 * When a chunk fails to load, lib/chunks fetches it again under fresh
 * URLs (see importAfresh). Hashed names are only known once the
 * bundle is written, hence a post-build HTML transform rather than a
 * constant in the source; and as the list sits in index.html next to
 * the entry's own <script>, the two always come from the same build. */
function chunkFiles(): Plugin {
  let base = '/'
  return {
    name: 'chunk-files',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const chunks = new Map(
          Object.values(ctx.bundle ?? {}).flatMap((c) =>
            c.type === 'chunk' ? [[c.fileName, c] as const] : [],
          ),
        )
        /* A chunk and everything it statically imports. */
        const graph = (fileName: string, into = new Set<string>()) => {
          if (!into.has(fileName)) {
            into.add(fileName)
            chunks.get(fileName)?.imports.forEach((f) => graph(f, into))
          }
          return into
        }
        const facade = (src: string) => {
          const chunk = [...chunks.values()].find((c) =>
            c.facadeModuleId?.endsWith(src),
          )
          if (!chunk) throw new Error(`chunk-files: no chunk for ${src}`)
          return chunk.fileName
        }
        /* What the entry loads up front is there already. */
        const loaded = new Set<string>()
        for (const c of chunks.values()) if (c.isEntry) graph(c.fileName, loaded)
        const own = (src: string) => {
          const js = [...graph(facade(src))].filter((f) => !loaded.has(f))
          const css = js.flatMap((f) => [
            ...(chunks.get(f)?.viteMetadata?.importedCss ?? []),
          ])
          return [...js, ...css].map((f) => base + f)
        }
        const files = {
          belowFold: own('/src/BelowFold.tsx'),
          contactPopup: own('/src/components/ContactPopup/ContactPopup.tsx'),
        }
        return [
          {
            tag: 'script',
            attrs: { type: 'application/json', id: 'chunk-files' },
            children: JSON.stringify(files),
            injectTo: 'body',
          },
        ]
      },
    },
  }
}

// https://vite.dev/config/
// This source lives inside the bunn-preview repo. It builds the UAE
// real-estate page that is served at bunn.world/uaerealestate, so:
//  • base '/uaerealestate/' — every emitted asset URL is rooted under
//    that path (no collision with the on-chain-bank root files).
//  • outDir '../uaerealestate' — build straight into the sibling
//    folder the static site serves at /uaerealestate.
export default defineConfig({
  base: '/uaerealestate/',
  plugins: [react(), chunkFiles()],
  build: {
    outDir: '../uaerealestate',
    emptyOutDir: true,
  },
  server: {
    port: parseInt(process.env.PORT || '5173', 10),
  },
})
