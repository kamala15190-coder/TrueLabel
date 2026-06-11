// Erzeugt die PWA-Icons aus dem SVG-Logo (einmalig / bei Logo-Änderung).
// Aufruf: npm run icons
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// Grünes Markenquadrat mit weißem Häkchen. `pad` = Sicherheitsrand (maskable).
const logo = (pad) => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#27B25A"/>
      <stop offset="1" stop-color="#14A44C"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${pad ? 0 : 24}" fill="#F3F9F0"/>
  <rect x="${pad}" y="${pad}" width="${512 - 2 * pad}" height="${512 - 2 * pad}"
        rx="${(512 - 2 * pad) * 0.24}" fill="url(#g)"/>
  <path d="M ${166 + pad * 0.3} ${262} l ${58 - pad * 0.1} ${58 - pad * 0.1} l ${122 - pad * 0.2} ${-122 + pad * 0.2}"
        stroke="#ffffff" stroke-width="${42 - pad * 0.08}" stroke-linecap="round"
        stroke-linejoin="round" fill="none"/>
</svg>`);

await mkdir("public", { recursive: true });

await sharp(logo(40)).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(logo(40)).resize(512, 512).png().toFile("public/icon-512.png");
await sharp(logo(40)).resize(180, 180).png().toFile("public/apple-touch-icon.png");
await sharp(logo(96)).resize(512, 512).png().toFile("public/icon-maskable-512.png");

console.log("✓ Icons erzeugt: icon-192, icon-512, icon-maskable-512, apple-touch-icon");
