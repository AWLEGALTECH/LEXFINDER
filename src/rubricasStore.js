// Acesso às rubricas customizadas (self-service) — Supabase (projeto AW-ECO).
// Ferramenta interna com login próprio (cookie); usa a chave anon pública + RLS.
// Tabela: public.lexfinder_rubricas_custom
const SUPABASE_URL = "https://wvltdjspytysuoybcfgb.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bHRkanNweXR5c3VveWJjZmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNjAxNjEsImV4cCI6MjA5NDgzNjE2MX0.aTFKemNruwj70C3inSxfmz8DQm38ux9JGlq5GXuGL34";
const REST = `${SUPABASE_URL}/rest/v1/lexfinder_rubricas_custom`;

const headers = (extra = {}) => ({
  apikey: SUPABASE_ANON,
  Authorization: `Bearer ${SUPABASE_ANON}`,
  "Content-Type": "application/json",
  ...extra,
});

export async function fetchCustomRubricas() {
  const res = await fetch(`${REST}?select=*&order=criado_em.asc`, { headers: headers() });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return res.json();
}

export async function createCustomRubrica({ nome, sublabel, fundamento, keywords, nao_reembolsavel, amostras, criado_por }) {
  const body = {
    nome: nome.trim(),
    sublabel: sublabel || "",
    fundamento: fundamento || "Verificar legalidade da cobrança e autorização contratual.",
    keywords: keywords || [],
    nao_reembolsavel: !!nao_reembolsavel,
    amostras: amostras || [],
    criado_por: criado_por || "",
  };
  const res = await fetch(REST, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  return rows[0];
}

export async function updateCustomRubrica(id, patch) {
  const res = await fetch(`${REST}?id=eq.${id}`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify({ ...patch, atualizado_em: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const rows = await res.json();
  return rows[0];
}

export async function deleteCustomRubrica(id) {
  const res = await fetch(`${REST}?id=eq.${id}`, { method: "DELETE", headers: headers() });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
}
