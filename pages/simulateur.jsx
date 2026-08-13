import Head from "next/head";
import { useState } from "react";
import Header from "../Header";
import Footer from "../Footer";

const PS = 17.2;
const fmt = (n) => Math.round(n).toLocaleString("fr-FR") + " €";
const pct = (n) => (Math.round(n * 10) / 10).toLocaleString("fr-FR");

const A = () => (
  <svg viewBox="0 0 100 100" fill="none" width="46" height="46">
    <circle cx="50" cy="50" r="46" stroke="#C9A961" strokeWidth="2" />
    <path d="M50 12 A38 38 0 0 1 88 50" stroke="#C9A961" strokeWidth="3" strokeLinecap="round" />
    <path d="M50 88 A38 38 0 0 1 12 50" stroke="#C9A961" strokeWidth="3" strokeLinecap="round" />
    <text x="50" y="67" textAnchor="middle" fontFamily="Cinzel,serif" fontWeight="700" fontSize="46" fill="#C9A961">A</text>
  </svg>
);

export default function Simulateur() {
  const [loyer, setLoyer] = useState(700);
  const [taux, setTaux] = useState(10);
  const [regime, setRegime] = useState("reel");
  const [tmi, setTmi] = useState(30);

  const loyersAn = loyer * 12;
  const brutAn = (loyersAn * taux) / 100;
  const econo = regime === "reel" ? (brutAn * (tmi + PS)) / 100 : 0;
  const netAn = brutAn - econo;
  const tauxEff = loyersAn > 0 ? (netAn / loyersAn) * 100 : 0;

  const seg = (val, cur, set, cast) => ({
    className: "sgb" + (val === cur ? " on" : ""),
    onClick: () => set(cast ? cast(val) : val),
    type: "button",
  });

  return (
    <>
      <Head>
        <title>Simulateur : le coût réel de la gestion locative après impôt | ATRIUM</title>
        <meta name="description" content="Vos honoraires de gestion locative sont déductibles de vos revenus fonciers (régime réel). Calculez leur coût réel après impôt selon votre loyer et votre tranche d'imposition. ATRIUM, Douai." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://atrium.templeimmo.com/simulateur" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="ATRIUM · Le Temple de l'Immobilier" />
        <meta property="og:title" content="Le coût réel de votre gestion locative, après impôt" />
        <meta property="og:description" content="Honoraires déductibles de vos revenus fonciers : estimez le coût réel de la gestion de votre bien après impôt." />
        <meta property="og:url" content="https://atrium.templeimmo.com/simulateur" />
        <meta property="og:image" content="https://atrium.templeimmo.com/og-atrium.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <Header />

      <main className="wrapmain">
        <section className="intro">
          <div className="mono"><A /></div>
          <div className="eyebrow">Simulateur ATRIUM</div>
          <h1>Le vrai coût de votre gestion locative, après impôt</h1>
          <p>En location nue au <b>régime réel</b>, les honoraires de gestion versés à votre cabinet sont <b>déductibles de vos revenus fonciers</b>. Leur coût réel, après impôt, est donc bien inférieur au taux affiché, souvent proche de la moitié. Estimez ci-dessous, selon votre loyer et votre tranche d'imposition, ce que vous coûte réellement la gestion de votre bien à Douai et dans le Douaisis.</p>
        </section>

        <section className="toolwrap">
          <div className="tool">
            <div className="field">
              <div className="label"><span>Loyer mensuel (hors charges)</span><span className="val">{fmt(loyer)}</span></div>
              <input type="range" min="300" max="3000" step="10" value={loyer} onChange={(e) => setLoyer(+e.target.value)} />
            </div>

            <div className="two">
              <div className="field">
                <div className="label"><span>Formule de gestion</span></div>
                <div className="seg">
                  <button {...seg(8, taux, setTaux)}>8 %<span className="s">Essentiel</span></button>
                  <button {...seg(10, taux, setTaux)}>10 %<span className="s">Sérénité</span></button>
                  <button {...seg(12, taux, setTaux)}>12 %<span className="s">Prestige</span></button>
                </div>
              </div>
              <div className="field">
                <div className="label"><span>Régime fiscal</span></div>
                <div className="seg">
                  <button {...seg("reel", regime, setRegime)}>Réel<span className="s">charges déduites</span></button>
                  <button {...seg("micro", regime, setRegime)}>Micro-foncier<span className="s">abattement 30 %</span></button>
                </div>
              </div>
            </div>

            <div className="field">
              <div className="label"><span>Votre tranche d'imposition (TMI)</span></div>
              <div className="seg">
                {[0, 11, 30, 41, 45].map((t) => (
                  <button key={t} {...seg(t, tmi, setTmi)}>{t} %</button>
                ))}
              </div>
            </div>

            <div className="result">
              <div className="rtop">
                <div className="k">Coût réel après impôt</div>
                <div className="big">{pct(tauxEff)} <small>%</small></div>
                <div className="cmp">soit <b>{fmt(netAn / 12)}</b> / mois au lieu de <b>{fmt(brutAn / 12)}</b></div>
              </div>
              <div className="rgrid">
                <div className="rc"><div className="cl">Honoraires de gestion / an</div><div className="cv">{fmt(brutAn)}</div></div>
                <div className="rc econo"><div className="cl">Économie d'impôt / an</div><div className="cv">{regime === "reel" ? "− " + fmt(econo) : "—"}</div></div>
                <div className="rc"><div className="cl">Coût réel net / an</div><div className="cv">{fmt(netAn)}</div></div>
                <div className="rc"><div className="cl">Loyers encaissés / an</div><div className="cv">{fmt(loyersAn)}</div></div>
              </div>
            </div>

            <div className="note">
              {regime === "reel" ? (
                <span><b>Au régime réel</b>, vos honoraires de {pct(taux)} % TTC sont déductibles : une partie vous revient via votre impôt (tranche {tmi} % + 17,2 % de prélèvements sociaux). Le taux réellement supporté n'est plus {pct(taux)} % mais <b>{pct(tauxEff)} %</b>.</span>
              ) : (
                <span><b>Au micro-foncier</b>, vous bénéficiez d'un abattement forfaitaire de 30 % mais vous ne déduisez pas les charges réelles. Dès que vos charges réelles dépassent 30 % des loyers, le <b>régime réel devient souvent plus avantageux</b> — nous vous aidons à le vérifier.</span>
              )}
            </div>

            <div className="cta">
              <a href="/#contact">Estimer mon loyer &amp; être rappelé</a>
              <span className="alt">Estimation offerte, sans engagement · 06 98 44 22 42</span>
            </div>

            <div className="micro">Simulation indicative fondée sur le droit fiscal des revenus fonciers (location nue). Au régime réel, les honoraires de gestion versés à un tiers sont déductibles des revenus fonciers ; l'économie correspond à votre taux marginal d'imposition majoré des prélèvements sociaux (17,2 %) et suppose un revenu foncier net imposable. Au micro-foncier (abattement forfaitaire de 30 %), les charges réelles ne sont pas déduites séparément. Ce simulateur ne constitue pas un conseil fiscal personnalisé.</div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .wrapmain { background: #0d0d0d; color: #f8f5ee; font-family: "EB Garamond", Georgia, serif; }
        .intro { max-width: 780px; margin: 0 auto; text-align: center; padding: 48px 22px 8px; }
        .mono { margin-bottom: 12px; }
        .eyebrow { color: #c9a961; letter-spacing: .26em; font-size: 12px; text-transform: uppercase; font-weight: 600; }
        h1 { font-family: "Cinzel", serif; color: #fff; font-size: 34px; font-weight: 600; margin: 12px 0 14px; line-height: 1.18; }
        .intro p { color: #b7ae98; font-size: 17px; line-height: 1.65; }
        .intro b { color: #e6dcc2; }
        .toolwrap { padding: 20px 16px 70px; display: flex; justify-content: center; }
        .tool { width: 100%; max-width: 760px; background: linear-gradient(180deg,#141414,#0d0d0d); border: 1px solid rgba(201,169,97,.32); border-radius: 16px; padding: 28px; }
        .field { margin-bottom: 22px; }
        .label { display: flex; justify-content: space-between; align-items: baseline; color: #e6dcc2; font-size: 14px; margin-bottom: 10px; }
        .label .val { color: #f5e6b8; font-family: "Cinzel", serif; font-size: 16px; }
        input[type=range] { width: 100%; -webkit-appearance: none; height: 4px; border-radius: 4px; background: linear-gradient(90deg,#c9a961,#8b7340); outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: radial-gradient(circle at 35% 35%,#f5e6b8,#c9a961); border: 2px solid #0d0d0d; cursor: pointer; }
        input[type=range]::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #c9a961; border: 2px solid #0d0d0d; cursor: pointer; }
        .two { display: flex; gap: 22px; flex-wrap: wrap; }
        .two .field { flex: 1 1 250px; }
        .seg { display: flex; gap: 8px; flex-wrap: wrap; }
        .seg :global(.sgb) { flex: 1 1 auto; min-width: 62px; background: #161616; border: 1px solid rgba(201,169,97,.3); color: #b7ae98; padding: 11px 8px; border-radius: 9px; font-family: inherit; font-size: 14.5px; cursor: pointer; transition: .15s; }
        .seg :global(.sgb .s) { display: block; font-size: 11px; color: #6f6a5c; }
        .seg :global(.sgb.on) { background: linear-gradient(180deg,#d8bd7e,#c9a961); color: #0d0d0d; border-color: #c9a961; font-weight: 700; }
        .seg :global(.sgb.on .s) { color: #3a2f16; }
        .result { background: #0f0f0f; border: 1px solid rgba(201,169,97,.3); border-radius: 14px; overflow: hidden; margin-top: 6px; }
        .rtop { padding: 22px 24px; text-align: center; border-bottom: 1px solid rgba(201,169,97,.18); }
        .rtop .k { color: #c9a961; letter-spacing: .2em; font-size: 11px; text-transform: uppercase; }
        .rtop .big { font-family: "Cinzel", serif; color: #fff; font-size: 44px; line-height: 1; margin: 8px 0 4px; }
        .rtop .big small { font-size: 20px; color: #f5e6b8; }
        .rtop .cmp { color: #b7ae98; font-size: 14px; font-style: italic; }
        .rtop .cmp b { color: #f5e6b8; font-style: normal; }
        .rgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(201,169,97,.18); }
        .rc { background: #0f0f0f; padding: 15px 18px; }
        .rc .cl { color: #b7ae98; font-size: 12.5px; }
        .rc .cv { font-family: "Cinzel", serif; color: #f5e6b8; font-size: 20px; margin-top: 3px; }
        .rc.econo .cv { color: #8fce9b; }
        .note { margin-top: 16px; color: #cabfa6; font-size: 13.5px; line-height: 1.6; border-top: 1px solid rgba(201,169,97,.15); padding-top: 14px; }
        .note b { color: #f5e6b8; }
        .cta { margin-top: 18px; text-align: center; }
        .cta a { display: inline-block; background: linear-gradient(180deg,#d8bd7e,#c9a961); color: #0d0d0d; text-decoration: none; padding: 15px 30px; border-radius: 10px; font-weight: 700; font-size: 16px; }
        .cta .alt { display: block; color: #b7ae98; font-size: 13px; margin-top: 10px; }
        .micro { margin-top: 16px; color: #6f6a5c; font-size: 11px; line-height: 1.55; }
        @media (max-width: 520px) { h1 { font-size: 26px; } .rtop .big { font-size: 36px; } .rgrid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
