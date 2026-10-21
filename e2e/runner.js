#!/usr/bin/env node
/**
 * e2e/runner.js
 * Master E2E Test Suite Runner for Colima Vivo.
 * Zero-dependency, requirement-driven, 4-tier testing framework.
 *
 * Usage:
 *   node e2e/runner.js
 *   node e2e/runner.js --tier=1
 *   node e2e/runner.js --tier=1,2
 *   node e2e/runner.js --filter=F1
 *   node e2e/runner.js --port=9498 --url=http://localhost:8085
 */

const { CdpSession } = require('./cdp');
const { verifyFpsStability, verifyConsoleErrors, verifyParallaxSeamContinuity, verifyCryptographicParity } = require('./pillars');
const tier1 = require('./tier1_feature_coverage');
const tier2 = require('./tier2_boundary_corner');
const tier3 = require('./tier3_combinations');
const tier4 = require('./tier4_scenarios');

// Parse CLI arguments
const args = process.argv.slice(2);
const options = {
  tiers: [1, 2, 3, 4],
  filter: null,
  port: 9494,
  url: 'http://localhost:8085'
};

for (const arg of args) {
  if (arg.startsWith('--tier=')) {
    options.tiers = arg.replace('--tier=', '').split(',').map(Number);
  } else if (arg.startsWith('--filter=')) {
    options.filter = new RegExp(arg.replace('--filter=', ''), 'i');
  } else if (arg.startsWith('--port=')) {
    options.port = parseInt(arg.replace('--port=', ''), 10);
  } else if (arg.startsWith('--url=')) {
    options.url = arg.replace('--url=', '');
  }
}

async function main() {
  console.log('================================================================================');
  console.log('🌴 COLIMA VIVO · AUTOMATED E2E TEST SUITE RUNNER');
  console.log(`Target URL: ${options.url}`);
  console.log(`CDP Port:   ${options.port}`);
  console.log(`Tiers:      ${options.tiers.join(', ')}`);
  if (options.filter) console.log(`Filter:     ${options.filter}`);
  console.log('================================================================================\n');

  const cdp = new CdpSession({ port: options.port, url: options.url });

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const tierSummary = {};
  const failures = [];

  const startTime = Date.now();

  try {
    console.log('🚀 Launching Google Chrome Headless via CDP...');
    await cdp.launch();
    console.log('🌐 Navigating to game canvas at', options.url);
    await cdp.navigate(options.url);
    console.log('✅ Canvas engine initialized and loaded.\n');

    // Assemble test list
    const suites = [];
    if (options.tiers.includes(1)) suites.push({ name: 'Tier 1: Feature Coverage (50 Tests, F1-F10)', items: tier1.tests, tier: 1 });
    if (options.tiers.includes(2)) suites.push({ name: 'Tier 2: Boundary & Corner Cases (50 Tests, F1-F10)', items: tier2.tests, tier: 2 });
    if (options.tiers.includes(3)) suites.push({ name: 'Tier 3: Cross-Feature Combinations (12 Tests)', items: tier3.tests, tier: 3 });
    if (options.tiers.includes(4)) suites.push({ name: 'Tier 4: Real-World Application Scenarios (5 Scenarios)', items: tier4.scenarios, tier: 4 });

    for (const suite of suites) {
      console.log(`\n--------------------------------------------------------------------------------`);
      console.log(`📦 ${suite.name}`);
      console.log(`--------------------------------------------------------------------------------`);

      tierSummary[suite.tier] = { total: 0, passed: 0, failed: 0 };

      for (const test of suite.items) {
        if (options.filter && !options.filter.test(test.id) && !options.filter.test(test.name)) {
          continue;
        }

        totalTests++;
        tierSummary[suite.tier].total++;

        const testStart = Date.now();
        let result = { pass: false, message: 'No result returned' };

        try {
          result = await test.run(cdp);
        } catch (err) {
          result = { pass: false, message: `Uncaught test exception: ${err.message}` };
        }

        const duration = Date.now() - testStart;

        if (result.pass) {
          passedTests++;
          tierSummary[suite.tier].passed++;
          console.log(`  ✓ [${test.id}] ${test.name} (${duration}ms)`);
        } else {
          failedTests++;
          tierSummary[suite.tier].failed++;
          console.log(`  ✗ [${test.id}] ${test.name} (${duration}ms)`);
          console.log(`    ↳ FAILURE: ${result.message}`);
          failures.push({
            id: test.id,
            name: test.name,
            tier: suite.tier,
            message: result.message
          });
        }
      }
    }

    // Validation Pillars Direct Audit
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log('🏛️  FOUR VALIDATION PILLARS AUDIT');
    console.log(`--------------------------------------------------------------------------------`);

    // Settle engine state before measuring validation pillars
    await cdp.evaluate(`
      new Promise(resolve => {
        if (typeof transitionDir !== 'undefined' && transitionDir !== 0) {
          transitionDir = 0;
          transitionAlpha = 0;
        }
        loadStage(0, 0, false);
        requestAnimationFrame(resolve);
      })
    `);

    // Pillar 1: 60 FPS Stability
    const p1 = await verifyFpsStability(cdp, 180);
    console.log(`  Pillar 1: 60 FPS Stability: ${p1.pass ? '✓ PASS' : '✗ FAIL'} (mean: ${p1.meanFps} FPS, stdDev: ${p1.stdDevMs}ms, dropped: ${p1.droppedFrames})`);

    // Pillar 2: 0 Console Errors
    const p2 = await verifyConsoleErrors(cdp);
    console.log(`  Pillar 2: 0 Console Errors: ${p2.pass ? '✓ PASS' : '✗ FAIL'} (exceptions: ${p2.exceptions.length}, errors: ${p2.errorLogs.length}, bootWarn: ${p2.bootWarning || 'none'})`);

    // Pillar 3: Visual Seam Detection
    const p3 = await verifyParallaxSeamContinuity(cdp, {
      xLeft: 0,
      xRight: 959,
      yStart: 20,
      height: 200,
      maxMeanDeltaE: 35.0,
      maxPeakDeltaE: 80.0
    });
    console.log(`  Pillar 3: Visual Seam Continuity: ${p3.pass ? '✓ PASS' : '✗ FAIL'} (mean Delta-E: ${p3.meanDeltaE}, peak Delta-E: ${p3.peakDeltaE} at y=${p3.peakY})`);

    // Pillar 4: 100% Cryptographic Parity
    const p4 = verifyCryptographicParity();
    console.log(`  Pillar 4: 100% Dual File Parity:  ${p4.pass ? '✓ PASS' : '✗ FAIL'} (SHA-256 match, length: ${p4.byteLengthIndex} bytes)`);

    const pillarsPassed = p1.pass && p2.pass && p3.pass && p4.pass;

    // Report Summary
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n================================================================================');
    console.log('📊 FINAL TEST SUITE EXECUTION SUMMARY');
    console.log('================================================================================');
    console.log(`Total Tests Executed: ${totalTests}`);
    console.log(`Total Passed:         ${passedTests}`);
    console.log(`Total Failed:         ${failedTests}`);
    console.log(`Total Duration:       ${totalDuration}s\n`);

    console.log('Breakdown by Tier:');
    for (const [tier, stat] of Object.entries(tierSummary)) {
      console.log(`  Tier ${tier}: ${stat.passed} / ${stat.total} passed (${stat.failed} failed)`);
    }

    if (failures.length > 0) {
      console.log('\n⚠️  FAILURES TO ESCALATE:');
      failures.forEach((f, idx) => {
        console.log(`  ${idx + 1}. [${f.id}] (Tier ${f.tier}) ${f.name}`);
        console.log(`     Error: ${f.message}`);
      });
    }

    console.log('================================================================================\n');

    const exitCode = (failedTests > 0 || !pillarsPassed) ? 1 : 0;
    return exitCode;

  } finally {
    cdp.kill();
  }
}

main().then(code => {
  process.exit(code || 0);
}).catch(err => {
  console.error('[RUNNER] Fatal error:', err);
  process.exit(1);
});
