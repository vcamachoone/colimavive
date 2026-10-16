# Project: Auditoría Integral Colima Vivo 1.0 (HTML5/Canvas)

## Architecture
- **Target File**: `Colima_Vivo_1_0_Senaletica_Postales_Corregidas.html` (1,172,684 bytes, 10,528 líneas).
- **Core Engine Architecture**:
  - Script 1 (L1073–L1083): Captura global anticipada de errores y trap de diagnóstico (`#cv-boot-warning`).
  - Script 2 (L1084–L10525): Motor 2D Vanilla JS con Canvas context (`gameCanvas`, 960x540 nativo, relación 16:9).
  - Game Loop: Fixed Timestep Accumulator a 60 Hz (`STEP_MS = 16.666 ms`) con protección clamp a 100 ms contra la espiral de la muerte.
  - State Machine: Gestión centralizada en `gameState` (`TITLE`, `PLAYING`, `PAUSED`, `WORLD_MAP`, `PASSPORT`, `LEVEL_CLEAR`, `GAME_OVER`, `VICTORY`, `MENU`, `RECOGNITION`, `BOSS_PRACTICE_RESULT`).
  - Subsistema de Audio: Web Audio API procedural (0 dependencias externas) con lazy-loading en gestos humanos.
  - Subsistema de Entrada: W3C Pointer Events en móviles con `setPointerCapture` y eventos de teclado con aislamiento de formularios.
  - Subsistema de Niveles: 10 municipios × 3 sub-niveles = 30 niveles deterministas con 10 batallas de jefes en sub-nivel 3.
  - Subsistema de Recompensas y Señalética: Postales ilustradas generadas proceduralmente, pasaporte modal persistente en `localStorage`, waypoints contextuales con auto-supresión en jefes y meta compacta `META ►`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Bootstrap Diagnostic Trap | Captura temprana de errores de parsing o scripts antes del arranque del juego | M1 | survey |
| F02 | Game Loop con Paso Fijo | Bucle de simulación desacoplado de la tasa de refresco a 60 FPS exactos | M1 | survey |
| F03 | Almacenamiento Local Seguro | Wrappers safeGet y safeSet con tolerancia a fallos en navegación privada | M1 | survey |
| F04 | Respaldo Portátil de Campaña | Exportación e importación validada de progreso de niveles y medallas en JSON | M1 | survey |
| F05 | Sistema de Poderes (Tuba y Limón) | Transformación física, incremento de altura (40px a 54px) y disparo cítrico | M2 | survey |
| F06 | Caja de Reserva (Item Reserve) | Almacenamiento y descenso automático o manual de ítem de repuesto | M2 | survey |
| F07 | Combo de Pisotones (Stomp Combo) | Multiplicador exponencial de puntaje por rebotes consecutivos y 1-UP | M2 | survey |
| F08 | Bloques Interrogación y Ladrillos | Interacción de golpeo inferior, aparición de monedas/ítems y fragmentación | M2 | survey |
| F09 | Zona Mágica (Comala 8-3) | Modificación ambiental de gravedad reducida (0.34) y fricción (0.91) | M2 | survey |
| F10 | Puntos de Control Bilingües Corregidos | Checkpoints señalizados en español con bandera reactiva y texto flotante | M2 | survey |
| F11 | Meta Compacta «META ►» | Marcador discreto de madera que reemplaza cartelería invasiva en meta | M3 | survey |
| F12 | Panel Waypoint Contextual | Panel informativo de alta visibilidad para las 30 rutas con auto-supresión en combate | M3 | survey |
| F13 | Pasaporte Colimense | Galería interactiva accesible de 30 postales turísticas con desbloqueo persistente | M3 | survey |
| F14 | Pantalla de Recompensa de Postal | Despliegue obligatorio de postal al completar niveles (incluido nivel 30) | M3 | survey |
| F15 | 10 Jefes Municipales Únicos | Batallas con patrones de ataque, escalamiento de vida (2 a 7) y barrera de arena | M2 | survey |
| F16 | Arena de Entrenamiento de Jefes | Modo de práctica independiente para entrenar contra jefes sin alterar progreso | M2 | survey |
| F17 | Sintetizador Chiptune Web Audio | Generador de audio procedural con 4 patrones regionales y autoplay compliance | M1 | survey |
| F18 | Mapa Interactivo de Colima | Mapa geográfico vectorial con nodos interactivos para los 10 municipios | M3 | survey |
| F19 | Telemetría y Playtesting | Registro observacional para QA y balance con exportación CSV sanitizada anti-fórmulas | M1 | survey |
| F20 | Protocolo de Reconocimiento | Cuestionario interactivo modal para evaluación turística de escenarios | M1 | survey |
| F21 | Accesibilidad y Reducción de Efectos | Preferencias de accesibilidad, reducción de movimiento y emulación CRT | M1 | survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Auditoría de Código y Arquitectura (R1) | Análisis estático/dinámico de JS, AST, variables globales, listeners, memoria, audio y compatibilidad cross-browser | none | IN_PROGRESS |
| M2 | Verificación Dinámica y QA de 30 Niveles y 10 Jefes (R2) | Simulación determinista de carga, física, colisiones, 10 batallas de jefes, entidades y LEVEL_CLEAR | M1 | PLANNED |
| M3 | Rendimiento y Adaptabilidad Visual (R3) | Profiling de FPS en canvas, adaptabilidad responsive, controles táctiles y ausencia de solapamientos HUD | M1 | PLANNED |
| M4 | Reporte Técnico y Plan de Acción (R4) | Generación de Auditoria_Colima_Vivo_1_0.md en raíz, matriz de severidad, evidencias y verificación forense | M1, M2, M3 | PLANNED |

## Interface Contracts
### Code Audit (M1) ↔ Dynamic QA (M2)
- Datos extraídos: Array `MUNICIPALITIES` (10 items), función `loadStage(w, s)`, variables globales de entidades.
- Contrato de validación: Cada nivel debe instanciar sin excepciones `TypeError` ni `ReferenceError`.
- Estado de meta: Nivel normal termina en `LEVEL_CLEAR`; nivel 10-3 con 30 postales termina en `VICTORY`.

### QA (M2) / Rendering (M3) ↔ Final Report (M4)
- Formato de evidencia: Tablas cuantitativas de entidades por nivel (bloques, monedas, medallas, enemigos, jefes).
- Métricas de rendimiento: FPS promedio, tiempo de cuadro (`STEP_MS`), balance de pila `ctx.save`/`restore`.
- Matriz de hallazgos: Clasificación en Crítica, Media y Baja con descripción técnica, impacto y recomendación.

## Code Layout
- Raíz del proyecto: `c:\Users\51-14045\Desktop\COLIMA\`
- Archivo fuente a auditar: `Colima_Vivo_1_0_Senaletica_Postales_Corregidas.html`
- Entregable final de auditoría: `Auditoria_Colima_Vivo_1_0.md`
- Carpeta de coordinación y metadatos: `.agents/teamwork/`
