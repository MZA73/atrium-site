import Head from "next/head";
import { useEffect, useState, useCallback } from "react";

/*
  ATRIUM - Cockpit admin (M2).
  Page autonome, sans dependance npm : parle a Supabase via l'API REST/Auth
  (fetch natif). La securite reelle est assuree par la RLS PostgreSQL
  (has_role('admin')). La cle ci-dessous est la cle PUBLIABLE, concue pour
  vivre dans le navigateur.

  Connexion SANS mot de passe : l'admin saisit son email, recoit un code a
  6 chiffres par email (OTP Supabase), et le saisit pour entrer.
  Pipeline : les prospects se deplacent d'une etape a l'autre ; chaque
  mouvement est journalise dans "activities".
*/

const SB_URL = "https://suauroxtdffsglljfwnk.supabase.co";
const SB_KEY = "sb_publishable_XIELoVMT1PXE5b_05QGTDw_wG8KV6Ju";
const STORE = "atrium_admin_session";

const OR = "#C9A961";
const NOIR = "#0D0D0D";

const PIPELINE = [
  { key: "nouveau", label: "Nouveau" },
  { key: "contacte", label: "Contacté" },
  { key: "rendez_vous", label: "Rendez-vous" },
  { key: "mandat_signe", label: "Mandat signé" },
];
const LABEL = {
  nouveau: "Nouveau", contacte: "Contacté", rendez_vous: "Rendez-vous",
  mandat_signe: "Mandat signé", perdu: "Perdu",
};
const INC_STATUT = { nouveau: "Nouveau", en_cours: "En cours", resolu: "Résolu", annule: "Annulé" };
const nomOf = (c) => c ? (c.raison_sociale || [c.prenom, c.nom].filter(Boolean).join(" ") || c.email || "Contact") : "Contact";

const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); };
const startOfWeek = () => { const d = new Date(); const j = (d.getDay()+6)%7; d.setDate(d.getDate()-j); d.setHours(0,0,0,0); return d.toISOString(); };
const startOfMonth = () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString(); };
const todayDate = () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); };

function loadSession() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem(STORE) || "null"); } catch { return null; }
}
const saveSession = (s) => { if (typeof window !== "undefined") window.localStorage.setItem(STORE, JSON.stringify(s)); };
const clearStore = () => { if (typeof window !== "undefined") window.localStorage.removeItem(STORE); };

function decodeJwt(t) {
  try {
    const p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(p))));
  } catch { return {}; }
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [phase, setPhase] = useState("boot"); // boot|email|otp|denied|ready
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [kpis, setKpis] = useState(null);
  const [prospects, setProspects] = useState([]);
  const [appUserId, setAppUserId] = useState(null);
  const [biensList, setBiensList] = useState([]);
  const [bauxList, setBauxList] = useState([]);
  const [upMsg, setUpMsg] = useState("");
  const [upBusy, setUpBusy] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [convos, setConvos] = useState([]);

  const validToken = useCallback(async (s) => {
    if (!s) return null;
    const now = Math.floor(Date.now() / 1000);
    if (s.expires_at && now < s.expires_at - 30) return s.access_token;
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
      expires_at: j.expires_at || Math.floor(Date.now()/1000) + (j.expires_in || 3600),
      email: s.email,
    };
    saveSession(ns); setSession(ns);
    return ns.access_token;
  }, []);

  const rest = useCallback(async (pathQ, s, { method = "GET", body, count, prefer } = {}) => {
    const token = await validToken(s);
    if (!token) throw new Error("session_expiree");
    const headers = { apikey: SB_KEY, Authorization: `Bearer ${token}` };
    if (body) headers["content-type"] = "application/json";
    if (count) headers.Prefer = "count=exact";
    if (prefer) headers.Prefer = prefer;
    const r = await fetch(`${SB_URL}/rest/v1/${pathQ}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401) throw new Error("session_expiree");
    if (count) {
      const cr = r.headers.get("content-range") || "*/0";
      const total = cr.split("/")[1];
      return total === "*" ? 0 : parseInt(total, 10) || 0;
    }
    if (r.status === 204) return null;
    const txt = await r.text();
    return txt ? JSON.parse(txt) : null;
  }, [validToken]);

  const rpc = useCallback(async (fn, body, s) => {
    const token = await validToken(s);
    const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    if (!r.ok) return null;
    return r.json();
  }, [validToken]);

  const loadData = useCallback(async (s) => {
    const c = (q) => rest(q, s, { count: true });
    const today = startOfToday(), week = startOfWeek(), month = startOfMonth().slice(0,10), td = todayDate();

    const [pJour,pSemaine,aContacter,rdv,tachesRetard,actionsUrgentes,mandatsActifs,biensVacants,mandatsMois] =
      await Promise.all([
        c(`prospect_profiles?select=contact_id&created_at=gte.${today}&limit=1`),
        c(`prospect_profiles?select=contact_id&created_at=gte.${week}&limit=1`),
        c(`prospect_profiles?select=contact_id&statut=eq.nouveau&limit=1`),
        c(`prospect_profiles?select=contact_id&statut=eq.rendez_vous&limit=1`),
        c(`tasks?select=id&status=in.(a_faire,en_cours)&due_date=lt.${td}&limit=1`),
        c(`tasks?select=id&status=in.(a_faire,en_cours)&due_date=lte.${td}&limit=1`),
        c(`mandats?select=id&statut=eq.actif&limit=1`),
        c(`biens?select=id&statut=eq.vacant&limit=1`),
        c(`mandats?select=id&signature_statut=eq.signe&date_signature=gte.${month}&limit=1`),
      ]);

    let caPotentiel = 0;
    try {
      const rows = await rest(`mandats?select=honoraires&statut=in.(projet,actif)`, s);
      if (Array.isArray(rows)) caPotentiel = rows.reduce((a,r)=>a+(Number(r.honoraires)||0),0);
    } catch {}

    setKpis({ pJour,pSemaine,aContacter,rdv,tachesRetard,actionsUrgentes,mandatsActifs,mandatsMois,biensVacants,caPotentiel });

    const list = await rest(
      `prospect_profiles?select=contact_id,statut,interet,ville_bien,score,created_at,contacts(nom,prenom,raison_sociale,email,telephone)&order=created_at.desc&limit=300`, s
    );
    setProspects(Array.isArray(list) ? list : []);

    try {
      const [bl, bxl] = await Promise.all([
        rest(`biens?select=id,adresse&order=adresse`, s),
        rest(`baux?select=id,bien_id,biens(adresse)&order=created_at.desc`, s),
      ]);
      setBiensList(Array.isArray(bl) ? bl : []);
      setBauxList(Array.isArray(bxl) ? bxl : []);
    } catch {}
    try {
      const inc = await rest(`incidents?select=id,sujet,description,statut,created_at,contacts(nom,prenom,raison_sociale)&order=created_at.desc&limit=80`, s);
      setIncidents(Array.isArray(inc) ? inc : []);
    } catch {}
    try {
      const msgs = await rest(`messages?select=id,from_user_id,to_contact_id,body,created_at,contacts(nom,prenom,raison_sociale)&order=created_at.asc&limit=300`, s);
      const map = {};
      (Array.isArray(msgs) ? msgs : []).forEach((m) => {
        const k = m.to_contact_id;
        if (!map[k]) map[k] = { contact_id: k, name: nomOf(m.contacts), items: [] };
        map[k].items.push(m);
      });
      setConvos(Object.values(map));
    } catch {}
  }, [rest]);

  const proceed = useCallback(async (s) => {
    setErr(""); setInfo("");
    let token;
    try { token = await validToken(s); } catch { token = null; }
    if (!token) { clearStore(); setSession(null); setPhase("email"); return; }

    let admin;
    try { admin = await rpc("has_role", { r: "admin" }, s); }
    catch { setErr("Erreur de vérification du rôle."); setPhase("email"); return; }
    if (admin !== true) { setPhase("denied"); return; }

    try {
      const sub = decodeJwt(token).sub;
      if (sub) {
        const rows = await rest(`app_users?select=id&auth_user_id=eq.${sub}&limit=1`, s);
        if (Array.isArray(rows) && rows[0]) setAppUserId(rows[0].id);
      }
    } catch {}

    try { await loadData(s); setPhase("ready"); }
    catch (e) {
      if (String(e.message).includes("session")) { clearStore(); setSession(null); setPhase("email"); }
      else { setErr("Erreur de chargement. Réessayez."); setPhase("ready"); }
    }
  }, [validToken, rpc, rest, loadData]);

  useEffect(() => {
    const s = loadSession();
    if (s && s.refresh_token) { setSession(s); proceed(s); }
    else setPhase("email");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Etape 1 : demander l'envoi du code par email
  async function onRequestCode(e) {
    e.preventDefault();
    setBusy(true); setErr(""); setInfo("");
    const email = (e.currentTarget.email.value || "").trim().toLowerCase();
    try {
      const r = await fetch(`${SB_URL}/auth/v1/otp`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: SB_KEY },
        body: JSON.stringify({ email, create_user: false }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(
          r.status === 429
            ? "Trop de demandes. Patientez une minute avant de réessayer."
            : (j.error_description || j.msg || "Impossible d'envoyer le code. Vérifiez l'email.")
        );
        setBusy(false); return;
      }
      setPendingEmail(email);
      setInfo("Un code à 6 chiffres vient d'être envoyé à " + email + ".");
      setPhase("otp");
    } catch { setErr("Connexion impossible. Vérifiez votre réseau."); }
    setBusy(false);
  }

  // Etape 2 : verifier le code
  async function onVerifyCode(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const code = (e.currentTarget.code.value || "").replace(/\s/g, "");
    try {
      const r = await fetch(`${SB_URL}/auth/v1/verify`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: SB_KEY },
        body: JSON.stringify({ email: pendingEmail, token: code, type: "email" }),
      });
      const j = await r.json();
      if (!r.ok || !j.access_token) {
        setErr("Code incorrect ou expiré. Redemandez un code si besoin.");
        setBusy(false); return;
      }
      const s = {
        access_token: j.access_token,
        refresh_token: j.refresh_token,
        expires_at: j.expires_at || Math.floor(Date.now()/1000) + (j.expires_in || 3600),
        email: pendingEmail,
      };
      saveSession(s); setSession(s); setPhase("boot");
      await proceed(s);
    } catch { setErr("Connexion impossible. Vérifiez votre réseau."); }
    setBusy(false);
  }

  async function onResend() {
    if (!pendingEmail) return;
    setBusy(true); setErr(""); setInfo("");
    try {
      const r = await fetch(`${SB_URL}/auth/v1/otp`, {
        method: "POST",
        headers: { "content-type": "application/json", apikey: SB_KEY },
        body: JSON.stringify({ email: pendingEmail, create_user: false }),
      });
      if (r.ok) setInfo("Nouveau code envoyé à " + pendingEmail + ".");
      else setErr(r.status === 429 ? "Trop de demandes. Patientez une minute." : "Envoi impossible, réessayez.");
    } catch { setErr("Réseau indisponible."); }
    setBusy(false);
  }

  function backToEmail() {
    setPhase("email"); setErr(""); setInfo(""); setPendingEmail("");
  }

  async function onLogout() {
    try {
      const token = session && (await validToken(session));
      if (token) await fetch(`${SB_URL}/auth/v1/logout`, { method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` } });
    } catch {}
    clearStore(); setSession(null); setKpis(null); setProspects([]); setPendingEmail(""); setPhase("email");
  }

  async function changeStatut(p, newS) {
    const id = p.contact_id, oldS = p.statut;
    if (oldS === newS) return;
    setProspects((arr) => arr.map((x) => x.contact_id === id ? { ...x, statut: newS } : x));
    setErr("");
    try {
      await rest(`prospect_profiles?contact_id=eq.${id}`, session, { method: "PATCH", body: { statut: newS }, prefer: "return=minimal" });
      try {
        await rest(`activities`, session, {
          method: "POST",
          body: { contact_id: id, user_id: appUserId || null, type: "deplacement_pipeline", description: `Pipeline : ${LABEL[oldS]} → ${LABEL[newS]}` },
          prefer: "return=minimal",
        });
      } catch {}
      loadData(session).catch(() => {});
    } catch {
      setProspects((arr) => arr.map((x) => x.contact_id === id ? { ...x, statut: oldS } : x));
      setErr("Le déplacement n'a pas pu être enregistré. Réessayez.");
    }
  }

  async function onUpload(e) {
    e.preventDefault();
    const f = e.currentTarget;
    const file = f.file.files[0];
    if (!file) return;
    setUpBusy(true); setUpMsg("");
    const audience = f.audience.value, type = f.type.value;
    const bienId = f.bien.value || null, bailId = f.bail.value || null;
    if (!bienId && !bailId) { setUpMsg("Rattachez le document à un bien ou un bail."); setUpBusy(false); return; }
    try {
      const token = await validToken(session);
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const rnd = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
      const path = `${rnd}/${safe}`;
      const up = await fetch(`${SB_URL}/storage/v1/object/documents/${path}`, {
        method: "POST",
        headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": file.type || "application/octet-stream", "x-upsert": "false" },
        body: file,
      });
      if (!up.ok) throw new Error("upload");
      const dres = await fetch(`${SB_URL}/rest/v1/documents`, {
        method: "POST",
        headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ type, storage_path: path, mime_type: file.type || null, taille_octets: file.size, visibility: audience, signature_statut: (f.signe && f.signe.checked) ? "en_cours" : "aucune" }),
      });
      const doc = (await dres.json())[0];
      const links = [];
      if (bienId) links.push({ document_id: doc.id, bien_id: bienId });
      if (bailId) links.push({ document_id: doc.id, bail_id: bailId });
      if (links.length) {
        await fetch(`${SB_URL}/rest/v1/document_links`, {
          method: "POST",
          headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(links),
        });
      }
      setUpMsg("Document déposé ✓ — visible dans l'espace du destinataire.");
      f.reset();
    } catch { setUpMsg("Échec du dépôt. Réessayez."); }
    setUpBusy(false);
  }

  async function setIncidentStatut(inc, statut) {
    setIncidents((arr) => arr.map((x) => x.id === inc.id ? { ...x, statut } : x));
    try { await rest(`incidents?id=eq.${inc.id}`, session, { method: "PATCH", body: { statut }, prefer: "return=minimal" }); }
    catch { setErr("Mise à jour du statut impossible."); loadData(session).catch(() => {}); }
  }

  async function reply(e, contactId) {
    e.preventDefault();
    const f = e.currentTarget;
    const body = (f.body.value || "").trim();
    if (!body || !appUserId) return;
    setErr("");
    try {
      await rest(`messages`, session, { method: "POST", prefer: "return=minimal", body: { from_user_id: appUserId, to_contact_id: contactId, body } });
      f.reset(); loadData(session).catch(() => {});
    } catch { setErr("Envoi impossible."); }
  }

  const nomContact = (c) => {
    if (!c) return "Contact";
    if (c.raison_sociale) return c.raison_sociale;
    return [c.prenom, c.nom].filter(Boolean).join(" ") || c.email || "Contact";
  };

  const lost = prospects.filter((p) => p.statut === "perdu");

  return (
    <>
      <Head>
        <title>Cockpit ATRIUM — Administration</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="wrap">
        {phase === "boot" && (
          <div className="center"><div className="spin" /><p>Ouverture du cockpit…</p></div>
        )}

        {phase === "email" && (
          <div className="center">
            <form className="card" onSubmit={onRequestCode}>
              <div className="brand">ATRIUM<span>Administration</span></div>
              <p className="mfa-txt">Entrez votre email : vous recevrez un code à 6 chiffres pour vous connecter.</p>
              <label>Email
                <input name="email" type="email" required placeholder="vous@templeimmo.com" autoComplete="username" autoFocus />
              </label>
              {err && <div className="err">{err}</div>}
              <button type="submit" disabled={busy}>{busy ? "Envoi du code…" : "Recevoir mon code"}</button>
              <p className="hint">Accès réservé à l'administration du cabinet.</p>
            </form>
          </div>
        )}

        {phase === "otp" && (
          <div className="center">
            <form className="card" onSubmit={onVerifyCode}>
              <div className="brand">ATRIUM<span>Vérification</span></div>
              {info && <div className="info">{info}</div>}
              <p className="mfa-txt">Saisissez le code à 6 chiffres reçu par email. Pensez à vérifier les spams.</p>
              <label>Code à 6 chiffres
                <input name="code" inputMode="numeric" pattern="[0-9 ]*" maxLength={8} required placeholder="123456" autoComplete="one-time-code" autoFocus />
              </label>
              {err && <div className="err">{err}</div>}
              <button type="submit" disabled={busy}>{busy ? "Vérification…" : "Entrer dans le cockpit"}</button>
              <p className="hint">
                <a className="link" onClick={onResend}>Renvoyer le code</a>
                {"  ·  "}
                <a className="link" onClick={backToEmail}>Changer d'email</a>
              </p>
            </form>
          </div>
        )}

        {phase === "denied" && (
          <div className="center">
            <div className="card">
              <div className="brand">ATRIUM<span>Administration</span></div>
              <p className="denied">Ce compte n'a pas le rôle administrateur.<br />Contactez le responsable pour obtenir l'accès.</p>
              <button onClick={onLogout}>Retour</button>
            </div>
          </div>
        )}

        {phase === "ready" && (
          <div className="app">
            <header className="top">
              <div className="brand sm">ATRIUM<span>Cockpit</span></div>
              <div className="who"><a className="navlink" href="/gestion">Gestion →</a>{session?.email}<button className="ghost" onClick={onLogout}>Déconnexion</button></div>
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
              <span>{prospects.length - lost.length} actif{prospects.length - lost.length > 1 ? "s" : ""}{lost.length ? ` · ${lost.length} perdu${lost.length>1?"s":""}` : ""}</span>
            </section>

            <section className="board">
              {PIPELINE.map((col, ci) => {
                const items = prospects.filter((p) => p.statut === col.key);
                return (
                  <div className="col" key={col.key}>
                    <div className="colhead">{col.label}<span>{items.length}</span></div>
                    <div className="cards">
                      {items.map((p, i) => (
                        <div className="pcard" key={i}>
                          <div className="pname">{nomContact(p.contacts)}</div>
                          <div className="pmeta">
                            {p.interet && <span className="tag">{p.interet}</span>}
                            {p.ville_bien && <span>{p.ville_bien}</span>}
                          </div>
                          {p.contacts?.email && <a className="pmail" href={`mailto:${p.contacts.email}`}>{p.contacts.email}</a>}
                          {p.contacts?.telephone && <div className="ptel">{p.contacts.telephone}</div>}
                          <div className="moves">
                            <button className="mv" disabled={ci === 0} onClick={() => changeStatut(p, PIPELINE[ci-1]?.key)} title="Étape précédente">◀</button>
                            <button className="mv" disabled={ci === PIPELINE.length-1} onClick={() => changeStatut(p, PIPELINE[ci+1]?.key)} title="Étape suivante">▶</button>
                            <button className="mv lost-btn" onClick={() => changeStatut(p, "perdu")} title="Marquer perdu">Perdu</button>
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && <div className="empty">—</div>}
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="inc-admin">
              <h2 className="docs-h">Incidents signalés</h2>
              {incidents.length === 0 ? <div className="a-empty">Aucun incident signalé.</div> : (
                <div className="ilist">
                  {incidents.map((i) => (
                    <div className="irow" key={i.id}>
                      <div className="imain">
                        <div className="isujet">{i.sujet} <span className="iby">— {nomOf(i.contacts)}</span></div>
                        {i.description && <div className="idesc">{i.description}</div>}
                      </div>
                      <div className="iact">
                        <span className={`pill ${i.statut === "resolu" ? "ok" : "warn"}`}>{INC_STATUT[i.statut] || i.statut}</span>
                        <select value={i.statut} onChange={(e) => setIncidentStatut(i, e.target.value)}>
                          <option value="nouveau">Nouveau</option>
                          <option value="en_cours">En cours</option>
                          <option value="resolu">Résolu</option>
                          <option value="annule">Annulé</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="msg-admin">
              <h2 className="docs-h">Messages clients</h2>
              {convos.length === 0 ? <div className="a-empty">Aucun message.</div> : convos.map((c) => (
                <div className="convo" key={c.contact_id}>
                  <div className="cname">{c.name}</div>
                  <div className="cmsgs">
                    {c.items.map((m) => (
                      <div className={`cb ${m.from_user_id === appUserId ? "me" : "them"}`} key={m.id}>{m.body}</div>
                    ))}
                  </div>
                  <form className="creply" onSubmit={(e) => reply(e, c.contact_id)}>
                    <input name="body" placeholder="Répondre…" required />
                    <button type="submit">Répondre</button>
                  </form>
                </div>
              ))}
            </section>

            <section className="docs-admin">
              <h2 className="docs-h">Coffre — déposer un document</h2>
              <form className="upform" onSubmit={onUpload}>
                <div className="uprow">
                  <label>Destinataire
                    <select name="audience" defaultValue="bailleur">
                      <option value="bailleur">Propriétaire</option>
                      <option value="locataire">Locataire</option>
                    </select>
                  </label>
                  <label>Type
                    <select name="type" defaultValue="quittance">
                      <option value="quittance">Quittance de loyer</option>
                      <option value="releve">Relevé de gérance</option>
                      <option value="mandat">Mandat</option>
                      <option value="bail">Bail</option>
                      <option value="etat_des_lieux">État des lieux</option>
                      <option value="diagnostic">Diagnostic</option>
                      <option value="avis">Avis</option>
                      <option value="autre">Autre</option>
                    </select>
                  </label>
                </div>
                <div className="uprow">
                  <label>Bien (optionnel)
                    <select name="bien" defaultValue="">
                      <option value="">—</option>
                      {biensList.map((b) => <option key={b.id} value={b.id}>{b.adresse}</option>)}
                    </select>
                  </label>
                  <label>Bail (optionnel)
                    <select name="bail" defaultValue="">
                      <option value="">—</option>
                      {bauxList.map((bx) => <option key={bx.id} value={bx.id}>{bx.biens?.adresse || bx.id.slice(0, 8)}</option>)}
                    </select>
                  </label>
                </div>
                <label className="upfile">Fichier
                  <input name="file" type="file" required />
                </label>
                <label className="upsigne"><input type="checkbox" name="signe" /> Requiert une signature du destinataire (le client signera depuis son espace)</label>
                {upMsg && <div className="upmsg">{upMsg}</div>}
                <button type="submit" disabled={upBusy}>{upBusy ? "Dépôt en cours…" : "Déposer le document"}</button>
                <p className="uphint">Le document ne sera visible que dans l'espace du destinataire choisi, en téléchargement sécurisé et journalisé.</p>
              </form>
            </section>

            {lost.length > 0 && (
              <section className="lostzone">
                <div className="losthead">Perdus <span>{lost.length}</span></div>
                <div className="lostcards">
                  {lost.map((p, i) => (
                    <div className="pcard lostcard" key={i}>
                      <div className="pname">{nomContact(p.contacts)}</div>
                      {p.contacts?.email && <a className="pmail" href={`mailto:${p.contacts.email}`}>{p.contacts.email}</a>}
                      <div className="moves">
                        <button className="mv" onClick={() => changeStatut(p, "nouveau")} title="Restaurer">↩ Restaurer</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
      <style jsx>{`
        .wrap { min-height: 100vh; background: ${NOIR}; color: #f3efe6; font-family: "EB Garamond", Georgia, serif; }
        .center { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 24px; }
        .spin { width: 34px; height: 34px; border-radius: 50%; border: 3px solid rgba(201,169,97,.25); border-top-color: ${OR}; animation: sp .9s linear infinite; }
        @keyframes sp { to { transform: rotate(360deg); } }
        .brand { font-family: "Cinzel", serif; font-size: 30px; letter-spacing: .12em; color: #fff; text-align: center; margin-bottom: 18px; }
        .brand span { display: block; font-family: "EB Garamond", serif; font-size: 12px; letter-spacing: .26em; text-transform: uppercase; color: ${OR}; margin-top: 4px; }
        .brand.sm { font-size: 22px; margin: 0; }
        .brand.sm span { display: inline; margin-left: 10px; font-size: 11px; }
        .card { width: 100%; max-width: 400px; background: #141414; border: 1px solid rgba(201,169,97,.28); border-radius: 16px; padding: 34px 28px; }
        .card label { display: flex; flex-direction: column; gap: 7px; font-size: 13px; color: #cfc6b2; margin-bottom: 16px; letter-spacing: .02em; }
        .card input { background: ${NOIR}; border: 1px solid rgba(201,169,97,.35); border-radius: 9px; padding: 12px 13px; color: #f3efe6; font-size: 15px; font-family: inherit; }
        .card input:focus { outline: none; border-color: ${OR}; }
        .card button { width: 100%; margin-top: 6px; background: linear-gradient(180deg,#d8bd7e,${OR}); color: ${NOIR}; border: none; border-radius: 10px; padding: 14px; font-size: 16px; font-weight: 700; font-family: inherit; cursor: pointer; }
        .card button:disabled { opacity: .6; cursor: default; }
        .hint, .denied { color: #8f8674; font-size: 13px; text-align: center; margin: 14px 0 0; line-height: 1.6; }
        .denied { color: #cfc6b2; font-size: 15px; margin-bottom: 20px; }
        .link { color: ${OR}; cursor: pointer; text-decoration: underline; }
        .mfa-txt { color: #cfc6b2; font-size: 14px; line-height: 1.6; margin: 0 0 18px; }
        .info { background: rgba(201,169,97,.12); border: 1px solid rgba(201,169,97,.4); color: #e7d9b4; padding: 10px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; }
        .err { background: rgba(180,60,50,.16); border: 1px solid rgba(200,90,80,.5); color: #f0c9c3; padding: 10px 12px; border-radius: 8px; font-size: 13.5px; margin-bottom: 14px; }
        .app { max-width: 1180px; margin: 0 auto; padding: 22px 20px 60px; }
        .top { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 1px solid rgba(201,169,97,.2); margin-bottom: 24px; flex-wrap: wrap; gap: 10px; }
        .who { color: #a99f8b; font-size: 14px; display: flex; align-items: center; gap: 14px; }
        .ghost { background: transparent; border: 1px solid rgba(201,169,97,.4); color: ${OR}; border-radius: 8px; padding: 8px 14px; font-family: inherit; font-size: 13px; cursor: pointer; }
        .navlink { color: ${OR}; text-decoration: none; font-size: 14px; }
        .banner-err { background: rgba(180,60,50,.16); border: 1px solid rgba(200,90,80,.5); color: #f0c9c3; padding: 10px 14px; border-radius: 8px; margin-bottom: 18px; }
        .kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 30px; }
        .kpi { background: #141414; border: 1px solid rgba(201,169,97,.2); border-radius: 12px; padding: 18px 16px; }
        .kpi.accent { border-color: rgba(201,169,97,.6); }
        .kpi.warn { border-color: rgba(200,120,60,.55); background: #17120e; }
        .kval { font-family: "Cinzel", serif; font-size: 30px; color: #fff; line-height: 1; }
        .kpi.accent .kval { color: ${OR}; }
        .klabel { color: #9a917d; font-size: 12.5px; margin-top: 8px; letter-spacing: .02em; }
        .pipe-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
        .pipe-head h2 { font-family: "Cinzel", serif; color: #fff; font-size: 20px; margin: 0; }
        .pipe-head span { color: #9a917d; font-size: 14px; }
        .board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .col { background: #101010; border: 1px solid rgba(201,169,97,.14); border-radius: 12px; padding: 12px; min-height: 160px; }
        .colhead { display: flex; justify-content: space-between; align-items: center; font-family: "Cinzel", serif; font-size: 13px; letter-spacing: .04em; color: ${OR}; padding: 4px 4px 12px; border-bottom: 1px solid rgba(201,169,97,.16); }
        .colhead span { background: rgba(201,169,97,.16); color: ${OR}; border-radius: 20px; padding: 1px 9px; font-size: 12px; font-family: "EB Garamond", serif; }
        .cards { display: flex; flex-direction: column; gap: 9px; padding-top: 11px; }
        .pcard { background: #181818; border: 1px solid rgba(255,255,255,.06); border-radius: 9px; padding: 11px 12px; }
        .pname { color: #f3efe6; font-size: 15.5px; font-weight: 600; }
        .pmeta { display: flex; gap: 8px; align-items: center; margin-top: 5px; color: #9a917d; font-size: 12.5px; }
        .tag { background: rgba(201,169,97,.14); color: ${OR}; border-radius: 5px; padding: 1px 7px; font-size: 11px; text-transform: capitalize; }
        .pmail { display: block; color: ${OR}; font-size: 12.5px; margin-top: 6px; text-decoration: none; word-break: break-all; }
        .ptel { color: #8f8674; font-size: 12.5px; margin-top: 2px; }
        .moves { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
        .mv { background: rgba(201,169,97,.08); border: 1px solid rgba(201,169,97,.3); color: ${OR}; border-radius: 6px; padding: 4px 9px; font-size: 12px; font-family: inherit; cursor: pointer; line-height: 1.2; }
        .mv:hover:not(:disabled) { background: rgba(201,169,97,.2); }
        .mv:disabled { opacity: .3; cursor: default; }
        .lost-btn { margin-left: auto; color: #c98a7a; border-color: rgba(200,120,90,.35); background: rgba(180,80,60,.08); }
        .empty { color: #4a453b; text-align: center; padding: 16px 0; }
        .lostzone { margin-top: 26px; border-top: 1px solid rgba(201,169,97,.12); padding-top: 16px; }
        .losthead { font-family: "Cinzel", serif; color: #8f8674; font-size: 14px; margin-bottom: 12px; }
        .losthead span { background: rgba(255,255,255,.06); border-radius: 20px; padding: 1px 9px; font-size: 12px; margin-left: 6px; }
        .lostcards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .lostcard { opacity: .72; }
        .docs-admin { margin-top: 34px; border-top: 1px solid rgba(201,169,97,.14); padding-top: 20px; }
        .docs-h { font-family: "Cinzel", serif; color: #fff; font-size: 18px; margin: 0 0 14px; }
        .upform { background: #141414; border: 1px solid rgba(201,169,97,.22); border-radius: 12px; padding: 20px; max-width: 720px; }
        .uprow { display: flex; gap: 14px; flex-wrap: wrap; }
        .upform label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #cfc6b2; margin-bottom: 14px; flex: 1 1 240px; }
        .upform select, .upform input { background: #0d0d0d; border: 1px solid rgba(201,169,97,.35); border-radius: 8px; padding: 10px 12px; color: #f3efe6; font-family: inherit; font-size: 14px; }
        .upfile { flex-basis: 100%; }
        .upform button { background: linear-gradient(180deg,#d8bd7e,#c9a961); color: #0d0d0d; border: none; border-radius: 9px; padding: 12px 18px; font-weight: 700; font-family: inherit; cursor: pointer; }
        .upform button:disabled { opacity: .6; }
        .upmsg { color: #c9a961; font-size: 14px; margin-bottom: 12px; }
        .upsigne { flex-direction: row !important; align-items: center; gap: 9px; color: #d8d0bf !important; font-size: 13.5px !important; }
        .upsigne input { width: 17px; height: 17px; accent-color: #c9a961; }
        .uphint { color: #8f8674; font-size: 12.5px; margin: 12px 0 0; }
        .inc-admin, .msg-admin { margin-top: 34px; border-top: 1px solid rgba(201,169,97,.14); padding-top: 20px; }
        .a-empty { color: #8f8674; font-size: 14px; }
        .ilist { display: flex; flex-direction: column; gap: 8px; }
        .irow { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; background: #141414; border: 1px solid rgba(201,169,97,.2); border-radius: 10px; padding: 13px 16px; }
        .isujet { color: #f3efe6; font-size: 15px; font-weight: 600; }
        .iby { color: #8f8674; font-weight: 400; font-size: 13px; }
        .idesc { color: #a99f8b; font-size: 13px; margin-top: 3px; }
        .iact { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .iact select { background: #0d0d0d; border: 1px solid rgba(201,169,97,.35); color: #f3efe6; border-radius: 7px; padding: 6px 8px; font-family: inherit; font-size: 13px; }
        .pill { font-size: 11px; padding: 2px 10px; border-radius: 20px; white-space: nowrap; }
        .pill.ok { background: rgba(80,160,80,.18); color: #8fce8f; }
        .pill.warn { background: rgba(200,150,60,.18); color: #e0b972; }
        .convo { background: #141414; border: 1px solid rgba(201,169,97,.2); border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }
        .cname { font-family: "Cinzel", serif; color: ${OR}; font-size: 14px; margin-bottom: 8px; }
        .cmsgs { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        .cb { max-width: 80%; padding: 8px 12px; border-radius: 10px; font-size: 14px; }
        .cb.them { align-self: flex-start; background: #1e1e1e; color: #e7ddc7; }
        .cb.me { align-self: flex-end; background: linear-gradient(180deg,#d8bd7e,#c9a961); color: #0d0d0d; }
        .creply { display: flex; gap: 8px; }
        .creply input { flex: 1; background: #0d0d0d; border: 1px solid rgba(201,169,97,.35); color: #f3efe6; border-radius: 8px; padding: 9px 12px; font-family: inherit; font-size: 14px; }
        .creply button { background: linear-gradient(180deg,#d8bd7e,#c9a961); color: #0d0d0d; border: none; border-radius: 8px; padding: 9px 16px; font-weight: 700; font-family: inherit; cursor: pointer; }
        @media (max-width: 900px) { .kpis { grid-template-columns: repeat(2, 1fr); } .board, .lostcards { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px) { .board, .lostcards { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
