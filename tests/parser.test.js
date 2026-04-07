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
  it('has 15 categories', () => {
    expect(CATEGORIAS).toHaveLength(22);
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
