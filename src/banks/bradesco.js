// Bradesco Celular bank profile
// Keywords are in the main CATEGORIAS array (parser.js) for now

export const bradescoProfile = {
  id: "bradesco",
  name: "Bradesco",
  detect: (text) => /bradesco/i.test(text),
  dateFormat: /^\d{2}\/\d{2}\/\d{4}$/,
  headerPattern: /bradesco\s+celular|extrato\s+de\s*:|folha\s*:\s*\d+\/\d+|data\s+hist[oó]rico|cr[eé]dito\s*\(r\$\)|d[eé]bito\s*\(r\$\)|saldo\s*\(r\$\)|movimenta[cç][aã]o\s+entre|transf\s+saldo\s+c\/sal\s+p\/cc|[uú]ltimos\s+lan[cç]amentos|total\s+data\s*:|^data\s*:\s*\d{2}\/\d{2}\/\d{4}|^nome\s*:\s*[A-Z]/i,
  summaryPattern: /^\s*total\b|\btotal\s*$|[uú]ltimos\s+lan[cç]amentos/i,
  columnHeaders: {
    credito: /^cr[eé]dito/i,
    debito: /^d[eé]bito/i,
    saldo: /^saldo/i,
  },
  supported: true,
};
