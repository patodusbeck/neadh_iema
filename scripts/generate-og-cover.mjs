import sharp from "sharp";
import { resolve } from "node:path";

const width = 1200;
const height = 630;

const bgSvg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4d2326"/>
      <stop offset="60%" stop-color="#341518"/>
      <stop offset="100%" stop-color="#2a1114"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="120" cy="80" r="260" fill="rgba(255,255,255,0.07)"/>
</svg>`;

const textSvg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font: 800 72px 'Arial', sans-serif; fill: #f8f1f1; }
    .subtitle { font: 700 36px 'Arial', sans-serif; fill: #f8f1f1; }
    .body { font: 500 31px 'Arial', sans-serif; fill: #e8d6d6; }
  </style>
  <text x="70" y="235" class="subtitle">NEADH IEMA</text>
  <text x="70" y="355" class="title">Bullying e racismo</text>
  <text x="70" y="430" class="title">não são brincadeira.</text>
  <text x="70" y="510" class="body">Canal de conscientização e denúncia escolar</text>
  <text x="70" y="555" class="body">neadhiema.vercel.app</text>
</svg>`;

const neadhLogo = resolve("assets/images/neadh_simbolo.png");
const iemaLogo = resolve("assets/images/iema.png");
const outPng = resolve("assets/images/og-cover.png");
const outWebp = resolve("assets/images/og-cover.webp");

const neadhLogoBuffer = await sharp(neadhLogo).resize({ width: 140 }).png().toBuffer();
const iemaLogoBuffer = await sharp(iemaLogo).resize({ width: 235 }).png().toBuffer();

const image = sharp(Buffer.from(bgSvg))
  .composite([
    { input: neadhLogoBuffer, left: 70, top: 60, blend: "over" },
    { input: iemaLogoBuffer, left: 230, top: 92, blend: "over" },
    { input: Buffer.from(textSvg), left: 0, top: 0, blend: "over" },
  ])
  .resize(width, height);

await image.png({ quality: 95 }).toFile(outPng);
await image.webp({ quality: 88, effort: 6 }).toFile(outWebp);

console.log("OG cover regenerated (PNG + WEBP)");
