// Erzeugt die Stripe-Branding-Assets (Produktfoto + Logo) als PNG via sharp.
// Reines SVG -> kein Browser, keine Web-Fonts nötig.
//   node scripts/gen-stripe-assets.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Helvetica, Arial, sans-serif";

// ---- gezeichnete Krone (gold) ----
const crown = (cx, y, w = 150) => {
  const h = w * 0.62;
  const x = cx - w / 2;
  return `
  <g transform="translate(${x},${y})">
    <defs><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4cf6a"/><stop offset="1" stop-color="#d99a1c"/>
    </linearGradient></defs>
    <path d="M0,${h * 0.62}
      L${w * 0.16},${h * 0.16}
      L${w * 0.34},${h * 0.5}
      L${w * 0.5},${h * 0.06}
      L${w * 0.66},${h * 0.5}
      L${w * 0.84},${h * 0.16}
      L${w},${h * 0.62}
      L${w * 0.88},${h}
      L${w * 0.12},${h} Z"
      fill="url(#gold)" stroke="#c98a14" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${w * 0.16}" cy="${h * 0.16}" r="7" fill="#f4cf6a"/>
    <circle cx="${w * 0.5}" cy="${h * 0.06}" r="8" fill="#f7dc8e"/>
    <circle cx="${w * 0.84}" cy="${h * 0.16}" r="7" fill="#f4cf6a"/>
  </g>`;
};

// ---- ein Score-Ring ----
const ring = (cx, cy, r, color, pct) => {
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct);
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(21,90,52,.09)" stroke-width="22"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="22" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
      transform="rotate(-90 ${cx} ${cy})"/>`;
};

const productSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#fbfdf5"/><stop offset="0.55" stop-color="#ecf7e7"/><stop offset="1" stop-color="#ddf0dd"/>
    </linearGradient>
    <radialGradient id="au1"><stop offset="0" stop-color="#2cba63" stop-opacity="0.30"/><stop offset="0.7" stop-color="#2cba63" stop-opacity="0"/></radialGradient>
    <radialGradient id="au2"><stop offset="0" stop-color="#eab308" stop-opacity="0.22"/><stop offset="0.7" stop-color="#eab308" stop-opacity="0"/></radialGradient>
    <radialGradient id="au3"><stop offset="0" stop-color="#2ba8c9" stop-opacity="0.16"/><stop offset="0.7" stop-color="#2ba8c9" stop-opacity="0"/></radialGradient>
    <linearGradient id="pill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf0c9"/><stop offset="1" stop-color="#f7e3a6"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>

  <rect width="1080" height="1080" fill="url(#bg)"/>
  <circle cx="120" cy="120" r="300" fill="url(#au1)"/>
  <circle cx="980" cy="1000" r="300" fill="url(#au2)"/>
  <circle cx="120" cy="940" r="250" fill="url(#au3)"/>

  ${crown(540, 150, 150)}

  ${ring(540, 545, 150, "#19a44e", 0.92)}
  ${ring(540, 545, 120, "#2cba63", 0.88)}
  ${ring(540, 545, 90, "#19a44e", 0.86)}
  <text x="540" y="545" text-anchor="middle" dominant-baseline="central" font-family="${SERIF}" font-weight="600" font-size="150" fill="#15271c" letter-spacing="-4">92</text>
  <text x="540" y="632" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="20" letter-spacing="5" fill="#5d7066">PREMIUM</text>

  <text x="540" y="812" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="88" letter-spacing="-1" fill="#15271c">True<tspan fill="#15a44c">Label</tspan></text>

  <rect x="406" y="852" width="268" height="62" rx="31" fill="url(#pill)"/>
  <text x="540" y="893" text-anchor="middle" font-family="${SANS}" font-weight="800" font-size="26" letter-spacing="6" fill="#9c6f12">PREMIUM</text>

  <text x="540" y="985" text-anchor="middle" font-family="${SANS}" font-weight="500" font-size="26" fill="#51695b">Intelligente Alternativen, Vergleich, Listen &amp; Quellen —</text>
  <text x="540" y="1022" text-anchor="middle" font-family="${SANS}" font-weight="500" font-size="26" fill="#51695b">alles, was bewusstes Essen leichter macht.</text>
</svg>`;

const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="220" viewBox="0 0 720 220">
  <defs><linearGradient id="tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2cba63"/><stop offset="1" stop-color="#15a44c"/></linearGradient></defs>
  <rect width="720" height="220" fill="#ffffff"/>
  <g transform="translate(150,56)">
    <rect width="108" height="108" rx="28" fill="url(#tile)"/>
    <path d="M30 56 l20 20 l40 -40" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="288" y="110" dominant-baseline="central" font-family="${SERIF}" font-weight="600" font-size="84" letter-spacing="-1" fill="#15271c">True<tspan fill="#15a44c">Label</tspan></text>
</svg>`;

await mkdir("public", { recursive: true });
await sharp(Buffer.from(productSvg)).png().toFile("public/premium.png");
await sharp(Buffer.from(logoSvg)).png().toFile("/tmp/stripe-logo.png");
// quadratisches Icon fürs Stripe-Branding aus dem App-Icon ableiten
await sharp("public/icon-512.png").resize(256, 256).png().toFile("/tmp/stripe-icon.png");
console.log("✓ public/premium.png (Produktfoto), /tmp/stripe-logo.png, /tmp/stripe-icon.png erzeugt");
