import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import QRCode from 'qrcode';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'slides/introduction.md');
const output = join(root, 'public/slides/introduction');
const registration = 'https://luma.com/ci9bek4c';
const qr = await QRCode.toString(registration, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, color: { dark: '#171b20', light: '#ffffff' } });
await mkdir(join(root, 'slides/assets'), { recursive: true });
await mkdir(output, { recursive: true });
await writeFile(join(root, 'slides/assets/town-hall-qr.svg'), qr);
let css = await readFile(join(root, 'slides/colors.css'), 'utf8');
for (const filename of ['ibm-plex-sans-400-latin.woff2', 'ibm-plex-mono-400-latin.woff2']) {
  const font = await readFile(join(root, 'public/fonts', filename));
  css = css.replace(`fonts/${filename}`, `data:font/woff2;base64,${font.toString('base64')}`);
}
const markdown = await readFile(source, 'utf8');
const embedded = markdown.replaceAll('assets/town-hall-qr.svg', `data:image/svg+xml;base64,${Buffer.from(qr).toString('base64')}`);
const temp = await mkdtemp(join(tmpdir(), 'colors-slides-'));
try {
  const input = join(temp, 'introduction.md');
  const theme = join(temp, 'colors.css');
  await writeFile(input, embedded);
  await writeFile(theme, css);
  const site = process.env.SITE_URL || 'https://www.getcolors.ai';
  const common = [input, '--html', '--theme', theme, '--url', new URL('/slides/introduction/', site).href, '--og-image', new URL('/og-colors-v4.png', site).href];
  const run = (extra) => {
    const result = spawnSync(resolve(root, 'node_modules/.bin/marp'), [...common, ...extra], { cwd: root, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Marp exited with ${result.status}`);
  };
  run(['--output', join(output, 'index.html')]);
  const browser = process.env.CHROME_PATH ? ['--browser-path', process.env.CHROME_PATH] : [];
  run(['--pdf', '--pdf-outlines', ...browser, '--output', join(output, 'introduction.pdf')]);
} finally {
  await rm(temp, { recursive: true, force: true });
}
console.log('Built the introduction HTML and PDF. Fonts and QR code are embedded.');
