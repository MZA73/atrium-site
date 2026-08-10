import Head from "next/head";
import { useEffect, useState, useCallback, useRef } from "react";

/*
  ATRIUM - Generateur de bail multifonction (saisie cabinet, M2.6).
  Reserve aux administrateurs (session partagee avec /admin et /gestion).
  1) On choisit un bail existant -> pre-remplissage auto (mapping confirme).
  2) Le cabinet complete / ajuste les champs et les selecteurs (regime, profil,
     garantie, zone, dpe) + cautions multiples.
  3) Apercu PDF genere cote navigateur (jsPDF + /gen_core.js).
  4) "Envoyer pour signature" : upload du PDF dans le bucket "documents" PUIS
     (seulement si l'upload reussit) insertion documents + document_links.
     L'ordre garantit qu'aucune ligne orpheline n'est creee si le stockage
     refuse : rien n'est casse, tout est reversible.
*/

const SB_URL = "https://suauroxtdffsglljfwnk.supabase.co";
const SB_KEY = "sb_publishable_XIELoVMT1PXE5b_05QGTDw_wG8KV6Ju";
const STORE = "atrium_admin_session";
const OR = "#C9A961";
const NOIR = "#0D0D0D";
const JSPDF_CDN = "https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js";

const loadSession = () => {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem(STORE) || "null"); } catch { return null; }
};
const saveSession = (s) => { if (typeof window !== "undefined") window.localStorage.setItem(STORE, JSON.stringify(s)); };
const clearStore = () => { if (typeof window !== "undefined") window.localStorage.removeItem(STORE); };

const nomContact = (c) => c ? (c.raison_sociale || [c.prenom, c.nom].filter(Boolean).join(" ") || c.email || "") : "";
const frDate = (iso) => {
  if (!iso) return "";
  const m = String(iso).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(iso);
};
const isMorale = (c) => !!(c && c.raison_sociale && !c.nom && !c.prenom);

// Champs du generateur (cles lues par buildBail). Groupes pour la saisie.
const FIELD_GROUPS = [
  ["Reference / dates", [
    ["reference", "Reference du bail"], ["jour", "Fait le (jour)"], ["date", "Date de l'acte"],
    ["date_effet", "Date d'effet"], ["date_fin", "Date de fin"], ["date_edl", "Date etat des lieux"],
    ["premier", "1er loyer (date)"],
  ]],
  ["Bailleur", [
    ["bailleur_nom", "Nom / denomination"], ["bailleur_qualite", "Qualite"], ["bailleur_adresse", "Adresse"],
    ["bailleur_email", "Email"], ["bailleur_tel", "Telephone"],
  ]],
  ["Locataire(s)", [
    ["locataire", "Locataire(s)"], ["loc_occupant", "Occupant(s) si different"],
  ]],
  ["Personne morale locataire (SCI...)", [
    ["loc_denom", "Denomination"], ["loc_forme", "Forme (SCI...)"], ["loc_capital", "Capital"],
    ["loc_rcs", "RCS"], ["loc_siege", "Siege"], ["loc_repr", "Represente par"], ["loc_qualrepr", "Qualite du representant"],
  ]],
  ["Bien", [
    ["bien_type", "Type (T3...)"], ["bien_adresse", "Adresse du bien"], ["bien_surface", "Surface (m2)"],
    ["bien_pieces", "Nombre de pieces"], ["bien_chambres", "Chambres"], ["bien_annee", "Annee construction"],
    ["bien_cadastre", "Cadastre"], ["bien_chauffage", "Chauffage"], ["bien_eauchaude", "Eau chaude"], ["bien_equip", "Equipements"],
  ]],
  ["Loyer & charges", [
    ["loyer", "Loyer HC (EUR)"], ["charges", "Charges (EUR)"], ["depot", "Depot de garantie (EUR)"],
    ["mode_paiement", "Mode de paiement"], ["irl", "IRL de reference"],
  ]],
  ["Encadrement (si zone concernee)", [
    ["loyer_ref", "Loyer de reference (EUR/m2)"], ["loyer_maj", "Loyer de reference majore (EUR/m2)"],
    ["complement", "Complement de loyer (EUR)"], ["motif_compl", "Motif du complement"], ["dernier_loyer", "Dernier loyer applique"],
  ]],
  ["DPE", [
    ["dpe_classe", "Classe DPE"], ["dpe_conso", "Consommation"], ["cout_energie", "Cout energie estime"],
  ]],
  ["Honoraires (ALUR)", [
    ["hono_loc", "Honoraires locataire (bail)"], ["hono_loc_edl", "Honoraires locataire (EDL)"],
    ["hono_bail", "Honoraires bailleur (bail)"], ["hono_bail_edl", "Honoraires bailleur (EDL)"],
  ]],
  ["Divers", [
    ["num_mandat", "Numero de mandat"], ["gli", "Assureur GLI"], ["duree_mob", "Duree (bail mobilite)"], ["visa", "Reference Visale"],
  ]],
];

export default function GestionBail() {
  const [session, setSession] = useState(null);
  const [phase, setPhase] = useState("boot"); // boot|email|otp|denied|ready
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [baux, setBaux] = useState([]);
  const [selId, setSelId] = useState("");
  const [d, setD] = useState({ regime: "nu", profil: "seul", garantie: "caution", zone: "non", dpe: "ok" });
  const [cautions, setCautions] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [sendMsg, setSendMsg] = useState("");
  const [libReady, setLibReady] = useState(false);
  const lastDoc = useRef(null);

  // --- Auth (identique a /gestion) ---
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
      expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), email: s.email };
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

  const loadBaux = useCallback(async (s) => {
    const bx = await api(
      "baux?select=id,date_debut,date_fin,loyer_hc,charges,depot_garantie,statut,bien_id," +
      "biens(reference,adresse,type,surface,loyer_hc,charges)," +
      "bail_parties(role,contact_id,contacts(civilite,nom,prenom,raison_sociale,email,adresse,code_postal,ville,telephone))" +
      "&order=created_at.desc&limit=100", s);
    setBaux(Array.isArray(bx) ? bx : []);
  }, [api]);

  const proceed = useCallback(async (s) => {
    setErr("");
    let token; try { token = await validToken(s); } catch { token = null; }
    if (!token) { clearStore(); setSession(null); setPhase("email"); return; }
    let admin; try { admin = await rpc("has_role", { r: "admin" }, s); } catch { setPhase("email"); return; }
    if (admin !== true) { setPhase("denied"); return; }
    try { await loadBaux(s); setPhase("ready"); }
    catch (e) { if (String(e.message).includes("session")) { clearStore(); setSession(null); setPhase("email"); } else { setErr("Erreur de chargement des baux."); setPhase("ready"); } }
  }, [validToken, rpc, loadBaux]);

  useEffect(() => {
    const s = loadSession();
    if (s && s.refresh_token) { setSession(s); proceed(s); } else setPhase("email");
    // charge jsPDF + le coeur de generation
    const j = document.createElement("script"); j.src = JSPDF_CDN; j.async = true;
    j.onload = () => {
      const g = document.createElement("script"); g.src = "/gen_core.js"; g.async = true;
      g.onload = () => setLibReady(true);
      document.body.appendChild(g);
    };
    document.body.appendChild(j);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRequestCode(e) {
    e.preventDefault(); setBusy(true); setErr(""); setInfo("");
    const email = (e.currentTarget.email.value || "").trim().toLowerCase();
    try {
      const r = await fetch(`${SB_URL}/auth/v1/otp`, { method: "POST", headers: { "content-type": "application/json", apikey: SB_KEY }, body: JSON.stringify({ email, create_user: false }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(r.status === 429 ? "Trop de demandes. Patientez une minute." : (j.error_description || j.msg || "Envoi impossible.")); setBusy(false); return; }
      setPendingEmail(email); setInfo("Code envoye a " + email + "."); setPhase("otp");
    } catch { setErr("Connexion impossible."); }
    setBusy(false);
  }

  async function onVerifyCode(e) {
    e.preventDefault(); setBusy(true); setErr("");
    const code = (e.currentTarget.code.value || "").replace(/\s/g, "");
    try {
      const r = await fetch(`${SB_URL}/auth/v1/verify`, { method: "POST", headers: { "content-type": "application/json", apikey: SB_KEY }, body: JSON.stringify({ email: pendingEmail, token: code, type: "email" }) });
      const j = await r.json();
      if (!r.ok || !j.access_token) { setErr("Code incorrect ou expire."); setBusy(false); return; }
      const s = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), email: pendingEmail };
      saveSession(s); setSession(s); setPhase("boot"); await proceed(s);
    } catch { setErr("Connexion impossible."); }
    setBusy(false);
  }

  async function onLogout() {
    try { const t = session && (await validToken(session)); if (t) await fetch(`${SB_URL}/auth/v1/logout`, { method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${t}` } }); } catch {}
    clearStore(); setSession(null); setPhase("email");
  }

  // --- Pre-remplissage a partir d'un bail choisi ---
  function prefill(bail) {
    if (!bail) return;
    const parts = Array.isArray(bail.bail_parties) ? bail.bail_parties : [];
    const locs = parts.filter((p) => ["locataire", "co_titulaire"].includes(p.role)).map((p) => p.contacts).filter(Boolean);
    const cauts = parts.filter((p) => ["garant", "caution"].includes(p.role)).map((p) => p.contacts).filter(Boolean);
    const bailleurs = parts.filter((p) => p.role === "bailleur").map((p) => p.contacts).filter(Boolean);
    const bien = bail.biens || {};

    const profil = locs.length > 1 ? "coloc" : (locs.some(isMorale) ? "morale" : "seul");
    const nd = { ...d, regime: "nu", profil, garantie: cauts.length ? "caution" : "sans", zone: "non", dpe: "ok" };
    nd.reference = bien.reference || ("BAIL-" + String(bail.id).slice(0, 8));
    nd.bien_type = bien.type || "";
    nd.bien_adresse = bien.adresse || "";
    nd.bien_surface = bien.surface != null ? String(bien.surface) : "";
    nd.loyer = (bail.loyer_hc != null ? bail.loyer_hc : bien.loyer_hc) != null ? String(bail.loyer_hc != null ? bail.loyer_hc : bien.loyer_hc) : "";
    nd.charges = (bail.charges != null ? bail.charges : bien.charges) != null ? String(bail.charges != null ? bail.charges : bien.charges) : "";
    nd.depot = bail.depot_garantie != null ? String(bail.depot_garantie) : "";
    nd.date_effet = frDate(bail.date_debut);
    nd.date_fin = frDate(bail.date_fin);
    nd.locataire = locs.map(nomContact).filter(Boolean).join(" ; ");
    if (locs.some(isMorale)) {
      const m = locs.find(isMorale);
      nd.loc_denom = m.raison_sociale || ""; nd.loc_siege = [m.adresse, m.code_postal, m.ville].filter(Boolean).join(" ");
    }
    if (bailleurs.length) {
      const b0 = bailleurs[0];
      nd.bailleur_nom = nomContact(b0);
      nd.bailleur_adresse = [b0.adresse, b0.code_postal, b0.ville].filter(Boolean).join(" ");
      nd.bailleur_email = b0.email || ""; nd.bailleur_tel = b0.telephone || "";
    }
    setD(nd);
    setCautions(cauts.map((c) => ({
      nom: nomContact(c), plafond: "", revenus: "",
      naissance: "", adresse: [c.adresse, c.code_postal, c.ville].filter(Boolean).join(" "), duree: "",
    })));
    setPreviewUrl(""); setSendMsg("");
  }

  function onPick(e) {
    const id = e.target.value; setSelId(id);
    prefill(baux.find((b) => String(b.id) === String(id)));
  }

  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const setCaution = (i, k, v) => setCautions((p) => p.map((c, j) => (j === i ? { ...c, [k]: v } : c)));
  const addCaution = () => setCautions((p) => [...p, { nom: "", plafond: "", revenus: "", naissance: "", adresse: "", duree: "" }]);
  const delCaution = (i) => setCautions((p) => p.filter((_, j) => j !== i));

  function buildData() {
    const payload = { ...d };
    payload.cautions = (d.garantie === "caution") ? cautions.filter((c) => (c.nom || "").trim()) : [];
    return payload;
  }

  function makeDoc() {
    if (!libReady || !window.jspdf || !window.buildBail) { setErr("Moteur PDF en cours de chargement, reessaie dans un instant."); return null; }
    setErr("");
    try {
      const doc = window.buildBail(window.jspdf.jsPDF, buildData());
      lastDoc.current = doc;
      return doc;
    } catch (e2) { setErr("Erreur de generation : " + (e2 && e2.message ? e2.message : e2)); return null; }
  }

  function onPreview() {
    const doc = makeDoc(); if (!doc) return;
    try { if (previewUrl) URL.revokeObjectURL(previewUrl); } catch {}
    setPreviewUrl(doc.output("bloburl"));
  }

  function onDownload() {
    const doc = makeDoc(); if (!doc) return;
    doc.save(((d.reference || "bail").replace(/[^\w\-]+/g, "-")) + ".pdf");
  }

  async function sha256Hex(bytes) {
    try { const h = await crypto.subtle.digest("SHA-256", bytes); return Array.from(new Uint8Array(h)).map((x) => x.toString(16).padStart(2, "0")).join(""); }
    catch { return null; }
  }

  // --- Envoyer pour signature : upload d'abord, insert ensuite ---
  async function onSend() {
    setSendMsg(""); setErr("");
    const bail = baux.find((b) => String(b.id) === String(selId));
    if (!bail) { setSendMsg("Choisis d'abord un bail."); return; }
    const parts = Array.isArray(bail.bail_parties) ? bail.bail_parties : [];
    const locIds = parts.filter((p) => ["locataire", "co_titulaire"].includes(p.role) && p.contact_id).map((p) => p.contact_id);
    const cautIds = parts.filter((p) => ["garant", "caution"].includes(p.role) && p.contact_id).map((p) => p.contact_id);
    const payload = buildData();
    const doc = makeDoc(); if (!doc) return;
    setBusy(true);
    try {
      const ab = doc.output("arraybuffer");
      const bytes = new Uint8Array(ab);
      const hash = await sha256Hex(ab);
      const token = await validToken(session);
      if (!token) throw new Error("session_expiree");
      const rand = Math.random().toString(36).slice(2, 8);
      const path = `bail/${bail.id}/${Date.now()}-${rand}.pdf`;

      // 1) UPLOAD (doit reussir avant toute ecriture en base)
      const up = await fetch(`${SB_URL}/storage/v1/object/documents/${path}`, {
        method: "POST",
        headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": "application/pdf", "x-upsert": "false" },
        body: bytes,
      });
      if (!up.ok) {
        const t = await up.text().catch(() => "");
        throw new Error("Upload refuse (" + up.status + "). " + (t || "Verifier les droits du bucket documents.") + " Aucune donnee n'a ete ecrite.");
      }

      // 1bis) UPLOAD du payload (permet la regeneration signee a la finalisation)
      try {
        await fetch(`${SB_URL}/storage/v1/object/documents/${path.replace(/\.pdf$/, ".json")}`, {
          method: "POST",
          headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": "application/json", "x-upsert": "false" },
          body: JSON.stringify({ ...payload, _bailId: bail.id, _bienId: bail.bien_id, _locName: payload.locataire || "" }),
        });
      } catch {}

      // 2) INSERT documents (seulement apres upload OK)
      const drow = await api("documents", session, { method: "POST", prefer: "return=representation", body: {
        type: "bail", storage_path: path, file_hash: hash, mime_type: "application/pdf",
        signature_statut: "en_cours", visibility: "locataire",
      }});
      const docId = Array.isArray(drow) && drow[0] ? drow[0].id : null;
      if (!docId) throw new Error("Document cree mais identifiant introuvable.");

      // 3) INSERT document_links (un lien par locataire ; sinon un lien bail/bien)
      const allIds = [...new Set([...locIds, ...cautIds])];
      const links = allIds.length
        ? allIds.map((cid) => ({ document_id: docId, contact_id: cid, bail_id: bail.id, bien_id: bail.bien_id }))
        : [{ document_id: docId, bail_id: bail.id, bien_id: bail.bien_id }];
      try {
        await api("document_links", session, { method: "POST", prefer: "return=minimal", body: links });
      } catch (le) {
        setSendMsg("Document enregistre (statut en_cours) mais liaison partielle : " + le.message + ". Verifie les liens dans /gestion.");
        setBusy(false); return;
      }

      setSendMsg("Envoye pour signature. Le bail apparait dans l'espace du/des locataire(s) sous « Documents a signer » (statut en_cours).");
    } catch (e3) {
      setSendMsg("Echec : " + (e3 && e3.message ? e3.message : e3));
    }
    setBusy(false);
  }

  // ---------- RENDU ----------
  const wrap = { maxWidth: 1180, margin: "0 auto", padding: "0 20px" };
  const label = { display: "block", fontSize: 11, letterSpacing: 0.4, color: "#7a6a44", marginBottom: 4, fontFamily: "Arial,sans-serif" };
  const inp = { width: "100%", padding: "8px 10px", border: "1px solid #d8cba3", borderRadius: 7, background: "#fffdf8", fontSize: 13.5, color: "#2a2620", boxSizing: "border-box" };
  const btn = (bg, fg) => ({ padding: "10px 16px", borderRadius: 9, border: "1px solid " + OR, background: bg, color: fg, fontWeight: 700, cursor: "pointer", fontSize: 13.5, letterSpacing: 0.3 });
  const card = { background: "#fff", border: "1px solid #ecdfbd", borderRadius: 14, padding: 18, marginBottom: 16 };

  return (
    <>
      <Head><title>ATRIUM — Generateur de bail</title><meta name="robots" content="noindex" /></Head>
      <div style={{ minHeight: "100vh", background: "#f4efe4", fontFamily: "Georgia,'Times New Roman',serif" }}>
        <header style={{ background: NOIR, borderBottom: "2px solid " + OR, padding: "16px 0" }}>
          <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: OR, fontSize: 22, letterSpacing: 7, fontWeight: "bold" }}>ATRIUM</div>
              <div style={{ color: "#b7ae98", fontSize: 11.5, fontStyle: "italic" }}>Generateur de bail multifonction — cabinet</div>
            </div>
            {phase === "ready" && <button onClick={onLogout} style={btn("transparent", OR)}>Se deconnecter</button>}
          </div>
        </header>

        <main style={{ ...wrap, padding: "24px 20px 60px" }}>
          {phase === "boot" && <p style={{ color: "#7a6a44" }}>Chargement…</p>}

          {phase === "denied" && (
            <div style={card}><p style={{ color: "#8a2a2a", margin: 0 }}>Acces reserve aux administrateurs. <a href="/gestion" style={{ color: OR }}>Retour</a></p></div>
          )}

          {(phase === "email" || phase === "otp") && (
            <div style={{ ...card, maxWidth: 420, margin: "40px auto" }}>
              <h1 style={{ fontSize: 20, color: NOIR, marginTop: 0 }}>Espace cabinet</h1>
              {err && <p style={{ color: "#8a2a2a", fontSize: 13 }}>{err}</p>}
              {info && <p style={{ color: "#2a6a2a", fontSize: 13 }}>{info}</p>}
              {phase === "email" ? (
                <form onSubmit={onRequestCode}>
                  <label style={label}>Email administrateur</label>
                  <input name="email" type="email" required style={inp} placeholder="contact@templeimmo.com" />
                  <button disabled={busy} style={{ ...btn(OR, NOIR), marginTop: 12, width: "100%" }}>{busy ? "…" : "Recevoir un code"}</button>
                </form>
              ) : (
                <form onSubmit={onVerifyCode}>
                  <label style={label}>Code recu par email</label>
                  <input name="code" inputMode="numeric" required style={inp} placeholder="123456" />
                  <button disabled={busy} style={{ ...btn(OR, NOIR), marginTop: 12, width: "100%" }}>{busy ? "…" : "Valider"}</button>
                </form>
              )}
            </div>
          )}

          {phase === "ready" && (
            <>
              {err && <div style={{ ...card, borderColor: "#e0b4b4", background: "#fff6f6", color: "#8a2a2a" }}>{err}</div>}

              <div style={card}>
                <label style={label}>1 · Choisir un bail existant (pre-remplissage auto)</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <select value={selId} onChange={onPick} style={{ ...inp, maxWidth: 640 }}>
                    <option value="">— selectionner un bail —</option>
                    {baux.map((b) => {
                      const loc = (b.bail_parties || []).filter((p) => ["locataire", "co_titulaire"].includes(p.role)).map((p) => nomContact(p.contacts)).filter(Boolean).join(", ");
                      const adr = b.biens ? b.biens.adresse : "";
                      return <option key={b.id} value={b.id}>{(b.biens && b.biens.reference ? b.biens.reference + " · " : "") + (adr || "bien") + (loc ? " · " + loc : "")}</option>;
                    })}
                  </select>
                  <button onClick={() => loadBaux(session)} style={btn("transparent", "#7a6a44")}>Rafraichir</button>
                </div>
                <p style={{ fontSize: 11.5, color: "#8a8069", margin: "8px 0 0" }}>Le cabinet garde la main : on complete et on ajuste ci-dessous avant de generer et d'envoyer.</p>
              </div>

              <div style={card}>
                <label style={label}>2 · Profil du bail</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
                  <div><label style={label}>Regime</label>
                    <select value={d.regime} onChange={(e) => set("regime", e.target.value)} style={inp}>
                      <option value="nu">Nu (vide)</option><option value="meuble">Meuble</option><option value="etudiant">Etudiant meuble</option><option value="mobilite">Bail mobilite</option>
                    </select></div>
                  <div><label style={label}>Profil locataire</label>
                    <select value={d.profil} onChange={(e) => set("profil", e.target.value)} style={inp}>
                      <option value="seul">Locataire seul</option><option value="coloc">Colocation</option><option value="morale">Personne morale (SCI…)</option>
                    </select></div>
                  <div><label style={label}>Garantie</label>
                    <select value={d.garantie} onChange={(e) => set("garantie", e.target.value)} style={inp}>
                      <option value="caution">Caution(s)</option><option value="visale">Visale</option><option value="gli">GLI</option><option value="sans">Sans</option>
                    </select></div>
                  <div><label style={label}>Zone</label>
                    <select value={d.zone} onChange={(e) => set("zone", e.target.value)} style={inp}>
                      <option value="non">Non tendue</option><option value="tendue">Tendue</option><option value="encadree">Encadrement des loyers</option>
                    </select></div>
                  <div><label style={label}>DPE</label>
                    <select value={d.dpe} onChange={(e) => set("dpe", e.target.value)} style={inp}>
                      <option value="ok">A a E</option><option value="fg">F ou G (passoire)</option>
                    </select></div>
                </div>
              </div>

              {d.garantie === "caution" && (
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ ...label, margin: 0 }}>Cautions (un acte par caution)</label>
                    <button onClick={addCaution} style={btn("transparent", OR)}>+ Ajouter une caution</button>
                  </div>
                  {cautions.length === 0 && <p style={{ fontSize: 12.5, color: "#8a8069" }}>Aucune caution. Ajoute une caution ou change la garantie.</p>}
                  {cautions.map((c, i) => (
                    <div key={i} style={{ border: "1px dashed #d8cba3", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <b style={{ color: "#7a6a44", fontSize: 12 }}>Caution {i + 1} / {cautions.length}</b>
                        <button onClick={() => delCaution(i)} style={{ ...btn("transparent", "#8a2a2a"), padding: "4px 10px" }}>Retirer</button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
                        {[["nom", "Nom de la caution"], ["naissance", "Ne(e) le / a"], ["adresse", "Adresse"], ["revenus", "Revenus mensuels"], ["plafond", "Montant maximum garanti"], ["duree", "Duree de l'engagement"]].map(([k, lab]) => (
                          <div key={k}><label style={label}>{lab}</label><input value={c[k] || ""} onChange={(e) => setCaution(i, k, e.target.value)} style={inp} /></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={card}>
                <label style={label}>3 · Champs du bail (completes / ajustes par le cabinet)</label>
                {FIELD_GROUPS.map(([title, fields]) => (
                  <div key={title} style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: OR, fontWeight: 700, letterSpacing: 0.5, borderBottom: "1px solid #ecdfbd", paddingBottom: 4, marginBottom: 8 }}>{title}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 }}>
                      {fields.map(([k, lab]) => (
                        <div key={k}><label style={label}>{lab}</label><input value={d[k] || ""} onChange={(e) => set(k, e.target.value)} style={inp} /></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...card, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={onPreview} style={btn(OR, NOIR)}>Generer l'apercu</button>
                <button onClick={onDownload} style={btn("transparent", "#7a6a44")}>Telecharger le PDF</button>
                <button onClick={onSend} disabled={busy} style={btn(NOIR, OR)}>{busy ? "Envoi…" : "Envoyer pour signature"}</button>
                {sendMsg && <span style={{ fontSize: 13, color: sendMsg.startsWith("Echec") || sendMsg.startsWith("Choisis") ? "#8a2a2a" : "#2a6a2a", flexBasis: "100%" }}>{sendMsg}</span>}
              </div>

              {previewUrl && (
                <div style={{ ...card, padding: 8 }}>
                  <iframe title="apercu" src={previewUrl} style={{ width: "100%", height: 720, border: "1px solid #ecdfbd", borderRadius: 10 }} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
