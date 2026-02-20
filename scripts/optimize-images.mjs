import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const tasks = [
  { input: "assets/images/neadh_simbolo.png", output: "assets/images/neadh_simbolo.webp", width: 540 },
  { input: "assets/images/iema.png", output: "assets/images/iema.webp", width: 610 },
  { input: "assets/images/og-cover.png", output: "assets/images/og-cover.webp", width: 1200 },
];

for (const task of tasks) {
  const outPath = resolve(task.output);
  await mkdir(dirname(outPath), { recursive: true });
  await sharp(resolve(task.input))
    .resize({ width: task.width, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(outPath);
  console.log(`Imagem otimizada: ${task.output}`);
}
