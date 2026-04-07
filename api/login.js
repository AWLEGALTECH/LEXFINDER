// Vercel Serverless Function — POST /api/login
// Validates credentials server-side and sets httpOnly session cookie.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, pass } = req.body || {};
  if (!email || !pass) {
    return res.status(400).json({ error: "E-mail e senha obrigatórios." });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Configuração do servidor incompleta." });
  }

  // Hash credentials to compare with stored hashes
  const emailHash = await sha256(email.trim().toLowerCase());
  const passHash = await sha256(pass);

  const HASH_EMAIL = "fc401c95244b15a0bb7398cf3983130bd130c4149036feec6413bed10311c0a8";
  const HASH_PASS  = "662fd63627ae81b42aa9ff339dd96a7e47f306c79aa1478c0dc083562696db53";

  if (emailHash !== HASH_EMAIL || passHash !== HASH_PASS) {
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }

  // Generate session token: timestamp.hmac(timestamp, secret)
  const ts = String(Date.now());
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = Array.from(new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ts))
  )).map(b => b.toString(16).padStart(2, "0")).join("");

  const token = `${ts}.${sig}`;

  res.setHeader("Set-Cookie", `lf_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`);
  return res.status(200).json({ ok: true });
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
