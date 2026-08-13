import Head from "next/head";
import { useEffect, useState, useCallback } from "react";

/*
  ATRIUM - Finalisation des baux (cabinet, M2.7).
  Reserve aux administrateurs (session partagee avec /admin et /gestion).
  Le cachet de l'AGENCE est appose EN DERNIER : une fois le locataire (et les
  cautions) signes, le cabinet clique "Apposer le cachet et finaliser". On
  recharge le payload du bail, on regenere le PDF SIGNE (signatures adoptees +
  cachet agence + paraphes) via /gen_signed.js, on le re-televerse et on passe
  le document a "signe". Tous les writes storage passent par le token cabinet.
*/

const SB_URL = "https://suauroxtdffsglljfwnk.supabase.co";
const SB_KEY = "sb_publishable_XIELoVMT1PXE5b_05QGTDw_wG8KV6Ju";
const STORE = "atrium_admin_session";
const OR = "#C9A961";
const NOIR = "#0D0D0D";
const JSPDF_CDN = "https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js";
const FONT_CDN = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/greatvibes/GreatVibes-Regular.ttf";

const loadSession = () => {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem(STORE) || "null"); } catch { return null; }
};
const saveSession = (s) => { if (typeof window !== "undefined") window.localStorage.setItem(STORE, JSON.stringify(s)); };
const clearStore = () => { if (typeof window !== "undefined") window.localStorage.removeItem(STORE); };

const nomContact = (c) => c ? (c.raison_sociale || [c.prenom, c.nom].filter(Boolean).join(" ") || c.email || "") : "";
const initials = (s) => (s || "").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 3) || "X";

export default function FinaliserBail() {
  const [session, setSession] = useState(null);
  const [phase, setPhase] = useState("boot"); // boot|email|otp|denied|ready
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [docs, setDocs] = useState([]);
  const [sigs, setSigs] = useState({}); // document_id -> [{contact_id, signed_by_name}]
  const [libReady, setLibReady] = useState(false);
  const [fontB64, setFontB64] = useState("");
  const [msg, setMsg] = useState({}); // per doc message
  const [previewUrl, setPreviewUrl] = useState("");

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

  const loadDocs = useCallback(async (s) => {
    const d = await api(
      "documents?select=id,type,storage_path,signature_statut,created_at," +
      "document_links(bail_id,bien_id,contact_id,contacts(nom,prenom,raison_sociale,email))" +
      "&type=eq.bail&signature_statut=eq.en_cours&order=created_at.desc&limit=100", s);
    const list = Array.isArray(d) ? d : [];
    setDocs(list);
    const ids = list.map((x) => x.id);
    if (ids.length) {
      try {
        const sg = await api(`signatures?select=document_id,contact_id,signed_by_name&document_id=in.(${ids.join(",")})`, s);
        const map = {};
        (Array.isArray(sg) ? sg : []).forEach((r) => { (map[r.document_id] = map[r.document_id] || []).push(r); });
        setSigs(map);
      } catch { setSigs({}); }
    } else setSigs({});
  }, [api]);

  const proceed = useCallback(async (s) => {
    setErr("");
    let token; try { token = await validToken(s); } catch { token = null; }
    if (!token) { clearStore(); setSession(null); setPhase("email"); return; }
    let admin; try { admin = await rpc("has_role", { r: "admin" }, s); } catch { setPhase("email"); return; }
    if (admin !== true) { setPhase("denied"); return; }
    // Signature du cabinet : chargee UNIQUEMENT apres verification du role admin
    // (jamais sur une page publique). Source PRIVEE = Supabase Storage (bucket
    // documents, chemin assets/sign-mo.png) via URL signee et jeton admin.
    // Repli TEMPORAIRE sur l'ancien /sign-mo.png tant que la copie privee n'est
    // pas en place ; a retirer (avec le fichier public) une fois l'upload fait.
    try {
      if (typeof window !== "undefined" && !window.ATRIUM_SIGN_PNG) {
        let blob = null;
        try {
          const sr = await fetch(`${SB_URL}/storage/v1/object/sign/documents/sign-mo.png`, {
            method: "POST",
            headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": "application/json" },
            body: JSON.stringify({ expiresIn: 120 }),
          });
          if (sr.ok) {
            const sj = await sr.json();
            const fr = await fetch(`${SB_URL}/storage/v1${sj.signedURL}`);
            if (fr.ok) blob = await fr.blob();
          }
        } catch {}
        if (!blob) { try { const rb = await fetch("/sign-mo.png"); if (rb.ok) blob = await rb.blob(); } catch {} }
        if (blob) {
          window.ATRIUM_SIGN_PNG = await new Promise((res) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result);
            fr.onerror = () => res(null);
            fr.readAsDataURL(blob);
          });
        }
      }
    } catch {}
    try { await loadDocs(s); setPhase("ready"); }
    catch (e) { if (String(e.message).includes("session")) { clearStore(); setSession(null); setPhase("email"); } else { setErr("Erreur de chargement."); setPhase("ready"); } }
  }, [validToken, rpc, loadDocs]);

  useEffect(() => {
    const s = loadSession();
    if (s && s.refresh_token) { setSession(s); proceed(s); } else setPhase("email");
    // jsPDF + moteur signe
    const j = document.createElement("script"); j.src = JSPDF_CDN; j.async = true;
    j.onload = () => {
      const g = document.createElement("script"); g.src = "/gen_core.js"; g.async = true;
      g.onload = () => setLibReady(true);
      document.body.appendChild(g);
    };
    document.body.appendChild(j);
    // police cursive (CDN, convertie en base64 pour jsPDF)
    fetch(FONT_CDN).then((r) => r.arrayBuffer()).then((ab) => {
      let bin = ""; const by = new Uint8Array(ab);
      for (let i = 0; i < by.length; i++) bin += String.fromCharCode(by[i]);
      setFontB64(btoa(bin));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onRequestCode(e) {
    e.preventDefault(); setBusy(true); setErr(""); setInfo("");
    const email = (e.currentTarget.email.value || "").trim().toLowerCase();
    try {
      const r = await fetch(`${SB_URL}/auth/v1/otp`, { method: "POST", headers: { "content-type": "application/json", apikey: SB_KEY }, body: JSON.stringify({ email, create_user: false }) });
      const jj = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(r.status === 429 ? "Trop de demandes. Patientez une minute." : (jj.error_description || jj.msg || "Envoi impossible.")); setBusy(false); return; }
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

  async function fetchPayload(storagePath, token) {
    const jpath = storagePath.replace(/\.pdf$/, ".json");
    const r = await fetch(`${SB_URL}/storage/v1/object/sign/documents/${jpath}`, {
      method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ expiresIn: 120 }),
    });
    if (!r.ok) throw new Error("payload_introuvable");
    const j = await r.json();
    const fr = await fetch(`${SB_URL}/storage/v1${j.signedURL}`);
    if (!fr.ok) throw new Error("payload_illisible");
    return fr.json();
  }

  async function sha256Hex(ab) {
    try { const h = await crypto.subtle.digest("SHA-256", ab); return Array.from(new Uint8Array(h)).map((x) => x.toString(16).padStart(2, "0")).join(""); } catch { return null; }
  }

  function buildSignedDoc(payload, docSigs) {
    const jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF || !window.buildBail) throw new Error("moteur_indisponible");
    if (!fontB64) throw new Error("police_indisponible");
    const d = { ...payload };
    d.signed = true;
    d._cursiveTTF = fontB64;
    d._sigPng = (typeof window !== "undefined" && window.ATRIUM_SIGN_PNG) || null;
    const locName = payload._locName || payload.locataire || "";
    // nom de signature adopte du locataire (issu de la signature enregistree si dispo)
    const locSigRec = (docSigs || []).find((x) => x.signed_by_name);
    d._locSig = (locSigRec && locSigRec.signed_by_name) || locName || "Locataire";
    d._locName = locName;
    d._locPar = initials(d._locSig);
    d._cabPar = "LT";
    return window.buildBail(jsPDF, d);
  }

  async function onPreview(doc) {
    setErr(""); setMsg((m) => ({ ...m, [doc.id]: "" }));
    try {
      const token = await validToken(session);
      const payload = await fetchPayload(doc.storage_path, token);
      const pdf = buildSignedDoc(payload, sigs[doc.id]);
      try { if (previewUrl) URL.revokeObjectURL(previewUrl); } catch {}
      setPreviewUrl(pdf.output("bloburl"));
    } catch (e) { setMsg((m) => ({ ...m, [doc.id]: "Apercu impossible : " + (e.message || e) })); }
  }

  async function onFinalize(doc) {
    setErr(""); setMsg((m) => ({ ...m, [doc.id]: "" }));
    setBusy(true);
    try {
      const token = await validToken(session);
      const payload = await fetchPayload(doc.storage_path, token);
      const pdf = buildSignedDoc(payload, sigs[doc.id]);
      const ab = pdf.output("arraybuffer");
      const bytes = new Uint8Array(ab);
      const hash = await sha256Hex(ab);
      const bailId = (doc.document_links && doc.document_links[0] && doc.document_links[0].bail_id) || payload._bailId || "x";
      const finalPath = `bail/${bailId}/signe-${Date.now()}.pdf`;
      // 1) upload du PDF signe final (token cabinet)
      const up = await fetch(`${SB_URL}/storage/v1/object/documents/${finalPath}`, {
        method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${token}`, "content-type": "application/pdf", "x-upsert": "false" },
        body: bytes,
      });
      if (!up.ok) { const t = await up.text().catch(() => ""); throw new Error("Upload refuse (" + up.status + "). " + t); }
      // 2) mise a jour du document : nouveau chemin + statut signe
      await api(`documents?id=eq.${doc.id}`, session, { method: "PATCH", prefer: "return=minimal", body: { storage_path: finalPath, file_hash: hash, signature_statut: "signe" } });
      // 3) notifier les parties (best-effort, serveur)
      try { await fetch("/api/notify-final", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ access_token: token, document_id: doc.id }) }); } catch {}
      setMsg((m) => ({ ...m, [doc.id]: "Cachet appose. Document signe definitif genere et transmis." }));
      await loadDocs(session);
    } catch (e) { setMsg((m) => ({ ...m, [doc.id]: "Echec : " + (e.message || e) })); }
    setBusy(false);
  }

  async function onDelete(doc) {
    setErr(""); setMsg((m) => ({ ...m, [doc.id]: "" }));
    const nom = doc.storage_path.split("/").slice(-1)[0];
    if (!window.confirm("Supprimer definitivement le bail \"" + nom + "\" ? Cette action est irreversible.")) return;
    setBusy(true);
    try {
      const Tk = await validTk(session);
      if (!Tk) throw new Error("session_expiree");
      // 1) supprimer les liaisons eventuelles (parties liees)
      try { await api("document_links?document_id=eq." + doc.id, session, { method: "DELETE" }); } catch {}
      // 2) supprimer les signatures eventuelles
      try { await api("signatures?document_id=eq." + doc.id, session, { method: "DELETE" }); } catch {}
      // 3) supprimer la ligne document
      await api("documents?id=eq." + doc.id, session, { method: "DELETE" });
      // 4) supprimer le fichier du storage (best-effort)
      try {
        await fetch(`${SB_URL}/storage/v1/object/documents/${doc.storage_path}`, {
          method: "DELETE", headers: { apikey: SB_KEY, Authorization: `Bearer ${Tk}` },
        });
      } catch {}
      setMsg((m) => ({ ...m, [doc.id]: "Bail supprime." }));
      await loadDocs(session);
    } catch (e) { setMsg((m) => ({ ...m, [doc.id]: "Echec suppression : " + (e.message || e) })); }
    setBusy(false);
  }

  // ---- RENDU ----
  const wrap = { maxWidth: 1080, margin: "0 auto", padding: "0 20px" };
  const label = { display: "block", fontSize: 11, letterSpacing: 0.4, color: "#7a6a44", marginBottom: 4, fontFamily: "Arial,sans-serif" };
  const inp = { width: "100%", padding: "8px 10px", border: "1px solid #d8cba3", borderRadius: 7, background: "#fffdf8", fontSize: 13.5, color: "#2a2620", boxSizing: "border-box" };
  const btn = (bg, fg) => ({ padding: "9px 15px", borderRadius: 9, border: "1px solid " + OR, background: bg, color: fg, fontWeight: 700, cursor: "pointer", fontSize: 13 });
  const card = { background: "#fff", border: "1px solid #ecdfbd", borderRadius: 14, padding: 18, marginBottom: 16 };

  return (
    <>
      <Head><title>ATRIUM — Finalisation des baux</title><meta name="robots" content="noindex" /></Head>
      <div style={{ minHeight: "100vh", background: "#f4efe4", fontFamily: "Georgia,'Times New Roman',serif" }}>
        <header style={{ background: NOIR, borderBottom: "2px solid " + OR, padding: "16px 0" }}>
          <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: OR, fontSize: 22, letterSpacing: 7, fontWeight: "bold" }}>ATRIUM</div>
              <div style={{ color: "#b7ae98", fontSize: 11.5, fontStyle: "italic" }}>Finalisation des baux — cachet agence</div>
            </div>
            {phase === "ready" && <button onClick={onLogout} style={btn("transparent", OR)}>Se deconnecter</button>}
          </div>
        </header>

        <main style={{ ...wrap, padding: "24px 20px 60px" }}>
          {phase === "boot" && <p style={{ color: "#7a6a44" }}>Chargement…</p>}
          {phase === "denied" && <div style={card}><p style={{ color: "#8a2a2a", margin: 0 }}>Acces reserve aux administrateurs. <a href="/gestion" style={{ color: OR }}>Retour</a></p></div>}

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
              <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13.5, color: "#5a5040" }}>
                  Baux en attente de finalisation : <b>{docs.length}</b>
                  {!libReady && <span style={{ color: "#b08a2a" }}> · moteur en chargement…</span>}
                  {libReady && !fontB64 && <span style={{ color: "#b08a2a" }}> · police en chargement…</span>}
                </div>
                <button onClick={() => loadDocs(session)} style={btn("transparent", "#7a6a44")}>Rafraichir</button>
              </div>

              {docs.length === 0 && <div style={{ ...card, color: "#8a8069" }}>Aucun bail à finaliser. Les baux signés par le locataire (et les cautions) apparaîtront ici.</div>}

              {docs.map((doc) => {
                const links = doc.document_links || [];
                const signedSet = new Set((sigs[doc.id] || []).map((x) => x.contact_id));
                const parties = links.filter((l) => l.contact_id);
                return (
                  <div key={doc.id} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, color: NOIR, fontWeight: 700 }}>Bail · {doc.storage_path.split("/").slice(-1)[0]}</div>
                        <div style={{ fontSize: 12, color: "#8a8069" }}>Créé le {doc.created_at ? new Date(doc.created_at).toLocaleDateString("fr-FR") : "—"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => onPreview(doc)} style={btn("transparent", "#7a6a44")}>Aperçu signé</button>
                        <button onClick={() => onFinalize(doc)} disabled={busy || !libReady || !fontB64} style={btn(NOIR, OR)}>{busy ? "…" : "Apposer le cachet et finaliser"}</button>
                        <button onClick={() => onDelete(doc)} disabled={busy} style={btn("transparent", "#8a2a2a")}>Supprimer</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {parties.length === 0 && <span style={{ fontSize: 12.5, color: "#8a8069" }}>Aucune partie liée (le cachet sera apposé sur le bail tel qu'envoyé).</span>}
                      {parties.map((l, i) => (
                        <span key={i} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, background: signedSet.has(l.contact_id) ? "#e7f0e4" : "#f6ecd9", color: signedSet.has(l.contact_id) ? "#3d6b34" : "#8a6a1f" }}>
                          {nomContact(l.contacts) || "Partie"} · {signedSet.has(l.contact_id) ? "signé ✓" : "en attente"}
                        </span>
                      ))}
                    </div>
                    {msg[doc.id] && <div style={{ marginTop: 10, fontSize: 13, color: msg[doc.id].startsWith("Echec") || msg[doc.id].includes("impossible") ? "#8a2a2a" : "#2a6a2a" }}>{msg[doc.id]}</div>}
                  </div>
                );
              })}

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
