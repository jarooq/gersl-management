// Generate the GERSL mobile launcher icon set in a fresh "modern minimalist"
// style: deep navy background, mission-amber heart-shape mark inside a
// rounded squircle, soft inner glow. Renders to PNG via sharp.
//
// Outputs:
//   mobile/assets/icon/icon.png            (1024x1024 — square launcher)
//   mobile/assets/icon/icon_foreground.png (1024x1024 — adaptive foreground)
//   mobile/assets/icon/icon.svg            (master, for designers)
//
// Run: node scripts/generate_app_icon.cjs

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'mobile', 'assets', 'icon');
fs.mkdirSync(OUT, { recursive: true });

const SIZE = 1024;
const NAVY = '#10212F';
const NAVY_DEEP = '#0A1722';
const NAVY_HI = '#1B2C3E';
const MISSION = '#A4F056'; // lime-green primary accent
const MISSION_LIGHT = '#C8FA8E';
const WHITE = '#FFFFFF';

// ---------------------------------------------------------------------------
// Master logo SVG
// A single hand cradling a stylised mission-amber spark — Ehsan ("benevolence").
// Drawn in vector so we can re-export at any size.
// ---------------------------------------------------------------------------

function makeLogoMark(stroke = 'none') {
  // Geometry inside a 1024 viewBox, centered at (512, 512).
  // Two-stroke design:
  //   - Outer ring (subtle)
  //   - Hand silhouette + spark
  // Designed to read at 48px on a launcher grid.
  return `
    <!-- Subtle ring -->
    <circle cx="512" cy="512" r="380" fill="none"
      stroke="${MISSION}" stroke-opacity="0.18" stroke-width="14"/>

    <!-- Cupped hand (stylised) -->
    <path
      d="
        M 320 590
        C 320 470, 410 410, 512 410
        C 614 410, 704 470, 704 590
        L 704 640
        C 704 700, 660 740, 600 740
        L 424 740
        C 364 740, 320 700, 320 640
        Z
      "
      fill="${MISSION}"
      stroke="${stroke}"
      stroke-width="6"
    />

    <!-- Wrist accent strip -->
    <rect x="372" y="710" width="280" height="22" rx="11" fill="${MISSION_LIGHT}" opacity="0.65"/>

    <!-- Spark / benevolence flame above the palm -->
    <path
      d="
        M 512 250
        C 470 320, 470 360, 512 410
        C 554 360, 554 320, 512 250
        Z
      "
      fill="${MISSION_LIGHT}"
    />
    <circle cx="512" cy="370" r="22" fill="${WHITE}" opacity="0.95"/>
  `;
}

// 1) Adaptive foreground icon — transparent background, mark only.
//    Android adaptive icons place this on top of an OS-rendered background.
const foregroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="48%" r="55%">
      <stop offset="0%" stop-color="${MISSION}" stop-opacity="0.30"/>
      <stop offset="55%" stop-color="${MISSION}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${MISSION}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- soft glow halo so the mark feels luminous on the navy -->
  <circle cx="512" cy="512" r="430" fill="url(#glow)"/>
  ${makeLogoMark()}
</svg>`;

// 2) Square launcher icon — full navy squircle background + mark.
const squareSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${NAVY_HI}"/>
      <stop offset="100%" stop-color="${NAVY_DEEP}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="48%" r="55%">
      <stop offset="0%" stop-color="${MISSION}" stop-opacity="0.22"/>
      <stop offset="55%" stop-color="${MISSION}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${MISSION}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="topShine" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%"  stop-color="${WHITE}" stop-opacity="0.10"/>
      <stop offset="60%" stop-color="${WHITE}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- squircle (iOS-style) — 22% radius for soft modern feel -->
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="225" ry="225" fill="url(#bg)"/>
  <!-- top shine for depth -->
  <rect x="0" y="0" width="${SIZE}" height="${SIZE}" rx="225" ry="225" fill="url(#topShine)"/>
  <!-- soft mission glow behind the mark -->
  <circle cx="512" cy="512" r="430" fill="url(#glow)"/>
  ${makeLogoMark()}
</svg>`;

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

(async () => {
  fs.writeFileSync(path.join(OUT, 'icon.svg'), squareSvg, 'utf8');
  fs.writeFileSync(path.join(OUT, 'icon_foreground.svg'), foregroundSvg, 'utf8');

  await sharp(Buffer.from(squareSvg))
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'icon.png'));

  await sharp(Buffer.from(foregroundSvg))
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, 'icon_foreground.png'));

  // Friendly stdout summary
  for (const f of ['icon.png', 'icon_foreground.png']) {
    const p = path.join(OUT, f);
    const s = fs.statSync(p);
    console.log(`${f.padEnd(24)} ${(s.size / 1024).toFixed(1)} KB`);
  }
  console.log('Done.');
})();
