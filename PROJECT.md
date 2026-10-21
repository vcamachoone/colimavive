# Project: Colima Vivo — Unified 16-Bit Panoramic Retro Pixel Art Scenarios

## Architecture

Colima Vivo's visual background rendering engine is re-architected into a unified, high-performance, 4-layer parallax pipeline running on the native `960x540` canvas at locked 60 FPS, completely replacing disjointed JPEG stamping ("plastas") with cohesive 16-bit retro pixel art.

```
+-----------------------------------------------------------------------------------+
| LAYER 0: Far Sky & Celestial Horizon (Parallax: 0.00x - 0.02x)                    |
| - 4-band regional sky palettes with Bayer ordered dithering                       |
| - Drifting pixel clouds, sun / moon / celestial bodies                            |
| - Mundo del Revés: Obsidian-to-blood-scarlet gradient with cosmic rift vortex     |
+-----------------------------------------------------------------------------------+
| LAYER 1: Distant Regional Landscape & Volcano Horizon (Parallax: 0.05x)           |
| - 1920px continuous seamless horizontal wrapping buffer                           |
| - Inland/Mountain (Worlds 0,1,5,6,7,8,9): Majestic Nevado + Volcán de Fuego       |
|   (glacial snow cap, active crater glow, animated 8-bit fumarole particles)       |
| - Coastal (Worlds 2,3,4): Pacific horizon, marine headlands, subtle wave glimmers|
| - Mundo del Revés: Obsidian/burgundy mountains, blood-ice, glowing magma fissures |
+-----------------------------------------------------------------------------------+
| LAYER 2: Municipal Midground Landscape Panorama (Parallax: 0.18x)                 |
| - 100% unified, seamless pixel art landscapes for ALL 10 municipalities          |
| - Eliminates reliance on missing/half-res JPEG postcards in gameplay loop         |
| - Depicts regional topography (cañaverales, salinas, huertas, cafetales, pueblos) |
| - Mundo del Revés: Scorched earth palette, dark crimson & charcoal tinting        |
+-----------------------------------------------------------------------------------+
| LAYER 3: Iconic Architectural Landmarks (Parallax: 0.35x)                         |
| - Signature monuments placed as true midground parallax features                  |
| - Moves at 0.35x speed (eliminates visual confusion with 1.0x foreground)        |
| - Resolves duplicate/ghosting landmarks (e.g. single volcano, single Pez Vela)   |
| - Mundo del Revés: Corrupted silhouettes with spectral crimson highlights         |
+-----------------------------------------------------------------------------------+
| LAYER 4: Atmospheric Effects & Weather (Parallax: 0.00x - 1.00x)                  |
| - Normal Mode: Ambient municipal weather (falling leaves, sea spray, fireflies)   |
| - Mundo del Revés: Volcanic ash, rising glowing embers, red lightning flashes,    |
|   bioluminescent spores, dark radial vignette, subtle spectral aberration         |
+-----------------------------------------------------------------------------------+
| PLAYABLE WORLD (Layer 5, Parallax: 1.00x)                                         |
| - Platforms, blocks, items, enemies, bosses, goal post, player character          |
| - Guaranteed contrast separation: background saturation attenuated (-25%) to     |
|   ensure crisp readability of platforms and hazards                               |
+-----------------------------------------------------------------------------------+
```

## Feature Inventory

Every feature from user requirements (R1–R4) and survey findings is enumerated below with its assigned milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | 16-Bit Bayer Dithered Sky System | 4-band regional sky palettes with 2x2/4x4 Bayer ordered dithering at color transitions, sun/moon, and drifting clouds | M1 | R1, Survey |
| F2 | Continuous Volcano & Coastal Horizon Engine | 1920px seamless horizontal looping horizon with twin volcanoes (Nevado + active Fuego with animated fumarole) for inland and Pacific coast for shorelines | M1 | R1, R2, Survey |
| F3 | Unified 10-Municipality Midground Pixel Art Panoramas | High-fidelity 16-bit retro pixel art panoramas for all 10 municipalities (30 levels), eliminating JPEG postcards in gameplay | M1 | R1, R2, Survey |
| F4 | True-Parallax Architectural Landmarks | Iconic municipal monuments rendered at true midground speed (0.35x), eliminating ghosting and duplicate landmark conflicts | M1 | R1, R2, Survey |
| F5 | Foreground Contrast & Playability Tuning | Luminance and saturation hierarchy ensuring interactive platforms, hazards, and player pop cleanly against background art | M1 | R1, AC |
| F6 | Seamless Horizontal Parallax Looping Engine | Mathematical modulo wrapping and continuous offscreen buffers with zero vertical cuts, edge lines, or seam stuttering | M1 | R2, AC |
| F7 | Mundo del Revés Dynamic Palette Transformation | Dynamic palette transform applied to midground, scenery, and landmarks under `isRev === true` without visual clashing | M1 | R3, Survey |
| F8 | Mundo del Revés Volcanic Ash & Spectral Atmosphere | Active falling ash, rising embers, red lightning, and spectral distortion in gameplay loop under `isRev === true` | M1 | R3, AC |
| F9 | Offscreen Pre-Render Canvas Caching & 60 FPS Optimization | Cached offscreen canvas buffers for all panoramic layers ensuring locked 60 FPS and zero per-frame path recalculation | M1 | R4, AC |
| F10 | Dual File Parity & Synchronization | Strict 100% byte-for-byte parity preserved between `index.html` and `Colima_Vivo_1_0_Senaletica_Postales_Corregidas.html` | M1 | R4, AC |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Unified 16-Bit Panoramic Retro Pixel Art Engine & Mundo del Revés Integration | Features F1 through F10: 4-layer background engine, Bayer dithering, seamless 1920px twin volcano/coast horizon, 10-municipality midgrounds, true-parallax landmarks, Mundo del Revés atmosphere/ash, 60 FPS offscreen caching, and 100% dual file parity | none | PLANNED |
| M2 | Final E2E Test Suite Pass & Adversarial Hardening | Phase 1: Pass 100% of E2E test suite (Tiers 1-4). Phase 2: Tier 5 adversarial coverage hardening | M1, TEST_READY | PLANNED |

## Interface Contracts

### Background Layer Pipeline ↔ Engine Render Loop
- **Function**: `drawBackground(cameraX, isRev, muni, stageMeta)`
- **Input Parameters**:
  - `cameraX: number` (current smoothed horizontal camera offset)
  - `isRev: boolean` (whether Mundo del Revés is active)
  - `muni: Object` (current municipality configuration from `MUNICIPALITIES[currentWorldIdx]`)
  - `stageMeta: Object` (level length, theme, time of day)
- **Output**: Direct rendering to primary canvas context (`ctx`) via pre-rendered offscreen buffer blitting.
- **Invariants**:
  - `cameraX` is strictly integer-snapped at draw call (`Math.round(cameraX * parallaxSpeed)`).
  - All layers wrap seamlessly at exact buffer width boundaries (`loopWidth`).
  - Total frame execution time for `drawBackground` must remain `<= 2.5 ms` on 60 FPS budget.

### Offscreen Canvas Buffer Cache (`CV_PANO_CACHE`)
- **Key Format**: `pano_${worldIdx}_${isRev ? 'rev' : 'norm'}`
- **Buffer Structure**:
  - `skyBuffer: HTMLCanvasElement` (`960x540`)
  - `horizonBuffer: HTMLCanvasElement` (`1920x540`)
  - `midgroundBuffer: HTMLCanvasElement` (`1920x540`)
  - `landmarkBuffer: HTMLCanvasElement` (`2880x540`)
- **Lifecycle**: Lazy-instantiated once per municipality/state transition; persistent across frames.

### Mundo del Revés Transformation Interface
- **Trigger**: Crouch on `isRift: true` pipe, toggling `isUpsideDown`.
- **Contract**:
  - When `isUpsideDown === true`, all 4 background layers consume inverted palettes.
  - `drawWeatherLayer` branches to volcanic ash / ember particle simulation.
  - Atmospheric overlay draws red lightning flashes and bioluminescent spores.
  - Zero dropped frames during state switch.

## Code Layout

- `/Volumes/DISCO SSD/dev/Colimavive/index.html`: Main game application and primary entrypoint.
- `/Volumes/DISCO SSD/dev/Colimavive/Colima_Vivo_1_0_Senaletica_Postales_Corregidas.html`: Audited release duplicate (strictly synchronized 100% byte-for-byte).
- `/Volumes/DISCO SSD/dev/Colimavive/server.js`: Node.js local game development server (`port 8085`).
- `/Volumes/DISCO SSD/dev/Colimavive/e2e/`: Automated E2E test suite and runner scripts.
- `/Volumes/DISCO SSD/dev/Colimavive/PROJECT.md`: Global architecture and milestone plan.
- `/Volumes/DISCO SSD/dev/Colimavive/TEST_INFRA.md`: E2E testing framework index and test catalog.
- `/Volumes/DISCO SSD/dev/Colimavive/TEST_READY.md`: Signal and metrics when E2E test suite is complete.
