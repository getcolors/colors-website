import { readFile, writeFile, mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import QRCode from 'qrcode';

const root = fileURLToPath(new URL('../', import.meta.url));
// One deck per invocation: `node scripts/build-slides.mjs [deck]`, where the
// deck is the basename of slides/<deck>.md; the output lands in
// public/slides/<deck>/ as index.html and <deck>.pdf. With no argument every
// deck under slides/ is built.
const decks = process.argv.slice(2).length ? process.argv.slice(2) : (await readdir(join(root, 'slides'))).filter((name) => name.endsWith('.md')).map((name) => name.slice(0, -3));
const registration = 'https://luma.com/ci9bek4c';
const qr = await QRCode.toString(registration, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, color: { dark: '#171b20', light: '#ffffff' } });
await mkdir(join(root, 'slides/assets'), { recursive: true });
await writeFile(join(root, 'slides/assets/town-hall-qr.svg'), qr);
let css = await readFile(join(root, 'slides/colors.css'), 'utf8');
for (const filename of ['ibm-plex-sans-400-latin.woff2', 'ibm-plex-mono-400-latin.woff2']) {
  const font = await readFile(join(root, 'public/fonts', filename));
  css = css.replace(`fonts/${filename}`, `data:font/woff2;base64,${font.toString('base64')}`);
}
for (const deck of decks) {
  const source = join(root, `slides/${deck}.md`);
  const output = join(root, `public/slides/${deck}`);
  await mkdir(output, { recursive: true });
  const markdown = await readFile(source, 'utf8');
  const embedded = markdown.replaceAll('assets/town-hall-qr.svg', `data:image/svg+xml;base64,${Buffer.from(qr).toString('base64')}`);
  // The og:image is the deck's own card when one exists, else the site card.
  const ogImage = (await readdir(join(root, 'public'))).filter((name) => name.startsWith(`og-slides-${deck}-`)).sort().at(-1) ?? 'og-colors-v4.png';
  const temp = await mkdtemp(join(tmpdir(), 'colors-slides-'));
  try {
    const input = join(temp, `${deck}.md`);
    const theme = join(temp, 'colors.css');
    await writeFile(input, embedded);
    await writeFile(theme, css);
    const site = process.env.SITE_URL || 'https://www.getcolors.ai';
    const common = [input, '--html', '--theme', theme, '--url', new URL(`/slides/${deck}/`, site).href, '--og-image', new URL(`/${ogImage}`, site).href];
    // stdin is ignored on purpose: Marp reads markdown from a piped stdin and
    // waits for EOF, which hangs the build under CI runners and agents.
    const run = (extra) => {
      const result = spawnSync(resolve(root, 'node_modules/.bin/marp'), [...common, ...extra], { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error(`Marp exited with ${result.status}`);
    };
    run(['--output', join(output, 'index.html')]);
    const browser = process.env.CHROME_PATH ? ['--browser-path', process.env.CHROME_PATH] : [];
    run(['--pdf', '--pdf-outlines', ...browser, '--output', join(output, `${deck}.pdf`)]);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
  console.log(`Built the ${deck} HTML and PDF. Fonts and QR code are embedded.`);
}
