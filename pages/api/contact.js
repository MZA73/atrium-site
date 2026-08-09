// ATRIUM  Route serveur de capture des leads (M1) - version resiliente
// Le formulaire public N'ECRIT JAMAIS en direct dans la base : il passe par ici.
// Connexion Postgres privilegiee (pooler Supabase) => contourne la RLS cote
// serveur. Puis DEUX emails Brevo : accuse de reception au client + notification
// interne, tous deux a la charte noir & or ATRIUM.

import { Pool } from "pg";

let pool;
function db() {
  if (!pool) {
    const url = process.env.DATABASE_URL || "";
    const m = url.match(/^postgres(?:ql)?:\/\/([^:]+):.*@([^:\/]+):(\d+)\/([^?]+)/);
    const cfg = { ssl: { rejectUnauthorized: false }, max: 2, connectionTimeoutMillis: 8000 };
    if (m && process.env.DB_PASSWORD) {
      cfg.user = m[1];
      cfg.host = m[2];
      cfg.port = Number(m[3]);
      cfg.database = m[4];
      cfg.password = process.env.DB_PASSWORD;
    } else {
      cfg.connectionString = url;
    }
    pool = new Pool(cfg);
  }
  return pool;
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");
const esc = (v) =>
  String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------------------------------------------------------------------------
// Gabarit d'email premium (noir & or). Corps en serif, encart or, bandeaux noirs.
// ---------------------------------------------------------------------------
function emailShell({ preheader, bodyHtml }) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0d0d;">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:26px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:#f8f5ee;border:1px solid #c9a961;border-radius:14px;overflow:hidden;font-family:Georgia,'Times New Roman',serif;">
<tr><td style="background:#0d0d0d;padding:28px 34px;text-align:center;border-bottom:2px solid #c9a961;">
<div style="color:#c9a961;font-size:30px;letter-spacing:9px;font-weight:bold;font-family:Georgia,serif;">ATRIUM</div>
<div style="color:#b7ae98;font-size:13px;font-style:italic;letter-spacing:1px;margin-top:5px;">by Le Temple de l'Immobilier</div>
</td></tr>
<tr><td style="padding:34px 36px;color:#2a2620;">${bodyHtml}</td></tr>
<tr><td style="background:#0d0d0d;padding:22px 34px;text-align:center;">
<div style="color:#c9a961;font-size:12.5px;font-style:italic;">Dorénavant, la pierre ne vous laissera plus jamais de marbre.</div>
<div style="color:#7a7263;font-size:11.5px;margin-top:10px;line-height:1.7;">Le Temple de l'Immobilier &middot; 10 rue Saint-Jacques, 59500 Douai &middot; 03 27 95 61 14<br>Gestion locative premium à Douai &amp; sur le territoire national &middot; contact@templeimmo.com</div>
</td></tr>
</table>
</td></tr>
</table></body></html>`;
}

const PROFILS = { bailleur: "Propriétaire bailleur", investisseur: "Investisseur", locataire: "Locataire" };

function recapBox(rows) {
  const trs = rows
    .filter((r) => r[1])
    .map(
      (r) =>
        `<tr><td style="padding:7px 0;color:#8a8069;font-size:13px;width:120px;vertical-align:top;font-family:Arial,sans-serif;">${esc(r[0])}</td><td style="padding:7px 0;color:#2a2620;font-size:15px;vertical-align:top;">${r[2] ? r[1] : esc(r[1])}</td></tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #d8cba3;border-left:3px solid #c9a961;border-radius:8px;background:#fffdf8;"><tr><td style="padding:8px 20px;"><table width="100%" cellpadding="0" cellspacing="0">${trs}</table></td></tr></table>`;
}

// Accuse de reception envoye AU CLIENT
function emailClient(lead) {
  const profil = PROFILS[lead.interet] || "Votre projet";
  const body = `
<div style="color:#c9a961;letter-spacing:3px;font-size:11.5px;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:bold;">Accusé de réception</div>
<h1 style="font-family:Georgia,serif;color:#0d0d0d;font-size:26px;line-height:1.25;margin:12px 0 16px;">Merci, votre demande est bien arrivée.</h1>
<p style="font-size:16px;line-height:1.7;color:#3a362d;margin:0 0 14px;">Bonjour ${esc(lead.nom)},</p>
<p style="font-size:16px;line-height:1.7;color:#3a362d;margin:0 0 18px;">Nous avons bien reçu votre demande${lead.ville_bien ? " concernant votre bien à " + esc(lead.ville_bien) : ""}. Un conseiller ATRIUM vous recontacte <b>sous 24 heures ouvrées</b> pour en échanger, en toute sérénité et sans engagement.</p>
${recapBox([["Profil", profil], ["Ville du bien", lead.ville_bien], ["Votre message", lead.message]])}
<p style="font-size:14.5px;line-height:1.7;color:#5a5445;margin:0 0 18px;">Vingt ans d'expertise, plus de 2&nbsp;100 biens confiés. Vos loyers encaissés et sécurisés, vos impayés traités, votre fiscalité prise en charge&nbsp;: vous ne pensez plus à rien, nous gérons tout. Et lors de notre échange, votre estimation de loyer vous est offerte, sans engagement.</p>
<p style="font-size:15px;line-height:1.7;color:#3a362d;margin:0 0 22px;">Une question d'ici là&nbsp;? Écrivez-nous à <a href="mailto:contact@templeimmo.com" style="color:#a9853f;text-decoration:none;font-weight:bold;">contact@templeimmo.com</a> ou appelez le <a href="tel:0327956114" style="color:#a9853f;text-decoration:none;font-weight:bold;">03 27 95 61 14</a>.</p>
<div style="border-top:1px solid #d8cba3;padding-top:16px;font-size:15px;color:#3a362d;">Bien à vous,<br><b style="font-family:Georgia,serif;color:#0d0d0d;">L'équipe ATRIUM</b></div>`;
  return emailShell({ preheader: "Votre demande a bien été reçue. Un conseiller vous rappelle sous 24 h.", bodyHtml: body });
}

// Notification interne envoyee A L'EQUIPE
function emailInterne(lead, dateStr) {
  const profil = PROFILS[lead.interet] || "Non précisé";
  const body = `
<div style="color:#c9a961;letter-spacing:3px;font-size:11.5px;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:bold;">Nouveau lead &middot; ${esc(dateStr)}</div>
<h1 style="font-family:Georgia,serif;color:#0d0d0d;font-size:25px;margin:12px 0 4px;">${esc(lead.nom)}</h1>
<div style="display:inline-block;background:#0d0d0d;color:#c9a961;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:.5px;padding:5px 12px;border-radius:20px;">${esc(profil)}</div>
${recapBox([
    ["Email", `<a href="mailto:${esc(lead.email)}" style="color:#a9853f;text-decoration:none;">${esc(lead.email)}</a>`, true],
    ["Téléphone", lead.telephone || ""],
    ["Ville du bien", lead.ville_bien || ""],
    ["Message", lead.message || ""],
  ])}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;"><tr><td style="background:linear-gradient(180deg,#d8bd7e,#c9a961);border-radius:8px;">
<a href="mailto:${esc(lead.email)}" style="display:inline-block;padding:13px 26px;color:#0d0d0d;font-family:Arial,sans-serif;font-weight:bold;font-size:15px;text-decoration:none;">Répondre au prospect</a>
</td></tr></table>
<p style="font-size:13.5px;line-height:1.7;color:#8a8069;font-family:Arial,sans-serif;margin:0;border-top:1px solid #d8cba3;padding-top:14px;">Statut&nbsp;: <b style="color:#5a5445;">nouveau</b> &middot; enregistré dans la base ATRIUM (table prospects). Source&nbsp;: formulaire du site.</p>`;
  return emailShell({ preheader: `Nouveau contact : ${lead.nom}${lead.ville_bien ? " (" + lead.ville_bien + ")" : ""}`, bodyHtml: body });
}

async function envoyerBrevo({ to, subject, html, replyTo }) {
  const key = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SENDER_EMAIL;
  if (!key || !sender || !to) return;
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: sender, name: "ATRIUM by Le Temple de l'Immobilier" },
      to: [{ email: to }],
      ...(replyTo ? { replyTo } : {}),
      subject,
      htmlContent: html,
    }),
  }).catch(() => {});
}

async function notifier(lead) {
  const dateStr = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" });
  const notify = process.env.CONTACT_NOTIFY_TO;
  const jobs = [];
  // 1) Accuse de reception au client
  jobs.push(
    envoyerBrevo({
      to: lead.email,
      subject: "Votre demande a bien été reçue — ATRIUM by Le Temple de l'Immobilier",
      html: emailClient(lead),
      replyTo: { email: "contact@templeimmo.com", name: "ATRIUM" },
    })
  );
  // 2) Notification interne
  if (notify) {
    jobs.push(
      envoyerBrevo({
        to: notify,
        subject: `Nouveau lead ATRIUM : ${lead.nom}${lead.ville_bien ? " (" + lead.ville_bien + ")" : ""}`,
        html: emailInterne(lead, dateStr),
        replyTo: { email: lead.email, name: lead.nom },
      })
    );
  }
  await Promise.allSettled(jobs);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      config: {
        db: !!process.env.DATABASE_URL,
        dbPassword: !!process.env.DB_PASSWORD,
        brevoKey: !!process.env.BREVO_API_KEY,
        sender: !!process.env.BREVO_SENDER_EMAIL,
        notify: !!process.env.CONTACT_NOTIFY_TO,
      },
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, GET");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true }); // honeypot

  const nom = (b.nom || "").toString().trim().slice(0, 120);
  const email = (b.email || "").toString().trim().slice(0, 160);
  const telephone = (b.telephone || "").toString().trim().slice(0, 40);
  const ville_bien = (b.ville_bien || "").toString().trim().slice(0, 120);
  const message = (b.message || "").toString().trim().slice(0, 4000);
  const interet = ["bailleur", "locataire", "investisseur"].includes(b.interet) ? b.interet : null;
  const consent = b.consent === true || b.consent === "true" || b.consent === "on";

  if (!nom || !isEmail(email)) return res.status(400).json({ ok: false, error: "champs_invalides" });
  if (!consent) return res.status(400).json({ ok: false, error: "consentement_requis" });

  let client;
  try {
    client = await db().connect();
    try {
      await client.query("begin");
      const c = await client.query(
        `insert into contacts (kind, nom, email, telephone, ville)
         values ('personne', $1, $2, $3, $4) returning id`,
        [nom, email, telephone || null, ville_bien || null]
      );
      const contactId = c.rows[0].id;
      await client.query(
        `insert into prospect_profiles (contact_id, source, interet, ville_bien, message, statut, consentement_at)
         values ($1, 'site-formulaire', $2, $3, $4, 'nouveau', now())`,
        [contactId, interet, ville_bien || null, message || null]
      );
      await client.query("commit");
    } finally {
      client.release();
    }
  } catch (e) {
    return res.status(500).json({ ok: false, error: "db", code: e && e.code ? String(e.code) : "unknown" });
  }

  await notifier({ nom, email, telephone, ville_bien, message, interet });
  return res.status(200).json({ ok: true });
}
