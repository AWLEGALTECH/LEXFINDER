import { describe, it, expect } from 'vitest';
import {
  normalizeText, matchCategoria, parseValor, groupByY, pickDebit,
  detectLayout, extractFromRow, analyzeAll, CATEGORIAS,
  IS_DATE, IS_VALUE, IS_HEADER, IS_SUMMARY
} from '../src/parser.js';

describe('normalizeText', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeText('TARIFA BANCÁRIA')).toBe('tarifa bancaria');
    expect(normalizeText('Crédito')).toBe('credito');
    expect(normalizeText('AÇÃO')).toBe('acao');
  });
});

describe('matchCategoria', () => {
  it('matches tarifa bancaria', () => {
    const cat = matchCategoria('TARIFA BANCARIA');
    expect(cat).not.toBeNull();
    expect(cat.id).toBe('tarifas');
  });

  it('matches cesta b.expresso', () => {
    const cat = matchCategoria('CESTA B.EXPRESSO4');
    expect(cat).not.toBeNull();
    expect(cat.id).toBe('cesta');
  });

  it('matches tarifa bancaria cesta - cesta wins (longer + later position)', () => {
    const cat = matchCategoria('TARIFA BANCARIA CESTA B.EXPRESSO');
    expect(cat).not.toBeNull();
    expect(cat.id).toBe('cesta');
  });

  it('returns null for REM: prefix (PIX)', () => {
    expect(matchCategoria('REM: JOAO SILVA')).toBeNull();
  });

  it('returns null for DES: prefix (TED)', () => {
    expect(matchCategoria('DES: MARIA SOUZA')).toBeNull();
  });

  it('returns null for non-matching text', () => {
    expect(matchCategoria('DEPOSITO EM DINHEIRO')).toBeNull();
  });

  it('matches mora credito pessoal', () => {
    const cat = matchCategoria('MORA CREDITO PESSOAL');
    expect(cat.id).toBe('mora');
  });

  it('matches invest facil', () => {
    const cat = matchCategoria('APLIC.INVEST FACIL');
    expect(cat.id).toBe('invest_facil');
  });

  it('matches anuidade', () => {
    const cat = matchCategoria('ANUIDADE CARTAO VISA');
    expect(cat.id).toBe('anuidade');
  });

  it('matches gastos_cartao', () => {
    const cat = matchCategoria('GASTO C/CARTAO DE CREDITO');
    expect(cat.id).toBe('gastos_cartao');
  });

  it('matches bx_ant_financ', () => {
    const cat = matchCategoria('BX.ANT.FINANC/EMP');
    expect(cat.id).toBe('bx_ant_financ');
  });

  it('matches vida_prev (was seguros)', () => {
    const cat = matchCategoria('BRADESCO VIDA E PREVIDENCIA S/A');
    expect(cat.id).toBe('vida_prev');
  });

  it('matches seguros', () => {
    const cat = matchCategoria('SEGURO PRESTAMISTA');
    expect(cat.id).toBe('seguros');
  });

  it('matches encargos', () => {
    const cat = matchCategoria('ENCARGOS LIMITE DE CRED');
    expect(cat.id).toBe('encargos');
  });

  it('matches adiantamento', () => {
    const cat = matchCategoria('TAR ADIANT.DEPOSITANTE');
    expect(cat.id).toBe('adiantamento');
  });

  it('matches credito pessoal', () => {
    const cat = matchCategoria('PARCELA CREDITO PESSOAL');
    expect(cat.id).toBe('credito');
  });

  it('matches titulo capitalizacao', () => {
    const cat = matchCategoria('TITULO DE CAPITALIZACAO');
    expect(cat.id).toBe('tit_cap');
  });

  it('matches emissao extrato', () => {
    const cat = matchCategoria('EMISSAO EXTRATO');
    expect(cat.id).toBe('extrato');
  });

  it('splits mora conta de telefone from mora credito', () => {
    expect(matchCategoria('MORA CONTA DE TELEFONE 4556442').id).toBe('mora_telefone');
    expect(matchCategoria('MORA CREDITO PESSOAL 3460070').id).toBe('mora');
  });

  it('routes third-party lenders to credito_terceiros', () => {
    expect(matchCategoria('CREFISA CREDITO PESSOAL PAGTO ELETRON COBRANCA').id).toBe('credito_terceiros');
    expect(matchCategoria('SUDA').id).toBe('credito_terceiros');
    // bank installment stays in credito
    expect(matchCategoria('PARCELA CREDITO PESSOAL 3480162 CONTR 404254480').id).toBe('credito');
  });

  it('does not match "suda" inside another word (ESUDA)', () => {
    expect(matchCategoria('0916487 DES: ESUDA TRANSPORTES E S 15/01')).toBeNull();
  });

  it('never classifies IOF as a chargeable category', () => {
    expect(matchCategoria('IOF S/ UTILIZACAO LIMITE 3167043')).toBeNull();
    expect(matchCategoria('IOF SOBRE OPERACAO DE CREDITO')).toBeNull();
  });

  it('classifies OPERACOES VENCIDAS as op_vencidas (reference-only)', () => {
    const cat = matchCategoria('OPERACOES VENCIDAS 3100198');
    expect(cat.id).toBe('op_vencidas');
    expect(cat.naoReembolsavel).toBe(true);
  });

  it('classifies PAGTO ELETRON COBRANCA ... SEGURO as seguros', () => {
    expect(matchCategoria('PAGTO ELETRON COBRANCA 0000085 SEGURO').id).toBe('seguros');
  });

  it('does NOT classify PagSeguro (maquininha) as seguro', () => {
    const cat = matchCategoria('PAGSEGURO*grandev COMPRA ELO DEBITO VISTA');
    expect(cat === null || cat.id !== 'seguros').toBe(true);
  });

  it('classifies SEGURO MAIS PROTECAO (protecao, not protegido) as seguros', () => {
    expect(matchCategoria('SEGURO MAIS PROTECAO 2760031').id).toBe('seguros');
  });

  it('does NOT classify water bill merged with EMPRESTIMO PESSOAL as credito', () => {
    expect(matchCategoria('0693719 AGUAS DO AMAZONAS/AM-6937195 EMPRESTIMO PESSOAL')).toBeNull();
    expect(matchCategoria('SAQUE DINHEIRO BANCO 24H 0811863 EMPRESTIMO PESSOAL')).toBeNull();
  });

  it('still classifies real installment as credito', () => {
    expect(matchCategoria('PARCELA CREDITO PESSOAL 3460122').id).toBe('credito');
    expect(matchCategoria('EMPRESTIMO PESSOAL PARC 003/012').id).toBe('credito');
  });
});

describe('parseValor', () => {
  it('parses Brazilian currency format', () => {
    expect(parseValor('1.234,56')).toBe(1234.56);
    expect(parseValor('15,00')).toBe(15);
    expect(parseValor('999,99')).toBe(999.99);
  });

  it('handles D/C suffix', () => {
    expect(parseValor('100,00D')).toBe(100);
    expect(parseValor('200,00C')).toBe(200);
  });

  it('handles negative values', () => {
    expect(parseValor('-15,00')).toBe(15);
  });

  it('returns null for invalid/zero', () => {
    expect(parseValor('0,00')).toBeNull();
    expect(parseValor('abc')).toBeNull();
    expect(parseValor(null)).toBeNull();
  });
});

describe('groupByY', () => {
  it('groups items within tolerance', () => {
    const items = [
      { text: 'A', x: 10, y: 100 },
      { text: 'B', x: 50, y: 102 },
      { text: 'C', x: 10, y: 200 },
    ];
    const rows = groupByY(items, 4);
    expect(rows).toHaveLength(2);
    // Row at y~200 comes first (higher Y = top of page in PDF coords)
    expect(rows[0].items.map(i => i.text)).toEqual(['C']);
    expect(rows[1].items.map(i => i.text)).toEqual(['A', 'B']);
  });

  it('sorts items within row by X', () => {
    const items = [
      { text: 'B', x: 50, y: 100 },
      { text: 'A', x: 10, y: 101 },
    ];
    const rows = groupByY(items, 4);
    expect(rows).toHaveLength(1);
    expect(rows[0].items.map(i => i.text)).toEqual(['A', 'B']);
  });
});

describe('pickDebit', () => {
  it('picks value closest to debitoX', () => {
    const cols = { creditoX: 100, debitoX: 200, saldoX: 300 };
    const values = [
      { text: '50,00', x: 105 },  // closer to credito
      { text: '25,00', x: 195 },  // closer to debito
      { text: '100,00', x: 290 }, // closer to saldo
    ];
    expect(pickDebit(values, cols)).toBe(25);
  });

  it('returns null when value is closer to credito', () => {
    const cols = { creditoX: 100, debitoX: 200, saldoX: 300 };
    const values = [
      { text: '50,00', x: 105 },  // closer to credito only
    ];
    expect(pickDebit(values, cols)).toBeNull();
  });

  it('uses fallback when no column detection', () => {
    const cols = { creditoX: null, debitoX: null, saldoX: null };
    const values = [
      { text: '50,00', x: 100 },
      { text: '25,00', x: 200 },
      { text: '100,00', x: 300 },
    ];
    // Fallback: drop last (saldo), take penultimate (debito)
    expect(pickDebit(values, cols)).toBe(25);
  });
});

describe('IS_DATE', () => {
  it('matches DD/MM/YYYY', () => {
    expect(IS_DATE.test('14/09/2023')).toBe(true);
    expect(IS_DATE.test('01/01/2020')).toBe(true);
  });
  it('rejects invalid formats', () => {
    expect(IS_DATE.test('14/09')).toBe(false);
    expect(IS_DATE.test('2023-09-14')).toBe(false);
  });
});

describe('IS_VALUE', () => {
  it('matches Brazilian currency', () => {
    expect(IS_VALUE.test('1.234,56')).toBe(true);
    expect(IS_VALUE.test('15,00')).toBe(true);
    expect(IS_VALUE.test('-15,00')).toBe(true);
    expect(IS_VALUE.test('100,00D')).toBe(true);
  });
  it('rejects non-currency', () => {
    expect(IS_VALUE.test('0090126')).toBe(false);
    expect(IS_VALUE.test('abc')).toBe(false);
  });
});

describe('CATEGORIAS', () => {
  it('has 24 categories', () => {
    expect(CATEGORIAS).toHaveLength(24);
  });

  it('all have required fields', () => {
    for (const cat of CATEGORIAS) {
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('label');
      expect(cat).toHaveProperty('keywords');
      expect(cat.keywords.length).toBeGreaterThan(0);
    }
  });

  it('invest_facil is marked naoReembolsavel', () => {
    const inv = CATEGORIAS.find(c => c.id === 'invest_facil');
    expect(inv.naoReembolsavel).toBe(true);
  });
});

describe('analyzeAll', () => {
  it('ignora fragmentos sem valor (null/0) para não inflar a contagem', () => {
    const txns = [
      { data: '01/01/2020', historico: 'TARIFA EMISSAO EXTRATO 0010120', valor: 2.4 },
      { data: '02/01/2020', historico: 'EXTRATOmes(E)', valor: null },          // fragmento
      { data: '03/01/2020', historico: 'CREFISA SA CREDITO FINANCIAMENTO', valor: 0 }, // sem valor
      { data: '04/01/2020', historico: 'BRADESCO VIDA E PREVIDENCIA SA', valor: null }, // crédito/label
    ];
    const grouped = analyzeAll(txns);
    const flat = Object.values(grouped).flatMap(g => g.items);
    expect(flat).toHaveLength(1);
    expect(flat[0].valor).toBe(2.4);
    expect(grouped.credito_terceiros).toBeUndefined();
    expect(grouped.vida_prev).toBeUndefined();
  });
});
