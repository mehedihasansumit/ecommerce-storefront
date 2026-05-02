import sharp from "sharp";
import path from "path";
import fs from "fs";

const icons = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function generateIcon(size: number, outPath: string) {
  const padding = Math.round(size * 0.15);
  const inner = size - padding * 2;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#3B82F6"/>
      <text
        x="50%" y="54%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${Math.round(inner * 0.55)}"
        font-weight="bold"
        fill="white"
      >S</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`✓ ${path.basename(outPath)} (${size}×${size})`);
}

async function generateFavicon(outPath: string) {
  const size = 64;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#3B82F6"/>
      <text
        x="50%" y="54%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${Math.round(size * 0.6)}"
        font-weight="bold"
        fill="white"
      >S</text>
    </svg>
  `;
  await sharp(Buffer.from(svg)).resize(32, 32).png().toFile(outPath);
  console.log(`✓ ${path.basename(outPath)} (32×32)`);
}

async function main() {
  const publicDir = path.join(process.cwd(), "public");
  const iconsDir = path.join(publicDir, "icons");
  fs.mkdirSync(iconsDir, { recursive: true });

  for (const icon of icons) {
    await generateIcon(icon.size, path.join(iconsDir, icon.name));
  }
  await generateFavicon(path.join(publicDir, "favicon.ico"));
  console.log("PWA icons generated.");
}

main().catch(console.error);
