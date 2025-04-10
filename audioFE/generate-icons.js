const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const BASE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#4a90e2"/>
  <text x="256" y="320" font-size="320" text-anchor="middle" fill="white">🎵</text>
</svg>
`;

async function generateIcons() {
  // Create directories if they don't exist
  await fs.mkdir('public/icons', { recursive: true });
  await fs.mkdir('public/splash', { recursive: true });

  // Save base SVG
  await fs.writeFile('public/icons/icon.svg', BASE_SVG);

  // Generate PNG icons
  for (const size of ICON_SIZES) {
    await sharp(Buffer.from(BASE_SVG))
      .resize(size, size)
      .png()
      .toFile(`public/icons/icon-${size}x${size}.png`);
    console.log(`Generated ${size}x${size} icon`);
  }

  // Generate splash screens for various iOS devices
  const splashScreens = [
    { width: 2048, height: 2732 }, // 12.9" iPad Pro
    { width: 1668, height: 2388 }, // 11" iPad Pro
    { width: 1536, height: 2048 }, // 10.5" iPad Pro
    { width: 1668, height: 2224 }, // 10.5" iPad Pro
    { width: 1620, height: 2160 }, // 10.2" iPad
    { width: 1290, height: 2796 }, // iPhone 14 Pro Max
    { width: 1179, height: 2556 }, // iPhone 14 Pro
    { width: 1284, height: 2778 }, // iPhone 14 Plus
    { width: 1170, height: 2532 }, // iPhone 14
    { width: 1125, height: 2436 }, // iPhone X/XS
    { width: 1242, height: 2688 }, // iPhone XS Max
    { width: 828, height: 1792 },  // iPhone XR
    { width: 750, height: 1334 },  // iPhone 8/7/6s/6
    { width: 640, height: 1136 },  // iPhone SE
  ];

  // Generate splash screens
  for (const { width, height } of splashScreens) {
    // Portrait
    await generateSplashScreen(width, height);
    // Landscape
    await generateSplashScreen(height, width);
  }
}

async function generateSplashScreen(width, height) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="#4a90e2"/>
      <text x="${width/2}" y="${height/2}" font-size="${Math.min(width, height)/3}" 
            text-anchor="middle" dominant-baseline="middle" fill="white">🎵</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toFile(`public/splash/apple-splash-${width}-${height}.png`);
  console.log(`Generated ${width}x${height} splash screen`);
}

generateIcons().catch(console.error); 