export const caixaProfile = {
  id: "caixa",
  name: "Caixa Econômica Federal",
  detect: (text) => /caixa\s+econ[oô]mica|caixa\s+federal|cef\b/i.test(text),
  supported: false,
};
