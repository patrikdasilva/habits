// Gera os PNGs do app a partir de app/icon.svg (usa o Playwright instalado na máquina).
// Uso: NODE_PATH=<onde está o playwright> node scripts/make-icons.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const bg = "#171721";
const inner = `<circle cx="256" cy="256" r="150" fill="#1e1e2a" stroke="#2c2c3a" stroke-width="22"/>
<path d="M256 106 A150 150 0 1 1 106 256" fill="none" stroke="#afb2ce" stroke-width="22" stroke-linecap="round"/>
<path d="M196 262 L240 306 L322 214" fill="none" stroke="#afb2ce" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>`;
const rounded = readFileSync("app/icon.svg", "utf8");
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${bg}"/>${inner}</svg>`;
// maskable: conteúdo dentro da zona segura (80%)
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="${bg}"/><g transform="translate(51.2 51.2) scale(0.8)">${inner}</g></svg>`;
const badge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M120 270 L215 365 L395 165" fill="none" stroke="#fff" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const jobs = [
  ["public/icons/icon-192.png", rounded, 192, true],
  ["public/icons/icon-512.png", rounded, 512, true],
  ["public/icons/maskable-512.png", maskable, 512, false],
  ["app/apple-icon.png", square, 180, false],
  ["public/icons/badge-96.png", badge, 96, true],
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [out, svg, size, transparent] of jobs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: out, omitBackground: transparent, clip: { x: 0, y: 0, width: size, height: size } });
  console.log("ok", out);
}
await browser.close();
