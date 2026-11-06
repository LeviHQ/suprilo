import sharp from "sharp";

const testSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="grad" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#b45309" />
    </radialGradient>
  </defs>
  <circle cx="256" cy="256" r="220" fill="url(#grad)" stroke="#78350f" stroke-width="12"/>
</svg>`;

const buf = await sharp(Buffer.from(testSvg))
  .resize(512, 512)
  .webp({ quality: 85, effort: 6 })
  .toBuffer();

console.log("Success! Rendered WebP size:", buf.length, "bytes");

