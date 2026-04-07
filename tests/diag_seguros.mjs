/**
 * Diagnostic script: parse a PDF and dump all entries classified as a specific category
 * Usage: node tests/diag_seguros.mjs <pdf_path> [category_id]
 */
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';

globalThis.window = globalThis.window || {};
globalThis.document = globalThis.document || {
  createElement: () => ({}),
  head: { appendChild: () => {} },
};
globalThis.window.__pdfjsLib = pdfjsLib;
globalThis.window.__tesseractWorker = null;

const { parseDocumentoPDF, analyzeAll, matchCategoria } = await import('../src/parser.js');

const pdfPath = process.argv[2] || 'tests/fixtures/ABEL_EXTRATOS.pdf';
const filterCat = process.argv[3] || null; // e.g. "seguros", "extrato", "mora"

function createFakeFile(buffer, name) {
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return { name, arrayBuffer: () => Promise.resolve(ab) };
}

try {
  const buffer = readFileSync(pdfPath);
  const fakeFile = createFakeFile(buffer, pdfPath.split('/').pop());
  const result = await parseDocumentoPDF(fakeFile);

  if (!result || !result.transactions || result.transactions.length === 0) {
    console.log('No transactions found.');
    process.exit(1);
  }

  console.log(`Total transactions: ${result.transactions.length}`);
  console.log(`Client: ${result.clientName || 'N/A'}`);

  // Group by category
  const grouped = analyzeAll(result.transactions);

  // Summary
  console.log('\n=== SUMMARY ===');
  let totalOcorr = 0, totalValor = 0;
  for (const [catId, data] of Object.entries(grouped)) {
    const count = data.items.length;
    const valor = data.items.reduce((s, t) => s + (t.valor || 0), 0);
    totalOcorr += count;
    totalValor += valor;
    console.log(`  ${catId}: ${count} ocorr, R$ ${valor.toFixed(2)}`);
  }
  console.log(`  TOTAL: ${totalOcorr} ocorr, R$ ${totalValor.toFixed(2)}`);

  // Detailed dump for filtered category
  const catsToShow = filterCat ? [filterCat] : Object.keys(grouped);
  for (const catId of catsToShow) {
    if (!grouped[catId]) {
      console.log(`\nCategory "${catId}" not found in results.`);
      continue;
    }
    console.log(`\n=== ${catId.toUpperCase()} (${grouped[catId].items.length} entries) ===`);
    for (const t of grouped[catId].items) {
      const val = t.valor != null ? `R$ ${t.valor.toFixed(2)}` : '(sem valor)';
      console.log(`  ${t.data || '??/??/????'} | ${val.padStart(12)} | ${t.historico}`);
    }
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
