// Vercel Routing Middleware — runs BEFORE any static file is served.
// If the user has no valid session cookie, they get a login page (not the SPA).
import { next } from "@vercel/functions";

export const config = {
  matcher: ["/((?!api|_vercel|favicon\\.svg|favicon\\.ico).*)"],
};

function getCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  const match = header.split(";").map(s => s.trim()).find(s => s.startsWith(name + "="));
  return match ? match.slice(name.length + 1) : null;
}

export default async function middleware(request) {
  const cookie = getCookie(request, "lf_session");

  if (cookie) {
    const dot = cookie.indexOf(".");
    if (dot > 0) {
      const ts = cookie.slice(0, dot);
      const sig = cookie.slice(dot + 1);
      const secret = process.env.AUTH_SECRET;
      if (secret) {
        const key = await crypto.subtle.importKey(
          "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
        );
        const expected = Array.from(new Uint8Array(
          await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ts))
        )).map(b => b.toString(16).padStart(2, "0")).join("");

        const age = Date.now() - Number(ts);
        if (sig === expected && age >= 0 && age < 86400000) {
          return next();  // valid session — serve the SPA normally
        }
      }
    }
  }

  // No valid session — return inline login page
  return new Response(LOGIN_HTML, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

const LOGIN_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>LEX FINDER - Login</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;background:radial-gradient(ellipse 80% 50% at 50% 20%,rgba(59,130,246,0.1) 0%,transparent 60%),#020617;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif}
.card{width:100%;max-width:400px;padding:0 1rem;animation:slideUp 0.4s ease}
.logo{text-align:center;margin-bottom:32px}
.logo-icon{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#fff;box-shadow:0 0 32px rgba(59,130,246,0.5);margin-bottom:16px}
.logo-title{font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:-0.5px}
.logo-sub{font-size:13px;color:#475569;margin-top:4px}
form{background:rgba(12,19,35,0.7);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.5)}
label{display:block;font-size:0.68rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#475569;margin-bottom:8px}
input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px 14px;color:#f1f5f9;font-size:0.9rem;font-family:Inter,sans-serif;outline:none;transition:border-color 0.2s}
input:focus{border-color:rgba(59,130,246,0.5)}
.field{margin-bottom:18px}
.field-pass{margin-bottom:22px;position:relative}
.toggle-pass{position:absolute;right:10px;top:38px;background:none;border:none;color:#475569;cursor:pointer;padding:4px;font-size:16px}
.error{margin-bottom:14px;padding:10px 14px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:8px;color:#f87171;font-size:0.78rem;font-weight:600;display:none}
.error.show{display:block}
button[type=submit]{width:100%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border:none;border-radius:10px;padding:13px;color:#fff;font-size:0.85rem;font-weight:700;letter-spacing:0.5px;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 20px rgba(59,130,246,0.4)}
button[type=submit]:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(59,130,246,0.5)}
button[type=submit]:disabled{background:rgba(255,255,255,0.04);color:#475569;cursor:not-allowed;box-shadow:none;transform:none}
@keyframes slideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-icon">&sect;</div>
    <div class="logo-title">LEX FINDER</div>
    <div class="logo-sub">An&aacute;lise de Descontos Indevidos</div>
  </div>
  <form id="loginForm">
    <div class="field">
      <label>E-mail</label>
      <input type="email" id="email" placeholder="seu@email.com" autocomplete="email" required>
    </div>
    <div class="field-pass">
      <label>Senha</label>
      <input type="password" id="pass" placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" autocomplete="current-password" required>
      <button type="button" class="toggle-pass" onclick="togglePass()">&#128065;</button>
    </div>
    <div class="error" id="errBox"></div>
    <button type="submit" id="submitBtn">Entrar</button>
  </form>
</div>
<script>
let attempts=0;
function togglePass(){const p=document.getElementById("pass");p.type=p.type==="password"?"text":"password"}
document.getElementById("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(attempts>=5)return;
  const btn=document.getElementById("submitBtn");
  btn.textContent="Verificando...";btn.disabled=true;
  const err=document.getElementById("errBox");
  err.classList.remove("show");
  try{
    const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:document.getElementById("email").value,pass:document.getElementById("pass").value})});
    if(r.ok){window.location.reload();return}
    attempts++;
    const d=await r.json().catch(()=>({}));
    err.textContent=attempts>=5?"Acesso bloqueado. Recarregue a p\\u00e1gina.":(d.error||"E-mail ou senha incorretos.");
    err.classList.add("show");
  }catch{err.textContent="Erro de conex\\u00e3o.";err.classList.add("show")}
  btn.textContent="Entrar";btn.disabled=attempts>=5;
});
</script>
</body>
</html>`;
