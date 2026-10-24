// Generates every app icon from one stopwatch drawing: the SVG favicon, the
// Apple touch icon and the web app manifest icons (any + maskable).
// Run with `pnpm icons` after changing the drawing; the outputs are committed.
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

// sharp ships with Next.js (image optimisation), so no extra dependency.
const require = createRequire(import.meta.url);
const sharp = require(
  require.resolve("sharp", { paths: [require.resolve("next")] }),
);

const BG = "#000000";
const GO = "#32d74b"; // --color-phone-go, the Start button's green

/** The stopwatch, drawn in a 512 box and centred, scaled to leave a margin. */
function svg({ scale, radius }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${radius}" fill="${BG}"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -258)">
    <rect x="216" y="56" width="80" height="40" rx="12" fill="${GO}"/>
    <rect x="242" y="90" width="28" height="40" fill="${GO}"/>
    <circle cx="256" cy="290" r="150" fill="none" stroke="${GO}" stroke-width="40"/>
    <path d="M256 290 L256 170 A120 120 0 0 1 359.92 350 Z" fill="${GO}"/>
  </g>
</svg>
`;
}

// Maskable icons get cropped to any shape, so the drawing stays inside the
// central safe zone (a circle of 40% of the size).
const ANY = svg({ scale: 0.86, radius: 96 });
const FULL_BLEED = svg({ scale: 0.86, radius: 0 });
const MASKABLE = svg({ scale: 0.68, radius: 0 });

const png = (source, size, path) =>
  sharp(Buffer.from(source)).resize(size, size).png().toFile(path);

await mkdir("public/icons", { recursive: true });
await writeFile("src/app/icon.svg", ANY);
await Promise.all([
  // iOS rounds the corners itself, so its icon is a full square.
  png(FULL_BLEED, 180, "src/app/apple-icon.png"),
  png(ANY, 192, "public/icons/icon-192.png"),
  png(ANY, 512, "public/icons/icon-512.png"),
  png(MASKABLE, 512, "public/icons/icon-maskable-512.png"),
]);
console.log("Icons written to src/app and public/icons");
