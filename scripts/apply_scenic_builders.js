const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const newBuilders = fs.readFileSync('scripts/temp_scenic.js', 'utf8').trim();

const startMarker = '// -------------------------------------------------------------------------\n    // 10 BUILDERS PROCEDURALES DE PAISAJES MUNICIPALES (POSTALES 16-BIT)';
const endMarker = 'function buildMunicipalMidgroundBuffer(worldIdx, isRev) {';

const startIdx = html.indexOf(startMarker);
if (startIdx === -1) {
  console.error('ERROR: startMarker not found!');
  process.exit(1);
}

const endIdx = html.indexOf(endMarker, startIdx);
if (endIdx === -1) {
  console.error('ERROR: endMarker not found!');
  process.exit(1);
}

const updatedHtml = html.slice(0, startIdx) + newBuilders + '\n\n    ' + html.slice(endIdx);
fs.writeFileSync('index.html', updatedHtml, 'utf8');
console.log('index.html actualizado exitosamente!');

// Sincronizar paridad SHA-256 exacta con Colima_Vivo_1_0_Senaletica_Postales_Corregidas.html
fs.writeFileSync('Colima_Vivo_1_0_Senaletica_Postales_Corregidas.html', updatedHtml, 'utf8');
console.log('Colima_Vivo_1_0_Senaletica_Postales_Corregidas.html sincronizado con paridad binaria exacta!');
