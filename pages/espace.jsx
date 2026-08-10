import Head from "next/head";
import { useEffect, useState, useCallback } from "react";

/*
  ATRIUM - Espace client (M3/M4).
  Portail unique proprietaire ET locataire. Connexion par code email (OTP
  Supabase). Selon les roles de l'identite connectee (bailleur / locataire),
  affiche la ou les vues correspondantes. La RLS PostgreSQL garantit que
  chacun ne voit que SES biens, mandats, baux et documents.
*/

const SB_URL = "https://suauroxtdffsglljfwnk.supabase.co";
const SB_KEY = "sb_publishable_XIELoVMT1PXE5b_05QGTDw_wG8KV6Ju";
const STORE = "atrium_espace_session";

const OR = "#a9853f";
const ORL = "#c9a961";

const fmtEur = (n) => (n == null ? "—" : Number(n).toLocaleString("fr-FR") + " €");
const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return d; }
};
const STATUT_BIEN = { loue: "Loué", vacant: "Vacant", en_recherche: "En recherche" };
const STATUT_MANDAT = { projet: "Projet", actif: "Actif", resilie: "Résilié", expire: "Expiré" };
const SIGN = { aucune: "Non signé", en_cours: "Signature en cours", signe: "Signé" };
const STATUT_BAIL = { projet: "Projet", actif: "En cours", termine: "Terminé", resilie: "Résilié" };
const TYPE_MANDAT = { gestion: "Gestion locative", recherche_locataire: "Recherche de locataire" };

function loadSession() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem(STORE) || "null"); } catch { return null; }
}
const saveSession = (s) => { if (typeof window !== "undefined") window.localStorage.setItem(STORE, JSON.stringify(s)); };
const clearStore = () => { if (typeof window !== "undefined") window.localStorage.removeItem(STORE); };

export default function Espace() {
  const [session, setSession] = useState(null);
  const [phase, setPhase] = useState("boot"); // boot|email|otp|denied|ready
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [roles, setRoles] = useState({ bailleur: false, locataire: false });
  const [tab, setTab] = useState("proprietaire");
  const [biens, setBiens] = useState([]);
  const [mandats, setMandats] = useState([]);
  const [bauxProp, setBauxProp] = useState([]);
  const [bailLoc, setBailLoc] = useState([]);
  const [docs, setDocs] = useState([]);

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
    saveSession(ns); setSession(ns);
    return ns.access_token;
  }, []);

  const rest = useCallback(async (pathQ, s) => {
    const token = await validToken(s);
    if (!token) throw new Error("session_expiree");
    const r = await fetch(`${SB_URL}/rest/v1/${pathQ}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` },
    });
    if (r.status === 401) throw new Error("session_expiree");
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

  const loadData = useCallback(async (s, isBailleur, isLocataire) => {
    if (isBailleur) {
      const [b, m, bx] = await Promise.all([
        rest(`biens?select=id,reference,adresse,type,surface,loyer_hc,charges,statut&order=adresse`, s),
        rest(`mandats?select=id,type,honoraires,date_debut,date_fin,statut,signature_statut,date_signature,bien_id,biens(adresse)`, s),
        rest(`baux?select=id,bien_id,date_debut,date_fin,loyer_hc,charges,depot_garantie,statut,biens(adresse),bail_parties(role,contacts(nom,prenom,raison_sociale))`, s),
      ]);
      const owned = new Set((Array.isArray(b) ? b : []).map((x) => x.id));
      setBiens(Array.isArray(b) ? b : []);
      setMandats(Array.isArray(m) ? m : []);
      setBauxProp((Array.isArray(bx) ? bx : []).filter((x) => owned.has(x.bien_id)));
    }
    if (isLocataire) {
      const bp = await rest(
        `bail_parties?select=role,baux(id,date_debut,date_fin,loyer_hc,charges,depot_garantie,statut,date_preavis,biens(adresse,type,surface))&role=eq.locataire`, s
      );
      setBailLoc((Array.isArray(bp) ? bp : []).map((x) => x.baux).filter(Boolean));
    }
    try {
      const d = await rest(`documents?select=id,type,created_at,expires_at&order=created_at.desc&limit=100`, s);
      setDocs(Array.isArray(d) ? d : []);
    } catch {}
  }, [rest]);

  const proceed = useCallback(async (s) => {
    setErr(""); setInfo("");
    let token;
    try { token = await validToken(s); } catch { token = null; }
    if (!token) { clearStore(); setSession(null); setPhase("email"); return; }
    let isB = false, isL = false;
    try {
      isB = (await rpc("has_role", { r: "bailleur" }, s)) === true;
      isL = (await rpc("has_role", { r: "locataire" }, s)) === true;
    } catch { setErr("Erreur de vérification du compte."); setPhase("email"); return; }
    if (!isB && !isL) { setPhase("denied"); return; }
    setRoles({ bailleur: isB, locataire: isL });
    setTab(isB ? "proprietaire" : "locataire");
    try { await loadData(s, isB, isL); setPhase("ready"); }
    catch (e) {
      if (String(e.message).includes("session")) { clearStore(); setSession(null); setPhase("email"); }
      else { setErr("Erreur de chargement."); setPhase("ready"); }
    }
  }, [validToken, rpc, loadData]);

  useEffect(() => {
    const s = loadSession();
    if (s && s.refresh_token) { setSession(s); proceed(s); }
    else setPhase("email");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRequestCode(e) {
    e.preventDefault();
    setBusy(true); setErr(""); setInfo("");
    const email = (e.currentTarget.email.value || "").trim().toLowerCase();
    try {
      const r = await fetch(`${SB_URL}/auth/v1/otp`, {
        method: "POST", headers: { "content-type": "application/json", apikey: SB_KEY },
        body: JSON.stringify({ email, create_user: false }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErr(r.status === 429 ? "Trop de demandes. Patientez une minute." : (j.error_description || j.msg || "Impossible d'envoyer le code."));
        setBusy(false); return;
      }
      setPendingEmail(email);
      setInfo("Un code à 6 chiffres vient d'être envoyé à " + email + ".");
      setPhase("otp");
    } catch { setErr("Connexion impossible. Vérifiez votre réseau."); }
    setBusy(false);
  }

  async function onVerifyCode(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const code = (e.currentTarget.code.value || "").replace(/\s/g, "");
    try {
      const r = await fetch(`${SB_URL}/auth/v1/verify`, {
        method: "POST", headers: { "content-type": "application/json", apikey: SB_KEY },
        body: JSON.stringify({ email: pendingEmail, token: code, type: "email" }),
      });
      const j = await r.json();
      if (!r.ok || !j.access_token) { setErr("Code incorrect ou expiré. Redemandez un code si besoin."); setBusy(false); return; }
      const s = { access_token: j.access_token, refresh_token: j.refresh_token,
        expires_at: j.expires_at || Math.floor(Date.now()/1000) + (j.expires_in || 3600), email: pendingEmail };
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
        method: "POST", headers: { "content-type": "application/json", apikey: SB_KEY },
        body: JSON.stringify({ email: pendingEmail, create_user: false }),
      });
      if (r.ok) setInfo("Nouveau code envoyé.");
      else setErr(r.status === 429 ? "Trop de demandes. Patientez une minute." : "Envoi impossible.");
    } catch { setErr("Réseau indisponible."); }
    setBusy(false);
  }

  async function onLogout() {
    try {
      const token = session && (await validToken(session));
      if (token) await fetch(`${SB_URL}/auth/v1/logout`, { method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` } });
    } catch {}
    clearStore(); setSession(null); setPhase("email");
    setBiens([]); setMandats([]); setBauxProp([]); setBailLoc([]); setDocs([]);
  }

  const nomLoc = (parties) => {
    const loc = (parties || []).find((p) => p.role === "locataire") || (parties || [])[0];
    const c = loc && loc.contacts;
    if (!c) return "—";
    return c.raison_sociale || [c.prenom, c.nom].filter(Boolean).join(" ") || "—";
  };

  return (
    <>
      <Head>
        <title>Espace client — ATRIUM by Le Temple de l&apos;Immobilier</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="wrap">
        {phase === "boot" && (<div className="center"><div className="spin" /><p>Ouverture de votre espace…</p></div>)}

        {phase === "email" && (
          <div className="center">
            <form className="card" onSubmit={onRequestCode}>
              <div className="brand">ATRIUM<span>Espace client</span></div>
              <p className="lead">Entrez votre email : vous recevrez un code à 6 chiffres pour accéder à votre espace propriétaire ou locataire.</p>
              <label>Email<input name="email" type="email" required placeholder="vous@email.fr" autoComplete="username" autoFocus /></label>
              {err && <div className="err">{err}</div>}
              <button type="submit" disabled={busy}>{busy ? "Envoi du code…" : "Recevoir mon code"}</button>
              <p className="hint">Réservé aux clients du cabinet.</p>
            </form>
          </div>
        )}

        {phase === "otp" && (
          <div className="center">
            <form className="card" onSubmit={onVerifyCode}>
              <div className="brand">ATRIUM<span>Vérification</span></div>
              {info && <div className="info">{info}</div>}
              <p className="lead">Saisissez le code à 6 chiffres reçu par email (pensez à vérifier les spams).</p>
              <label>Code à 6 chiffres<input name="code" inputMode="numeric" pattern="[0-9 ]*" maxLength={8} required placeholder="123456" autoComplete="one-time-code" autoFocus /></label>
              {err && <div className="err">{err}</div>}
              <button type="submit" disabled={busy}>{busy ? "Vérification…" : "Accéder à mon espace"}</button>
              <p className="hint"><a className="link" onClick={onResend}>Renvoyer le code</a>{"  ·  "}<a className="link" onClick={() => { setPhase("email"); setErr(""); setInfo(""); }}>Changer d'email</a></p>
            </form>
          </div>
        )}

        {phase === "denied" && (
          <div className="center">
            <div className="card">
              <div className="brand">ATRIUM<span>Espace client</span></div>
              <p className="lead">Aucun espace propriétaire ou locataire n'est encore associé à ce compte. Contactez le cabinet pour l'activation.</p>
              <p className="hint2">03 27 95 61 14 · contact@templeimmo.com</p>
              <button onClick={onLogout}>Se déconnecter</button>
            </div>
          </div>
        )}

        {phase === "ready" && (
          <div className="app">
            <header className="top">
              <div className="brand sm">ATRIUM<span>Espace client</span></div>
              <div className="who">{session?.email}<button className="ghost" onClick={onLogout}>Déconnexion</button></div>
            </header>

            {err && <div className="banner-err">{err}</div>}

            {roles.bailleur && roles.locataire && (
              <div className="tabs">
                <button className={tab === "proprietaire" ? "on" : ""} onClick={() => setTab("proprietaire")}>Espace propriétaire</button>
                <button className={tab === "locataire" ? "on" : ""} onClick={() => setTab("locataire")}>Espace locataire</button>
              </div>
            )}

            {roles.bailleur && (!roles.locataire || tab === "proprietaire") && (
              <div className="panel">
                <h1>Espace propriétaire</h1>

                <h2>Mes biens</h2>
                {biens.length === 0 ? <div className="empty">Aucun bien enregistré pour le moment.</div> : (
                  <div className="grid">
                    {biens.map((b) => (
                      <div className="tile" key={b.id}>
                        <div className="thead"><span className="taddr">{b.adresse}</span><span className={`pill ${b.statut === "loue" ? "ok" : "warn"}`}>{STATUT_BIEN[b.statut] || b.statut}</span></div>
                        <div className="trow">{b.type || "Bien"}{b.surface ? ` · ${b.surface} m²` : ""}</div>
                        <div className="tval">{fmtEur(b.loyer_hc)}<span className="tsub"> /mois HC{b.charges ? ` + ${fmtEur(b.charges)} de charges` : ""}</span></div>
                      </div>
                    ))}
                  </div>
                )}

                <h2>Mon mandat de gestion</h2>
                {mandats.length === 0 ? <div className="empty">Aucun mandat pour le moment.</div> : (
                  <div className="grid">
                    {mandats.map((m) => (
                      <div className="tile" key={m.id}>
                        <div className="thead"><span className="taddr">{TYPE_MANDAT[m.type] || m.type}</span><span className={`pill ${m.statut === "actif" ? "ok" : "warn"}`}>{STATUT_MANDAT[m.statut] || m.statut}</span></div>
                        <div className="trow">{m.biens?.adresse || ""}</div>
                        <div className="trow">Honoraires : <b>{m.honoraires != null ? m.honoraires + " %" : "—"}</b> · {SIGN[m.signature_statut] || ""}</div>
                        <div className="trow small">Depuis le {fmtDate(m.date_debut)}{m.date_fin ? ` · échéance ${fmtDate(m.date_fin)}` : ""}</div>
                      </div>
                    ))}
                  </div>
                )}

                <h2>Mes baux en cours</h2>
                {bauxProp.length === 0 ? <div className="empty">Aucun bail en cours.</div> : (
                  <div className="grid">
                    {bauxProp.map((bx) => (
                      <div className="tile" key={bx.id}>
                        <div className="thead"><span className="taddr">{bx.biens?.adresse || "Bien"}</span><span className={`pill ${bx.statut === "actif" ? "ok" : "warn"}`}>{STATUT_BAIL[bx.statut] || bx.statut}</span></div>
                        <div className="trow">Locataire : <b>{nomLoc(bx.bail_parties)}</b></div>
                        <div className="trow">Loyer : <b>{fmtEur(bx.loyer_hc)}</b> HC{bx.charges ? ` + ${fmtEur(bx.charges)} charges` : ""} · Dépôt {fmtEur(bx.depot_garantie)}</div>
                        <div className="trow small">Depuis le {fmtDate(bx.date_debut)}</div>
                      </div>
                    ))}
                  </div>
                )}

                <h2>Mes documents</h2>
                <DocsList docs={docs} />
              </div>
            )}

            {roles.locataire && (!roles.bailleur || tab === "locataire") && (
              <div className="panel">
                <h1>Espace locataire</h1>
                {bailLoc.length === 0 ? <div className="empty">Aucun bail associé à votre compte pour le moment.</div> : bailLoc.map((bl) => (
                  <div key={bl.id}>
                    <h2>Mon logement</h2>
                    <div className="tile solo">
                      <div className="taddr big">{bl.biens?.adresse || "Logement"}</div>
                      <div className="trow">{bl.biens?.type || ""}{bl.biens?.surface ? ` · ${bl.biens.surface} m²` : ""}</div>
                    </div>
                    <h2>Mon bail</h2>
                    <div className="detgrid">
                      <div className="det"><span>Loyer hors charges</span><b>{fmtEur(bl.loyer_hc)}</b></div>
                      <div className="det"><span>Charges</span><b>{fmtEur(bl.charges)}</b></div>
                      <div className="det"><span>Total mensuel</span><b>{fmtEur((Number(bl.loyer_hc)||0) + (Number(bl.charges)||0))}</b></div>
                      <div className="det"><span>Dépôt de garantie</span><b>{fmtEur(bl.depot_garantie)}</b></div>
                      <div className="det"><span>Entrée dans les lieux</span><b>{fmtDate(bl.date_debut)}</b></div>
                      <div className="det"><span>Statut</span><b>{STATUT_BAIL[bl.statut] || bl.statut}</b></div>
                    </div>
                  </div>
                ))}
                <h2>Mes quittances & documents</h2>
                <DocsList docs={docs} vide="Vos quittances et documents apparaîtront ici." />
              </div>
            )}

            <p className="foot">ATRIUM by Le Temple de l&apos;Immobilier · 03 27 95 61 14 · contact@templeimmo.com</p>
          </div>
        )}
      </div>

      <style jsx global>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
      <style jsx>{`
        .wrap { min-height: 100vh; background: #f7f4ee; color: #2a2620; font-family: "EB Garamond", Georgia, serif; }
        .center { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 24px; }
        .spin { width: 34px; height: 34px; border-radius: 50%; border: 3px solid rgba(169,133,63,.25); border-top-color: ${OR}; animation: sp .9s linear infinite; }
        @keyframes sp { to { transform: rotate(360deg); } }
        .brand { font-family: "Cinzel", serif; font-size: 30px; letter-spacing: .12em; color: #0d0d0d; text-align: center; margin-bottom: 18px; }
        .brand span { display: block; font-family: "EB Garamond", serif; font-size: 12px; letter-spacing: .26em; text-transform: uppercase; color: ${OR}; margin-top: 4px; }
        .brand.sm { font-size: 22px; margin: 0; }
        .brand.sm span { display: inline; margin-left: 10px; font-size: 11px; }
        .card { width: 100%; max-width: 400px; background: #fffdf8; border: 1px solid #e6ddca; border-radius: 16px; padding: 34px 28px; }
        .card label { display: flex; flex-direction: column; gap: 7px; font-size: 13px; color: #6b6350; margin-bottom: 16px; }
        .card input { background: #fff; border: 1px solid #d9cfb6; border-radius: 9px; padding: 12px 13px; color: #2a2620; font-size: 15px; font-family: inherit; }
        .card input:focus { outline: none; border-color: ${OR}; }
        .card button { width: 100%; margin-top: 6px; background: linear-gradient(180deg,#c9a961,${OR}); color: #221c0c; border: none; border-radius: 10px; padding: 14px; font-size: 16px; font-weight: 700; font-family: inherit; cursor: pointer; }
        .card button:disabled { opacity: .6; cursor: default; }
        .lead { color: #5a5344; font-size: 14px; line-height: 1.6; margin: 0 0 18px; }
        .hint, .hint2 { color: #8a8069; font-size: 13px; text-align: center; margin: 14px 0 0; }
        .hint2 { margin-bottom: 18px; }
        .link { color: ${OR}; cursor: pointer; text-decoration: underline; }
        .info { background: rgba(201,169,97,.14); border: 1px solid rgba(201,169,97,.5); color: #7a6427; padding: 10px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; }
        .err { background: #fbecea; border: 1px solid #e6b9b1; color: #a5453a; padding: 10px 12px; border-radius: 8px; font-size: 13.5px; margin-bottom: 14px; }
        .app { max-width: 1080px; margin: 0 auto; padding: 22px 20px 60px; }
        .top { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 1px solid #e6ddca; margin-bottom: 22px; flex-wrap: wrap; gap: 10px; }
        .who { color: #6b6350; font-size: 14px; display: flex; align-items: center; gap: 14px; }
        .ghost { background: transparent; border: 1px solid #d9cfb6; color: ${OR}; border-radius: 8px; padding: 8px 14px; font-family: inherit; font-size: 13px; cursor: pointer; }
        .banner-err { background: #fbecea; border: 1px solid #e6b9b1; color: #a5453a; padding: 10px 14px; border-radius: 8px; margin-bottom: 18px; }
        .tabs { display: flex; gap: 10px; margin-bottom: 22px; }
        .tabs button { background: #fffdf8; border: 1px solid #e6ddca; color: #6b6350; border-radius: 30px; padding: 9px 20px; font-family: inherit; font-size: 14px; cursor: pointer; }
        .tabs button.on { background: #0d0d0d; color: #fff; border-color: #0d0d0d; }
        .panel h1 { font-family: "Cinzel", serif; font-size: 26px; color: #0d0d0d; margin: 0 0 6px; }
        .panel h2 { font-family: "Cinzel", serif; font-size: 17px; color: #0d0d0d; margin: 30px 0 12px; border-left: 3px solid ${ORL}; padding-left: 12px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
        .tile { background: #fffdf8; border: 1px solid #e6ddca; border-left: 3px solid ${ORL}; border-radius: 10px; padding: 16px 18px; }
        .tile.solo { max-width: 460px; }
        .thead { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px; }
        .taddr { font-family: "Cinzel", serif; font-size: 15px; color: #0d0d0d; }
        .taddr.big { font-size: 20px; }
        .pill { font-size: 11px; padding: 2px 10px; border-radius: 20px; white-space: nowrap; }
        .pill.ok { background: #e7f0e4; color: #3d6b34; }
        .pill.warn { background: #f6ecd9; color: #8a6a1f; }
        .trow { color: #46402f; font-size: 14.5px; line-height: 1.7; }
        .trow.small { color: #8a8069; font-size: 13px; }
        .tval { font-size: 22px; color: #0d0d0d; margin-top: 6px; font-weight: 600; }
        .tsub { font-size: 13px; color: #8a8069; font-weight: 400; }
        .detgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        .det { background: #fffdf8; border: 1px solid #e6ddca; border-radius: 10px; padding: 14px 16px; }
        .det span { display: block; color: #8a8069; font-size: 12.5px; margin-bottom: 4px; }
        .det b { color: #0d0d0d; font-size: 18px; }
        .empty { color: #a49a82; background: #fbf9f2; border: 1px dashed #e0d6bf; border-radius: 10px; padding: 16px; font-size: 14px; }
        .foot { text-align: center; color: #a49a82; font-size: 12.5px; margin-top: 40px; }
        @media (max-width: 560px) { .panel h1 { font-size: 22px; } }
      `}</style>
    </>
  );
}

function DocsList({ docs, vide }) {
  const TYPES = { bail: "Bail", quittance: "Quittance de loyer", releve: "Relevé de gérance", avis: "Avis", diagnostic: "Diagnostic", etat_des_lieux: "État des lieux", mandat: "Mandat" };
  if (!docs || docs.length === 0) {
    return <div className="empty">{vide || "Vos documents (mandat, quittances, relevés, états des lieux) apparaîtront ici dès qu'ils seront déposés par le cabinet."}
      <style jsx>{`.empty { color: #a49a82; background: #fbf9f2; border: 1px dashed #e0d6bf; border-radius: 10px; padding: 16px; font-size: 14px; }`}</style>
    </div>;
  }
  return (
    <div className="dlist">
      {docs.map((d) => (
        <div className="drow" key={d.id}>
          <span className="dtype">{TYPES[d.type] || d.type}</span>
          <span className="ddate">{d.created_at ? new Date(d.created_at).toLocaleDateString("fr-FR") : ""}</span>
          <span className="dsoon">Téléchargement à venir</span>
        </div>
      ))}
      <style jsx>{`
        .dlist { display: flex; flex-direction: column; gap: 8px; }
        .drow { display: flex; align-items: center; gap: 14px; background: #fffdf8; border: 1px solid #e6ddca; border-radius: 9px; padding: 12px 16px; }
        .dtype { font-size: 15px; color: #0d0d0d; flex: 1; }
        .ddate { color: #8a8069; font-size: 13px; }
        .dsoon { color: #a49a82; font-size: 12px; font-style: italic; }
      `}</style>
    </div>
  );
}
