export const itauProfile = {
  id: "itau",
  name: "Itaú",
  detect: (text) => /ita[uú]|itau/i.test(text),
  supported: false,
};
