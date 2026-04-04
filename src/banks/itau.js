export const itauProfile = {
  id: "itau",
  name: "Itaú",
  detect: (text) => /ita[uú]|itau|combinaqui|periodo\s+de\s+visualiza|extrato\s+conta\s*\/\s*lan[cç]amentos|limite\s+da\s+conta\s+(utilizado|dispon)/i.test(text),
  supported: true,
  dateFormat: /^\d{2}\/\d{2}\/\d{4}$/,
  headerPattern: /extrato\s+conta\s*\/|^lancamentos$|periodo\s+de\s+visualizacao|saldo\s+em\s+conta|limite\s+da\s+conta|emitido\s+em|agencia:\s*\d|conta:\s*\d|valor\s*\(r\$\)|saldo\s*\(r\$\)|aviso!|itau\s+unibanco/i,
  summaryPattern: /saldo\s+do\s+dia|saldo\s+anterior|saldo\s+final|saldo\s+em\s+conta|aviso!/i,
  columnHeaders: {
    valor: /^valor\s*\(r\$\)/i,
    saldo: /^saldo\s*\(r\$\)/i,
  },
};
