#!/usr/bin/env node
/**
 * scripts/create_comala_photocomposition.js
 * Assembles 7 authentic photographs of Comala into a 1920x540 panoramic matte painting
 * and converts it into authentic 16-bit SNES pixel art.
 */

const { CdpSession } = require('../e2e/cdp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('Launching headless Chrome via CDP to composite Comala panorama...');
  const session = new CdpSession({ port: 9595, url: 'http://localhost:8085' });
  await session.launch();
  await session.navigate('http://localhost:8085');

  console.log('Compositing 7 authentic photos on 1920x540 canvas...');
  const res = await session.evaluate(`
    (async () => {
      const W = 1920, H = 540;
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = H;
      const ctx = cv.getContext('2d');

      function loadImage(src) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      }

      const [volcan, iglesia, portales, palacio, plaza, madero2, madero] = await Promise.all([
        loadImage('/scratch/foto_real_volcan_colima.jpg'),
        loadImage('/scratch/foto_real_comala_iglesia.jpg'),
        loadImage('/scratch/foto_real_comala_portales.jpg'),
        loadImage('/scratch/foto_real_comala_palacio.jpg'),
        loadImage('/scratch/foto_real_comala_plaza.jpg'),
        loadImage('/scratch/foto_real_comala_madero2.jpg'),
        loadImage('/scratch/foto_real_comala_madero.jpg')
      ]);

      // 1. Sky & Atmospheric Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#3b82f6');
      skyGrad.addColorStop(0.45, '#93c5fd');
      skyGrad.addColorStop(0.75, '#e0f2fe');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Volcán de Colima (Capa lejana, centrado monumental)
      // volcan size: 3072x2048. Crop top cone and slopes:
      // sx: 200, sy: 150, sw: 2600, sh: 1700
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.drawImage(volcan, 350, 150, 2400, 1500, 150, 20, 850, 420);
      ctx.drawImage(volcan, 350, 150, 2400, 1500, 1200, 40, 750, 380);
      ctx.restore();

      // Atmospheric haze over volcano base
      const haze = ctx.createLinearGradient(0, 280, 0, 420);
      haze.addColorStop(0, 'rgba(224, 242, 254, 0)');
      haze.addColorStop(1, 'rgba(224, 242, 254, 0.7)');
      ctx.fillStyle = haze;
      ctx.fillRect(0, 280, W, 140);

      // 3. Empedrado colimense tradicional (Base)
      // madero size: 2592x3872. Crop bottom road:
      // sx: 0, sy: 2000, sw: 2592, sh: 1872
      for (let rx = 0; rx < W; rx += 480) {
        ctx.drawImage(madero, 0, 2200, 2592, 1600, rx, 380, 480, 160);
      }

      // 4. Arquitectura y Monumentos Reales:
      // A. Casas coloniales típicas con tejas árabes (Madero2) a la izquierda (x: 0 a 380)
      // madero2 size: 2592x3872
      ctx.drawImage(madero2, 800, 600, 1750, 2600, -20, 140, 380, 300);

      // B. Portales tradicionales de Comala con arcos y cantera (Portales) (x: 340 a 760)
      // portales size: 3872x2592
      ctx.drawImage(portales, 600, 200, 3000, 2000, 340, 160, 440, 260);

      // C. Parroquia de San Miguel Arcángel (Iglesia) en el centro (x: 740 a 1120)
      // iglesia size: 2816x2112. Crop towers, cupolas, pediment:
      // sx: 500, sy: 50, sw: 1600, sh: 1800
      ctx.drawImage(iglesia, 500, 50, 1600, 1700, 740, 90, 370, 330);

      // D. Quiosco blanco y jardines con palmeras (Plaza) (x: 1080 a 1480)
      // plaza size: 4928x3264
      ctx.drawImage(plaza, 1600, 300, 2800, 2600, 1080, 120, 400, 300);

      // E. Palacio Municipal con Torre del Reloj (Palacio) a la derecha (x: 1450 a 1920)
      // palacio size: 3872x2592
      ctx.drawImage(palacio, 1300, 50, 2400, 1800, 1450, 130, 480, 290);

      // 5. Suavizado y Ensamblado de Bordes para bucle continuo
      // Gradiente de borde para que el extremo derecho (Palacio) ensamble con el izquierdo (Casas)
      const seamGrad = ctx.createLinearGradient(W - 60, 0, W, 0);
      seamGrad.addColorStop(0, 'rgba(255,255,255,0)');
      seamGrad.addColorStop(1, 'rgba(255,255,255,0.3)');
      ctx.fillStyle = seamGrad;
      ctx.fillRect(W - 60, 100, 60, 350);

      // 6. Tinte cálido dorado colimense (Atardecer dorado unificador)
      ctx.save();
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      return cv.toDataURL('image/png');
    })()
  `);

  await session.kill();

  if (!res || typeof res !== 'string') {
    throw new Error('Failed to capture composite canvas from CDP');
  }

  const base64Data = res.replace(/^data:image\/png;base64,/, '');
  const outPng = path.join(__dirname, '../scratch/comala_composite_photo.png');
  const outBmp = path.join(__dirname, '../scratch/comala_composite_photo.bmp');
  const outPixelBmp = path.join(__dirname, '../scratch/comala_composite_pixelart.bmp');
  const outPixelPng = path.join(__dirname, '../scratch/comala_composite_pixelart.png');

  fs.writeFileSync(outPng, Buffer.from(base64Data, 'base64'));
  console.log(`Saved composite photo to ${outPng}`);

  // Convert to BMP using sips
  execSync(`sips -s format bmp "${outPng}" --out "${outBmp}"`);

  // Convert to 16-bit SNES Pixel Art using our quantization pipeline
  const { convertPhotoToPixelArt } = require('./photo_to_pixelart');
  convertPhotoToPixelArt(outBmp, outPixelBmp, {
    pixelSize: 2,
    paletteSize: 48, // 48 rich SNES colors
    dither: 0.65,
    contrast: 1.25,
    saturation: 1.3
  });

  // Convert final pixel art BMP to PNG
  execSync(`sips -s format png "${outPixelBmp}" --out "${outPixelPng}"`);
  console.log(`Saved final 16-bit pixel art panorama to ${outPixelPng}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
