import Head from "next/head";
import { useEffect, useState, useCallback } from "react";

/*
  ATRIUM - Cockpit admin (M2, v0).
  Page autonome, sans dependance npm : parle a Supabase via l'API REST/Auth
  (fetch natif). La securite reelle est assuree par la RLS PostgreSQL cote
  base (has_role('admin')). La cle ci-dessous est la cle PUBLIABLE, concue
  pour vivre dans le navigateur.
*/

const SB_URL = "https://suauroxtdffsglljfwnk.supabase.co";
const SB_KEY = "sb_publishable_XIELoVMT1PXE5b_05QGTDw_wG8KV6Ju";
const STORE = "atrium_admin_session";

const OR = "#C9A961";
const NOIR = "#0D0D0D";

// ---- helpers date (ISO) ----
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// ---- session ----
function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(STORE) || "null");
  } catch {
    return null;
  }
}
function saveSession(s) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE, JSON.stringify(s));
}
function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORE);
}

const PIPELINE = [
  { key: "nouveau", label: "Nouveau" },
  { key: "contacte", label: "Contacté" },
  { key: "rendez_vous", label: "Rendez-vous" },
  { key: "mandat_signe", label: "Mandat signé" },
];

export default function Admin() {
  const [session, setSession] = useState(null);
  const [phase, setPhase] = useState("boot"); // boot | login | denied | ready
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [kpis, setKpis] = useState(null);
  const [prospects, setProspects] = useState([]);

  // renvoie un access_token valide (rafraichit si besoin)
  const validToken = useCallback(async (s) => {
    if (!s) return null;
    const now = Math.floor(Date.now() / 1000);
    if (s.expires_at && now < s.expires_at - 30) return s.access_token;
    // refresh
    const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: SB_KEY },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const ns = {
      access_token: j.access_token,
      refresh_token: j.refresh_token,
      expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
      email: s.email,
    };
    saveSession(ns);
    setSession(ns);
    return ns.access_token;
  }, []);

  const rest = useCallback(
    async (pathQ, s, { count } = {}) => {
      const token = await validToken(s);
      if (!token) throw new Error("session_expiree");
      const headers = {
        apikey: SB_KEY,
        Authorization: `Bearer ${token}`,
      };
      if (count) headers.Prefer = "count=exact";
      const r = await fetch(`${SB_URL}/rest/v1/${pathQ}`, { headers });
      if (r.status === 401) throw new Error("session_expiree");
      if (count) {
        const cr = r.headers.get("content-range") || "*/0";
        const total = cr.split("/")[1];
        return total === "*" ? 0 : parseInt(total, 10) || 0;
      }
      return r.json();
    },
    [validToken]
  );

  const rpc = useCallback(
    async (fn, body, s) => {
      const token = await validToken(s);
      const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body || {}),
      });
      if (!r.ok) return null;
      return r.json();
    },
    [validToken]
  );

  const loadData = useCallback(
    async (s) => {
      const c = (q) => rest(q, s, { count: true });
      const today = startOfToday();
      const week = startOfWeek();
      const month = startOfMonth();
      const td = todayDate();

      const [
        pJour,
        pSemaine,
        aContacter,
        rdv,
        tachesRetard,
        actionsUrgentes,
        mandatsActifs,
        biensVacants,
      ] = await Promise.all([
        c(`prospect_profiles?select=contact_id&created_at=gte.${today}&limit=1`),
        c(`prospect_profiles?select=contact_id&created_at=gte.${week}&limit=1`),
        c(`prospect_profiles?select=contact_id&statut=eq.nouveau&limit=1`),
        c(`prospect_profiles?select=contact_id&statut=eq.rendez_vous&limit=1`),
        c(`tasks?select=id&status=in.(a_faire,en_cours)&due_date=lt.${td}&limit=1`),
        c(`tasks?select=id&status=in.(a_faire,en_cours)&due_date=lte.${td}&limit=1`),
        c(`mandats?select=id&statut=eq.actif&limit=1`),
        c(`biens?select=id&statut=eq.vacant&limit=1`),
      ]);

      // mandats signes ce mois
      const mandatsMois = await c(
        `mandats?select=id&signature_statut=eq.signe&date_signature=gte.${month.slice(0, 10)}&limit=1`
      );

      // CA potentiel = somme des honoraires des mandats en projet/actif
      let caPotentiel = 0;
      try {
        const rows = await rest(
          `mandats?select=honoraires&statut=in.(projet,actif)`,
          s
        );
        if (Array.isArray(rows))
          caPotentiel = rows.reduce((a, r) => a + (Number(r.honoraires) || 0), 0);
      } catch {}

      setKpis({
        pJour,
        pSemaine,
        aContacter,
        rdv,
        tachesRetard,
        actionsUrgentes,
        mandatsActifs,
        mandatsMois,
        biensVacants,
        caPotentiel,
      });

      // pipeline : prospects + contact embarque
      const list = await rest(
        `prospect_profiles?select=contact_id,statut,interet,ville_bien,score,created_at,contacts(nom,prenom,raison_sociale,email,telephone)&order=created_at.desc&limit=200`,
        s
      );
      setProspects(Array.isArray(list) ? list : []);
    },
    [rest]
  );

  const boot = useCallback(
    async (s) => {
      setErr("");
      try {
        const admin = await rpc("has_role", { r: "admin" }, s);
        if (admin !== true) {
          setPhase("denied");
          return;
        }
        await loadData(s);
        setPhase("ready");
      } catch (e) {
        if (String(e.message).includes("session")) {
          clearSession();
          setSession(null);
          setPhase("login");
        } else {
          setErr("Erreur de chargement. Réessayez.");
          setPhase("ready");
        }
      }
    },
    [rpc, loadData]
  );

  useEffect(() => {
    const s = loadSession();
    if (s && s.refresh_token) {
      setSession(s);
      boot(s);
    } else {
      setPhase("login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogin(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const f = e.currentTarget;
    try {
      const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: SB_KEY },
        body: JSON.stringify({ email: f.email.value, password: f.password.value }),
      });
      const j = await r.json();
      if (!r.ok || !j.access_token) {
        setErr(
          j.error_description || j.msg || "Identifiants invalides."
        );
        setBusy(false);
        return;
      }
      const s = {
        access_token: j.access_token,
        refresh_token: j.refresh_token,
        expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
        email: f.email.value,
      };
      saveSession(s);
      setSession(s);
      setPhase("boot");
      await boot(s);
    } catch {
      setErr("Connexion impossible. Vérifiez votre réseau.");
    }
    setBusy(false);
  }

  async function onLogout() {
    try {
      const token = session && (await validToken(session));
      if (token)
        await fetch(`${SB_URL}/auth/v1/logout`, {
          method: "POST",
          headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` },
        });
    } catch {}
    clearSession();
    setSession(null);
    setKpis(null);
    setProspects([]);
    setPhase("login");
  }

  const nomContact = (c) => {
    if (!c) return "Contact";
    if (c.raison_sociale) return c.raison_sociale;
    return [c.prenom, c.nom].filter(Boolean).join(" ") || c.email || "Contact";
  };

  return (
    <>
      <Head>
        <title>Cockpit ATRIUM — Administration</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="wrap">
        {phase === "boot" && (
          <div className="center">
            <div className="spin" />
            <p>Ouverture du cockpit…</p>
          </div>
        )}

        {phase === "login" && (
          <div className="center">
            <form className="card" onSubmit={onLogin}>
              <div className="brand">
                ATRIUM<span>Administration</span>
              </div>
              <label>
                Email
                <input name="email" type="email" required placeholder="vous@templeimmo.com" />
              </label>
              <label>
                Mot de passe
                <input name="password" type="password" required placeholder="••••••••" />
              </label>
              {err && <div className="err">{err}</div>}
              <button type="submit" disabled={busy}>
                {busy ? "Connexion…" : "Entrer dans le cockpit"}
              </button>
              <p className="hint">Accès réservé à l'administration du cabinet.</p>
            </form>
          </div>
        )}

        {phase === "denied" && (
          <div className="center">
            <div className="card">
              <div className="brand">ATRIUM<span>Administration</span></div>
              <p className="denied">
                Ce compte n'a pas le rôle administrateur.<br />
                Contactez le responsable pour obtenir l'accès.
              </p>
              <button onClick={onLogout}>Se déconnecter</button>
            </div>
          </div>
        )}

        {phase === "ready" && (
          <div className="app">
            <header className="top">
              <div className="brand sm">
                ATRIUM<span>Cockpit</span>
              </div>
              <div className="who">
                {session?.email}
                <button className="ghost" onClick={onLogout}>Déconnexion</button>
              </div>
            </header>

            {err && <div className="banner-err">{err}</div>}

            <section className="kpis">
              {kpis && [
                ["Prospects aujourd'hui", kpis.pJour],
                ["Prospects (semaine)", kpis.pSemaine],
                ["À contacter", kpis.aContacter, "accent"],
                ["Rendez-vous", kpis.rdv],
                ["Tâches en retard", kpis.tachesRetard, kpis.tachesRetard ? "warn" : ""],
                ["Actions urgentes", kpis.actionsUrgentes, kpis.actionsUrgentes ? "warn" : ""],
                ["Mandats actifs", kpis.mandatsActifs],
                ["Mandats signés (mois)", kpis.mandatsMois],
                ["Biens vacants", kpis.biensVacants],
                ["CA potentiel", `${kpis.caPotentiel.toLocaleString("fr-FR")} €`],
              ].map(([label, val, tone], i) => (
                <div className={`kpi ${tone || ""}`} key={i}>
                  <div className="kval">{val}</div>
                  <div className="klabel">{label}</div>
                </div>
              ))}
            </section>

            <section className="pipe-head">
              <h2>Pipeline commercial</h2>
              <span>{prospects.length} prospect{prospects.length > 1 ? "s" : ""}</span>
            </section>

            <section className="board">
              {PIPELINE.map((col) => {
                const items = prospects.filter((p) => p.statut === col.key);
                return (
                  <div className="col" key={col.key}>
                    <div className="colhead">
                      {col.label}
                      <span>{items.length}</span>
                    </div>
                    <div className="cards">
                      {items.map((p, i) => (
                        <div className="pcard" key={i}>
                          <div className="pname">{nomContact(p.contacts)}</div>
                          <div className="pmeta">
                            {p.interet && <span className="tag">{p.interet}</span>}
                            {p.ville_bien && <span>{p.ville_bien}</span>}
                          </div>
                          {p.contacts?.email && (
                            <a className="pmail" href={`mailto:${p.contacts.email}`}>
                              {p.contacts.email}
                            </a>
                          )}
                          {p.contacts?.telephone && (
                            <div className="ptel">{p.contacts.telephone}</div>
                          )}
                        </div>
                      ))}
                      {items.length === 0 && <div className="empty">—</div>}
                    </div>
                  </div>
                );
              })}
            </section>

            {prospects.some((p) => p.statut === "perdu") && (
              <section className="lost">
                Perdus : {prospects.filter((p) => p.statut === "perdu").length}
              </section>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
      <style jsx>{`
        .wrap {
          min-height: 100vh;
          background: ${NOIR};
          color: #f3efe6;
          font-family: "EB Garamond", Georgia, serif;
        }
        .center {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 24px;
        }
        .spin {
          width: 34px; height: 34px; border-radius: 50%;
          border: 3px solid rgba(201,169,97,.25); border-top-color: ${OR};
          animation: sp 0.9s linear infinite;
        }
        @keyframes sp { to { transform: rotate(360deg); } }
        .brand {
          font-family: "Cinzel", serif;
          font-size: 30px; letter-spacing: .12em; color: #fff;
          text-align: center; margin-bottom: 18px;
        }
        .brand span {
          display: block; font-family: "EB Garamond", serif;
          font-size: 12px; letter-spacing: .26em; text-transform: uppercase;
          color: ${OR}; margin-top: 4px;
        }
        .brand.sm { font-size: 22px; margin: 0; }
        .brand.sm span { display: inline; margin-left: 10px; font-size: 11px; }
        .card {
          width: 100%; max-width: 380px;
          background: #141414;
          border: 1px solid rgba(201,169,97,.28);
          border-radius: 16px; padding: 34px 28px;
        }
        .card label {
          display: flex; flex-direction: column; gap: 7px;
          font-size: 13px; color: #cfc6b2; margin-bottom: 16px;
          letter-spacing: .02em;
        }
        .card input {
          background: ${NOIR}; border: 1px solid rgba(201,169,97,.35);
          border-radius: 9px; padding: 12px 13px; color: #f3efe6;
          font-size: 15px; font-family: inherit;
        }
        .card input:focus { outline: none; border-color: ${OR}; }
        .card button {
          width: 100%; margin-top: 6px;
          background: linear-gradient(180deg,#d8bd7e,${OR});
          color: ${NOIR}; border: none; border-radius: 10px;
          padding: 14px; font-size: 16px; font-weight: 700;
          font-family: inherit; cursor: pointer;
        }
        .card button:disabled { opacity: .6; cursor: default; }
        .hint, .denied { color: #8f8674; font-size: 13px; text-align: center; margin: 14px 0 0; line-height: 1.6; }
        .denied { color: #cfc6b2; font-size: 15px; margin-bottom: 20px; }
        .err {
          background: rgba(180,60,50,.16); border: 1px solid rgba(200,90,80,.5);
          color: #f0c9c3; padding: 10px 12px; border-radius: 8px;
          font-size: 13.5px; margin-bottom: 14px;
        }
        .app { max-width: 1180px; margin: 0 auto; padding: 22px 20px 60px; }
        .top {
          display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 18px; border-bottom: 1px solid rgba(201,169,97,.2);
          margin-bottom: 24px; flex-wrap: wrap; gap: 10px;
        }
        .who { color: #a99f8b; font-size: 14px; display: flex; align-items: center; gap: 14px; }
        .ghost {
          background: transparent; border: 1px solid rgba(201,169,97,.4);
          color: ${OR}; border-radius: 8px; padding: 8px 14px;
          font-family: inherit; font-size: 13px; cursor: pointer;
        }
        .banner-err {
          background: rgba(180,60,50,.16); border: 1px solid rgba(200,90,80,.5);
          color: #f0c9c3; padding: 10px 14px; border-radius: 8px; margin-bottom: 18px;
        }
        .kpis {
          display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px;
          margin-bottom: 30px;
        }
        .kpi {
          background: #141414; border: 1px solid rgba(201,169,97,.2);
          border-radius: 12px; padding: 18px 16px;
        }
        .kpi.accent { border-color: rgba(201,169,97,.6); }
        .kpi.warn { border-color: rgba(200,120,60,.55); background: #17120e; }
        .kval { font-family: "Cinzel", serif; font-size: 30px; color: #fff; line-height: 1; }
        .kpi.accent .kval { color: ${OR}; }
        .klabel { color: #9a917d; font-size: 12.5px; margin-top: 8px; letter-spacing: .02em; }
        .pipe-head {
          display: flex; align-items: baseline; justify-content: space-between;
          margin-bottom: 14px;
        }
        .pipe-head h2 { font-family: "Cinzel", serif; color: #fff; font-size: 20px; margin: 0; }
        .pipe-head span { color: #9a917d; font-size: 14px; }
        .board {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
        }
        .col {
          background: #101010; border: 1px solid rgba(201,169,97,.14);
          border-radius: 12px; padding: 12px; min-height: 160px;
        }
        .colhead {
          display: flex; justify-content: space-between; align-items: center;
          font-family: "Cinzel", serif; font-size: 13px; letter-spacing: .04em;
          color: ${OR}; padding: 4px 4px 12px; border-bottom: 1px solid rgba(201,169,97,.16);
        }
        .colhead span {
          background: rgba(201,169,97,.16); color: ${OR};
          border-radius: 20px; padding: 1px 9px; font-size: 12px; font-family: "EB Garamond", serif;
        }
        .cards { display: flex; flex-direction: column; gap: 9px; padding-top: 11px; }
        .pcard {
          background: #181818; border: 1px solid rgba(255,255,255,.06);
          border-radius: 9px; padding: 11px 12px;
        }
        .pname { color: #f3efe6; font-size: 15.5px; font-weight: 600; }
        .pmeta { display: flex; gap: 8px; align-items: center; margin-top: 5px; color: #9a917d; font-size: 12.5px; }
        .tag {
          background: rgba(201,169,97,.14); color: ${OR};
          border-radius: 5px; padding: 1px 7px; font-size: 11px; text-transform: capitalize;
        }
        .pmail { display: block; color: ${OR}; font-size: 12.5px; margin-top: 6px; text-decoration: none; word-break: break-all; }
        .ptel { color: #8f8674; font-size: 12.5px; margin-top: 2px; }
        .empty { color: #4a453b; text-align: center; padding: 16px 0; }
        .lost { margin-top: 18px; color: #8f8674; font-size: 13.5px; }
        @media (max-width: 900px) {
          .kpis { grid-template-columns: repeat(2, 1fr); }
          .board { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 560px) {
          .board { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
