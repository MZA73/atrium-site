// ATRIUM - Notification de finalisation d'un bail signe.
// Appele par /finaliser-bail apres apposition du cachet agence : envoie a
// chaque partie (et a l'agence) le PDF signe definitif, par email Brevo.
// Reserve aux administrateurs (verif has_role admin via PostgREST).

import { Pool } from "pg";

const SB_URL = "https://suauroxtdffsglljfwnk.supabase.co";
const SB_KEY = "sb_publishable_XIELoVMT1PXE5b_05QGTDw_wG8KV6Ju";

let pool;
function db() {
  if (!pool) {
    const url = process.env.DATABASE_URL || "";
    const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):.*@([^:\/]+):(\d+)\/([^?]+)/);
    const cfg = { ssl: { rejectUnauthorized: false }, max: 2, connectionTimeoutMillis: 8000 };
    if (m && process.env.DB_PASSWORD) { cfg.user = m[1]; cfg.host = m[2]; cfg.port = Number(m[3]); cfg.database = m[4]; cfg.password = process.env.DB_PASSWORD; }
    else { cfg.connectionString = url; }
    pool = new Pool(cfg);
  }
  return pool;
}

const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function emailShell({ preheader, bodyHtml }) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0d0d;">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:26px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:#f8f5ee;border:1px solid #c9a961;border-radius:14px;overflow:hidden;font-family:Georgia,'Times New Roman',serif;">
<tr><td style="background:#0d0d0d;padding:28px 34px;text-align:center;border-bottom:2px solid #c9a961;">
<div style="color:#c9a961;font-size:30px;letter-spacing:9px;font-weight:bold;">ATRIUM</div>
<div style="color:#b7ae98;font-size:13px;font-style:italic;letter-spacing:1px;margin-top:5px;">by Le Temple de l'Immobilier</div>
</td></tr>
<tr><td style="padding:34px 36px;color:#2a2620;">${bodyHtml}</td></tr>
<tr><td style="background:#0d0d0d;padding:22px 34px;text-align:center;">
<div style="color:#c9a961;font-size:12.5px;font-style:italic;">Dorenavant, la pierre ne vous laissera plus jamais de marbre.</div>
<div style="color:#7a7263;font-size:11.5px;margin-top:10px;line-height:1.7;">Le Temple de l'Immobilier &middot; 10 rue Saint-Jacques, 59500 Douai &middot; 03 27 95 61 14<br>contact@templeimmo.com</div>
</td></tr></table></td></tr></table></body></html>`;
}

async function brevo({ to, subject, html, attachment }) {
  const key = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SENDER_EMAIL;
  if (!key || !sender || !to) return;
  const payload = { sender: { email: sender, name: "ATRIUM by Le Temple de l'Immobilier" }, to: [{ email: to }], subject, htmlContent: html, replyTo: { email: "contact@templeimmo.com", name: "ATRIUM" } };
  if (attachment) payload.attachment = [attachment];
  await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": key, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) }).catch(() => {});
}

const nomOf = (r) => r ? (r.raison_sociale || [r.prenom, r.nom].filter(Boolean).join(" ") || r.email || "Client") : "Client";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false, error: "method_not_allowed" }); }
  const b = req.body || {};
  const token = (b.access_token || "").toString();
  const documentId = (b.document_id || "").toString();
  if (!token || !documentId) return res.status(400).json({ ok: false, error: "params" });

  // Autorisation : administrateur uniquement (fonction SQL has_role)
  try {
    const hr = await fetch(`${SB_URL}/rest/v1/rpc/has_role`, { method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ r: "admin" }) });
    const isAdmin = hr.ok && (await hr.json()) === true;
    if (!isAdmin) return res.status(403).json({ ok: false, error: "non_autorise" });
  } catch { return res.status(401).json({ ok: false, error: "non_authentifie" }); }

  let doc, parties;
  let client;
  try {
    client = await db().connect();
    try {
      const dr = await client.query(`select id, storage_path from documents where id = $1 and deleted_at is null limit 1`, [documentId]);
      if (!dr.rows.length) return res.status(404).json({ ok: false, error: "document_inconnu" });
      doc = dr.rows[0];
      const pr = await client.query(
        `select distinct c.email, c.nom, c.prenom, c.raison_sociale
         from document_links dl join contacts c on c.id = dl.contact_id
         where dl.document_id = $1 and c.email is not null`, [documentId]);
      parties = pr.rows;
    } finally { client.release(); }
  } catch (e) { return res.status(500).json({ ok: false, error: "db", code: e && e.code ? String(e.code) : "unknown" }); }

  // Recuperer le PDF signe final (URL signee, token cabinet)
  let attachment = null;
  try {
    const sr = await fetch(`${SB_URL}/storage/v1/object/sign/documents/${doc.storage_path}`, { method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ expiresIn: 120 }) });
    if (sr.ok) { const sj = await sr.json(); const fr = await fetch(`${SB_URL}/storage/v1${sj.signedURL}`); if (fr.ok) { const buf = Buffer.from(await fr.arrayBuffer()); attachment = { content: buf.toString("base64"), name: (doc.storage_path.split("/").pop() || "bail-signe.pdf") }; } }
  } catch {}

  const body = (name) => `
<div style="color:#c9a961;letter-spacing:3px;font-size:11.5px;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:bold;">Bail signé</div>
<h1 style="font-family:Georgia,serif;color:#0d0d0d;font-size:24px;margin:12px 0 14px;">Votre bail est signé et finalisé.</h1>
<p style="font-size:16px;line-height:1.7;color:#3a362d;margin:0 0 14px;">Bonjour ${esc(name)},</p>
<p style="font-size:15px;line-height:1.7;color:#3a362d;margin:0 0 14px;">Toutes les parties ont signé et le cabinet a apposé son cachet. Vous trouverez en pièce jointe l'exemplaire du bail signé, revêtu des signatures et du cachet de l'agence.</p>
<p style="font-size:13px;line-height:1.7;color:#8a8069;margin:14px 0 0;">Conservez cet email et sa pièce jointe. Une question&nbsp;? <a href="mailto:contact@templeimmo.com" style="color:#a9853f;font-weight:bold;text-decoration:none;">contact@templeimmo.com</a> · 03 27 95 61 14.</p>`;

  const jobs = [];
  for (const p of parties) jobs.push(brevo({ to: p.email, subject: "Votre bail signé — ATRIUM", html: emailShell({ preheader: "Votre bail signé et finalisé.", bodyHtml: body(nomOf(p)) }), attachment }));
  if (process.env.CONTACT_NOTIFY_TO) jobs.push(brevo({ to: process.env.CONTACT_NOTIFY_TO, subject: "Bail finalisé (cachet apposé)", html: emailShell({ preheader: "Un bail a été finalisé.", bodyHtml: body("le cabinet") }), attachment }));
  await Promise.allSettled(jobs);

  return res.status(200).json({ ok: true, notified: parties.length });
}
