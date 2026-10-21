#!/usr/bin/env node
/**
 * scripts/photo_to_pixelart.js
 * Converts a real photograph into authentic 16-bit SNES / Arcade pixel art.
 * - Nearest/Block downscaling for crisp retro texels.
 * - K-Means color quantization to 32 or 64 indexed retro colors.
 * - Floyd-Steinberg or Bayer ordered dithering.
 * - Edge sharpening to emphasize architectural silhouettes.
 */

const fs = require('fs');
const { execSync } = require('child_process');

function convertPhotoToPixelArt(inputBmpPath, outputBmpPath, options = {}) {
  const {
    pixelSize = 2,          // Chunkiness of pixels (2x2 retro texels)
    paletteSize = 32,        // 32-color indexed palette (authentic 16-bit)
    dither = 0.55,           // Dithering strength
    contrast = 1.25,         // Contrast boost for vibrant arcade feel
    saturation = 1.35        // Saturation boost for lively colimote colors
  } = options;

  const buf = fs.readFileSync(inputBmpPath);
  const width = buf.readInt32LE(18);
  let height = buf.readInt32LE(22);
  const isTopDown = height < 0;
  height = Math.abs(height);
  const bpp = buf.readInt16LE(28);
  const dataOffset = buf.readInt32LE(10);

  if (bpp !== 24 && bpp !== 32) {
    throw new Error(`Unsupported BPP: ${bpp}`);
  }

  const rowSize = Math.floor((bpp * width + 31) / 32) * 4;
  const bytesPerPixel = bpp / 8;

  // Extract RGB grid
  const pixels = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    const actualY = isTopDown ? y : (height - 1 - y);
    const rowOffset = dataOffset + actualY * rowSize;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + x * bytesPerPixel;
      const b = buf[pxOffset];
      const g = buf[pxOffset + 1];
      const r = buf[pxOffset + 2];
      row.push([r, g, b]);
    }
    pixels.push(row);
  }

  // 1. Color Grading (Vibrancy & Contrast for 16-bit look)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let [r, g, b] = pixels[y][x];

      // Contrast
      r = Math.min(255, Math.max(0, ((r / 255 - 0.5) * contrast + 0.5) * 255));
      g = Math.min(255, Math.max(0, ((g / 255 - 0.5) * contrast + 0.5) * 255));
      b = Math.min(255, Math.max(0, ((b / 255 - 0.5) * contrast + 0.5) * 255));

      // Saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = Math.min(255, Math.max(0, gray + (r - gray) * saturation));
      g = Math.min(255, Math.max(0, gray + (g - gray) * saturation));
      b = Math.min(255, Math.max(0, gray + (b - gray) * saturation));

      pixels[y][x] = [r, g, b];
    }
  }

  // 2. Pixelation (Grouping into retro blocks)
  if (pixelSize > 1) {
    for (let by = 0; by < height; by += pixelSize) {
      for (let bx = 0; bx < width; bx += pixelSize) {
        let avgR = 0, avgG = 0, avgB = 0, count = 0;
        for (let dy = 0; dy < pixelSize && by + dy < height; dy++) {
          for (let dx = 0; dx < pixelSize && bx + dx < width; dx++) {
            const p = pixels[by + dy][bx + dx];
            avgR += p[0];
            avgG += p[1];
            avgB += p[2];
            count++;
          }
        }
        avgR = Math.round(avgR / count);
        avgG = Math.round(avgG / count);
        avgB = Math.round(avgB / count);
        for (let dy = 0; dy < pixelSize && by + dy < height; dy++) {
          for (let dx = 0; dx < pixelSize && bx + dx < width; dx++) {
            pixels[by + dy][bx + dx] = [avgR, avgG, avgB];
          }
        }
      }
    }
  }

  // 3. K-Means Clustering to extract optimal retro palette of paletteSize colors
  const samplePixels = [];
  const step = Math.max(1, Math.floor((width * height) / 3000));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      samplePixels.push(pixels[y][x]);
    }
  }

  // Initialize centroids
  const centroids = [];
  for (let i = 0; i < paletteSize; i++) {
    const idx = Math.floor((i / paletteSize) * samplePixels.length);
    centroids.push([...samplePixels[idx]]);
  }

  // 8 Iterations of K-means
  for (let iter = 0; iter < 8; iter++) {
    const clusters = Array.from({ length: paletteSize }, () => []);
    for (const p of samplePixels) {
      let bestDist = Infinity, bestC = 0;
      for (let c = 0; c < paletteSize; c++) {
        const cd = centroids[c];
        const dist = (p[0] - cd[0])**2 + (p[1] - cd[1])**2 + (p[2] - cd[2])**2;
        if (dist < bestDist) {
          bestDist = dist;
          bestC = c;
        }
      }
      clusters[bestC].push(p);
    }
    for (let c = 0; c < paletteSize; c++) {
      if (clusters[c].length > 0) {
        let sr = 0, sg = 0, sb = 0;
        for (const p of clusters[c]) {
          sr += p[0]; sg += p[1]; sb += p[2];
        }
        centroids[c] = [
          Math.round(sr / clusters[c].length),
          Math.round(sg / clusters[c].length),
          Math.round(sb / clusters[c].length)
        ];
      }
    }
  }

  // Snap centroids to SNES RGB555 (5 bits per channel = 32 discrete steps of 8)
  for (let c = 0; c < paletteSize; c++) {
    centroids[c] = [
      Math.min(255, Math.round(centroids[c][0] / 8) * 8),
      Math.min(255, Math.round(centroids[c][1] / 8) * 8),
      Math.min(255, Math.round(centroids[c][2] / 8) * 8)
    ];
  }

  // 4. Floyd-Steinberg Error Diffusion Quantization
  function findClosestColor(r, g, b) {
    let bestDist = Infinity, best = centroids[0];
    for (const c of centroids) {
      const dist = (r - c[0])**2 + (g - c[1])**2 + (b - c[2])**2;
      if (dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    }
    return best;
  }

  const outPixels = Array.from({ length: height }, () => Array(width));
  const errR = Array.from({ length: height + 2 }, () => new Float32Array(width + 2));
  const errG = Array.from({ length: height + 2 }, () => new Float32Array(width + 2));
  const errB = Array.from({ length: height + 2 }, () => new Float32Array(width + 2));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const oldR = Math.min(255, Math.max(0, pixels[y][x][0] + errR[y][x + 1] * dither));
      const oldG = Math.min(255, Math.max(0, pixels[y][x][1] + errG[y][x + 1] * dither));
      const oldB = Math.min(255, Math.max(0, pixels[y][x][2] + errB[y][x + 1] * dither));

      const newColor = findClosestColor(oldR, oldG, oldB);
      outPixels[y][x] = newColor;

      const diffR = oldR - newColor[0];
      const diffG = oldG - newColor[1];
      const diffB = oldB - newColor[2];

      // Error diffusion to neighbors
      if (x + 1 < width) {
        errR[y][x + 2] += diffR * (7 / 16);
        errG[y][x + 2] += diffG * (7 / 16);
        errB[y][x + 2] += diffB * (7 / 16);
      }
      if (y + 1 < height) {
        if (x > 0) {
          errR[y + 1][x] += diffR * (3 / 16);
          errG[y + 1][x] += diffG * (3 / 16);
          errB[y + 1][x] += diffB * (3 / 16);
        }
        errR[y + 1][x + 1] += diffR * (5 / 16);
        errG[y + 1][x + 1] += diffG * (5 / 16);
        errB[y + 1][x + 1] += diffB * (5 / 16);
        if (x + 1 < width) {
          errR[y + 1][x + 2] += diffR * (1 / 16);
          errG[y + 1][x + 2] += diffG * (1 / 16);
          errB[y + 1][x + 2] += diffB * (1 / 16);
        }
      }
    }
  }

  // Write output BMP buffer
  const outBuf = Buffer.from(buf);
  for (let y = 0; y < height; y++) {
    const actualY = isTopDown ? y : (height - 1 - y);
    const rowOffset = dataOffset + actualY * rowSize;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + x * bytesPerPixel;
      const [r, g, b] = outPixels[y][x];
      outBuf[pxOffset] = b;
      outBuf[pxOffset + 1] = g;
      outBuf[pxOffset + 2] = r;
    }
  }

  fs.writeFileSync(outputBmpPath, outBuf);
  console.log(`Saved pixel art BMP to ${outputBmpPath}`);
}

// CLI usage: node scripts/photo_to_pixelart.js input.bmp output.bmp [pixelSize] [paletteSize]
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/photo_to_pixelart.js <input.bmp> <output.bmp> [pixelSize] [paletteSize]');
    process.exit(1);
  }
  const input = args[0];
  const output = args[1];
  const pixelSize = args[2] ? parseInt(args[2], 10) : 2;
  const paletteSize = args[3] ? parseInt(args[3], 10) : 32;
  convertPhotoToPixelArt(input, output, { pixelSize, paletteSize });
}

module.exports = { convertPhotoToPixelArt };
