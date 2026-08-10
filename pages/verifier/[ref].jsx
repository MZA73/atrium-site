import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

const G = "#C9A961", DK = "#0D0D0D", CR = "#F8F5EE", INK = "#2a2620", GRAY = "#7a7263";

export default function Verifier() {
  const router = useRouter();
  const { ref } = router.query;
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    if (!ref) return;
    fetch(`/api/verify?ref=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then((d) => setState({ loading: false, data: d }))
      .catch(() => setState({ loading: false, data: { ok: false } }));
  }, [ref]);

  const d = state.data;
  const ok = d && d.ok && d.found;
  const box = { width: 620, maxWidth: "92%", background: CR, border: `1px solid ${G}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 70px rgba(0,0,0,.5)", fontFamily: "Georgia,'Times New Roman',serif" };
  const rowS = { display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 4px", borderBottom: "1px solid #e3d9bf", fontSize: 15 };
  const kS = { fontFamily: "Arial,sans-serif", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#a9853f", fontWeight: "bold", alignSelf: "center" };

  return (
    <>
      <Head><title>Vérification de signature — ATRIUM</title><meta name="robots" content="noindex" /></Head>
      <div style={{ minHeight: "100vh", background: DK, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px" }}>
        <div style={box}>
          <div style={{ background: DK, padding: "26px 32px", textAlign: "center", borderBottom: `2px solid ${G}` }}>
            <div style={{ color: G, fontSize: 28, letterSpacing: 9, fontWeight: "bold" }}>ATRIUM</div>
            <div style={{ color: "#b7ae98", fontSize: 12, fontStyle: "italic", letterSpacing: 1, marginTop: 5 }}>by Le Temple de l&apos;Immobilier</div>
            <div style={{ color: "#cfc6b0", fontSize: 12, fontFamily: "Arial,sans-serif", letterSpacing: 3, textTransform: "uppercase", marginTop: 12 }}>Vérification de signature électronique</div>
          </div>
          <div style={{ padding: "30px 34px 34px" }}>
            {state.loading && <p style={{ color: GRAY, textAlign: "center" }}>Vérification en cours…</p>}
            {!state.loading && ok && (
              <>
                <div style={{ textAlign: "center", marginBottom: 22 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", border: `3px solid ${G}`, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", color: G, fontSize: 34 }}>✓</div>
                  <div style={{ fontSize: 22, color: DK }}>Document authentique</div>
                  <div style={{ fontSize: 14, color: GRAY, marginTop: 6 }}>Cette référence correspond à une signature électronique enregistrée par le cabinet.</div>
                </div>
                <div style={{ background: "#fffdf8", border: "1px solid #e3d9bf", borderLeft: `3px solid ${G}`, borderRadius: 8, padding: "8px 18px" }}>
                  <div style={rowS}><span style={kS}>Statut</span><span style={{ color: "#2e7d32", fontWeight: "bold" }}>Signé électroniquement</span></div>
                  <div style={rowS}><span style={kS}>Signataire</span><span style={{ color: INK }}>{d.signataire}</span></div>
                  <div style={rowS}><span style={kS}>Document</span><span style={{ color: INK }}>{d.type}</span></div>
                  <div style={rowS}><span style={kS}>Date et heure</span><span style={{ color: INK }}>{d.date}</span></div>
                  <div style={rowS}><span style={kS}>Adresse IP</span><span style={{ color: INK }}>{d.ip}</span></div>
                  <div style={{ ...rowS, borderBottom: "none" }}><span style={kS}>Référence</span><span style={{ color: INK, fontFamily: "monospace" }}>{d.ref}</span></div>
                </div>
                <p style={{ fontSize: 12.5, color: GRAY, lineHeight: 1.6, marginTop: 16 }}>Signature électronique recueillie au sens du règlement (UE) n°910/2014 (eIDAS) et de l&apos;article 1367 du Code civil. Le consentement du signataire, son horodatage et l&apos;empreinte du document sont conservés par le cabinet comme éléments de preuve.</p>
              </>
            )}
            {!state.loading && !ok && (
              <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid #b23b3b", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#b23b3b", fontSize: 34 }}>!</div>
                <div style={{ fontSize: 21, color: DK }}>Référence introuvable</div>
                <div style={{ fontSize: 14, color: GRAY, marginTop: 8, lineHeight: 1.6 }}>Aucune signature ne correspond à cette référence. Vérifiez le QR code ou contactez le cabinet au 03 27 95 61 14.</div>
              </div>
            )}
          </div>
          <div style={{ background: DK, padding: "18px 32px", textAlign: "center" }}>
            <div style={{ color: G, fontSize: 12, fontStyle: "italic" }}>Dorénavant, la pierre ne vous laissera plus jamais de marbre.</div>
            <div style={{ color: "#7a7263", fontSize: 11, marginTop: 8 }}>Le Temple de l&apos;Immobilier · 03 27 95 61 14 · contact@templeimmo.com</div>
          </div>
        </div>
      </div>
    </>
  );
}
