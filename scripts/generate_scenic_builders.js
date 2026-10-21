const fs = require('fs');

const code = `
    // =========================================================================
    // 10 BUILDERS PROCEDURALES DE PAISAJES MUNICIPALES (POSTALES 16-BIT HD)
    // Documentados con fotografías reales de los 10 municipios de Colima
    // =========================================================================

    // HELPER 1: Fachada colonial auténtica de pueblo colimense (Comala, Villa, Cuauhtémoc)
    function drawScenicColonialHouse(bctx, hx, hy, hw, hh, opt = {}) {
      const wallCol = opt.wallCol || '#f8fafc';
      const wallDither = opt.wallDither || '#e2e8f0';
      const zocaloCol = opt.zocaloCol || '#78716c';
      const zocaloMortar = opt.zocaloMortar || '#44403c';
      const doorX = hx + (opt.doorRelX !== undefined ? opt.doorRelX : Math.floor(hw * 0.2));
      const doorW = opt.doorW || 24;
      const doorH = opt.doorH || 52;
      const G = hy + hh;

      // 1. Zócalo de cantera labrada
      pxRect(hx, G - 12, hw, 12, zocaloMortar);
      for (let bx = hx; bx < hx + hw; bx += 18) {
        pxRect(bx + 1, G - 11, 16, 10, zocaloCol);
        pxRect(bx + 2, G - 11, 14, 2, '#a8a29e');
      }

      // 2. Muro de adobe blanco / cantera con degradado sutil
      pxRect(hx, hy, hw, hh - 12, wallCol);
      pxDitherRect(bctx, hx, hy, hw, 18, wallCol, wallDither, 0.45);
      pxRect(hx, hy + hh - 20, hw, 8, wallDither);

      // 3. Alero de vigas salientes (canecillos de madera oscura)
      pxRect(hx - 6, hy - 4, hw + 12, 6, '#451a03');
      for (let vx = hx + 4; vx < hx + hw - 4; vx += 16) {
        pxRect(vx, hy - 2, 5, 6, '#291102');
        pxRect(vx + 1, hy - 2, 3, 2, '#78350f');
      }

      // 4. Tejado de tejas curvas de barro cocido (tejas árabes coloniales)
      pxRect(hx - 8, hy - 16, hw + 16, 14, '#7c2d12');
      for (let tx = hx - 8; tx < hx + hw + 8; tx += 12) {
        pxRect(tx, hy - 16, 11, 14, '#991b1b');
        pxRect(tx + 2, hy - 16, 7, 12, '#ea580c');
        pxRect(tx + 3, hy - 15, 4, 3, '#fdba74');
        pxRect(tx + 1, hy - 4, 9, 3, '#c2410c');
      }

      // 5. Puerta de madera labrada con tableros y chapa de latón
      pxRect(doorX - 3, G - doorH - 4, doorW + 6, doorH + 4, '#57534e');
      pxRect(doorX, G - doorH, doorW, doorH, '#451a03');
      const panelH = Math.floor((doorH - 12) / 2);
      pxRect(doorX + 2, G - doorH + 3, doorW - 4, panelH, '#78350f');
      pxRect(doorX + 4, G - doorH + 5, doorW - 8, panelH - 4, '#542609');
      pxRect(doorX + 2, G - doorH + 7 + panelH, doorW - 4, panelH, '#78350f');
      pxRect(doorX + 4, G - doorH + 9 + panelH, doorW - 8, panelH - 4, '#542609');
      pxRect(doorX + doorW - 6, G - Math.floor(doorH * 0.52), 3, 4, '#fde047');

      // 6. Ventana colonial con reja de hierro forjado y reflejo de cielo
      const winX = hx + (opt.doorRelX > hw * 0.4 ? 14 : hw - 36);
      const winY = hy + 26;
      const winW = 22, winH = 28;
      pxRect(winX - 3, winY - 3, winW + 6, winH + 6, '#57534e');
      pxRect(winX, winY, winW, winH, '#0f172a');
      pxRect(winX + 2, winY + 2, Math.floor(winW / 2) - 3, winH - 4, '#38bdf8');
      pxRect(winX + Math.floor(winW / 2) + 1, winY + 2, Math.floor(winW / 2) - 3, winH - 4, '#0284c7');
      pxRect(winX - 4, winY + winH, winW + 8, 3, '#1e293b');
      pxRect(winX - 4, winY - 4, winW + 8, 3, '#1e293b');
      for (let rx = winX + 2; rx < winX + winW; rx += 5) {
        pxRect(rx, winY - 4, 2, winH + 8, '#1e293b');
      }

      // 7. Balcón de madera superior con bugambilias florecientes
      if (hh >= 92 && opt.hasBalcony !== false) {
        const balX = winX - 4;
        const balY = winY + winH + 2;
        const balW = winW + 8;
        pxRect(balX, balY, balW, 4, '#451a03');
        pxRect(balX + 2, balY + 4, 4, 6, '#291102');
        pxRect(balX + balW - 6, balY + 4, 4, 6, '#291102');
        pxRect(balX, balY - 14, balW, 3, '#1e293b');
        for (let bx = balX + 3; bx < balX + balW; bx += 6) {
          pxRect(bx, balY - 14, 2, 14, '#1e293b');
        }
        pxFoliageCluster(bctx, balX + Math.floor(balW / 2), balY - 6, Math.floor(balW * 0.7), 14,
          '#831843', '#be185d', '#e11d48', '#f472b6');
      }

      // 8. Farol colonial de herrería con brillo cálido
      if (opt.hasLantern) {
        const lX = hx + hw - 14;
        const lY = hy + 18;
        pxRect(lX, lY - 6, 2, 14, '#1e293b');
        pxRect(lX - 4, lY, 10, 10, '#1e293b');
        pxRect(lX - 2, lY + 2, 6, 6, '#fef08a');
        pxRect(lX - 1, lY + 3, 4, 4, '#ffffff');
      }

      // 9. Macetas de barro cocido con flores en la banqueta
      if (opt.hasPots) {
        const pX = hx + (opt.doorRelX > hw * 0.4 ? hw - 20 : 10);
        pxRect(pX, G - 16, 12, 14, '#c2410c');
        pxRect(pX - 2, G - 18, 16, 4, '#ea580c');
        pxFoliageCluster(bctx, pX + 6, G - 24, 10, 8, '#064e3b', '#047857', '#e11d48', '#f43f5e');
      }
    }

    // HELPER 2: Árbol monumental de Parota (Enterolobium cyclocarpum), árbol sagrado de Colima
    function drawScenicParota(bctx, cx, cy, radX, radY) {
      const trunkW = Math.max(16, Math.floor(radX * 0.22));
      pxRect(cx - trunkW / 2, cy - 20, trunkW, radY + 20, '#2e1b10');
      pxRect(cx - trunkW / 2 + 3, cy - 16, trunkW - 6, radY + 16, '#452b1b');
      pxRect(cx - radX * 0.65, cy - 35, radX * 0.7, 14, '#2e1b10');
      pxRect(cx, cy - 38, radX * 0.65, 14, '#2e1b10');
      pxRect(cx - radX * 0.45, cy - 50, radX * 0.9, 12, '#3d2516');

      pxFoliageCluster(bctx, cx, cy - 55, radX, radY, '#022c22', '#064e3b', '#047857', '#10b981');
      pxFoliageCluster(bctx, cx - radX * 0.45, cy - 45, Math.floor(radX * 0.65), Math.floor(radY * 0.75), '#022c22', '#064e3b', '#059669', '#34d399');
      pxFoliageCluster(bctx, cx + radX * 0.45, cy - 45, Math.floor(radX * 0.65), Math.floor(radY * 0.75), '#022c22', '#064e3b', '#059669', '#34d399');
      pxFoliageCluster(bctx, cx, cy - 70, Math.floor(radX * 0.7), Math.floor(radY * 0.6), '#047857', '#059669', '#10b981', '#6ee7b7');
    }

    // HELPER 3: Palmera cocotera de la costa de Colima (Tecomán, Armería, Manzanillo)
    function drawScenicPalm(bctx, px, py, height = 120, lean = 12) {
      const steps = 10;
      const stepH = Math.floor(height / steps);
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const curX = px + Math.round(Math.sin(t * Math.PI * 0.5) * lean);
        const curY = py - s * stepH;
        pxRect(curX, curY - stepH, 8, stepH, s % 2 === 0 ? '#78350f' : '#92400e');
        pxRect(curX + 2, curY - stepH, 4, stepH, '#b45309');
      }
      const topX = px + lean;
      const topY = py - height;
      pxRect(topX - 4, topY + 2, 6, 6, '#451a03');
      pxRect(topX + 2, topY + 4, 6, 6, '#451a03');
      pxRect(topX - 2, topY + 6, 5, 5, '#78350f');

      const fronds = [
        [-38, -12, -22, -26], [38, -12, 22, -26],
        [-46, 4, -28, -10], [46, 4, 28, -10],
        [-32, 16, -18, 6], [32, 16, 18, 6],
        [0, -32, 0, -18]
      ];
      for (const [fx, fy, mx, my] of fronds) {
        pxFoliageCluster(bctx, topX + mx, topY + my, 18, 8, '#064e3b', '#047857', '#16a34a', '#86efac');
        pxFoliageCluster(bctx, topX + fx, topY + fy, 14, 6, '#047857', '#16a34a', '#4ade80', '#bbf7d0');
      }
    }

    // HELPER 4: Kiosco francés/alemán de hierro forjado (Jardín Libertad / Comala)
    function drawScenicKiosk(bctx, kx, ky) {
      pxBrickwork(bctx, kx - 70, ky - 32, 140, 32, '#a8a29e', '#57534e', '#d6d3d1', 14, 8);
      pxRect(kx - 74, ky - 36, 148, 6, '#78716c');
      pxRect(kx - 72, ky - 36, 144, 2, '#d6d3d1');
      for (let st = 0; st < 4; st++) {
        pxRect(kx - 24 - st * 4, ky - 8 - st * 6, 48 + st * 8, 6, '#d6d3d1');
        pxRect(kx - 24 - st * 4, ky - 8 - st * 6, 48 + st * 8, 2, '#ffffff');
      }

      const cols = [-56, -34, -12, 12, 34, 56];
      for (const cx of cols) {
        pxRect(kx + cx - 2, ky - 100, 4, 68, '#1e293b');
        pxRect(kx + cx - 1, ky - 100, 2, 68, '#475569');
        pxRect(kx + cx - 5, ky - 104, 10, 4, '#1e293b');
        pxRect(kx + cx - 4, ky - 103, 8, 2, '#ca8a04');
      }

      pxRect(kx - 60, ky - 58, 120, 3, '#1e293b');
      pxRect(kx - 60, ky - 40, 120, 3, '#1e293b');
      for (let bx = kx - 58; bx < kx + 58; bx += 6) {
        if (Math.abs(bx - kx) < 18) continue;
        pxRect(bx, ky - 58, 2, 18, '#334155');
      }

      pxRect(kx - 66, ky - 108, 132, 6, '#1e293b');
      pxRect(kx - 64, ky - 107, 128, 2, '#ca8a04');

      bctx.fillStyle = '#0f766e';
      bctx.beginPath();
      bctx.moveTo(kx - 68, ky - 108);
      bctx.lineTo(kx, ky - 150);
      bctx.lineTo(kx + 68, ky - 108);
      bctx.closePath();
      bctx.fill();

      bctx.fillStyle = '#14b8a6';
      bctx.beginPath();
      bctx.moveTo(kx - 60, ky - 108);
      bctx.lineTo(kx, ky - 146);
      bctx.lineTo(kx + 10, ky - 108);
      bctx.closePath();
      bctx.fill();

      bctx.fillStyle = '#5eead4';
      bctx.fillRect(kx - 8, ky - 148, 16, 2);

      pxRect(kx - 10, ky - 162, 20, 14, '#0f766e');
      pxRect(kx - 6, ky - 160, 12, 10, '#fef08a');
      pxRect(kx - 2, ky - 180, 4, 18, '#ca8a04');
      pxRect(kx - 6, ky - 176, 12, 3, '#ca8a04');
    }

    // -------------------------------------------------------------------------
    // 1. CUAUHTÉMOC: Cañaverales de Quesería, Ingenio Azucarero y Hacienda de Chiapa
    // -------------------------------------------------------------------------
    function buildCuauhtemocMidground(bctx, L, G, isRev) {
      buildHarmonicTerrainPath(bctx, L, G, 50, [{ n: 1, amp: 18 }, { n: 2, amp: 10, phase: 0.5 }, { n: 4, amp: 4 }], '#4a6828');
      buildHarmonicTerrainPath(bctx, L, G, 34, [{ n: 1, amp: 12 }, { n: 2, amp: 8, phase: 1.2 }], '#385220');

      // Cañaverales verdes de Quesería con espigas doradas ondeantes
      for (let x = 60; x <= 460; x += 22) {
        const ch = 74 + (x % 3) * 8;
        pxRect(x, G - ch, 5, ch, '#4d7c0f');
        pxRect(x + 1, G - ch, 2, ch, '#65a30d');
        pxFoliageCluster(bctx, x + 2, G - ch - 8, 16, 12, '#14532d', '#15803d', '#4ade80', '#d9f99d');
        pxRect(x - 3, G - ch - 18, 10, 10, '#fef08a'); // Espiga dorada de caña madura
      }
      for (let x = 1460; x <= 1860; x += 22) {
        const ch = 70 + (x % 4) * 6;
        pxRect(x, G - ch, 5, ch, '#4d7c0f');
        pxRect(x + 1, G - ch, 2, ch, '#65a30d');
        pxFoliageCluster(bctx, x + 2, G - ch - 8, 16, 12, '#14532d', '#15803d', '#4ade80', '#d9f99d');
        pxRect(x - 3, G - ch - 16, 10, 8, '#fef08a');
      }

      // El Monumental Chacuaco del Ingenio de Quesería (chimenea industrial del siglo XIX)
      const chX = 520;
      pxBrickwork(bctx, chX + 40, G - 230, 36, 230, '#7c2d12', '#451a03', '#ea580c', 12, 6);
      pxRect(chX + 34, G - 238, 48, 9, '#271006'); // Corona del chacuaco
      for (let k = 1; k < 8; k++) {
        pxRect(chX + 40, G - 230 + k * 28, 36, 4, '#94a3b8'); // Zunchos de hierro estructural
      }
      // Penacho de vapor blanco que se eleva hacia las faldas del volcán
      pxFoliageCluster(bctx, chX + 58, G - 252, 28, 16, '#cbd5e1', '#e2e8f0', '#f8fafc', '#ffffff');
      pxFoliageCluster(bctx, chX + 74, G - 275, 34, 18, '#e2e8f0', '#f8fafc', '#ffffff', '#ffffff');

      // Naves industriales del trapiche de vapor
      pxBrickwork(bctx, chX + 80, G - 130, 240, 130, '#991b1b', '#451a03', '#c2410c', 16, 8);
      pxRect(chX + 74, G - 142, 252, 14, '#451a03');
      for (let t = 0; t < 252; t += 12) pxRect(chX + 76 + t, G - 140, 8, 11, '#b91c1c');
      for (let w = 0; w < 4; w++) {
        pxArch(chX + 96 + w * 56, G - 92, 42, 70, '#991b1b', '#1c1917');
        pxRect(chX + 104 + w * 56, G - 76, 26, 2, '#94a3b8');
        pxRect(chX + 116 + w * 56, G - 90, 2, 68, '#94a3b8');
      }
      // Tanques y silos de melaza
      pxRect(chX + 326, G - 95, 48, 95, '#475569');
      pxRect(chX + 328, G - 95, 44, 4, '#94a3b8');
      pxRect(chX + 380, G - 85, 42, 85, '#475569');

      // Casco histórico de la Hacienda de Chiapa (arcos blancos, patio y tejas rojas)
      const hpX = 1000;
      pxBrickwork(bctx, hpX, G - 110, 360, 110, '#f8fafc', '#cbd5e1', '#ffffff', 18, 9);
      for (let a = 0; a < 5; a++) {
        pxArch(hpX + 14 + a * 68, G - 90, 52, 90, '#f8fafc', '#451a03');
        pxFoliageCluster(bctx, hpX + 40 + a * 68, G - 100, 16, 12, '#831843', '#be185d', '#e11d48', '#f472b6');
      }
      pxRect(hpX - 6, G - 122, 372, 14, '#7c2d12');
      for (let t = 0; t < 372; t += 12) pxRect(hpX - 6 + t, G - 122, 8, 12, '#ea580c');
      // Fuente central de cantera de la hacienda
      pxBrickwork(bctx, hpX + 155, G - 32, 50, 32, '#a8a29e', '#57534e', '#d6d3d1', 12, 6);
      pxWaterSheet(bctx, hpX + 160, G - 28, 40, 16, '#0284c7', '#38bdf8', '#e0f2fe');

      // Arboleda de parotas y laureles
      drawScenicParota(bctx, 240, G - 90, 75, 42);
      drawScenicParota(bctx, 1540, G - 95, 80, 44);
    }

    // -------------------------------------------------------------------------
    // 2. MINATITLÁN: Sierra de Manantlán, Cascada El Salto y Cafetales
    // -------------------------------------------------------------------------
    function buildMinatitlanMidground(bctx, L, G, isRev) {
      buildHarmonicTerrainPath(bctx, L, G, 68, [{ n: 1, amp: 28 }, { n: 2, amp: 14, phase: 0.8 }, { n: 3, amp: 8 }], '#1b382b');
      buildHarmonicTerrainPath(bctx, L, G, 46, [{ n: 1, amp: 18 }, { n: 2, amp: 10, phase: 0.2 }], '#264d3b');

      // Bosque denso de coníferas (pinos y oyameles de la Sierra de Manantlán)
      for (let x = 60; x <= 480; x += 36) {
        const ph = 85 + (x % 5) * 12;
        pxRect(x + 14, G - ph * 0.45, 8, ph * 0.45, '#2e1b10');
        // Capas piramidales de follaje de coníferas
        pxFoliageCluster(bctx, x + 18, G - ph * 0.4, 28, 20, '#022c22', '#064e3b', '#047857', '#10b981');
        pxFoliageCluster(bctx, x + 18, G - ph * 0.7, 22, 16, '#064e3b', '#047857', '#059669', '#34d399');
        pxFoliageCluster(bctx, x + 18, G - ph * 0.95, 14, 12, '#047857', '#059669', '#10b981', '#6ee7b7');
      }
      for (let x = 1460; x <= 1860; x += 36) {
        const ph = 80 + (x % 4) * 14;
        pxRect(x + 14, G - ph * 0.45, 8, ph * 0.45, '#2e1b10');
        pxFoliageCluster(bctx, x + 18, G - ph * 0.4, 26, 18, '#022c22', '#064e3b', '#047857', '#10b981');
        pxFoliageCluster(bctx, x + 18, G - ph * 0.7, 20, 15, '#064e3b', '#047857', '#059669', '#34d399');
        pxFoliageCluster(bctx, x + 18, G - ph * 0.95, 14, 12, '#047857', '#059669', '#10b981', '#6ee7b7');
      }

      // Monumental Cañón y Cascada El Salto (20m de caída vertical de agua pura)
      const csX = 540;
      // Farallón de basalto columnar oscuro
      pxBrickwork(bctx, csX, G - 195, 290, 195, '#18181b', '#09090b', '#3f3f46', 22, 14);
      pxRect(csX + 20, G - 180, 45, 180, '#27272a');
      pxRect(csX + 225, G - 180, 55, 180, '#27272a');
      // Velo de agua de la cascada
      pxWaterSheet(bctx, csX + 110, G - 195, 68, 195, '#047857', '#0d9488', '#2dd4bf');
      for (let s = 0; s < 7; s++) {
        pxRect(csX + 114 + s * 9, G - 185 + (s % 2) * 14, 5, 175, '#f0fdfa');
        pxRect(csX + 116 + s * 9, G - 185 + (s % 2) * 14, 2, 175, '#ffffff');
      }
      // Poza turquesa cristalina al pie con rocas y vapor
      pxWaterSheet(bctx, csX + 60, G - 48, 220, 48, '#0f766e', '#14b8a6', '#99f6e4');
      pxFoliageCluster(bctx, csX + 144, G - 38, 54, 20, '#5eead4', '#a5f3fc', '#f0fdfa', '#ffffff');
      // Puente colgante sobre la barranca de la cascada
      pxRect(csX + 30, G - 130, 230, 4, '#78350f');
      for (let h = 0; h < 10; h++) {
        pxRect(csX + 40 + h * 22, G - 145, 2, 15, '#1e293b');
        pxRect(csX + 40 + h * 22, G - 145, 22, 2, '#451a03');
      }

      // Cafetales de sombra con cerezas rojas maduras
      const cfX = 940;
      for (let c = 0; c < 5; c++) {
        const cx = cfX + c * 65;
        pxRect(cx + 12, G - 35, 6, 35, '#451a03');
        pxFoliageCluster(bctx, cx + 15, G - 52, 28, 22, '#064e3b', '#047857', '#15803d', '#22c55e');
        // Cerezas de café maduras
        pxRect(cx + 6, G - 44, 4, 4, '#dc2626');
        pxRect(cx + 20, G - 38, 4, 4, '#dc2626');
        pxRect(cx + 14, G - 28, 4, 4, '#ef4444');
      }

      // Torre de extracción minera de Peña Colorada
      const mnX = 1320;
      pxRect(mnX + 20, G - 175, 14, 175, '#334155');
      pxRect(mnX + 70, G - 175, 14, 175, '#334155');
      pxRect(mnX + 10, G - 185, 84, 14, '#1e293b');
      pxRect(mnX + 42, G - 200, 20, 20, '#ca8a04'); // Polea del malacate
      pxRect(mnX + 90, G - 120, 95, 120, '#5c2c10'); // Tolva de hierro
    }

    // -------------------------------------------------------------------------
    // 3. MANZANILLO: Bahía de Santiago, Las Hadas Moriscas y Monumento Pez Vela
    // -------------------------------------------------------------------------
    function buildManzanilloMidground(bctx, L, G, isRev) {
      buildHarmonicTerrainPath(bctx, L, G, 50, [{ n: 1, amp: 18 }, { n: 2, amp: 10, phase: 1.0 }], '#0369a1');
      pxWaterSheet(bctx, 0, G - 55, L, 55, '#082f49', '#0284c7', '#38bdf8');

      // Arquitectura morisca-mediterránea de Las Hadas (villas escalonadas, minaretes y cúpulas)
      const lhX = 60;
      for (let t = 0; t < 5; t++) {
        const tx = lhX + t * 88;
        const th = 110 + (t % 3) * 16;
        pxRect(tx, G - th, 80, th, '#f8fafc');
        pxDitherRect(bctx, tx, G - th, 80, 18, '#f8fafc', '#cbd5e1', 0.5);
        // Arcos de herradura moriscos
        pxArch(tx + 18, G - 70, 44, 70, '#f8fafc', '#0369a1');
        pxRect(tx + 26, G - 45, 28, 2, '#38bdf8');
        // Cúpulas moriscas redondeadas
        bctx.fillStyle = '#f8fafc';
        bctx.beginPath();
        bctx.arc(tx + 40, G - th, 28, Math.PI, 0);
        bctx.fill();
        // Minarete con aguja
        if (t === 1 || t === 3) {
          pxRect(tx + 34, G - th - 34, 12, 34, '#f8fafc');
          pxRect(tx + 32, G - th - 38, 16, 4, '#cbd5e1');
          pxRect(tx + 38, G - th - 48, 4, 10, '#fde047');
        }
        // Bugambilias de Las Hadas
        pxFoliageCluster(bctx, tx + 65, G - th + 25, 20, 14, '#831843', '#be185d', '#e11d48', '#f472b6');
      }

      // Monumento al Pez Vela de Sebastián en el Malecón (escultura roja monumental de 25m)
      const pvX = 660;
      // Explanada de cantera del Malecón
      pxBrickwork(bctx, pvX - 20, G - 40, 240, 40, '#94a3b8', '#475569', '#cbd5e1', 16, 8);
      pxRect(pvX - 24, G - 44, 248, 6, '#cbd5e1');
      // Escultura roja geométrica de Sebastián
      pxRect(pvX + 50, G - 180, 28, 140, '#b91c1c');
      pxRect(pvX + 38, G - 160, 24, 90, '#991b1b');
      pxRect(pvX + 26, G - 130, 20, 60, '#7f1d1d');
      pxRect(pvX + 62, G - 195, 26, 40, '#dc2626');
      pxRect(pvX + 76, G - 202, 16, 18, '#ef4444');
      // Gran aleta vela y pico largo del pez vela
      pxRect(pvX + 85, G - 175, 80, 10, '#f87171');
      pxRect(pvX + 155, G - 174, 20, 7, '#fca5a5');
      pxArch(pvX + 56, G - 140, 70, 95, '#b91c1c', '#0284c7');
      pxRect(pvX + 130, G - 150, 22, 105, '#dc2626');
      // Palmeras del malecón
      drawScenicPalm(bctx, pvX + 220, G - 40, 110, 8);
      drawScenicPalm(bctx, pvX - 30, G - 40, 100, -8);

      // Terminal portuaria de contenedores y grúas pórtico STS
      const grX = 1100;
      pxRect(grX, G - 185, 18, 185, '#ea580c');
      pxRect(grX + 70, G - 185, 18, 185, '#ea580c');
      pxRect(grX - 35, G - 195, 220, 16, '#c2410c');
      for (let k = 0; k < 6; k++) pxRect(grX + 10 + k * 14, G - 160 + k * 26, 4, 22, '#fb923c');
      const contCols = ['#b91c1c', '#0284c7', '#15803d', '#ca8a04', '#475569'];
      for (let ct = 0; ct < 12; ct++) {
        pxRect(grX + 95 + (ct % 6) * 44, G - 26 - Math.floor(ct / 6) * 24, 40, 22, contCols[ct % contCols.length]);
        pxRect(grX + 97 + (ct % 6) * 44, G - 26 - Math.floor(ct / 6) * 24, 36, 2, '#ffffff');
      }

      // Velero en la bahía
      const vlX = 1540;
      pxRect(vlX, G - 48, 55, 12, '#ffffff');
      pxRect(vlX + 4, G - 48, 47, 4, '#0284c7');
      pxRect(vlX + 26, G - 92, 3, 44, '#451a03');
      pxRect(vlX + 29, G - 90, 28, 38, '#ffffff');
      drawScenicPalm(bctx, 1750, G - 55, 115, 10);
    }

    // -------------------------------------------------------------------------
    // 4. ARMERÍA: Salinas de Cuyutlán, Estero Palo Verde y la Ola Verde
    // -------------------------------------------------------------------------
    function buildArmeriaMidground(bctx, L, G, isRev) {
      buildHarmonicTerrainPath(bctx, L, G, 44, [{ n: 1, amp: 14 }, { n: 2, amp: 6, phase: 0.4 }], '#b8ad96');

      // Cuadrículas de las Salinas de Cuyutlán (eras de evaporación de sal marina)
      const slX = 60;
      for (let s = 0; s < 4; s++) {
        const sx = slX + s * 115;
        pxWaterSheet(bctx, sx, G - 42, 105, 42, '#0891b2', '#22d3ee', '#cffafe');
        pxRect(sx - 4, G - 44, 113, 4, '#ffffff');
      }

      // Pirámides cónicas de sal marina artesanal secando al sol
      const mtX = 520;
      for (let m = 0; m < 5; m++) {
        const mx = mtX + m * 82;
        pxSteppedHill(mx + 38, G - 10, 78, 48 + (m % 2) * 16, '#ffffff', '#cbd5e1', 6);
        pxRect(mx + 20, G - 42 - (m % 2) * 12, 36, 2, '#ffffff');
      }

      // Estero Palo Verde con manglares y raíces zancudas
      const mgX = 940;
      for (let mg = 0; mg < 4; mg++) {
        const mx = mgX + mg * 110;
        // Raíces zancudas
        pxRect(mx + 10, G - 55, 8, 55, '#3d2314');
        pxRect(mx + 28, G - 55, 8, 55, '#5c3822');
        pxRect(mx + 46, G - 55, 8, 55, '#3d2314');
        pxFoliageCluster(bctx, mx + 28, G - 85, 42, 30, '#064e3b', '#047857', '#15803d', '#4ade80');
      }
      // Garzas blancas del estero en vuelo
      pxRect(mgX + 140, G - 135, 16, 6, '#ffffff');
      pxRect(mgX + 144, G - 145, 8, 12, '#ffffff');
      pxRect(mgX + 154, G - 134, 4, 3, '#f59e0b');

      // La Legendaria Ola Verde de Cuyutlán rompiendo en la costa
      const ovX = 1400;
      pxRect(ovX, G - 110, 240, 110, '#022c22');
      pxWaterSheet(bctx, ovX, G - 110, 240, 110, '#064e3b', '#059669', '#6ee7b7');
      // Cresta espumosa de la Ola Verde
      pxRect(ovX - 10, G - 118, 260, 12, '#ffffff');
      for (let s = 0; s < 260; s += 8) {
        pxRect(ovX - 10 + s, G - 124, 5, 8, '#f0fdf4');
        pxRect(ovX - 8 + s, G - 128, 3, 5, '#ffffff');
      }
      drawScenicPalm(bctx, 1780, G - 44, 115, -10);
    }

    // -------------------------------------------------------------------------
    // 5. TECOMÁN: Huertas de Limón Mexicano, Cocoteros y Boca de Pascuales
    // -------------------------------------------------------------------------
    function buildTecomanMidground(bctx, L, G, isRev) {
      buildHarmonicTerrainPath(bctx, L, G, 46, [{ n: 1, amp: 16 }, { n: 2, amp: 8, phase: 0.3 }], '#3d5926');

      // Huertas de Limón de Tecomán (Capital Mundial del Limón)
      for (let x = 60; x <= 620; x += 74) {
        pxRect(x + 22, G - 62, 14, 62, '#451a03');
        pxRect(x + 24, G - 62, 6, 62, '#78350f');
        // Copa de limonero densa y redondeada
        pxFoliageCluster(bctx, x + 28, G - 88, 38, 30, '#14532d', '#15803d', '#16a34a', '#84cc16');
        // Limones mexicanos maduros (verde lima brillante)
        pxRect(x + 12, G - 84, 8, 8, '#84cc16');
        pxRect(x + 14, G - 82, 4, 4, '#d9f99d');
        pxRect(x + 36, G - 76, 8, 8, '#84cc16');
        pxRect(x + 38, G - 74, 4, 4, '#d9f99d');
        pxRect(x + 24, G - 96, 7, 7, '#bef264');
        pxRect(x + 42, G - 92, 6, 6, '#84cc16');
        // Flores blancas de azahar
        pxRect(x + 18, G - 98, 4, 4, '#ffffff');
        pxRect(x + 32, G - 88, 4, 4, '#ffffff');
      }

      // Huacales y cajas de cosecha de madera rústica apiladas
      const crX = 480;
      pxRect(crX, G - 36, 44, 36, '#78350f');
      pxRect(crX + 2, G - 34, 40, 10, '#b45309');
      pxRect(crX + 2, G - 22, 40, 10, '#b45309');
      for (let l = 0; l < 5; l++) pxRect(crX + 4 + l * 8, G - 32, 6, 6, '#84cc16');
      pxRect(crX + 48, G - 48, 44, 48, '#78350f');
      pxRect(crX + 50, G - 46, 40, 12, '#b45309');
      pxRect(crX + 50, G - 32, 40, 12, '#b45309');
      for (let l = 0; l < 5; l++) pxRect(crX + 52 + l * 8, G - 44, 6, 6, '#84cc16');

      // Canal de riego de piedra con agua cristalina
      const cnX = 720;
      pxBrickwork(bctx, cnX, G - 28, 220, 28, '#78716c', '#44403c', '#a8a29e', 14, 7);
      pxWaterSheet(bctx, cnX + 6, G - 24, 208, 18, '#0891b2', '#06b6d4', '#67e8f9');

      // Cocoteros y palmares de Tecomán
      for (let p = 980; p <= 1400; p += 105) {
        drawScenicPalm(bctx, p, G - 25, 125 + (p % 3) * 15, (p % 2 === 0 ? 12 : -10));
      }

      // Enramadas de Boca de Pascuales y Playa El Real con techos de palapa
      const rmX = 1450;
      pxRect(rmX, G - 92, 16, 92, '#5c3d23');
      pxRect(rmX + 160, G - 92, 16, 92, '#5c3d23');
      pxDitherRect(bctx, rmX - 20, G - 110, 216, 24, '#78350f', '#b45309', 0.5);
      pxRect(rmX + 25, G - 52, 125, 16, '#806040');
      // Tabla de surf recargada
      pxRect(rmX + 130, G - 80, 14, 80, '#ef4444');
      pxRect(rmX + 133, G - 76, 8, 72, '#fde047');
    }

    // -------------------------------------------------------------------------
    // 6. IXTLAHUACÁN: Grutas de San Gabriel (Teoyostoc) y Cañón del Río Salado
    // -------------------------------------------------------------------------
    function buildIxtlahuacanMidground(bctx, L, G, isRev) {
      buildHarmonicTerrainPath(bctx, L, G, 60, [{ n: 1, amp: 26 }, { n: 2, amp: 14, phase: 0.6 }, { n: 3, amp: 8 }], '#44403c');

      // Agujas y mogotes de roca caliza kárstica con estratos ocres y grises
      for (let k = 60; k <= 480; k += 95) {
        pxSteppedHill(k + 35, G - 30, 75, 120 + (k % 3) * 24, '#1c1917', '#78716c', 10);
        pxRect(k + 15, G - 110 - (k % 3) * 16, 40, 4, '#ca8a04'); // Estrato de arenisca mineral
        pxRect(k + 20, G - 80 - (k % 3) * 12, 35, 3, '#ca8a04');
      }

      // Cactos pitayos (cactáceas columnares ramificadas con espinas y flores)
      const cactX = 540;
      for (let c = 0; c < 5; c++) {
        const cx = cactX + c * 80;
        pxRect(cx, G - 100, 12, 100, '#14532d');
        pxRect(cx + 2, G - 100, 4, 100, '#16a34a');
        // Brazos ramificados
        pxRect(cx - 16, G - 75, 16, 10, '#14532d');
        pxRect(cx - 16, G - 92, 10, 20, '#16a34a');
        pxRect(cx + 12, G - 82, 16, 10, '#14532d');
        pxRect(cx + 18, G - 98, 10, 22, '#16a34a');
        // Flores rojas de pitaya
        pxRect(cx - 14, G - 96, 6, 6, '#ef4444');
        pxRect(cx + 20, G - 102, 6, 6, '#ef4444');
        pxRect(cx + 3, G - 104, 6, 6, '#ef4444');
      }

      // La Misteriosa Entrada de las Grutas de San Gabriel (Teoyostoc)
      const gvX = 980;
      pxSteppedHill(gvX + 150, G, 340, 175, '#292524', '#57534e', 14);
      // Bóveda cavernosa profunda
      pxArch(gvX + 85, G - 45, 130, 130, '#292524', '#09090b');
      // Estalactitas doradas de calcita colgando del techo de la cueva
      for (let st = 0; st < 9; st++) {
        const slen = 24 + (st % 4) * 14;
        pxRect(gvX + 95 + st * 13, G - 45, 6, slen, '#ca8a04');
        pxRect(gvX + 97 + st * 13, G - 45 + slen - 4, 2, 4, '#fef08a');
      }
      // Estalagmitas ascendentes
      for (let sm = 0; sm < 6; sm++) {
        const smH = 16 + (sm % 3) * 10;
        pxRect(gvX + 105 + sm * 18, G - 45 - smH, 6, smH, '#a16207');
        pxRect(gvX + 107 + sm * 18, G - 45 - smH, 2, 3, '#fde047');
      }
      // Raíces milenarias del árbol de amate que bajan por la cueva
      pxRect(gvX + 75, G - 165, 8, 140, '#451a03');
      pxRect(gvX + 80, G - 110, 6, 85, '#78350f');

      // Cañón del Río Salado con aguas mineralizadas y pozas
      const rnX = 1420;
      pxWaterSheet(bctx, rnX, G - 40, 240, 40, '#78350f', '#b45309', '#fde047');
      for (let r = 0; r < 5; r++) {
        pxSteppedHill(rnX + r * 54, G - 8, 48, 24 + (r % 2) * 10, '#57534e', '#78716c', 6);
      }
    }

    // -------------------------------------------------------------------------
    // 7. COQUIMATLÁN: Los Amiales, Sabinos Centenarios y Manantiales Cristalinos
    // -------------------------------------------------------------------------
    function buildCoquimatlanMidground(bctx, L, G, isRev) {
      buildHarmonicTerrainPath(bctx, L, G, 50, [{ n: 1, amp: 18 }, { n: 2, amp: 10, phase: 1.2 }, { n: 4, amp: 4 }], '#2c5932');

      // Manantiales cristalinos y pozas turquesas de Los Amiales
      const amX = 60;
      pxWaterSheet(bctx, amX, G - 58, 280, 58, '#0e7490', '#06b6d4', '#cffafe');
      pxBrickwork(bctx, amX - 6, G - 62, 292, 6, '#475569', '#334155', '#94a3b8', 14, 6);
      // Piedras de río y escalinatas sumergidas
      for (let st = 0; st < 6; st++) {
        pxRect(amX + 30 + st * 42, G - 42, 24, 12, '#64748b');
        pxRect(amX + 32 + st * 42, G - 42, 20, 2, '#94a3b8');
      }

      // Sabinos centenarios (Ahuehuetes monumentales de Los Amiales con raíces buttress)
      const sbX = 520;
      // Tronco colosal del sabino
      pxRect(sbX, G - 165, 48, 165, '#2e1b10');
      pxRect(sbX + 4, G - 165, 12, 165, '#452b1b');
      // Raíces buttress serpenteantes que entran al agua cristalina
      pxRect(sbX - 34, G - 65, 34, 65, '#3d2516');
      pxRect(sbX + 48, G - 65, 34, 65, '#3d2516');
      pxRect(sbX - 24, G - 30, 24, 30, '#54321d');
      pxRect(sbX + 58, G - 30, 24, 30, '#54321d');
      // Follaje llorón denso de ahuehuete
      pxFoliageCluster(bctx, sbX + 24, G - 180, 95, 60, '#064e3b', '#047857', '#15803d', '#34d399');
      pxFoliageCluster(bctx, sbX - 45, G - 160, 65, 45, '#064e3b', '#047857', '#15803d', '#34d399');
      pxFoliageCluster(bctx, sbX + 90, G - 160, 65, 45, '#064e3b', '#047857', '#15803d', '#34d399');
      // Helechos y lianas colgantes sobre el agua
      for (let l = 0; l < 8; l++) {
        pxRect(sbX - 35 + l * 18, G - 130, 4, 55, '#15803d');
        pxRect(sbX - 34 + l * 18, G - 78, 6, 12, '#4ade80');
      }

      // Palapas ribereñas de Los Amiales
      const plX = 880;
      pxRect(plX, G - 88, 14, 88, '#5c3d23');
      pxRect(plX + 130, G - 88, 14, 88, '#5c3d23');
      pxDitherRect(bctx, plX - 16, G - 104, 176, 22, '#78350f', '#b45309', 0.5);
      pxRect(plX + 18, G - 48, 110, 14, '#806040');

      // Monolito de la Piedra Acampanada en la selva baja caducifolia
      const prX = 1180;
      pxSteppedHill(prX + 90, G, 200, 135, '#4a4f44', '#788070', 12);
      pxRect(prX + 60, G - 110, 60, 4, '#a8a29e');
      drawScenicParota(bctx, 1600, G - 90, 85, 48);
    }

    // -------------------------------------------------------------------------
    // 8. COMALA: El Pueblo Blanco de América, Parroquia San Miguel y Portales
    // -------------------------------------------------------------------------
    function buildComalaMidground(bctx, L, G, isRev) {
      buildHarmonicTerrainPath(bctx, L, G, 48, [{ n: 1, amp: 16 }, { n: 2, amp: 8, phase: 0.5 }], '#443f38');

      // Arboleda de Parotas y Laureles de la India al fondo de los techos
      drawScenicParota(bctx, 220, G - 120, 75, 44);
      drawScenicParota(bctx, 820, G - 125, 80, 46);
      drawScenicParota(bctx, 1620, G - 120, 75, 44);

      // Casas coloniales continuas de Comala (Pueblo Blanco)
      const houses = [
        { x: 50, w: 90, h: 92, door: 22, balc: true, pots: true, lant: true },
        { x: 145, w: 95, h: 102, door: 48, balc: true, pots: false, lant: false },
        { x: 245, w: 85, h: 88, door: 16, balc: false, pots: true, lant: true },
        { x: 335, w: 100, h: 96, door: 55, balc: true, pots: true, lant: false },
        { x: 440, w: 90, h: 90, door: 25, balc: true, pots: false, lant: true },
        { x: 1380, w: 92, h: 94, door: 20, balc: true, pots: true, lant: true },
        { x: 1475, w: 88, h: 86, door: 48, balc: false, pots: true, lant: false },
        { x: 1568, w: 95, h: 98, door: 28, balc: true, pots: false, lant: true },
        { x: 1668, w: 90, h: 90, door: 52, balc: true, pots: true, lant: false },
        { x: 1762, w: 95, h: 94, door: 30, balc: true, pots: true, lant: true }
      ];

      for (const h of houses) {
        drawScenicColonialHouse(bctx, h.x, G - h.h, h.w, h.h, {
          wallCol: '#f8fafc',
          wallDither: '#e2e8f0',
          doorRelX: h.door,
          hasBalcony: h.balc,
          hasLantern: h.lant,
          hasPots: h.pots
        });
      }

      // Los Famosos Portales Arqueados de Comala (restaurantes botaneros tradicionales)
      const ptX = 550;
      for (let p = 0; p < 6; p++) {
        const px = ptX + p * 68;
        pxBrickwork(bctx, px, G - 110, 18, 110, '#ded4c3', '#b3a898', '#ffffff', 14, 7);
        pxArch(px + 18, G - 100, 50, 100, '#ded4c3', '#5c3d2e');
      }
      pxRect(ptX, G - 122, 412, 14, '#7c2d12');
      for (let t = 0; t < 412; t += 12) pxRect(ptX + t, G - 122, 8, 12, '#ea580c');
      // Faroles coloniales en los portales
      for (let f = 0; f < 5; f++) {
        const fx = ptX + 44 + f * 68;
        pxRect(fx, G - 88, 6, 8, '#fef08a');
        pxRect(fx + 1, G - 87, 4, 6, '#ffffff');
      }

      // La Histórica Parroquia de San Miguel Arcángel (1884, estilo neoclásico)
      const tX = ptX + 430;
      // Torre Campanario izquierda
      pxBrickwork(bctx, tX, G - 215, 36, 120, '#f8fafc', '#cbd5e1', '#ffffff', 12, 6);
      pxArch(tX + 6, G - 195, 24, 40, '#f8fafc', '#451a03');
      pxRect(tX + 15, G - 185, 6, 12, '#ca8a04'); // Campana de bronce
      pxSteppedHill(tX + 18, G - 215, 34, 20, '#ca8a04', '#fde047', 4);
      pxRect(tX + 16, G - 238, 4, 12, '#ffffff'); // Cruz

      // Fachada central neoclásica y ventana coral
      pxBrickwork(bctx, tX + 36, G - 175, 58, 80, '#f8fafc', '#cbd5e1', '#ffffff', 12, 6);
      pxArch(tX + 48, G - 148, 34, 52, '#f8fafc', '#451a03');
      pxRect(tX + 54, G - 170, 22, 18, '#38bdf8'); // Ventana coral
      pxRect(tX + 63, G - 170, 4, 18, '#ffffff');
      // Escultura de San Miguel Arcángel coronando el frontón
      pxRect(tX + 61, G - 188, 8, 13, '#ca8a04');
      pxRect(tX + 58, G - 184, 14, 4, '#fde047'); // Alas doradas

      // Torre Campanario derecha
      pxBrickwork(bctx, tX + 94, G - 215, 36, 120, '#f8fafc', '#cbd5e1', '#ffffff', 12, 6);
      pxArch(tX + 100, G - 195, 24, 40, '#f8fafc', '#451a03');
      pxRect(tX + 109, G - 185, 6, 12, '#ca8a04'); // Campana de bronce
      pxSteppedHill(tX + 112, G - 215, 34, 20, '#ca8a04', '#fde047', 4);
      pxRect(tX + 110, G - 238, 4, 12, '#ffffff'); // Cruz

      // Kiosco alemán de Comala en la plaza
      drawScenicKiosk(bctx, 1220, G);
    }

    // -------------------------------------------------------------------------
    // 9. VILLA DE ÁLVAREZ: Monumental Plaza La Petatera y Perritos Bailarines
    // -------------------------------------------------------------------------
    function buildVillaMidground(bctx, L, G, isRev) {
      buildHarmonicTerrainPath(bctx, L, G, 48, [{ n: 1, amp: 16 }, { n: 2, amp: 8, phase: 0.2 }], '#967e62');

      // Tiras festivas de papel picado cruzando la calle (rojo, amarillo, verde, azul, morado)
      const bannerCols = ['#dc2626', '#f59e0b', '#16a34a', '#2563eb', '#7c3aed'];
      for (let b = 50; b <= 520; b += 24) {
        pxRect(b, G - 130, 18, 16, bannerCols[Math.floor(b / 24) % 5]);
        pxRect(b + 4, G - 114, 10, 6, bannerCols[Math.floor(b / 24) % 5]);
      }

      // Casas coloniales festivas de La Villa
      const houses = [
        { x: 50, w: 90, h: 90, door: 20 },
        { x: 145, w: 92, h: 96, door: 45 },
        { x: 242, w: 88, h: 88, door: 18 },
        { x: 335, w: 96, h: 94, door: 50 },
        { x: 435, w: 90, h: 88, door: 25 },
        { x: 1460, w: 90, h: 92, door: 22 },
        { x: 1555, w: 95, h: 98, door: 50 },
        { x: 1655, w: 88, h: 86, door: 20 },
        { x: 1748, w: 95, h: 94, door: 45 }
      ];
      for (const h of houses) {
        drawScenicColonialHouse(bctx, h.x, G - h.h, h.w, h.h, {
          wallCol: '#eed0a2',
          wallDither: '#d6c19f',
          doorRelX: h.door,
          hasBalcony: true,
          hasLantern: true,
          hasPots: true
        });
      }

      // Monumental Plaza de Toros "La Petatera" (Artesanía más grande del mundo)
      const petX = 540;
      // 4 niveles de graderías de horcones de madera y petates tejidos de tule
      for (let tier = 0; tier < 4; tier++) {
        const ty = G - 145 + tier * 30;
        const tw = 380 - tier * 36;
        const tx = petX + tier * 18;
        // Petates tejidos de tule en tonos ocres y ámbar
        pxDitherRect(bctx, tx, ty, tw, 26, '#d97706', '#b45309', 0.5);
        pxRect(tx, ty, tw, 3, '#fde68a'); // Borde de petate nuevo
        // Horcones y latas de madera rústica atados con ixtle
        for (let p = 0; p < 11; p++) {
          pxRect(tx + p * 35, ty, 6, 30, '#451a03');
          pxRect(tx + p * 35 - 2, ty + 8, 10, 4, '#fef08a'); // Amarre de ixtle vegetal
        }
      }
      // Tiras de papel picado ondeando en la cresta de La Petatera
      for (let bf = 0; bf < 16; bf++) {
        pxRect(petX + bf * 24, G - 155, 14, 12, bannerCols[bf % bannerCols.length]);
      }

      // Glorieta y Monumento a los Perritos Bailarines (Tlalchichis prehispánicos)
      const pbX = 1060;
      // Base monumental de cantera redonda
      pxSteppedHill(pbX + 85, G, 190, 42, '#8c7b64', '#b3a898', 8);
      pxRect(pbX + 40, G - 46, 90, 6, '#cbd5e1');
      // Escultura de bronce de los dos perritos abrazados danzando
      pxRect(pbX + 50, G - 110, 34, 65, '#92400e');
      pxRect(pbX + 58, G - 125, 22, 25, '#b45309');
      pxRect(pbX + 85, G - 110, 34, 65, '#92400e');
      pxRect(pbX + 85, G - 125, 22, 25, '#b45309');
      pxRect(pbX + 70, G - 95, 30, 12, '#d97706'); // Punto de unión del abrazo
      // Brillo metálico del bronce al sol
      pxRect(pbX + 62, G - 120, 6, 8, '#fde047');
      pxRect(pbX + 90, G - 120, 6, 8, '#fde047');
      drawScenicParota(bctx, pbX + 220, G - 85, 75, 42);
    }

    // -------------------------------------------------------------------------
    // 10. COLIMA CAPITAL: Catedral Basílica Menor, Palacio de Gobierno y Parotas
    // -------------------------------------------------------------------------
    function buildColimaCapitalMidground(bctx, L, G, isRev) {
      buildHarmonicTerrainPath(bctx, L, G, 50, [{ n: 1, amp: 16 }, { n: 2, amp: 8, phase: 0.4 }], '#665f54');

      // Basílica Menor Catedral de Colima (fachada monumental de cantera rosa)
      const catX = 60;
      // Torre Campanario izquierda (cantera rosa tallada con cúpula de cobre verdoso)
      pxBrickwork(bctx, catX, G - 215, 48, 215, '#b47a68', '#7c5344', '#f2cdc3', 14, 7);
      pxArch(catX + 8, G - 195, 32, 50, '#b47a68', '#ca8a04'); // Arco campanario
      pxRect(catX + 20, G - 185, 8, 14, '#ca8a04'); // Campana de bronce
      // Cúpula superior de cobre oxidado verde verdigris
      bctx.fillStyle = '#0f766e';
      bctx.beginPath();
      bctx.arc(catX + 24, G - 215, 24, Math.PI, 0);
      bctx.fill();
      bctx.fillStyle = '#2dd4bf';
      bctx.fillRect(catX + 16, G - 232, 16, 3);
      pxRect(catX + 22, G - 245, 4, 14, '#fde047'); // Cruz dorada

      // Fachada central neoclásica y portal mayor
      pxBrickwork(bctx, catX + 48, G - 145, 140, 145, '#b47a68', '#7c5344', '#f2cdc3', 14, 7);
      pxArch(catX + 85, G - 100, 66, 100, '#b47a68', '#3d251e'); // Portal central
      // Rosetón central de cantera
      bctx.fillStyle = '#38bdf8';
      bctx.beginPath();
      bctx.arc(catX + 118, G - 120, 16, 0, Math.PI * 2);
      bctx.fill();
      pxRect(catX + 116, G - 136, 4, 32, '#f2cdc3');
      pxRect(catX + 102, G - 122, 32, 4, '#f2cdc3');

      // Torre Campanario derecha
      pxBrickwork(bctx, catX + 188, G - 215, 48, 215, '#b47a68', '#7c5344', '#f2cdc3', 14, 7);
      pxArch(catX + 196, G - 195, 32, 50, '#b47a68', '#ca8a04');
      pxRect(catX + 208, G - 185, 8, 14, '#ca8a04'); // Campana de bronce
      bctx.fillStyle = '#0f766e';
      bctx.beginPath();
      bctx.arc(catX + 212, G - 215, 24, Math.PI, 0);
      bctx.fill();
      bctx.fillStyle = '#2dd4bf';
      bctx.fillRect(catX + 204, G - 232, 16, 3);
      pxRect(catX + 210, G - 245, 4, 14, '#fde047'); // Cruz dorada

      // Palacio de Gobierno (arquería neoclásica monumental y reloj histórico)
      const palX = 540;
      pxBrickwork(bctx, palX, G - 120, 280, 120, '#d4c2a5', '#8c7b64', '#ffffff', 16, 8);
      for (let a = 0; a < 4; a++) {
        pxArch(palX + 18 + a * 64, G - 95, 48, 95, '#d4c2a5', '#4a4237');
      }
      // Torre del Reloj del Palacio
      pxBrickwork(bctx, palX + 114, G - 190, 56, 72, '#d4c2a5', '#8c7b64', '#ffffff', 14, 7);
      pxRect(palX + 128, G - 175, 26, 26, '#ffffff'); // Carátula del reloj
      pxRect(palX + 138, G - 168, 4, 12, '#1e293b'); // Manecillas
      pxSteppedHill(palX + 142, G - 190, 52, 22, '#8c7b64', '#d4c2a5', 4);
      // Bandera Mexicana
      pxRect(palX + 130, G - 222, 8, 14, '#15803d');
      pxRect(palX + 138, G - 222, 8, 14, '#ffffff');
      pxRect(palX + 146, G - 222, 8, 14, '#dc2626');

      // Kiosco histórico francés de Jardín Libertad (1891)
      drawScenicKiosk(bctx, 1020, G);

      // Colosales Árboles de Parota en Jardín Libertad
      drawScenicParota(bctx, 1340, G - 130, 95, 52);
      drawScenicParota(bctx, 1720, G - 125, 90, 50);
    }
`;

fs.writeFileSync('scripts/temp_scenic.js', code);
console.log('Script generado con éxito.');
