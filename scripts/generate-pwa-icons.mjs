import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const symbolPath = path.join(root, "assets", "images", "neadh_simbolo.png");
const iconsPath = path.join(root, "assets", "icons");

const canvas = (symbolData) => `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="112" fill="#4d2326"/>
    <circle cx="256" cy="184" r="128" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="2"/>
    <image href="data:image/png;base64,${symbolData}" x="144" y="34" width="224" height="224"/>
    <path d="M128 348H384" stroke="#ffffff" stroke-opacity="0.45" stroke-width="2"/>
    <text x="256" y="376" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" letter-spacing="7">NEADH</text>
    <text x="256" y="420" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif" font-size="23" font-weight="700" letter-spacing="3">IEMA • CAROLINA</text>
    <text x="256" y="451" fill="#ffffff" fill-opacity="0.72" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="2">DIREITOS HUMANOS</text>
  </svg>
`;

const symbolAlpha = await sharp(symbolPath)
  .resize(224, 224, { fit: "contain" })
  .extractChannel("alpha")
  .toBuffer();
const symbol = await sharp({
  create: {
    width: 224,
    height: 224,
    channels: 3,
    background: "#ffffff",
  },
})
  .joinChannel(symbolAlpha)
  .png()
  .toBuffer();
const iconSvg = Buffer.from(canvas(symbol.toString("base64")));

for (const size of [192, 512]) {
  await sharp(iconSvg)
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(iconsPath, `pwa-${size}.png`));
}

console.log("Ícones PWA gerados: pwa-192.png e pwa-512.png");