/**
 * Validates the current parser output against saved baselines.
 * Usage: node tests/validate_baselines.mjs
 *
 * Exits with code 0 if all match, 1 if any differences found.
 */
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';

// Mock browser globals before importing parser
globalThis.window = globalThis.window || {};
globalThis.document = globalThis.document || {
  createElement: () => ({}),
  head: { appendChild: () => {} },
};

// Pre-set __pdfjsLib so loadPdfJs() returns immediately
globalThis.window.__pdfjsLib = pdfjsLib;
// Also mock __tesseractWorker to avoid Tesseract loading
globalThis.window.__tesseractWorker = null;

const { parseDocumentoPDF, analyzeAll } = await import('../src/parser.js');

const fixtures = [
  { name: 'abel', file: 'ABEL_EXTRATOS.pdf', clientName: 'ABEL MOTA NOGUEIRA' },
  { name: 'adailton', file: 'ADAILTON_EXTRATOS.pdf', clientName: 'ADAILTON DA SILVA PEREIRA' },
  { name: 'alcilene', file: 'ALCILENE_EXTRATOS.pdf', clientName: 'ALCILENE PEREIRA PINHEIRO' },
  { name: 'alexandre', file: 'ALEXANDRE_EXTRATOS.pdf', clientName: 'ALEXANDRE LUIS BARBOSA NOGUEIRA' },
  { name: 'claudia', file: 'CLAUDIA_EXTRATOS.pdf', clientName: 'CLAUDIA NAYARA LIRA LEMOS' },
  { name: 'david', file: 'DAVID_EXTRATOS.pdf', clientName: 'DAVID PONCIANO DA SILVA' },
  { name: 'luis_carlos', file: 'luis_carlos.pdf', clientName: 'LUIS CARLOS MARQUES DE ALMEIDA' },
  { name: 'zeildo', file: 'ZEILDO_EXTRATOS.pdf', clientName: 'ZEILDO ALMEIDA FREITAS' },
];

function createFakeFile(buffer, name) {
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return {
    name,
    arrayBuffer() {
      return Promise.resolve(ab);
    }
  };
}

let totalPass = 0;
let totalFail = 0;
let totalSkip = 0;

for (const fixture of fixtures) {
  const pdfPath = `tests/fixtures/${fixture.file}`;
  const baselinePath = `tests/baselines/${fixture.name}.json`;

  let baseline;
  try {
    baseline = JSON.parse(readFileSync(baselinePath, 'utf-8'));
  } catch (err) {
    console.log(`  SKIP ${fixture.clientName} — no baseline file (${baselinePath})`);
    totalSkip++;
    continue;
  }

  try {
    const buf = readFileSync(pdfPath);
    const fakeFile = createFakeFile(buf, fixture.file);
    const result = await parseDocumentoPDF(fakeFile, null);

    // Group by category
    const grouped = analyzeAll(result.transactions);

    const categorias = {};
    let totalOcorrencias = 0;
    let totalValor = 0;

    for (const [catId, catData] of Object.entries(grouped)) {
      const count = catData.items.length;
      const valor = catData.items.reduce((s, i) => s + i.valor, 0);
      categorias[catId] = { count, valor: Math.round(valor * 100) / 100 };
      totalOcorrencias += count;
      totalValor += valor;
    }

    totalValor = Math.round(totalValor * 100) / 100;

    // Compare with baseline
    const diffs = [];

    // Compare totals
    if (totalOcorrencias !== baseline.totalOcorrencias) {
      diffs.push(`  totalOcorrencias: expected ${baseline.totalOcorrencias}, got ${totalOcorrencias} (delta ${totalOcorrencias - baseline.totalOcorrencias})`);
    }

    if (Math.abs(totalValor - baseline.totalValor) > 0.02) {
      diffs.push(`  totalValor: expected R$ ${baseline.totalValor.toFixed(2)}, got R$ ${totalValor.toFixed(2)} (delta R$ ${(totalValor - baseline.totalValor).toFixed(2)})`);
    }

    // Compare per-category
    const allCatIds = new Set([...Object.keys(categorias), ...Object.keys(baseline.categorias)]);
    for (const catId of [...allCatIds].sort()) {
      const actual = categorias[catId] || { count: 0, valor: 0 };
      const expected = baseline.categorias[catId] || { count: 0, valor: 0 };

      if (actual.count !== expected.count) {
        diffs.push(`  [${catId}] count: expected ${expected.count}, got ${actual.count} (delta ${actual.count - expected.count})`);
      }
      if (Math.abs(actual.valor - expected.valor) > 0.02) {
        diffs.push(`  [${catId}] valor: expected R$ ${expected.valor.toFixed(2)}, got R$ ${actual.valor.toFixed(2)} (delta R$ ${(actual.valor - expected.valor).toFixed(2)})`);
      }
    }

    // Check for extra categories not in baseline
    for (const catId of Object.keys(categorias)) {
      if (!baseline.categorias[catId]) {
        diffs.push(`  [${catId}] EXTRA category not in baseline: ${categorias[catId].count} items, R$ ${categorias[catId].valor.toFixed(2)}`);
      }
    }

    // Check for missing categories in baseline
    for (const catId of Object.keys(baseline.categorias)) {
      if (!categorias[catId]) {
        diffs.push(`  [${catId}] MISSING category from baseline: expected ${baseline.categorias[catId].count} items, R$ ${baseline.categorias[catId].valor.toFixed(2)}`);
      }
    }

    if (diffs.length === 0) {
      console.log(`PASS  ${fixture.clientName} — ${totalOcorrencias} ocorrencias, R$ ${totalValor.toFixed(2)}, ${Object.keys(categorias).length} categorias`);
      totalPass++;
    } else {
      console.log(`FAIL  ${fixture.clientName}`);
      // Also print actual totals for context
      console.log(`  Actual: ${totalOcorrencias} ocorrencias, R$ ${totalValor.toFixed(2)}, ${Object.keys(categorias).length} categorias`);
      console.log(`  Baseline: ${baseline.totalOcorrencias} ocorrencias, R$ ${baseline.totalValor.toFixed(2)}, ${Object.keys(baseline.categorias).length} categorias`);
      for (const d of diffs) {
        console.log(d);
      }
      totalFail++;
    }

  } catch (err) {
    console.log(`ERROR ${fixture.clientName}: ${err.message}`);
    console.log(err.stack);
    totalFail++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`Results: ${totalPass} PASS, ${totalFail} FAIL, ${totalSkip} SKIP (of ${fixtures.length} total)`);

if (totalFail > 0) {
  process.exit(1);
} else {
  console.log('All baselines validated successfully!');
  process.exit(0);
}
