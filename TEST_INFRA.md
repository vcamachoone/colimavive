# Colima Vivo — E2E Test Infrastructure & Testing Architecture

## 1. Test Philosophy & Framework Overview

The Colima Vivo automated testing framework is built according to a requirement-driven, opaque-box E2E test methodology designed to validate retro 16-bit canvas gameplay, multi-layer parallax scrolling, 60 FPS frame stability, visual aesthetics, and cryptographic file parity.

### Zero-Dependency Architecture
The test harness is located under `/Volumes/DISCO SSD/dev/Colimavive/e2e/` and relies strictly on:
- **Node.js Built-in Modules**: `http`, `child_process`, `crypto`, `fs`, `path`.
- **Native WebSocket**: Node.js global `WebSocket` client (Node 22+ / 24+).
- **Google Chrome Headless**: Direct Chrome DevTools Protocol (CDP) session (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` via `--headless=new --remote-debugging-port=9494`).
- **No external npm dependencies**: Eliminates framework bloat, build steps, and vulnerability vectors.

---

## 2. The Four Validation Pillars

Every test run verifies the four core quality pillars demanded by `ORIGINAL_REQUEST.md` and `PROJECT.md`:

| Pillar | Metric / Invariant | Threshold / Pass Criteria | Verification Method |
|---|---|---|---|
| **Pillar 1: 60 FPS Stability** | Mean FPS & Frametime Jitter | `meanFps >= 58.5`, `stdDev <= 3.5ms`, `droppedFrames <= 2` over 180 frames | `performance.now()` delta sampling via `requestAnimationFrame` |
| **Pillar 2: Zero Console Errors** | Runtime Exceptions & Console Errors | `exceptions === 0`, `errorLogs === 0`, no `#cv-boot-warning` element | CDP `Runtime.exceptionThrown`, `Runtime.consoleAPICalled`, `Log.entryAdded` |
| **Pillar 3: Visual Seam Detection** | Euclidean RGB Delta-E across wrap seam | `meanDeltaE <= 35.0`, `peakDeltaE <= 80.0` across wrap boundaries | Direct canvas `ctx.getImageData` pixel column sampling |
| **Pillar 4: Dual File Parity** | 100% Byte-for-byte synchronization | SHA-256 hash match, byte length match, line count match | Cryptographic SHA-256 hash comparison of `index.html` and `Colima_Vivo_1_0_Senaletica_Postales_Corregidas.html` |

### Seam Continuity Formula (Pillar 3)
Continuity across horizontal wrap boundaries ($x = 0$ and $x = W$) is verified using Euclidean color distance between adjacent vertical pixel columns:
$$\Delta E = \sqrt{(R_1 - R_2)^2 + (G_1 - G_2)^2 + (B_1 - B_2)^2}$$
A smooth pixel art gradient or wrapped horizon maintains $\Delta E_{\text{mean}} \le 35.0$, flagging abrupt vertical cuts or visual tears.

---

## 3. Feature Inventory & Test Mapping (Tiers 1–3)

All 10 features (F1 through F10) defined in `PROJECT.md` are covered across the 4 tiers:

| # | Feature | Scope / Description | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Source |
|---|---|---|:---:|:---:|:---:|---|
| **F1** | 16-Bit Bayer Dithered Sky System | 4-band palettes, Bayer ordered dithering, celestial bodies, drifting clouds | 5 | 5 | T3.1, T3.11 | `PROJECT.md § F1`, `R1` |
| **F2** | Continuous Volcano & Coastal Horizon Engine | 1920px seamless horizon buffer, twin volcanoes, fumarole particles, coastlines | 5 | 5 | T3.2, T3.6, T3.11 | `PROJECT.md § F2`, `R1, R2` |
| **F3** | Unified 10-Municipality Midground Panoramas | 16-bit retro pixel art panoramas for all 10 municipalities (30 levels) | 5 | 5 | T3.3, T3.7, T3.11 | `PROJECT.md § F3`, `R1, R2` |
| **F4** | True-Parallax Architectural Landmarks | Monuments placed as midground parallax features at 0.35x speed | 5 | 5 | T3.4, T3.8, T3.11 | `PROJECT.md § F4`, `R1, R2` |
| **F5** | Foreground Contrast & Playability Tuning | Saturation attenuation (-25%) and luminance contrast separation | 5 | 5 | T3.4, T3.9 | `PROJECT.md § F5`, `R1, AC` |
| **F6** | Seamless Horizontal Parallax Looping Engine | Mathematical modulo wrapping with double-blit seam coverage | 5 | 5 | T3.2, T3.7, T3.10 | `PROJECT.md § F6`, `R2, AC` |
| **F7** | Mundo del Revés Dynamic Palette Transform | Inverted obsidian/scarlet palette under `isRev === true` | 5 | 5 | T3.1, T3.5, T3.6, T3.9, T3.12 | `PROJECT.md § F7`, `R3` |
| **F8** | Mundo del Revés Volcanic Ash & Atmosphere | Falling ash, rising embers, red lightning, and bioluminescent spores | 5 | 5 | T3.5, T3.12 | `PROJECT.md § F8`, `R3, AC` |
| **F9** | Offscreen Canvas Caching & 60 FPS Optimization | Pre-rendered canvas buffers ensuring locked 60 FPS without path recomputation | 5 | 5 | T3.3, T3.8, T3.10 | `PROJECT.md § F9`, `R4, AC` |
| **F10**| Dual File Parity & Synchronization | 100% cryptographic parity between `index.html` and audited duplicate | 5 | 5 | T3.12 | `PROJECT.md § F10`, `R4, AC` |
| **TOTAL** | | | **50** | **50** | **12** | |

---

## 4. Real-World Application Scenarios (Tier 4)

Tier 4 exercises complete gameplay loops, state machines, and stress transitions:

| # | Scenario Name | Features Exercised | Complexity | Description |
|---|---|---|:---:|---|
| **T4.1** | The Grand Colima Tour (10-Municipality Journey) | F1, F2, F3, F4, F5, F6, F9 | High | Sequentially traverses all 10 municipalities (World 0 to 9), walking player through each level, verifying midground loading, zero console errors, and 60 FPS performance. |
| **T4.2** | High-Velocity Camera Scroll & Seamless Wrap Torture Test | F2, F6, F9 | High | Pushes camera horizontally across 15,000 pixels at high velocity (up to 20 px/frame), sampling seam wrap boundaries via Delta-E and asserting continuous visual flow. |
| **T4.3** | The Upside-Down Incursion & Escape (Mundo del Revés) | F1, F7, F8, F9 | High | Initiates dimension rift warp, enters Mundo del Revés, exercises combat and atmospheric ash/spores for 60 frames, then safely exits back to normal daylight Colima. |
| **T4.4** | Boss Arena Gauntlet with Parallax Continuity | F2, F3, F4, F5 | High | Enters Boss Arenas across World 0 (Cuauhtémoc), World 2 (Manzanillo), and World 8 (Villa de Álvarez), engaging combat with screen shake and checking background buffer stability. |
| **T4.5** | Extended 180-Frame Engine Stability & Zero-Error Audit | F1-F10 (All) | High | Audits all 4 Validation Pillars simultaneously over 180 continuous frames: 60 FPS stability, zero console exceptions, visual seam continuity, and 100% file parity. |

---

## 5. Coverage Thresholds & Target Counts

| Tier | Category | Minimum Required | Implemented in Suite | Status |
|---|---|:---:|:---:|:---:|
| **Tier 1** | Feature Coverage (F1–F10) | ≥ 50 | 50 | ✅ COMPLETE |
| **Tier 2** | Boundary & Corner Cases (F1–F10) | ≥ 50 | 50 | ✅ COMPLETE |
| **Tier 3** | Cross-Feature Combinations | ≥ 10 | 12 | ✅ COMPLETE |
| **Tier 4** | Real-World Application Scenarios | ≥ 5 | 5 | ✅ COMPLETE |
| **TOTAL** | Full Suite Count | **≥ 115** | **117** | **✅ TARGET EXCEEDED** |

---

## 6. Execution Commands & CLI Options

The test suite can be executed from the terminal using native Node.js commands:

### Run Full Test Suite (All Tiers 1–4, 117 tests)
```bash
node e2e/runner.js
# Or via npm script:
npm test
```

### Run Specific Tiers
```bash
# Run Tier 1 Feature Coverage only
node e2e/runner.js --tier=1

# Run Tiers 1 and 2
node e2e/runner.js --tier=1,2

# Run Tier 3 Combinations
node e2e/runner.js --tier=3

# Run Tier 4 Scenarios only
node e2e/runner.js --tier=4
```

### Run Tests Filtered by Feature or ID
```bash
# Filter all tests covering Feature 1 (Bayer Sky)
node e2e/runner.js --filter=F1

# Filter specific test by ID
node e2e/runner.js --filter=T1.F10.1
```

### Run Against Custom Server URL or CDP Port
```bash
node e2e/runner.js --url=http://localhost:8085 --port=9495
```

---

## 7. File Structure

```
/Volumes/DISCO SSD/dev/Colimavive/
├── e2e/
│   ├── cdp.js                     # Zero-dependency CDP controller & browser launcher
│   ├── pillars.js                 # The 4 validation pillar evaluators (FPS, console, seam, parity)
│   ├── tier1_feature_coverage.js  # 50 Tier 1 tests (5 per feature F1-F10)
│   ├── tier2_boundary_corner.js   # 50 Tier 2 boundary tests (5 per feature F1-F10)
│   ├── tier3_combinations.js      # 12 Tier 3 cross-feature interaction tests
│   ├── tier4_scenarios.js         # 5 Tier 4 comprehensive end-to-end scenarios
│   └── runner.js                  # Master test runner, CLI parser & reporter
├── TEST_INFRA.md                  # This document
└── TEST_READY.md                  # Test suite readiness & execution verification signoff
```
