// ATRIUM  Route serveur de capture des leads (M1)
// Le formulaire public N'ECRIT JAMAIS en direct dans la base : il passe par ici.
// On se connecte a Postgres avec une connexion privilegiee (pooler Supabase),
// ce qui contourne la RLS cote serveur, exactement comme prevu par le blueprint.
// Puis on notifie par email via Brevo. Aucun secret n'atteint le navigateur.

import { Pool } from "pg";

// Un seul pool reutilise entre invocations (Vercel garde la fonction chaude).
let pool;
function db() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 2,
    });
  }
  return pool;
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");

async function notifierBrevo(lead) {
  const key = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SENDER_EMAIL;
  const to = process.env.CONTACT_NOTIFY_TO;
  if (!key || !sender || !to) return; // notification best effort
  const html = `
    <h2>Nouveau contact ATRIUM</h2>
    <p><b>Profil :</b> ${lead.interet || "non precise"}</p>
    <p><b>Nom :</b> ${lead.nom}</p>
    <p><b>Email :</b> ${lead.email}</p>
    <p><b>Telephone :</b> ${lead.telephone || "-"}</p>
    <p><b>Ville du bien :</b> ${lead.ville_bien || "-"}</p>
    <p><b>Message :</b><br>${(lead.message || "-").replace(/</g, "&lt;")}</p>
    <hr><p style="color:#888">Lead enregistre dans la base ATRIUM (prospects).</p>`;
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: sender, name: "ATRIUM by Le Temple de l'Immobilier" },
      to: [{ email: to }],
      replyTo: { email: lead.email, name: lead.nom },
      subject: `Nouveau contact ATRIUM : ${lead.nom}${lead.ville_bien ? " (" + lead.ville_bien + ")" : ""}`,
      htmlContent: html,
    }),
  }).catch(() => {}); // ne jamais bloquer la reponse sur l'email
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const b = req.body || {};

  // Anti-spam : champ piege invisible. Un robot le remplit, un humain jamais.
  if (b.website) return res.status(200).json({ ok: true }); // on fait semblant d'accepter

  const nom = (b.nom || "").toString().trim().slice(0, 120);
  const email = (b.email || "").toString().trim().slice(0, 160);
  const telephone = (b.telephone || "").toString().trim().slice(0, 40);
  const ville_bien = (b.ville_bien || "").toString().trim().slice(0, 120);
  const message = (b.message || "").toString().trim().slice(0, 4000);
  const interet = ["bailleur", "locataire", "investisseur"].includes(b.interet) ? b.interet : null;
  const consent = b.consent === true || b.consent === "true" || b.consent === "on";

  if (!nom || !isEmail(email)) return res.status(400).json({ ok: false, error: "champs_invalides" });
  if (!consent) return res.status(400).json({ ok: false, error: "consentement_requis" });

  const client = await db().connect();
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
  } catch (e) {
    await client.query("rollback").catch(() => {});
    return res.status(500).json({ ok: false, error: "enregistrement_impossible" });
  } finally {
    client.release();
  }

  await notifierBrevo({ nom, email, telephone, ville_bien, message, interet });
  return res.status(200).json({ ok: true });
}
