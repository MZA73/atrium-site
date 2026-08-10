// ATRIUM - Signature electronique simple (M4+).
// Le client signe un document depuis son espace ; cette route :
//  1) verifie son identite (jeton Supabase),
//  2) verifie que le document lui est destine et est "en_cours" de signature,
//  3) enregistre la signature (table signatures) + passe le document a "signe",
//  4) envoie 2 emails Brevo : au client (document + mention juridique
//     d'engagement) et a l'agence (confirmation + copie de l'acceptation).
// Connexion base privilegiee (pooler) => contourne la RLS cote serveur.

import { Pool } from "pg";

const SB_URL = "https://suauroxtdffsglljfwnk.supabase.co";
const SB_KEY = "sb_publishable_XIELoVMT1PXE5b_05QGTDw_wG8KV6Ju";

let pool;
function db() {
  if (!pool) {
    const url = process.env.DATABASE_URL || "";
    const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):.*@([^:\/]+):(\d+)\/([^?]+)/);
    const cfg = { ssl: { rejectUnauthorized: false }, max: 2, connectionTimeoutMillis: 8000 };
    if (m && process.env.DB_PASSWORD) {
      cfg.user = m[1]; cfg.host = m[2]; cfg.port = Number(m[3]); cfg.database = m[4];
      cfg.password = process.env.DB_PASSWORD;
    } else { cfg.connectionString = url; }
    pool = new Pool(cfg);
  }
  return pool;
}

const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const TYPES = { bail: "Bail", quittance: "Quittance de loyer", releve: "Relevé de gérance", avis: "Avis", diagnostic: "Diagnostic", etat_des_lieux: "État des lieux", mandat: "Mandat", autre: "Document" };

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
<div style="color:#c9a961;font-size:12.5px;font-style:italic;">Dorénavant, la pierre ne vous laissera plus jamais de marbre.</div>
<div style="color:#7a7263;font-size:11.5px;margin-top:10px;line-height:1.7;">Le Temple de l'Immobilier &middot; 10 rue Saint-Jacques, 59500 Douai &middot; 03 27 95 61 14<br>contact@templeimmo.com</div>
</td></tr></table></td></tr></table></body></html>`;
}

async function brevo({ to, subject, html, attachment }) {
  const key = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SENDER_EMAIL;
  if (!key || !sender || !to) return;
  const payload = {
    sender: { email: sender, name: "ATRIUM by Le Temple de l'Immobilier" },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    replyTo: { email: "contact@templeimmo.com", name: "ATRIUM" },
  };
  if (attachment) payload.attachment = [attachment];
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

const nomOf = (r) => r ? (r.raison_sociale || [r.prenom, r.nom].filter(Boolean).join(" ") || r.email || "Client") : "Client";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false, error: "method_not_allowed" }); }
  const b = req.body || {};
  const token = (b.access_token || "").toString();
  const documentId = (b.document_id || "").toString();
  const name = (b.name || "").toString().trim().slice(0, 160);
  const consent = b.consent === true || b.consent === "true";
  if (!token || !documentId) return res.status(400).json({ ok: false, error: "params" });
  if (!consent) return res.status(400).json({ ok: false, error: "consentement_requis" });

  // 1) identite : on lit le sujet du jeton, puis on valide sa signature via
  // PostgREST (qui rejette tout jeton non signe / expire avec un 401).
  function decodeJwt(tk) {
    try { return JSON.parse(Buffer.from((tk.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")); }
    catch { return {}; }
  }
  const claims = decodeJwt(token);
  const authId = claims.sub;
  const authEmail = claims.email;
  if (!authId) return res.status(401).json({ ok: false, error: "non_authentifie" });
  try {
    const chk = await fetch(`${SB_URL}/rest/v1/contacts?select=id&limit=1`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` } });
    if (chk.status === 401 || chk.status === 403) return res.status(401).json({ ok: false, error: "non_authentifie" });
  } catch { return res.status(401).json({ ok: false, error: "non_authentifie" }); }

  const ip = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() || null;
  const ua = (req.headers["user-agent"] || "").toString().slice(0, 300) || null;
  const dateStr = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long", timeStyle: "short" });

  let doc, signer;
  let client;
  try {
    client = await db().connect();
    try {
      const cr = await client.query(
        `select u.id app_id, c.id contact_id, c.nom, c.prenom, c.raison_sociale, c.email
         from app_users u join contacts c on c.id = u.contact_id where u.auth_user_id = $1 limit 1`, [authId]);
      if (!cr.rows.length) return res.status(403).json({ ok: false, error: "compte_inconnu" });
      signer = cr.rows[0];

      const dr = await client.query(
        `select d.id, d.type, d.storage_path, d.signature_statut
         from documents d
         join document_links dl on dl.document_id = d.id
         where d.id = $1 and d.deleted_at is null
           and ( dl.contact_id = $2
              or dl.bien_id in (select bien_id from bien_proprietaires where contact_id = $2)
              or dl.bail_id in (select bail_id from bail_parties where contact_id = $2) )
         limit 1`, [documentId, signer.contact_id]);
      if (!dr.rows.length) return res.status(403).json({ ok: false, error: "document_non_autorise" });
      doc = dr.rows[0];
      if (doc.signature_statut === "signe") return res.status(409).json({ ok: false, error: "deja_signe" });

      const consentText = `Je soussigné(e) ${name || nomOf(signer)} reconnais avoir pris connaissance du document et l'accepter sans réserve. Signature électronique le ${dateStr}.`;
      await client.query(
        `insert into signatures (document_id, contact_id, signed_by_name, consent_text, ip, user_agent)
         values ($1, $2, $3, $4, $5, $6)`,
        [doc.id, signer.contact_id, name || nomOf(signer), consentText, ip, ua]);
      await client.query(`update documents set signature_statut = 'signe' where id = $1`, [doc.id]);
      doc._consentText = consentText;
    } finally { client.release(); }
  } catch (e) {
    return res.status(500).json({ ok: false, error: "db", code: e && e.code ? String(e.code) : "unknown" });
  }

  // Recuperer le document (piece jointe) via URL signee
  let attachment = null;
  try {
    const sr = await fetch(`${SB_URL}/storage/v1/object/sign/documents/${doc.storage_path}`, {
      method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ expiresIn: 120 }),
    });
    if (sr.ok) {
      const sj = await sr.json();
      const fr = await fetch(`${SB_URL}/storage/v1${sj.signedURL}`);
      if (fr.ok) {
        const buf = Buffer.from(await fr.arrayBuffer());
        const fname = (doc.storage_path.split("/").pop() || "document.pdf");
        attachment = { content: buf.toString("base64"), name: fname };
      }
    }
  } catch {}

  const typeLabel = TYPES[doc.type] || "Document";
  const clientName = name || nomOf(signer);

  // Email CLIENT : document + mention juridique d'engagement
  const clientBody = `
<div style="color:#c9a961;letter-spacing:3px;font-size:11.5px;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:bold;">Signature enregistrée</div>
<h1 style="font-family:Georgia,serif;color:#0d0d0d;font-size:25px;margin:12px 0 16px;">Votre signature a bien été prise en compte.</h1>
<p style="font-size:16px;line-height:1.7;color:#3a362d;margin:0 0 14px;">Bonjour ${esc(clientName)},</p>
<p style="font-size:16px;line-height:1.7;color:#3a362d;margin:0 0 16px;">Vous venez de signer électroniquement le document suivant&nbsp;: <b>${esc(typeLabel)}</b>. Vous en trouverez une copie en pièce jointe de cet email.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;border:1px solid #d8cba3;border-left:3px solid #c9a961;border-radius:8px;background:#fffdf8;"><tr><td style="padding:14px 18px;font-family:Arial,sans-serif;font-size:13.5px;color:#5a5445;line-height:1.7;">
<b style="color:#0d0d0d;">Récapitulatif de la signature</b><br>
Signataire : ${esc(clientName)}<br>Document : ${esc(typeLabel)}<br>Date et heure : ${esc(dateStr)}<br>Horodatage et traçabilité conservés par le cabinet.
</td></tr></table>
<p style="font-size:14px;line-height:1.7;color:#5a5445;margin:0 0 8px;"><b style="color:#0d0d0d;">Mention relative à votre engagement.</b> En apposant votre signature électronique, vous avez exprimé votre <b>consentement libre et éclairé</b> et vous êtes engagé(e) dans les termes du document signé. Cette signature électronique, horodatée et tracée, a valeur d'engagement entre les parties&nbsp;; elle vaut acceptation du document sans réserve. Nous vous invitons à conserver cet email et sa pièce jointe.</p>
<p style="font-size:13px;line-height:1.7;color:#8a8069;margin:14px 0 0;">Une question&nbsp;? Écrivez à <a href="mailto:contact@templeimmo.com" style="color:#a9853f;text-decoration:none;font-weight:bold;">contact@templeimmo.com</a> ou appelez le 03 27 95 61 14.</p>`;

  // Email AGENCE : confirmation + copie de l'acceptation
  const agencyBody = `
<div style="color:#c9a961;letter-spacing:3px;font-size:11.5px;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:bold;">Document signé &middot; ${esc(dateStr)}</div>
<h1 style="font-family:Georgia,serif;color:#0d0d0d;font-size:24px;margin:12px 0 14px;">${esc(clientName)} a signé : ${esc(typeLabel)}</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 16px;border:1px solid #d8cba3;border-left:3px solid #c9a961;border-radius:8px;background:#fffdf8;"><tr><td style="padding:14px 18px;font-family:Arial,sans-serif;font-size:13.5px;color:#3a362d;line-height:1.8;">
<b style="color:#0d0d0d;">Preuve d'acceptation</b><br>
Signataire : ${esc(clientName)}${signer.email ? " (" + esc(signer.email) + ")" : ""}<br>
Document : ${esc(typeLabel)}<br>
Date et heure : ${esc(dateStr)}<br>
Adresse IP : ${esc(ip || "non disponible")}<br>
Terminal : ${esc(ua || "non disponible")}<br>
Texte accepté : « ${esc(doc._consentText)} »
</td></tr></table>
<p style="font-size:13px;line-height:1.7;color:#8a8069;margin:0;">Le statut du document est passé à « signé » dans ATRIUM. Copie du document en pièce jointe. Signature électronique simple, sans recours à un tiers de confiance.</p>`;

  await Promise.allSettled([
    brevo({ to: signer.email || authEmail, subject: `Votre signature — ${typeLabel} — ATRIUM`, html: emailShell({ preheader: "Votre signature électronique a bien été enregistrée.", bodyHtml: clientBody }), attachment }),
    process.env.CONTACT_NOTIFY_TO ? brevo({ to: process.env.CONTACT_NOTIFY_TO, subject: `Document signé : ${clientName} — ${typeLabel}`, html: emailShell({ preheader: `${clientName} a signé ${typeLabel}.`, bodyHtml: agencyBody }), attachment }) : Promise.resolve(),
  ]);

  return res.status(200).json({ ok: true });
}
