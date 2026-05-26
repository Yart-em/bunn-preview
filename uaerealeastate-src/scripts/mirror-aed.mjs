/**
 * Post-build mirror: copy the built /uaerealestate output to a sibling
 * /aedrealestate folder and re-base every path reference
 * (/uaerealestate/… → /aedrealestate/…). One source builds two served
 * copies, so they never drift. Runs after `vite build` (see package.json).
 */
import {
  cpSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  statSync,
  existsSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', '..', 'uaerealestate'); // vite build output
const DST = join(here, '..', '..', 'aedrealestate'); // mirror copy

if (!existsSync(SRC)) {
  console.error('[mirror-aed] build output not found at', SRC);
  process.exit(1);
}

rmSync(DST, { recursive: true, force: true });
cpSync(SRC, DST, { recursive: true });

// Re-base only text assets; binaries (png/woff2/…) carry no path refs.
const TEXT = /\.(html|js|css|json|svg|txt|webmanifest|map)$/i;
let touched = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (TEXT.test(name)) {
      const before = readFileSync(p, 'utf8');
      const after = before.split('uaerealestate').join('aedrealestate');
      if (after !== before) {
        writeFileSync(p, after);
        touched += 1;
      }
    }
  }
}
walk(DST);
console.log(`[mirror-aed] mirrored → /aedrealestate (re-based ${touched} files)`);
