export const santanderProfile = {
  id: "santander",
  name: "Santander",
  detect: (text) => /santander|contamax/i.test(text),
  supported: true,
  dateFormat: /^\d{2}\/\d{2}$/,
  headerPattern: /^nome$|^ag[eê]ncia$|^conta\s+corrente$|^movimenta[cç][aã]o$|saldo\s+de\s+contamax|saldo\s+dispon[ií]vel|limite\s+santander|provis[aã]o\s+de\s+encargos|santander\s+van\s+gogh|extrato\s+consolidado|pagina\s*:|reclama[cç][oõ]es|cancelamentos|consultas.*informa|twitter|facebook|www\.santander/i,
  summaryPattern: /^saldo\s+em\s+\d{2}\/\d{2}$|saldo\s+de\s+contamax|saldo\s+dispon[ií]vel|^\(\=\)|^\(\+\)|^\(\-\)/i,
  columnHeaders: {
    valor: /valor|d[eé]bito|cr[eé]dito/i,
    saldo: /saldo/i,
  },
};
