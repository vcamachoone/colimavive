# COLIMA VIVO 1.0 — Auditoría y corrección de señalética, checkpoints y postales

## Alcance
Corrección del último HTML `Colima_Vivo_1_0_Capas_Colisiones_Letreros_Corregidos.html`.
Sin pruebas de teléfonos. Se preserva el motor de geometría ya corregido.

## Defectos corregidos

1. **Carteles demasiado grandes y superpuestos con arquitectura, objetos jugables y personajes.** Se ocultaron los grandes rótulos físicos de parada en las rutas regionales; los nombres se presentan en el HUD con panel opaco, máximo de ancho y contexto de nivel. Se conservan las decoraciones de los edificios y los hitos de pixel art, sin modificar hitboxes.
2. **Checkpoint en inglés y con número de desarrollo.** Se reemplazó `CHECKPOINT 1/2` por `CONTROL` y `✓ ACTIVADO`, y el mensaje por `¡PUNTO ACTIVADO!`. No se modifica ninguna lógica de checkpoint.
3. **Cartel postal sin recompensa visible.** Las metas finales ahora usan una señal pequeña y clara `META ►`; al completar el nivel se muestra una postal ilustrada con su lugar, avance de colección, medallas y controles de continuar / abrir Pasaporte. Reutiliza `postcardGraphic` para mantener la galería y la pantalla de victoria coherentes. La última victoria de campaña también muestra la postal.
4. **Nombres duplicados y encimados.** Se eliminaron carteles in-world duplicados en las rutas; la ubicación se explica mediante panel contextual independiente, sin cortar palabras a nivel de sprite.

## Evidencias y límites

- Niveles cargados y renderizados: **30/30**.
- Postales generadas dentro del motor: **30/30**.
- Victoria instrumentada verifica el guardado y el cambio `gameState=LEVEL_CLEAR`: **True**.
- Puentes: **22/22**.
- Bloques «?» activados por salto: **60/60**.
- Monedas: **46/46**.
- Bloques «?» con personaje grande: **60/60**.
- Jefes presentes en niveles 3 de cada municipio: **10/10**.
- Errores JavaScript: **0** en estas ejecuciones.

### Advertencias

- Las postales son **ilustraciones interpretativas existentes en el Pasaporte**, no fotografías ni reproducciones arquitectónicas validadas.
- No se completaron partidas humanas ni se probaron teléfonos físicos.
- No se evaluó el reconocimiento turístico con personas ni todas las superposiciones durante animaciones.
- La ausencia de error de sintaxis/ejecución no prueba que cada elemento gráfico sea perfecto.

## Archivos

- HTML corregido `Colima_Vivo_1_0_Senaletica_Postales_Corregidas.html`.
- `Colima_Vivo_Senaletica_Comparativa.png` con capturas reales en Chromium.
- `Colima_Vivo_Senaletica_Validacion_30_Niveles.csv`.

## Próxima revisión recomendada

Prueba dinámica de todos los niveles y diez jefes en varias posiciones de cámara para detectar colisiones gráficas entre escenarios, animaciones y objetos que la auditoría geométrica estática no detecta. Mantener excluidas las pruebas físicas de teléfonos.
