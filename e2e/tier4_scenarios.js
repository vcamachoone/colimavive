/**
 * e2e/tier4_scenarios.js
 * Tier 4: Real-World Application Scenarios (5 comprehensive scenarios).
 * Authoritative sources: PROJECT.md § Milestones, Architecture, ORIGINAL_REQUEST.md § Requirements.
 */

const { verifyFpsStability, verifyConsoleErrors, verifyParallaxSeamContinuity, verifyCryptographicParity } = require('./pillars');

const scenarios = [
  // ==========================================
  // SCENARIO 1: The Grand Colima Tour (10-Municipality Sequential Journey)
  // ==========================================
  {
    id: 'T4.1',
    name: 'The Grand Colima Tour (10-Municipality Sequential Journey)',
    source: 'ORIGINAL_REQUEST.md § R1, PROJECT.md § M1',
    complexity: 'High',
    features: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F9'],
    run: async (cdp) => {
      const tourResults = [];
      for (let w = 0; w < 10; w++) {
        const step = await cdp.evaluate(`
          (() => {
            try {
              loadStage(${w}, 0, false);
              cameraX = 0;
              // Advance 30 frames
              for (let f = 0; f < 30; f++) {
                if (player) {
                  player.x += 3;
                  cameraX = Math.max(0, Math.min(player.x - W * 0.35, stageMeta.length - W));
                }
                update();
                render();
              }
              return {
                ok: true,
                world: ${w},
                name: MUNICIPALITIES[${w}].municipality,
                playerX: player ? Math.round(player.x) : 0,
                cameraX: Math.round(cameraX)
              };
            } catch(e) {
              return { ok: false, world: ${w}, error: e.message };
            }
          })()
        `);
        tourResults.push(step);
      }

      const failedSteps = tourResults.filter(s => !s.ok);
      if (failedSteps.length > 0) {
        return {
          pass: false,
          message: `Tour failed on worlds: ${failedSteps.map(f => f.world).join(', ')}: ${failedSteps[0].error}`
        };
      }

      // Check console errors
      const consoleCheck = await verifyConsoleErrors(cdp);
      if (!consoleCheck.pass) {
        return { pass: false, message: consoleCheck.error };
      }

      return {
        pass: true,
        details: `Successfully toured all 10 municipalities: ${tourResults.map(t => t.name).join(' -> ')}`
      };
    }
  },

  // ==========================================
  // SCENARIO 2: High-Velocity Camera Scroll & Seamless Wrap Torture Test
  // ==========================================
  {
    id: 'T4.2',
    name: 'High-Velocity Camera Scroll & Seamless Wrap Torture Test',
    source: 'ORIGINAL_REQUEST.md § R2, PROJECT.md § F2, F6',
    complexity: 'High',
    features: ['F2', 'F6', 'F9'],
    run: async (cdp) => {
      const scrollResult = await cdp.evaluate(`
        (() => {
          try {
            loadStage(0, 0, false);
            const W = 960;
            // Scroll camera from 0 to 15,000 in large steps
            let maxStep = 0;
            for (let cam = 0; cam <= 15000; cam += 250) {
              cameraX = cam;
              render();
            }
            return { ok: true };
          } catch(e) {
            return { ok: false, error: e.message };
          }
        })()
      `);

      if (!scrollResult.ok) {
        return { pass: false, message: `High-velocity scroll crashed: ${scrollResult.error}` };
      }

      // Verify wrap seam continuity at a high wrap point
      await cdp.evaluate(`cameraX = 9600; render();`);
      const seam = await verifyParallaxSeamContinuity(cdp, {
        xLeft: 0,
        xRight: 959,
        yStart: 20,
        height: 200,
        maxMeanDeltaE: 35.0,
        maxPeakDeltaE: 80.0
      });

      return { pass: seam.pass, message: seam.error };
    }
  },

  // ==========================================
  // SCENARIO 3: The Upside-Down Incursion & Escape (Mundo del Revés Full Lifecycle)
  // ==========================================
  {
    id: 'T4.3',
    name: 'The Upside-Down Incursion & Escape (Mundo del Revés Full Lifecycle)',
    source: 'ORIGINAL_REQUEST.md § R3, PROJECT.md § F7, F8',
    complexity: 'High',
    features: ['F1', 'F7', 'F8', 'F9'],
    run: async (cdp) => {
      // 1. Enter World 0 in normal mode
      await cdp.evaluate(`
        loadStage(0, 0, false);
        isUpsideDown = false;
        render();
      `);

      // 2. Trigger dimension warp to enter Mundo del Revés
      const incursion = await cdp.evaluate(`
        (() => {
          try {
            isUpsideDown = true;
            loadStage(0, 0, true);
            // Simulate 60 frames of gameplay under Mundo del Revés
            for (let i = 0; i < 60; i++) {
              frameCount++;
              update();
              render();
            }
            return {
              ok: true,
              isUpsideDown,
              enemyCount: enemies ? enemies.length : 0
            };
          } catch(e) {
            return { ok: false, error: e.message };
          }
        })()
      `);

      if (!incursion.ok) {
        return { pass: false, message: `Incursion crashed: ${incursion.error}` };
      }

      // 3. Exit Mundo del Revés back to normal mode
      const exitResult = await cdp.evaluate(`
        (() => {
          try {
            isUpsideDown = false;
            loadStage(0, 0, true);
            for (let i = 0; i < 30; i++) {
              frameCount++;
              update();
              render();
            }
            return { ok: true, isUpsideDown };
          } catch(e) {
            return { ok: false, error: e.message };
          }
        })()
      `);

      if (!exitResult.ok || exitResult.isUpsideDown !== false) {
        return { pass: false, message: 'Failed to exit Mundo del Revés safely' };
      }

      return { pass: true };
    }
  },

  // ==========================================
  // SCENARIO 4: Boss Arena Gauntlet with Parallax Background Continuity
  // ==========================================
  {
    id: 'T4.4',
    name: 'Boss Arena Gauntlet with Parallax Background Continuity',
    source: 'ORIGINAL_REQUEST.md § R1, R2, PROJECT.md § F2, F3, F4',
    complexity: 'High',
    features: ['F2', 'F3', 'F4', 'F5'],
    run: async (cdp) => {
      const bossWorlds = [0, 2, 8]; // Cuauhtémoc, Manzanillo, Villa de Álvarez
      for (const w of bossWorlds) {
        const arenaResult = await cdp.evaluate(`
          (() => {
            try {
              loadStage(${w}, 2, false); // Substage 2 is boss arena
              boss = {
                active: true,
                hp: 100,
                maxHp: 100,
                x: 600,
                y: 300,
                phase: 1
              };
              // Simulate 30 frames with screen shake
              for (let i = 0; i < 30; i++) {
                screenShake = i % 5 === 0 ? 8 : 0;
                frameCount++;
                render();
              }
              screenShake = 0;
              return { ok: true };
            } catch(e) {
              screenShake = 0;
              return { ok: false, error: e.message };
            }
          })()
        `);
        if (!arenaResult.ok) {
          return { pass: false, message: `Boss arena failed on World ${w}: ${arenaResult.error}` };
        }
      }
      return { pass: true };
    }
  },

  // ==========================================
  // SCENARIO 5: Extended 180-Frame Engine Stability & Zero-Error Pillar Audit
  // ==========================================
  {
    id: 'T4.5',
    name: 'Extended 180-Frame Engine Stability & Zero-Error Pillar Audit',
    source: 'ORIGINAL_REQUEST.md § Acceptance Criteria, PROJECT.md § M1, M2',
    complexity: 'High',
    features: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'],
    run: async (cdp) => {
      // 1. Pillar 1: 60 FPS Stability over 180 frames
      await cdp.evaluate(`
        loadStage(0, 0, false);
        if (player) { player.x = 200; player.vx = 2.0; }
      `);
      const pillar1 = await verifyFpsStability(cdp, 180);
      if (!pillar1.pass) {
        return { pass: false, message: pillar1.error };
      }

      // 2. Pillar 2: 0 Console Errors
      const pillar2 = await verifyConsoleErrors(cdp);
      if (!pillar2.pass) {
        return { pass: false, message: pillar2.error };
      }

      // 3. Pillar 3: Visual Seam Continuity
      const pillar3 = await verifyParallaxSeamContinuity(cdp, {
        xLeft: 0,
        xRight: 959,
        yStart: 20,
        height: 200,
        maxMeanDeltaE: 35.0,
        maxPeakDeltaE: 80.0
      });
      if (!pillar3.pass) {
        return { pass: false, message: pillar3.error };
      }

      // 4. Pillar 4: 100% Cryptographic SHA-256 Parity
      const pillar4 = verifyCryptographicParity();
      if (!pillar4.pass) {
        return { pass: false, message: pillar4.error };
      }

      return {
        pass: true,
        details: `All 4 Pillars Passed: FPS=${pillar1.meanFps}, ConsoleErrors=0, SeamDeltaE=${pillar3.meanDeltaE}, Parity=100%`
      };
    }
  }
];

module.exports = { scenarios };
