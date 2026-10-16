# E2E Test Infra: Colima Vivo 1.0 Audit

## Test Philosophy
- Opaque-box, requirement-driven testing covering the entire game engine, simulation, storage, audio, rendering and reporting.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory & Test Mapping
| # | Feature | Source | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Pairwise) |
|---|---------|--------|:-----------------:|:-----------------:|:-----------------:|
| F01 | Bootstrap Diagnostic Trap | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| F02 | Game Loop con Paso Fijo | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| F03 | Almacenamiento Local Seguro | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| F04 | Respaldo Portátil de Campaña | ORIGINAL_REQUEST R1/R2 | 5 | 5 | ✓ |
| F05 | Sistema de Poderes (Tuba/Limón) | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| F06 | Caja de Reserva (Item Reserve) | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| F07 | Combo de Pisotones (Stomp Combo) | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| F08 | Bloques Interrogación y Ladrillos | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| F09 | Zona Mágica (Comala 8-3) | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| F10 | Puntos de Control Bilingües Corregidos | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| F11 | Meta Compacta «META ►» | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| F12 | Panel Waypoint Contextual | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |
| F13 | Pasaporte Colimense | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| F14 | Recompensa de Postal (30 niveles) | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| F15 | 10 Jefes Municipales Únicos | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| F16 | Arena de Entrenamiento de Jefes | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| F17 | Sintetizador Chiptune Web Audio | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| F18 | Mapa Interactivo de Colima | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ |
| F19 | Telemetría y Playtesting | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| F20 | Protocolo de Reconocimiento | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ |
| F21 | Accesibilidad y Filtro CRT | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ |

## Test Architecture
- Test Runner: Node.js VM harness executing game engine scripts with mock DOM/Canvas/WebAudio interfaces.
- Execution Command: `node .agents/teamwork/e2e_runner/run_e2e_tests.js`
- Pass/Fail Semantics: Exit code 0 on all tests passing, non-zero on failure.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full 30-Level Sequential Campaign Playthrough | F02, F03, F05, F08, F10, F14, F15 | High |
| 2 | Boss Gauntlet: Defeat all 10 Bosses in Training & Campaign | F02, F15, F16, F17 | High |
| 3 | Incognito / Restricted Storage Simulation | F01, F03, F04, F13, F14 | Medium |
| 4 | Backup Export, Tampering Rejection, and Restoration | F03, F04, F13 | Medium |
| 5 | Viewport Resizing and Mobile Touch Pointer Emulation | F02, F11, F12, F21 | Medium |
| 6 | Victory Flow: Level 30 Postcard Unlock to Full Passport Completion | F13, F14, F18, F21 | High |

## Coverage Thresholds
- Tier 1: ≥ 105 test cases (5 per feature × 21 features)
- Tier 2: ≥ 105 test cases (boundary/corner cases)
- Tier 3: ≥ 21 pairwise interaction test cases
- Tier 4: ≥ 6 realistic end-to-end application scenarios
- Total Target: ≥ 237 test cases
