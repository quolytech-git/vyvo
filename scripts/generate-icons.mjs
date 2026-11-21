import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// Pure-Node supersampled PNG icon generator for VYVO PWA icons.
// Produces crisp anti-aliased icons matching public/icon.svg with zero native deps.

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, combined, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter None
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInRoundedRect(x, y, size, radius) {
  if (x < 0 || y < 0 || x > size || y > size) return false;
  const cx = x < radius ? radius : x > size - radius ? size - radius : x;
  const cy = y < radius ? radius : y > size - radius ? size - radius : y;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function renderIcon({ size, maskable = false, rounded = true }) {
  const rgba = Buffer.alloc(size * size * 4);
  const scale = maskable ? 0.78 : 1.0;
  const offset = (64 * (1 - scale)) / 2;

  const mapPt = ([x, y]) => [x * scale + offset, y * scale + offset];
  const leftArm = [
    [14, 17],
    [23.5, 17],
    [36.5, 47],
    [27.5, 47],
  ].map(mapPt);
  const rightArm = [
    [40.5, 17],
    [50, 17],
    [36.5, 47],
    [32, 36.5],
  ].map(mapPt);

  const SAMPLES = 4;
  const invTotal = 1 / (SAMPLES * SAMPLES);
  const cornerRadius = rounded && !maskable ? 14 : 0;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const u = ((px + (sx + 0.5) / SAMPLES) / size) * 64;
          const v = ((py + (sy + 0.5) / SAMPLES) / size) * 64;

          const inBg =
            cornerRadius > 0
              ? pointInRoundedRect(u, v, 64, cornerRadius)
              : true;

          if (!inBg) continue;

          // Default background #09090B
          let cr = 9, cg = 9, cb = 11, ca = 255;

          // Subtle 1.25px hairline inner border on rounded icons (#27272A)
          if (cornerRadius > 0) {
            const inInner = pointInRoundedRect(u - 1.2, v - 1.2, 61.6, Math.max(0, cornerRadius - 1.2));
            if (!inInner) {
              cr = 39; cg = 39; cb = 42;
            }
          }

          if (pointInPolygon(u, v, rightArm)) {
            cr = 16; cg = 185; cb = 129; // #10B981
          }
          if (pointInPolygon(u, v, leftArm)) {
            cr = 250; cg = 250; cb = 250; // #FAFAFA
          }

          r += cr;
          g += cg;
          b += cb;
          a += ca;
        }
      }

      const idx = (py * size + px) * 4;
      rgba[idx] = Math.round(r * invTotal);
      rgba[idx + 1] = Math.round(g * invTotal);
      rgba[idx + 2] = Math.round(b * invTotal);
      rgba[idx + 3] = Math.round(a * invTotal);
    }
  }

  return encodePNG(size, size, rgba);
}

const outDir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const specs = [
  { file: "icon-192.png", size: 192, maskable: false, rounded: true },
  { file: "icon-512.png", size: 512, maskable: false, rounded: true },
  { file: "icon-maskable-512.png", size: 512, maskable: true, rounded: false },
  { file: "apple-touch-icon.png", size: 180, maskable: false, rounded: false },
  { file: "favicon-32.png", size: 32, maskable: false, rounded: true },
];

for (const spec of specs) {
  const png = renderIcon(spec);
  fs.writeFileSync(path.join(outDir, spec.file), png);
  console.log(`Generated public/icons/${spec.file} (${png.length} bytes)`);
}

// Generate public/favicon.ico wrapping the 32x32 PNG for zero-404 favicon requests
const fav32 = fs.readFileSync(path.join(outDir, "favicon-32.png"));
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // type 1 = ICO
icoHeader.writeUInt16LE(1, 4); // count = 1 image
const icoDir = Buffer.alloc(16);
icoDir[0] = 32; // width
icoDir[1] = 32; // height
icoDir[2] = 0;  // color palette
icoDir[3] = 0;  // reserved
icoDir.writeUInt16LE(1, 4);  // color planes
icoDir.writeUInt16LE(32, 6); // bits per pixel
icoDir.writeUInt32LE(fav32.length, 8);
icoDir.writeUInt32LE(22, 12); // image offset = 6 + 16
const icoBuf = Buffer.concat([icoHeader, icoDir, fav32]);
fs.writeFileSync(path.join(process.cwd(), "public", "favicon.ico"), icoBuf);
console.log(`Generated public/favicon.ico (${icoBuf.length} bytes)`);
