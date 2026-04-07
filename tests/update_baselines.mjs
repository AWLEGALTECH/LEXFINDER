/**
 * Script to run the parser against all PDF fixtures and output new baseline values.
 * Usage: node tests/update_baselines.mjs
 *
 * Mocks browser globals so loadPdfJs() works in Node.
 */
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, writeFileSync } from 'fs';

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

// Create a fake File-like object from a buffer
function createFakeFile(buffer, name) {
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return {
    name,
    arrayBuffer() {
      return Promise.resolve(ab);
    }
  };
}

const dryRun = process.argv.includes('--dry-run');

for (const fixture of fixtures) {
  const pdfPath = `tests/fixtures/${fixture.file}`;
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

    const baseline = {
      clientName: fixture.clientName,
      totalOcorrencias,
      totalValor,
      categorias,
    };

    // Add notes for special cases
    if (fixture.name === 'alcilene') {
      baseline.nota = 'OCR (Tesseract) - resultados podem variar ±1 entre execucoes';
    }
    if (fixture.name === 'david') {
      baseline.nota = "PDF unico 'Ultimos Lancamentos' Folha 2/2 — fallback ativado";
    }

    console.log(`\n=== ${fixture.clientName} ===`);
    console.log(`  Total: ${totalOcorrencias} ocorrencias, R$ ${totalValor.toFixed(2)}`);
    for (const [catId, catData] of Object.entries(categorias)) {
      console.log(`  ${catId}: ${catData.count} x R$ ${catData.valor.toFixed(2)}`);
    }

    if (!dryRun) {
      writeFileSync(`tests/baselines/${fixture.name}.json`, JSON.stringify(baseline, null, 2) + '\n');
      console.log(`  -> Written to tests/baselines/${fixture.name}.json`);
    }

  } catch (err) {
    console.error(`ERROR processing ${fixture.file}: ${err.message}`);
    console.error(err.stack);
  }
}
