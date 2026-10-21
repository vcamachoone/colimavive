/**
 * e2e/stress_challenger2.js
 * Empirical Performance, State, and Memory Stress Harness
 * Challenger 2 (Performance & State Challenger) — Milestone 1
 *
 * Evaluation Criteria:
 * 1. 60 FPS Frame Time Stability (300+ frames, mean FPS >= 58.5, stdDev <= 1.0ms, 0 drops)
 * 2. Rapid Stage Switching across 10 municipalities (50 consecutive switches, CV_PANO_CACHE bounds <= 8)
 * 3. Rapid Dimension Switching (in/out of Mundo del Revés under active particle load)
 * 4. Error Collection (0 console errors, 0 runtime exceptions)
 */

const { CdpSession } = require('./cdp');

const STRESS_PORT = 9496;
const TARGET_URL = 'http://localhost:8085';

async function runEmpiricalStressSuite() {
  console.log('='.repeat(80));
  console.log('🔥 COLIMA VIVO · CHALLENGER 2 EMPIRICAL STRESS TEST HARNESS');
  console.log('='.repeat(80));

  const cdp = new CdpSession({ port: STRESS_PORT, url: TARGET_URL });
  const results = {
    fpsStability: null,
    stageSwitching: null,
    dimensionSwitching: null,
    errorAudit: null,
    summary: { passed: 0, failed: 0, total: 0 }
  };

  try {
    console.log(`\n🚀 Launching dedicated headless Chrome on port ${STRESS_PORT}...`);
    await cdp.launch();
    console.log(`🌐 Navigating to ${TARGET_URL}...`);
    await cdp.navigate();
    console.log('✅ Application loaded successfully.\n');

    // =========================================================================
    // 1. 60 FPS FRAME TIME STABILITY (300+ Frames)
    // =========================================================================
    console.log('-'.repeat(80));
    console.log('⚡ STRESS TEST 1: 60 FPS Frame Time Stability & Jitter Analysis (500 Frames)');
    console.log('-'.repeat(80));

    // Ensure game is actively playing
    await cdp.evaluate(`
      (() => {
        loadStage(0, 0, false);
        gameState = 'PLAYING';
      })()
    `);

    // Warm up 30 frames
    await cdp.evaluate(`
      new Promise(resolve => {
        let count = 0;
        function w() {
          if (++count >= 30) resolve();
          else requestAnimationFrame(w);
        }
        requestAnimationFrame(w);
      })
    `);

    // Sample 500 consecutive frame times
    const sampleCount = 500;
    const rawDeltas = await cdp.evaluate(`
      new Promise(resolve => {
        const deltas = [];
        let count = 0;
        let last = performance.now();
        function tick(now) {
          deltas.push(now - last);
          last = now;
          count++;
          if (count >= ${sampleCount}) {
            resolve(deltas);
          } else {
            requestAnimationFrame(tick);
          }
        }
        requestAnimationFrame(tick);
      })
    `);

    // Exclude first delta (timestamp delta from previous rAF)
    const deltas = rawDeltas.slice(1);
    const totalTimeMs = deltas.reduce((a, b) => a + b, 0);
    const meanDeltaMs = totalTimeMs / deltas.length;
    const meanFps = 1000 / meanDeltaMs;
    const variance = deltas.reduce((sum, d) => sum + Math.pow(d - meanDeltaMs, 2), 0) / deltas.length;
    const stdDevMs = Math.sqrt(variance);

    let droppedFrames = 0;
    let hitchesAbove20ms = 0;
    let minDelta = Infinity;
    let maxDelta = -Infinity;

    for (const dt of deltas) {
      if (dt > 25.0) droppedFrames++;
      if (dt > 20.0) hitchesAbove20ms++;
      if (dt < minDelta) minDelta = dt;
      if (dt > maxDelta) maxDelta = dt;
    }

    const fpsPass = meanFps >= 58.5 && stdDevMs <= 1.0 && droppedFrames === 0;

    results.fpsStability = {
      pass: fpsPass,
      framesSampled: deltas.length,
      meanFps: Number(meanFps.toFixed(2)),
      meanDeltaMs: Number(meanDeltaMs.toFixed(3)),
      stdDevMs: Number(stdDevMs.toFixed(3)),
      minDeltaMs: Number(minDelta.toFixed(3)),
      maxDeltaMs: Number(maxDelta.toFixed(3)),
      droppedFrames,
      hitchesAbove20ms,
      targetCriteria: {
        minMeanFps: 58.5,
        maxStdDevMs: 1.0,
        maxDroppedFrames: 0
      }
    };

    console.log(`  Frames Sampled:     ${deltas.length}`);
    console.log(`  Mean FPS:           ${results.fpsStability.meanFps} (Target >= 58.5)`);
    console.log(`  Mean Frame Delta:   ${results.fpsStability.meanDeltaMs} ms`);
    console.log(`  Frame Time StdDev:  ${results.fpsStability.stdDevMs} ms (Target <= 1.0 ms)`);
    console.log(`  Min / Max Delta:    ${results.fpsStability.minDeltaMs} ms / ${results.fpsStability.maxDeltaMs} ms`);
    console.log(`  Dropped Frames:     ${droppedFrames} (Target: 0)`);
    console.log(`  Hitches (>20ms):    ${hitchesAbove20ms}`);
    console.log(`  Verdict:            ${fpsPass ? '✅ PASS' : '❌ FAIL'}`);

    if (fpsPass) results.summary.passed++; else results.summary.failed++;
    results.summary.total++;

    // =========================================================================
    // 2. RAPID STAGE SWITCHING ACROSS ALL 10 MUNICIPALITIES (50 SWITCHES)
    // =========================================================================
    console.log('\n' + '-'.repeat(80));
    console.log('🔄 STRESS TEST 2: Rapid Stage Switching & Memory Bounds (50 Switches)');
    console.log('-'.repeat(80));

    const switchStressResult = await cdp.evaluate(`
      (() => {
        const history = [];
        let maxCacheSize = 0;
        let anyInvalidBuffer = false;
        let errors = [];

        for (let i = 0; i < 50; i++) {
          const worldIdx = i % 10;
          const subIdx = (Math.floor(i / 10) + i) % 3;
          const isRev = (i % 4 === 1 || i % 4 === 2);

          try {
            loadStage(worldIdx, subIdx, isRev);
            // Simulate 2 frames of background drawing
            cameraX = (i * 120);
            drawBackground();

            // Verify cache state
            const cacheSize = CV_PANO_CACHE.size;
            if (cacheSize > maxCacheSize) maxCacheSize = cacheSize;

            // Check cache bounds invariant: must never exceed 8
            if (cacheSize > 8) {
              errors.push(\`Iteration \${i}: CV_PANO_CACHE size exceeded 8 (size=\${cacheSize})\`);
            }

            // Verify buffer validity for each entry in cache
            for (const [key, val] of CV_PANO_CACHE.entries()) {
              if (!val.skyBuffer || !val.horizonBuffer || !val.midgroundBuffer) {
                anyInvalidBuffer = true;
                errors.push(\`Iteration \${i}: Null or missing buffer in key \${key}\`);
              }
              if (val.skyBuffer.width !== 960 || val.skyBuffer.height !== 540) {
                errors.push(\`Iteration \${i}: Invalid skyBuffer dimensions \${val.skyBuffer.width}x\${val.skyBuffer.height}\`);
              }
              if (val.horizonBuffer.width !== 1920 || val.horizonBuffer.height !== 540) {
                errors.push(\`Iteration \${i}: Invalid horizonBuffer dimensions \${val.horizonBuffer.width}x\${val.horizonBuffer.height}\`);
              }
              if (val.midgroundBuffer.width !== 1920 || val.midgroundBuffer.height !== 540) {
                errors.push(\`Iteration \${i}: Invalid midgroundBuffer dimensions \${val.midgroundBuffer.width}x\${val.midgroundBuffer.height}\`);
              }
            }

            // Track sample points
            if (i % 10 === 0 || i === 49) {
              history.push({
                iteration: i,
                worldIdx,
                subIdx,
                isRev,
                cacheSize,
                totalKeys: Array.from(CV_PANO_CACHE.keys())
              });
            }
          } catch (e) {
            errors.push(\`Iteration \${i} exception: \${e.message}\`);
          }
        }

        return {
          totalSwitches: 50,
          maxCacheSize,
          finalCacheSize: CV_PANO_CACHE.size,
          anyInvalidBuffer,
          errors,
          history
        };
      })()
    `);

    const stagePass = switchStressResult.errors.length === 0 &&
                      switchStressResult.maxCacheSize <= 8 &&
                      !switchStressResult.anyInvalidBuffer;

    results.stageSwitching = {
      pass: stagePass,
      ...switchStressResult
    };

    console.log(`  Total Switches:     ${switchStressResult.totalSwitches}`);
    console.log(`  Max Cache Size:     ${switchStressResult.maxCacheSize} / 8 (Bound: <= 8)`);
    console.log(`  Final Cache Size:   ${switchStressResult.finalCacheSize}`);
    console.log(`  Buffer Validation:  ${switchStressResult.anyInvalidBuffer ? '❌ INVALID' : '✅ ALL BUFFERS VALID'}`);
    console.log(`  Errors / Anomalies: ${switchStressResult.errors.length}`);
    if (switchStressResult.errors.length > 0) {
      switchStressResult.errors.forEach(e => console.log(`    ↳ ${e}`));
    }
    console.log(`  Sample Checkpoints:`);
    switchStressResult.history.forEach(h => {
      console.log(`    Step ${h.iteration}: World ${h.worldIdx}-${h.subIdx + 1} (rev=${h.isRev}) -> Cache Size: ${h.cacheSize}`);
    });
    console.log(`  Verdict:            ${stagePass ? '✅ PASS' : '❌ FAIL'}`);

    if (stagePass) results.summary.passed++; else results.summary.failed++;
    results.summary.total++;

    // =========================================================================
    // 3. RAPID DIMENSION SWITCHING UNDER ACTIVE PARTICLE LOAD
    // =========================================================================
    console.log('\n' + '-'.repeat(80));
    console.log('🌌 STRESS TEST 3: Rapid Dimension Switching Under Active Particle Load (60 Toggles)');
    console.log('-'.repeat(80));

    const dimStressResult = await cdp.evaluate(`
      (() => {
        loadStage(0, 0, false);
        gameState = 'PLAYING';
        const errors = [];
        const times = [];
        let maxParticleCount = 0;

        for (let cycle = 0; cycle < 60; cycle++) {
          const targetRev = (cycle % 2 === 0);
          try {
            const t0 = performance.now();
            isUpsideDown = targetRev;

            // Render 3 consecutive frames in this dimension state
            for (let f = 0; f < 3; f++) {
              frameCount++;
              cameraX += 4;
              drawBackground();
              drawWeatherLayer();
            }
            const dt = performance.now() - t0;
            times.push(dt / 3);

            // Check particle count bounds
            const wLen = weatherParticles ? weatherParticles.length : 0;
            if (wLen > maxParticleCount) maxParticleCount = wLen;
            if (wLen !== 42) {
              errors.push(\`Cycle \${cycle}: weatherParticles count leaked or altered (\${wLen} !== 42)\`);
            }
          } catch (e) {
            errors.push(\`Cycle \${cycle} exception: \${e.message}\`);
          }
        }

        // Clean up state
        isUpsideDown = false;
        drawBackground();

        const avgRenderMs = times.reduce((a, b) => a + b, 0) / times.length;
        const maxRenderMs = Math.max(...times);

        return {
          totalCycles: 60,
          avgRenderMs: Number(avgRenderMs.toFixed(3)),
          maxRenderMs: Number(maxRenderMs.toFixed(3)),
          maxParticleCount,
          finalWeatherParticles: weatherParticles ? weatherParticles.length : 0,
          finalUpsideDown: isUpsideDown,
          errors
        };
      })()
    `);

    const dimPass = dimStressResult.errors.length === 0 &&
                    dimStressResult.finalWeatherParticles === 42 &&
                    dimStressResult.finalUpsideDown === false &&
                    dimStressResult.avgRenderMs <= 3.0;

    results.dimensionSwitching = {
      pass: dimPass,
      ...dimStressResult
    };

    console.log(`  Total Inversion Cycles:  ${dimStressResult.totalCycles}`);
    console.log(`  Avg Draw Execution:      ${dimStressResult.avgRenderMs} ms/frame (Budget <= 3.0ms)`);
    console.log(`  Peak Draw Execution:     ${dimStressResult.maxRenderMs} ms`);
    console.log(`  Weather Particle Count:  ${dimStressResult.maxParticleCount} (Constant 42)`);
    console.log(`  Restored Cleanly:        ${dimStressResult.finalUpsideDown === false ? 'YES' : 'NO'}`);
    console.log(`  Errors / Leaks:          ${dimStressResult.errors.length}`);
    if (dimStressResult.errors.length > 0) {
      dimStressResult.errors.forEach(e => console.log(`    ↳ ${e}`));
    }
    console.log(`  Verdict:                 ${dimPass ? '✅ PASS' : '❌ FAIL'}`);

    if (dimPass) results.summary.passed++; else results.summary.failed++;
    results.summary.total++;

    // =========================================================================
    // 4. COMPREHENSIVE ERROR COLLECTION
    // =========================================================================
    console.log('\n' + '-'.repeat(80));
    console.log('🛡️  STRESS TEST 4: Zero Console Errors and Exceptions Audit');
    console.log('-'.repeat(80));

    const bootWarning = await cdp.evaluate(`
      (() => {
        const el = document.getElementById('cv-boot-warning');
        if (!el || el.hidden) return null;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return null;
        return el.textContent.trim().length > 0 ? el.textContent.trim() : null;
      })()
    `);

    const errorLogs = (cdp.consoleLogs || []).filter(l => l.type === 'error');
    const exceptions = cdp.exceptions || [];
    const networkErrors = cdp.networkErrors || [];

    const errorPass = exceptions.length === 0 && errorLogs.length === 0 && !bootWarning;

    results.errorAudit = {
      pass: errorPass,
      exceptionsCount: exceptions.length,
      errorLogsCount: errorLogs.length,
      networkErrorsCount: networkErrors.length,
      bootWarning: bootWarning || 'None',
      exceptions,
      errorLogs,
      networkErrors
    };

    console.log(`  Exceptions Captured:     ${exceptions.length}`);
    console.log(`  Console Error Logs:      ${errorLogs.length}`);
    console.log(`  Network Load Errors:     ${networkErrors.length}`);
    console.log(`  DOM Boot Warning State:  ${bootWarning || 'None (Clean)'}`);
    console.log(`  Verdict:                 ${errorPass ? '✅ PASS' : '❌ FAIL'}`);

    if (errorPass) results.summary.passed++; else results.summary.failed++;
    results.summary.total++;

    // =========================================================================
    // FINAL VERDICT
    // =========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('🏆 CHALLENGER 2 STRESS HARNESS FINAL VERDICT');
    console.log('='.repeat(80));
    console.log(`Total Stress Suites: ${results.summary.total}`);
    console.log(`Passed:              ${results.summary.passed}`);
    console.log(`Failed:              ${results.summary.failed}`);
    console.log(`Overall Status:      ${results.summary.failed === 0 ? '🟢 ALL STRESS TESTS PASSED' : '🔴 STRESS DEFECTS DETECTED'}`);
    console.log('='.repeat(80));

    return results;
  } finally {
    cdp.kill();
  }
}

if (require.main === module) {
  runEmpiricalStressSuite()
    .then(res => {
      process.exit(res.summary.failed === 0 ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal stress harness exception:', err);
      process.exit(1);
    });
}

module.exports = { runEmpiricalStressSuite };
