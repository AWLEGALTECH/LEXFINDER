export const santanderProfile = {
  id: "santander",
  name: "Santander",
  detect: (text) => /santander/i.test(text),
  supported: false,
};
