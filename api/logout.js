// Vercel Serverless Function — GET/POST /api/logout
// Clears the session cookie and redirects to root.

export default function handler(req, res) {
  res.setHeader("Set-Cookie", "lf_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
  res.writeHead(302, { Location: "/" });
  res.end();
}
