// ATRIUM — vérification publique d'une signature électronique.
// Lecture serveur (pooler privilégié) => contourne la RLS, ne renvoie que
// des informations non sensibles permettant de confirmer l'authenticité.
import { Pool } from "pg";

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

const TYPES = { bail: "Bail", quittance: "Quittance de loyer", releve: "Relevé de gérance", avis: "Avis", diagnostic: "Diagnostic", etat_des_lieux: "État des lieux", mandat: "Mandat de gestion", autre: "Document" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHORT = /^[0-9a-f]{8}$/i; // reference publiee (8 hexa, affichee au client)

// Ne renvoie que les initiales du signataire (RGPD : pas de nom complet en clair).
function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  return parts.map((p) => p[0].toUpperCase() + ".").join(" ");
}

export default async function handler(req, res) {
  const ref = (req.query.ref || req.query.id || "").toString().trim().toLowerCase();
  if (!ref) return res.status(400).json({ ok: false, error: "ref_manquante" });
  // Anti-enumeration : on n'accepte QUE l'UUID complet ou une reference d'EXACTEMENT
  // 8 hexa (recherche exacte, pas un prefixe court). Tout le reste est refuse.
  const isUuid = UUID.test(ref);
  const isShort = SHORT.test(ref);
  if (!isUuid && !isShort) return res.status(400).json({ ok: false, error: "ref_invalide" });
  let client;
  try {
    client = await db().connect();
    const r = await client.query(
      isUuid
        ? `select s.id, s.signed_by_name, s.signed_at, d.type
             from signatures s join documents d on d.id = s.document_id
            where s.id = $1 limit 1`
        : `select s.id, s.signed_by_name, s.signed_at, d.type
             from signatures s join documents d on d.id = s.document_id
            where left(s.id::text, 8) = $1 order by s.signed_at desc limit 1`,
      [ref]
    );
    client.release();
    if (!r.rows.length) return res.status(200).json({ ok: true, found: false });
    const row = r.rows[0];
    // On renvoie de quoi CONFIRMER l'authenticite, sans divulguer de donnee personnelle
    // en clair : initiales, date, type d'acte, reference. Aucune IP retournee.
    return res.status(200).json({
      ok: true, found: true,
      signataire: initials(row.signed_by_name),
      date: new Date(row.signed_at).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long", timeStyle: "short" }),
      type: TYPES[row.type] || "Document",
      ref: row.id.slice(0, 8).toUpperCase(),
    });
  } catch (e) {
    try { client && client.release(); } catch {}
    return res.status(500).json({ ok: false, error: "db" });
  }
}
