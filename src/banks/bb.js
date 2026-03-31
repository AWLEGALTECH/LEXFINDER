export const bbProfile = {
  id: "bb",
  name: "Banco do Brasil",
  detect: (text) => /banco\s+do\s+brasil|bb\s+celular/i.test(text),
  supported: false,
};
