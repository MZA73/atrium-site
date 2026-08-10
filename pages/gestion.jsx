import Head from "next/head";
import { useEffect, useState, useCallback } from "react";

/*
  ATRIUM - Gestion (saisie admin, M2.5).
  Reserve aux administrateurs. Session partagee avec le cockpit (/admin) :
  si deja connecte a /admin, l'acces est direct. Permet de creer les vraies
  donnees (contacts, biens + proprietaire, mandats, baux + locataire) qui
  alimentent les espaces client, le coffre et les KPI.
*/

const SB_URL = "https://suauroxtdffsglljfwnk.supabase.co";
const SB_KEY = "sb_publishable_XIELoVMT1PXE5b_05QGTDw_wG8KV6Ju";
const STORE = "atrium_admin_session";
const OR = "#C9A961";
const NOIR = "#0D0D0D";

const loadSession = () => {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem(STORE) || "null"); } catch { return null; }
};
const saveSession = (s) => { if (typeof window !== "undefined") window.localStorage.setItem(STORE, JSON.stringify(s)); };
const clearStore = () => { if (typeof window !== "undefined") window.localStorage.removeItem(STORE); };

const nomContact = (c) => c ? (c.raison_sociale || [c.prenom, c.nom].filter(Boolean).join(" ") || c.email || "Contact") : "—";

export default function Gestion() {
  const [session, setSession] = useState(null);
  const [phase, setPhase] = useState("boot"); // boot|email|otp|denied|ready
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [contacts, setContacts] = useState([]);
  const [biens, setBiens] = useState([]);
  const [mandats, setMandats] = useState([]);
  const [baux, setBaux] = useState([]);
  const [msg, setMsg] = useState({});

  const validToken = useCallback(async (s) => {
    if (!s) return null;
    const now = Math.floor(Date.now() / 1000);
    if (s.expires_at && now < s.expires_at - 30) return s.access_token;
    const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST", headers: { "content-type": "application/json", apikey: SB_KEY },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const ns = { access_token: j.access_token, refresh_token: j.refresh_token,
      expires_at: j.expires_at || Math.floor(Date.now()/1000) + (j.expires_in || 3600), email: s.email };
    saveSession(ns); setSession(ns); return ns.access_token;
  }, []);

  const api = useCallback(async (path, s, { method = "GET", body, prefer } = {}) => {
    const token = await validToken(s);
    if (!token) throw new Error("session_expiree");
    const headers = { apikey: SB_KEY, Authorization: `Bearer ${token}` };
    if (body) headers["content-type"] = "application/json";
    if (prefer) headers.Prefer = prefer;
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401) throw new Error("session_expiree");
    if (r.status === 204) return null;
    const txt = await r.text();
    const data = txt ? JSON.parse(txt) : null;
    if (!r.ok) throw new Error((data && (data.message || data.hint)) || "erreur");
    return data;
  }, [validToken]);

  const rpc = useCallback(async (fn, body, s) => {
    const token = await validToken(s);
    const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
      method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    if (!r.ok) return null;
    return r.json();
  }, [validToken]);

  const refresh = useCallback(async (s) => {
    const [c, b, m, bx] = await Promise.all([
      api(`contacts?select=id,kind,civilite,nom,prenom,raison_sociale,email,telephone&order=created_at.desc&limit=200`, s),
      api(`biens?select=id,reference,adresse,type,surface,loyer_hc,charges,statut&order=adresse`, s),
      api(`mandats?select=id,type,honoraires,statut,signature_statut,date_debut,biens(adresse)&order=created_at.desc`, s),
      api(`baux?select=id,date_debut,loyer_hc,statut,biens(adresse),bail_parties(role,contacts(nom,prenom,raison_sociale))&order=created_at.desc`, s),
    ]);
    setContacts(Array.isArray(c) ? c : []);
    setBiens(Array.isArray(b) ? b : []);
    setMandats(Array.isArray(m) ? m : []);
    setBaux(Array.isArray(bx) ? bx : []);
  }, [api]);

  const proceed = useCallback(async (s) => {
    setErr("");
    let token; try { token = await validToken(s); } catch { token = null; }
    if (!token) { clearStore(); setSession(null); setPhase("email"); return; }
    let admin; try { admin = await rpc("has_role", { r: "admin" }, s); } catch { setPhase("email"); return; }
    if (admin !== true) { setPhase("denied"); return; }
    try { await refresh(s); setPhase("ready"); }
    catch (e) { if (String(e.message).includes("session")) { clearStore(); setSession(null); setPhase("email"); } else { setErr("Erreur de chargement."); setPhase("ready"); } }
  }, [validToken, rpc, refresh]);

  useEffect(() => {
    const s = loadSession();
    if (s && s.refresh_token) { setSession(s); proceed(s); } else setPhase("email");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRequestCode(e) {
    e.preventDefault(); setBusy(true); setErr(""); setInfo("");
    const email = (e.currentTarget.email.value || "").trim().toLowerCase();
    try {
      const r = await fetch(`${SB_URL}/auth/v1/otp`, { method: "POST", headers: { "content-type": "application/json", apikey: SB_KEY }, body: JSON.stringify({ email, create_user: false }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(r.status === 429 ? "Trop de demandes. Patientez une minute." : (j.error_description || j.msg || "Envoi impossible.")); setBusy(false); return; }
      setPendingEmail(email); setInfo("Code envoyé à " + email + "."); setPhase("otp");
    } catch { setErr("Connexion impossible."); }
    setBusy(false);
  }

  async function onVerifyCode(e) {
    e.preventDefault(); setBusy(true); setErr("");
    const code = (e.currentTarget.code.value || "").replace(/\s/g, "");
    try {
      const r = await fetch(`${SB_URL}/auth/v1/verify`, { method: "POST", headers: { "content-type": "application/json", apikey: SB_KEY }, body: JSON.stringify({ email: pendingEmail, token: code, type: "email" }) });
      const j = await r.json();
      if (!r.ok || !j.access_token) { setErr("Code incorrect ou expiré."); setBusy(false); return; }
      const s = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now()/1000) + (j.expires_in || 3600), email: pendingEmail };
      saveSession(s); setSession(s); setPhase("boot"); await proceed(s);
    } catch { setErr("Connexion impossible."); }
    setBusy(false);
  }

  async function onLogout() {
    try { const t = session && (await validToken(session)); if (t) await fetch(`${SB_URL}/auth/v1/logout`, { method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${t}` } }); } catch {}
    clearStore(); setSession(null); setPhase("email");
  }

  const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; };
  const nn = (v) => (v === "" || v == null ? null : v);
  const flash = (k, t) => { setMsg((m) => ({ ...m, [k]: t })); };

  async function createContact(e) {
    e.preventDefault(); const f = e.currentTarget; flash("contact", "");
    try {
      await api(`contacts`, session, { method: "POST", prefer: "return=minimal", body: {
        kind: f.kind.value, civilite: nn(f.civilite.value), nom: nn(f.nom.value), prenom: nn(f.prenom.value),
        raison_sociale: nn(f.raison_sociale.value), email: nn(f.email.value), telephone: nn(f.telephone.value),
        adresse: nn(f.adresse.value), code_postal: nn(f.code_postal.value), ville: nn(f.ville.value),
      }});
      flash("contact", "Contact créé ✓"); f.reset(); await refresh(session);
    } catch (er) { flash("contact", "Échec : " + er.message); }
  }

  async function createBien(e) {
    e.preventDefault(); const f = e.currentTarget; flash("bien", "");
    try {
      const b = await api(`biens`, session, { method: "POST", prefer: "return=representation", body: {
        reference: nn(f.reference.value), adresse: f.adresse.value, type: nn(f.type.value),
        surface: num(f.surface.value), loyer_hc: num(f.loyer_hc.value), charges: num(f.charges.value), statut: f.statut.value,
      }});
      const bienId = b[0].id;
      if (f.proprietaire.value) {
        await api(`bien_proprietaires`, session, { method: "POST", prefer: "return=minimal", body: {
          bien_id: bienId, contact_id: f.proprietaire.value, quote_part: num(f.quote_part.value) || 100, role: "proprietaire",
        }});
      }
      flash("bien", "Bien créé ✓"); f.reset(); await refresh(session);
    } catch (er) { flash("bien", "Échec : " + er.message); }
  }

  async function createMandat(e) {
    e.preventDefault(); const f = e.currentTarget; flash("mandat", "");
    try {
      await api(`mandats`, session, { method: "POST", prefer: "return=minimal", body: {
        bien_id: f.bien.value, type: f.type.value, honoraires: num(f.honoraires.value),
        date_debut: nn(f.date_debut.value), date_fin: nn(f.date_fin.value), statut: f.statut.value,
        signature_statut: f.signature_statut.value, date_signature: nn(f.date_signature.value),
      }});
      flash("mandat", "Mandat créé ✓"); f.reset(); await refresh(session);
    } catch (er) { flash("mandat", "Échec : " + er.message); }
  }

  async function createBail(e) {
    e.preventDefault(); const f = e.currentTarget; flash("bail", "");
    try {
      const b = await api(`baux`, session, { method: "POST", prefer: "return=representation", body: {
        bien_id: f.bien.value, date_debut: nn(f.date_debut.value), date_fin: nn(f.date_fin.value),
        loyer_hc: num(f.loyer_hc.value), charges: num(f.charges.value), depot_garantie: num(f.depot_garantie.value), statut: f.statut.value,
      }});
      const bailId = b[0].id;
      if (f.locataire.value) {
        await api(`bail_parties`, session, { method: "POST", prefer: "return=minimal", body: { bail_id: bailId, contact_id: f.locataire.value, role: "locataire" } });
      }
      flash("bail", "Bail créé ✓"); f.reset(); await refresh(session);
    } catch (er) { flash("bail", "Échec : " + er.message); }
  }

  const contactOpts = contacts.map((c) => <option key={c.id} value={c.id}>{nomContact(c)}{c.email ? ` — ${c.email}` : ""}</option>);
  const bienOpts = biens.map((b) => <option key={b.id} value={b.id}>{b.adresse}</option>);

  return (
    <>
      <Head>
        <title>Gestion — ATRIUM Administration</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="wrap">
        {phase === "boot" && <div className="center"><div className="spin" /><p>Chargement…</p></div>}

        {(phase === "email" || phase === "otp") && (
          <div className="center">
            <form className="card" onSubmit={phase === "email" ? onRequestCode : onVerifyCode}>
              <div className="brand">ATRIUM<span>Gestion</span></div>
              {info && <div className="info">{info}</div>}
              {phase === "email" ? (
                <label>Email<input name="email" type="email" required placeholder="vous@templeimmo.com" autoFocus /></label>
              ) : (
                <label>Code à 6 chiffres<input name="code" inputMode="numeric" maxLength={8} required placeholder="123456" autoFocus /></label>
              )}
              {err && <div className="err">{err}</div>}
              <button type="submit" disabled={busy}>{busy ? "…" : phase === "email" ? "Recevoir mon code" : "Entrer"}</button>
              <p className="hint">Réservé à l'administration.</p>
            </form>
          </div>
        )}

        {phase === "denied" && (
          <div className="center"><div className="card"><div className="brand">ATRIUM<span>Gestion</span></div>
            <p className="denied">Compte sans rôle administrateur.</p>
            <button onClick={onLogout}>Se déconnecter</button></div></div>
        )}

        {phase === "ready" && (
          <div className="app">
            <header className="top">
              <div className="brand sm">ATRIUM<span>Gestion</span></div>
              <div className="who"><a className="navlink" href="/admin">← Cockpit</a>{session?.email}<button className="ghost" onClick={onLogout}>Déconnexion</button></div>
            </header>
            {err && <div className="banner-err">{err}</div>}

            <div className="cols">
              {/* CONTACT */}
              <section className="block">
                <h2>Nouveau contact</h2>
                <form onSubmit={createContact}>
                  <div className="row">
                    <label>Nature<select name="kind" defaultValue="personne"><option value="personne">Personne</option><option value="societe">Société</option></select></label>
                    <label>Civilité<input name="civilite" placeholder="M. / Mme" /></label>
                  </div>
                  <div className="row">
                    <label>Nom<input name="nom" placeholder="Nom" /></label>
                    <label>Prénom<input name="prenom" placeholder="Prénom" /></label>
                  </div>
                  <label>Raison sociale (si société)<input name="raison_sociale" placeholder="SCI …" /></label>
                  <div className="row">
                    <label>Email<input name="email" type="email" placeholder="email" /></label>
                    <label>Téléphone<input name="telephone" placeholder="06…" /></label>
                  </div>
                  <label>Adresse<input name="adresse" placeholder="Adresse" /></label>
                  <div className="row">
                    <label>Code postal<input name="code_postal" placeholder="59500" /></label>
                    <label>Ville<input name="ville" placeholder="Douai" /></label>
                  </div>
                  {msg.contact && <div className="fmsg">{msg.contact}</div>}
                  <button type="submit">Créer le contact</button>
                </form>
                <div className="mini">{contacts.length} contact{contacts.length > 1 ? "s" : ""}</div>
                <ul className="list">{contacts.slice(0, 8).map((c) => <li key={c.id}>{nomContact(c)}<span>{c.email || ""}</span></li>)}</ul>
              </section>

              {/* BIEN */}
              <section className="block">
                <h2>Nouveau bien</h2>
                <form onSubmit={createBien}>
                  <label>Adresse <span className="req">*</span><input name="adresse" required placeholder="12 rue …, 59500 Douai" /></label>
                  <div className="row">
                    <label>Référence<input name="reference" placeholder="REF-001" /></label>
                    <label>Type<input name="type" placeholder="Appartement T3" /></label>
                  </div>
                  <div className="row">
                    <label>Surface (m²)<input name="surface" inputMode="decimal" placeholder="65" /></label>
                    <label>Statut<select name="statut" defaultValue="vacant"><option value="vacant">Vacant</option><option value="loue">Loué</option><option value="en_recherche">En recherche</option></select></label>
                  </div>
                  <div className="row">
                    <label>Loyer HC (€)<input name="loyer_hc" inputMode="decimal" placeholder="720" /></label>
                    <label>Charges (€)<input name="charges" inputMode="decimal" placeholder="80" /></label>
                  </div>
                  <div className="row">
                    <label>Propriétaire<select name="proprietaire" defaultValue=""><option value="">—</option>{contactOpts}</select></label>
                    <label>Quote-part (%)<input name="quote_part" inputMode="decimal" placeholder="100" /></label>
                  </div>
                  {msg.bien && <div className="fmsg">{msg.bien}</div>}
                  <button type="submit">Créer le bien</button>
                </form>
                <div className="mini">{biens.length} bien{biens.length > 1 ? "s" : ""}</div>
                <ul className="list">{biens.slice(0, 8).map((b) => <li key={b.id}>{b.adresse}<span>{b.statut}</span></li>)}</ul>
              </section>

              {/* MANDAT */}
              <section className="block">
                <h2>Nouveau mandat</h2>
                <form onSubmit={createMandat}>
                  <label>Bien <span className="req">*</span><select name="bien" required defaultValue=""><option value="" disabled>Choisir…</option>{bienOpts}</select></label>
                  <div className="row">
                    <label>Type<select name="type" defaultValue="gestion"><option value="gestion">Gestion locative</option><option value="recherche_locataire">Recherche locataire</option></select></label>
                    <label>Honoraires (%)<input name="honoraires" inputMode="decimal" placeholder="7.5" /></label>
                  </div>
                  <div className="row">
                    <label>Début<input name="date_debut" type="date" /></label>
                    <label>Fin<input name="date_fin" type="date" /></label>
                  </div>
                  <div className="row">
                    <label>Statut<select name="statut" defaultValue="actif"><option value="projet">Projet</option><option value="actif">Actif</option><option value="resilie">Résilié</option><option value="expire">Expiré</option></select></label>
                    <label>Signature<select name="signature_statut" defaultValue="signe"><option value="aucune">Aucune</option><option value="en_cours">En cours</option><option value="signe">Signé</option></select></label>
                  </div>
                  <label>Date de signature<input name="date_signature" type="date" /></label>
                  {msg.mandat && <div className="fmsg">{msg.mandat}</div>}
                  <button type="submit">Créer le mandat</button>
                </form>
                <div className="mini">{mandats.length} mandat{mandats.length > 1 ? "s" : ""}</div>
                <ul className="list">{mandats.slice(0, 8).map((m) => <li key={m.id}>{m.biens?.adresse || "—"}<span>{m.statut}</span></li>)}</ul>
              </section>

              {/* BAIL */}
              <section className="block">
                <h2>Nouveau bail</h2>
                <form onSubmit={createBail}>
                  <label>Bien <span className="req">*</span><select name="bien" required defaultValue=""><option value="" disabled>Choisir…</option>{bienOpts}</select></label>
                  <div className="row">
                    <label>Début<input name="date_debut" type="date" /></label>
                    <label>Fin<input name="date_fin" type="date" /></label>
                  </div>
                  <div className="row">
                    <label>Loyer HC (€)<input name="loyer_hc" inputMode="decimal" placeholder="720" /></label>
                    <label>Charges (€)<input name="charges" inputMode="decimal" placeholder="80" /></label>
                  </div>
                  <div className="row">
                    <label>Dépôt (€)<input name="depot_garantie" inputMode="decimal" placeholder="720" /></label>
                    <label>Statut<select name="statut" defaultValue="actif"><option value="projet">Projet</option><option value="actif">Actif</option><option value="termine">Terminé</option><option value="resilie">Résilié</option></select></label>
                  </div>
                  <label>Locataire<select name="locataire" defaultValue=""><option value="">—</option>{contactOpts}</select></label>
                  {msg.bail && <div className="fmsg">{msg.bail}</div>}
                  <button type="submit">Créer le bail</button>
                </form>
                <div className="mini">{baux.length} bail/baux</div>
                <ul className="list">{baux.slice(0, 8).map((bx) => <li key={bx.id}>{bx.biens?.adresse || "—"}<span>{bx.statut}</span></li>)}</ul>
              </section>
            </div>

            <p className="foot">Astuce : crée d'abord le contact (propriétaire ou locataire), puis le bien, puis le mandat et le bail. Les données apparaissent aussitôt dans les espaces client et les KPI du cockpit.</p>
          </div>
        )}
      </div>

      <style jsx global>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
      <style jsx>{`
        .wrap { min-height: 100vh; background: ${NOIR}; color: #f3efe6; font-family: "EB Garamond", Georgia, serif; }
        .center { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .spin { width: 32px; height: 32px; border-radius: 50%; border: 3px solid rgba(201,169,97,.25); border-top-color: ${OR}; animation: sp .9s linear infinite; }
        @keyframes sp { to { transform: rotate(360deg); } }
        .brand { font-family: "Cinzel", serif; font-size: 28px; letter-spacing: .12em; color: #fff; text-align: center; margin-bottom: 16px; }
        .brand span { display: block; font-size: 11px; letter-spacing: .26em; text-transform: uppercase; color: ${OR}; margin-top: 4px; }
        .brand.sm { font-size: 20px; margin: 0; }
        .brand.sm span { display: inline; margin-left: 10px; }
        .card { width: 100%; max-width: 380px; background: #141414; border: 1px solid rgba(201,169,97,.28); border-radius: 16px; padding: 32px 26px; }
        .card label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: #cfc6b2; margin-bottom: 14px; }
        .card input { background: ${NOIR}; border: 1px solid rgba(201,169,97,.35); border-radius: 8px; padding: 11px 12px; color: #f3efe6; font-size: 15px; font-family: inherit; }
        .card button { width: 100%; background: linear-gradient(180deg,#d8bd7e,${OR}); color: ${NOIR}; border: none; border-radius: 9px; padding: 13px; font-weight: 700; font-family: inherit; cursor: pointer; }
        .hint, .denied { color: #8f8674; font-size: 13px; text-align: center; margin: 12px 0 0; }
        .denied { color: #cfc6b2; margin-bottom: 16px; }
        .info { background: rgba(201,169,97,.12); border: 1px solid rgba(201,169,97,.4); color: #e7d9b4; padding: 9px 11px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
        .err { background: rgba(180,60,50,.16); border: 1px solid rgba(200,90,80,.5); color: #f0c9c3; padding: 9px 11px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
        .app { max-width: 1180px; margin: 0 auto; padding: 22px 20px 60px; }
        .top { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; border-bottom: 1px solid rgba(201,169,97,.2); margin-bottom: 22px; flex-wrap: wrap; gap: 10px; }
        .who { color: #a99f8b; font-size: 14px; display: flex; align-items: center; gap: 14px; }
        .navlink { color: ${OR}; text-decoration: none; }
        .ghost { background: transparent; border: 1px solid rgba(201,169,97,.4); color: ${OR}; border-radius: 8px; padding: 7px 13px; font-family: inherit; font-size: 13px; cursor: pointer; }
        .banner-err { background: rgba(180,60,50,.16); border: 1px solid rgba(200,90,80,.5); color: #f0c9c3; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }
        .cols { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
        .block { background: #121212; border: 1px solid rgba(201,169,97,.18); border-radius: 14px; padding: 20px; }
        .block h2 { font-family: "Cinzel", serif; color: #fff; font-size: 17px; margin: 0 0 16px; }
        .block form label { display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; color: #cfc6b2; margin-bottom: 12px; flex: 1; }
        .row { display: flex; gap: 12px; }
        .block input, .block select { background: ${NOIR}; border: 1px solid rgba(201,169,97,.3); border-radius: 8px; padding: 9px 11px; color: #f3efe6; font-size: 14px; font-family: inherit; width: 100%; }
        .req { color: ${OR}; }
        .block button { background: linear-gradient(180deg,#d8bd7e,${OR}); color: ${NOIR}; border: none; border-radius: 8px; padding: 11px 16px; font-weight: 700; font-family: inherit; cursor: pointer; margin-top: 4px; }
        .fmsg { color: ${OR}; font-size: 13px; margin-bottom: 10px; }
        .mini { color: #8f8674; font-size: 12px; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: .06em; }
        .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
        .list li { display: flex; justify-content: space-between; gap: 10px; font-size: 13.5px; color: #d8d0bf; border-bottom: 1px solid rgba(255,255,255,.05); padding-bottom: 5px; }
        .list li span { color: #8f8674; font-size: 12px; }
        .foot { color: #8f8674; font-size: 13px; margin-top: 26px; text-align: center; }
        @media (max-width: 820px) { .cols { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
