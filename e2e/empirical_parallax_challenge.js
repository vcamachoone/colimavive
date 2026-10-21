/**
 * e2e/empirical_parallax_challenge.js
 * Empirical Challenger M1-5 Stress Harness:
 * Parallax Looping, Modulo Wrapping, and Seam Continuity Deep Verification.
 */

const { CdpSession } = require('./cdp');

const PORT = 9497;
const URL = 'http://localhost:8085';

async function runEmpiricalHarness() {
  console.log('================================================================================');
  console.log('🔬 CHALLENGER M1-5: EMPIRICAL PARALLAX & WRAPPING STRESS HARNESS');
  console.log(`Port: ${PORT} | Target URL: ${URL}`);
  console.log('================================================================================\n');

  const cdp = new CdpSession({ port: PORT, url: URL });
  await cdp.launch();
  await cdp.navigate();

  const results = {
    cameraCoords: [],
    bufferSeams: [],
    drift300: null,
    drift600: null,
    drift1200: null
  };

  try {
    // -------------------------------------------------------------------------
    // TEST SUITE 1: Camera Coordinates Sweep (Origins, Multiples, Extremes, Negatives, Subpixels)
    // Testing column 0 vs column 959 across sky & cloud window y in [20, 220]
    // -------------------------------------------------------------------------
    console.log('--- TEST SUITE 1: Camera Coordinates Sweep (Columns 0 vs 959, y in [20, 220]) ---');
    const cameraTestCoords = [
      0,
      120,
      240,
      480,
      960,
      1920,
      3840,
      9600,
      19200,
      38400,
      100000,
      1000000,
      -0.5,
      -1,
      -500,
      -960,
      -1920,
      -9600,
      0.001,
      0.499,
      0.500,
      0.999,
      960.333,
      1920.777,
      -1920.555
    ];

    for (const cam of cameraTestCoords) {
      const evalResult = await cdp.evaluate(`
        (() => {
          loadStage(0, 0, false);
          isUpsideDown = false;
          cameraX = ${cam};
          render();
          const c = document.getElementById('gameCanvas');
          const ctx = c.getContext('2d');
          const imgL = ctx.getImageData(0, 20, 1, 200).data;
          const imgR = ctx.getImageData(959, 20, 1, 200).data;
          let sum = 0, peak = 0, peakY = 0;
          for (let y = 0; y < 200; y++) {
            const i = y * 4;
            const d = Math.sqrt(
              (imgL[i] - imgR[i]) ** 2 +
              (imgL[i+1] - imgR[i+1]) ** 2 +
              (imgL[i+2] - imgR[i+2]) ** 2
            );
            sum += d;
            if (d > peak) {
              peak = d;
              peakY = y + 20;
            }
          }
          return {
            cam: ${cam},
            mean: +(sum / 200).toFixed(2),
            peak: +peak.toFixed(2),
            peakY
          };
        })()
      `);

      const pass = evalResult.peak <= 80.0;
      console.log(
        `  ${pass ? '✓' : '✗'} cameraX = ${String(cam).padStart(11)} -> mean ΔE: ${String(evalResult.mean).padStart(5)}, peak ΔE: ${String(evalResult.peak).padStart(5)} at y=${evalResult.peakY} [${pass ? 'PASS' : 'FAIL'}]`
      );
      results.cameraCoords.push({ ...evalResult, pass });
    }

    // -------------------------------------------------------------------------
    // TEST SUITE 2: 1920px Offscreen Buffer Seam Continuity (Columns 0 vs 1919)
    // Testing Layer 1 (Horizon) and Layer 2 (Midground) across all 10 municipalities
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 2: 1920px Offscreen Buffer Seam Continuity (Col 0 vs Col 1919) ---');
    for (let w = 0; w < 10; w++) {
      for (const rev of [false, true]) {
        const bufferResult = await cdp.evaluate(`
          (() => {
            const pano = getOrBuildPanoBuffers(${w}, ${rev}, false);
            
            // Horizon buffer (x=0 vs x=1919)
            const hCtx = pano.horizonBuffer.getContext('2d');
            const h0 = hCtx.getImageData(0, 0, 1, 540).data;
            const h1919 = hCtx.getImageData(1919, 0, 1, 540).data;
            let hPeak = 0, hPeakY = 0, hSum = 0;
            for (let y = 0; y < 540; y++) {
              const i = y * 4;
              const d = Math.sqrt((h0[i]-h1919[i])**2 + (h0[i+1]-h1919[i+1])**2 + (h0[i+2]-h1919[i+2])**2);
              hSum += d;
              if (d > hPeak) { hPeak = d; hPeakY = y; }
            }

            // Midground buffer (x=0 vs x=1919)
            const mCtx = pano.midgroundBuffer.getContext('2d');
            const m0 = mCtx.getImageData(0, 0, 1, 540).data;
            const m1919 = mCtx.getImageData(1919, 0, 1, 540).data;
            let mPeak = 0, mPeakY = 0, mSum = 0;
            for (let y = 0; y < 540; y++) {
              const i = y * 4;
              const d = Math.sqrt((m0[i]-m1919[i])**2 + (m0[i+1]-m1919[i+1])**2 + (m0[i+2]-m1919[i+2])**2);
              mSum += d;
              if (d > mPeak) { mPeak = d; mPeakY = y; }
            }

            return {
              world: ${w},
              rev: ${rev},
              horizon: { mean: +(hSum/540).toFixed(2), peak: +hPeak.toFixed(2), peakY: hPeakY },
              midground: { mean: +(mSum/540).toFixed(2), peak: +mPeak.toFixed(2), peakY: mPeakY }
            };
          })()
        `);
        const hPass = bufferResult.horizon.peak <= 80.0;
        console.log(
          `  ${hPass ? '✓' : '✗'} World ${w} (${rev ? 'Revés ' : 'Normal'}) Horizon -> peak ΔE: ${String(bufferResult.horizon.peak).padStart(5)} at y=${bufferResult.horizon.peakY} (mean: ${bufferResult.horizon.mean}) [${hPass ? 'PASS' : 'FAIL'}]`
        );
        results.bufferSeams.push(bufferResult);
      }
    }

    // -------------------------------------------------------------------------
    // TEST SUITE 3: 300-Frame Real-Time Drift Simulation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 3: 300-Frame Drift Simulation (Zero Spikes > 80 across Col 0 & 959) ---');
    const drift300Result = await cdp.evaluate(`
      (() => {
        loadStage(0, 0, false);
        isUpsideDown = false;
        cameraX = 0;
        const c = document.getElementById('gameCanvas');
        const ctx = c.getContext('2d');
        const spikes = [];
        let maxOverallDeltaE = 0;
        let maxFrame = 0;
        let maxFrameY = 0;

        for (let f = 0; f < 300; f++) {
          frameCount++;
          update();
          render();
          const imgL = ctx.getImageData(0, 20, 1, 200).data;
          const imgR = ctx.getImageData(959, 20, 1, 200).data;
          for (let y = 0; y < 200; y++) {
            const i = y * 4;
            const d = Math.sqrt(
              (imgL[i] - imgR[i]) ** 2 +
              (imgL[i+1] - imgR[i+1]) ** 2 +
              (imgL[i+2] - imgR[i+2]) ** 2
            );
            if (d > maxOverallDeltaE) {
              maxOverallDeltaE = d;
              maxFrame = f;
              maxFrameY = y + 20;
            }
            if (d > 80.0) {
              spikes.push({ frame: f, y: y + 20, deltaE: +d.toFixed(2) });
              break;
            }
          }
        }
        return {
          framesTested: 300,
          spikesCount: spikes.length,
          spikesSample: spikes.slice(0, 5),
          maxDeltaE: +maxOverallDeltaE.toFixed(2),
          maxFrame,
          maxFrameY
        };
      })()
    `);
    console.log(`  Frames tested: ${drift300Result.framesTested}`);
    console.log(`  Spikes > 80 count: ${drift300Result.spikesCount}`);
    console.log(`  Max overall ΔE encountered: ${drift300Result.maxDeltaE} at frame ${drift300Result.maxFrame}, y=${drift300Result.maxFrameY}`);
    console.log(`  300-Frame Drift Result: ${drift300Result.spikesCount === 0 ? '✓ PASS' : '✗ FAIL'}`);
    results.drift300 = drift300Result;

    // -------------------------------------------------------------------------
    // TEST SUITE 4: Extended 600-Frame Torture Drift Simulation
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 4: Extended 600-Frame Torture Drift Simulation ---');
    const drift600Result = await cdp.evaluate(`
      (() => {
        loadStage(0, 0, false);
        isUpsideDown = false;
        cameraX = 0;
        const c = document.getElementById('gameCanvas');
        const ctx = c.getContext('2d');
        const spikes = [];
        let maxOverallDeltaE = 0;
        let maxFrame = 0;
        let maxFrameY = 0;

        for (let f = 0; f < 600; f++) {
          frameCount++;
          update();
          render();
          const imgL = ctx.getImageData(0, 20, 1, 200).data;
          const imgR = ctx.getImageData(959, 20, 1, 200).data;
          for (let y = 0; y < 200; y++) {
            const i = y * 4;
            const d = Math.sqrt(
              (imgL[i] - imgR[i]) ** 2 +
              (imgL[i+1] - imgR[i+1]) ** 2 +
              (imgL[i+2] - imgR[i+2]) ** 2
            );
            if (d > maxOverallDeltaE) {
              maxOverallDeltaE = d;
              maxFrame = f;
              maxFrameY = y + 20;
            }
            if (d > 80.0) {
              spikes.push({ frame: f, y: y + 20, deltaE: +d.toFixed(2) });
              break;
            }
          }
        }
        return {
          framesTested: 600,
          spikesCount: spikes.length,
          spikesSample: spikes.slice(0, 5),
          maxDeltaE: +maxOverallDeltaE.toFixed(2),
          maxFrame,
          maxFrameY
        };
      })()
    `);
    console.log(`  Frames tested: ${drift600Result.framesTested}`);
    console.log(`  Spikes > 80 count: ${drift600Result.spikesCount}`);
    console.log(`  Max overall ΔE encountered: ${drift600Result.maxDeltaE} at frame ${drift600Result.maxFrame}, y=${drift600Result.maxFrameY}`);
    console.log(`  600-Frame Drift Result: ${drift600Result.spikesCount === 0 ? '✓ PASS' : '✗ FAIL'}`);
    results.drift600 = drift600Result;

    // -------------------------------------------------------------------------
    // TEST SUITE 5: Extended 1200-Frame Endurance Drift Simulation (20 seconds)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST SUITE 5: Extended 1200-Frame Endurance Drift Simulation (20s @ 60 FPS) ---');
    const drift1200Result = await cdp.evaluate(`
      (() => {
        loadStage(0, 0, false);
        isUpsideDown = false;
        cameraX = 0;
        const c = document.getElementById('gameCanvas');
        const ctx = c.getContext('2d');
        const spikes = [];
        let maxOverallDeltaE = 0;
        let maxFrame = 0;
        let maxFrameY = 0;

        for (let f = 0; f < 1200; f++) {
          frameCount++;
          update();
          render();
          const imgL = ctx.getImageData(0, 20, 1, 200).data;
          const imgR = ctx.getImageData(959, 20, 1, 200).data;
          for (let y = 0; y < 200; y++) {
            const i = y * 4;
            const d = Math.sqrt(
              (imgL[i] - imgR[i]) ** 2 +
              (imgL[i+1] - imgR[i+1]) ** 2 +
              (imgL[i+2] - imgR[i+2]) ** 2
            );
            if (d > maxOverallDeltaE) {
              maxOverallDeltaE = d;
              maxFrame = f;
              maxFrameY = y + 20;
            }
            if (d > 80.0) {
              spikes.push({ frame: f, y: y + 20, deltaE: +d.toFixed(2) });
              break;
            }
          }
        }
        return {
          framesTested: 1200,
          spikesCount: spikes.length,
          spikesSample: spikes.slice(0, 5),
          maxDeltaE: +maxOverallDeltaE.toFixed(2),
          maxFrame,
          maxFrameY
        };
      })()
    `);
    console.log(`  Frames tested: ${drift1200Result.framesTested}`);
    console.log(`  Spikes > 80 count: ${drift1200Result.spikesCount}`);
    console.log(`  Max overall ΔE encountered: ${drift1200Result.maxDeltaE} at frame ${drift1200Result.maxFrame}, y=${drift1200Result.maxFrameY}`);
    console.log(`  1200-Frame Drift Result: ${drift1200Result.spikesCount === 0 ? '✓ PASS' : '✗ FAIL'}`);
    results.drift1200 = drift1200Result;

    console.log('\n================================================================================');
    console.log('✅ EMPIRICAL STRESS HARNESS COMPLETED');
    console.log('================================================================================');

  } catch (err) {
    console.error('Fatal harness error:', err);
    process.exitCode = 1;
  } finally {
    cdp.kill();
  }
}

runEmpiricalHarness();
