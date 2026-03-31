import { bradescoProfile } from "./bradesco.js";
import { itauProfile } from "./itau.js";
import { bbProfile } from "./bb.js";
import { caixaProfile } from "./caixa.js";
import { santanderProfile } from "./santander.js";

export const BANK_PROFILES = [
  bradescoProfile,
  itauProfile,
  bbProfile,
  caixaProfile,
  santanderProfile,
];

export function detectBank(text) {
  for (const profile of BANK_PROFILES) {
    if (profile.detect(text)) return profile;
  }
  return bradescoProfile; // fallback
}
