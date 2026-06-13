// Erzeugt die PWA-/App-Icons aus dem neuen Markenlogo (»Lebendiger Barcode«).
// App-Icon = weißes Logo auf grünem Marken-Verlauf. Aufruf: npm run icons
//
// Quelle der Logoform: public/logo-white.svg (monochrom weiß, transparent).
// Das Master-Logo wird programmatisch in branding/ erzeugt
// (branding/generate_logo_barcode.py) — favicon.ico/.svg & logo.svg liegen
// bereits in public/ und werden hier NICHT überschrieben.
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";

const greenBg = (size) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#34C46E"/><stop offset="1" stop-color="#12914A"/>
  </linearGradient></defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/></svg>`);

const whiteLogo = await readFile("public/logo-white.svg");

// fill = Anteil der Kantenlänge, den das Logo einnimmt (maskable kleiner → Safe-Zone)
async function appIcon(size, fill, out, flatten = false) {
  const bg = await sharp(greenBg(size)).png().toBuffer();
  const inner = Math.round(size * fill);
  const logo = await sharp(whiteLogo, { density: 512 })
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const off = Math.round((size - inner) / 2);
  let img = sharp(bg).composite([{ input: logo, top: off, left: off }]);
  if (flatten) img = img.flatten({ background: "#12914A" }); // iOS: kein Alphakanal
  await img.png().toFile(out);
}

await mkdir("public", { recursive: true });
await appIcon(192, 0.78, "public/icon-192.png");
await appIcon(512, 0.78, "public/icon-512.png");
await appIcon(512, 0.62, "public/icon-maskable-512.png"); // Safe-Zone
await appIcon(180, 0.76, "public/apple-touch-icon.png", true);

console.log("✓ App-Icons erzeugt: icon-192, icon-512, icon-maskable-512, apple-touch-icon");
