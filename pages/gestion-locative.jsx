import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";
import ContactForm from "../ContactForm";
import COMMUNES, { hrefOf } from "../communes";

const SITE = "https://atrium.templeimmo.com";

function buildHub() {
  const cards = COMMUNES.map((c) => `
    <a class="cov" href="${hrefOf(c)}" style="text-decoration:none;">
      <h3>${c.nom} <small style="color:var(--or);font-weight:600;">${c.cp}</small></h3>
      <p>${c.angle}</p>
    </a>`).join("\n");
  return `<!-- HERO -->
<section class="hero"><div class="wrap">
  <div class="hero-txt">
    <div class="eyebrow hero-eyebrow">Gestion locative &nbsp;&#183;&nbsp; Douaisis</div>
    <div class="hero-national">Tous secteurs &nbsp;&#183;&nbsp; national sur demande</div>
    <h1>Gestion locative dans le <span class="g">Douaisis</span></h1>
    <p class="sub">Douai et l'ensemble de son bassin, g&#233;r&#233;s par un cabinet install&#233; &#224; Douai depuis vingt ans, fort de plus de 2&nbsp;100 mandats. Loyers s&#233;curis&#233;s, comptes clairs, fiscalit&#233; incluse.</p>
    <p class="reassure">S&#233;lectionnez votre commune ci-dessous, ou demandez une estimation locative offerte.</p>
    <div class="cta-row">
      <a class="btn btn-gold" href="#communes">Choisir ma commune</a>
      <a class="btn btn-ghost" href="#contact">&#202;tre rappel&#233; sous 24 h</a>
    </div>
    <div class="badges">
      <div class="badge"><span class="bn">Carte G</span><span class="bl">Gestion en propre</span></div>
      <div class="badge"><span class="bn">110 000 &#8364;</span><span class="bl">Garantie financi&#232;re</span></div>
      <div class="badge"><span class="bn">Douaisis</span><span class="bl">Tout le bassin</span></div>
    </div>
  </div>
  <div class="hero-emblem"><div class="ring">
    <div class="mono"><b>A</b><span>ATRIUM</span></div>
  </div></div>
</div></section>

<!-- TRUST -->
<div class="trust"><div class="wrap">
  <div class="ti"><b>20 ans</b><span>&#224; Douai et dans le Douaisis</span></div>
  <div class="sep"></div>
  <div class="ti"><b>2&nbsp;100+</b><span>mandats confi&#233;s</span></div>
  <div class="sep"></div>
  <div class="ti"><b>12 communes</b><span>tout le bassin couvert</span></div>
  <div class="sep"></div>
  <div class="ti"><b>110&nbsp;000 &#8364;</b><span>garantie financi&#232;re, carte G</span></div>
</div></div>

<!-- COMMUNES -->
<section id="communes"><div class="wrap">
  <div class="sec-head">
    <div class="eyebrow">Nos secteurs</div>
    <h2>ATRIUM g&#232;re votre bien dans tout le Douaisis</h2>
    <p>Un cabinet local qui conna&#238;t chaque commune, chaque quartier, chaque loyer de march&#233;. S&#233;lectionnez votre ville :</p>
    <div class="rule-c"></div>
  </div>
  <div class="cover-grid">
${cards}
  </div>
</div></section>

<!-- FORMULES -->
<section id="formules" class="pr"><div class="wrap">
  <div class="sec-head">
    <div class="eyebrow">Nos formules</div>
    <h2>Trois niveaux de s&#233;r&#233;nit&#233;</h2>
    <p>Un taux clair, aucun frais de dossier cach&#233;, aucun honoraire de vacance. Vous changez d'agence gratuitement, nous reprenons tout.</p>
    <div class="rule-c"></div>
  </div>
  <div class="formules-grid">
    <div class="f-card">
      <div class="f-name">Essentiel</div>
      <div class="f-tag">L'essentiel bien fait, au meilleur prix d'entr&#233;e.</div>
      <div class="f-rate">8<small>% TTC</small></div>
      <ul class="f-list"><li>Encaissement et reversement des loyers</li><li>Quittancement et r&#233;vision de loyer</li><li>Gestion des impay&#233;s</li><li>Reversement et relev&#233;s trimestriels</li></ul>
      <a class="btn btn-dark" href="#contact">Choisir Essentiel</a>
    </div>
    <div class="f-card reco">
      <div class="f-badge">Le plus choisi</div>
      <div class="f-name">S&#233;r&#233;nit&#233;</div>
      <div class="f-tag">Le confort complet, cadence mensuelle.</div>
      <div class="f-rate">10<small>% TTC</small></div>
      <ul class="f-list"><li>Tout Essentiel, en <b>mensuel</b></li><li><b>Aide &#224; la d&#233;claration 2044 incluse</b></li><li>Visite technique annuelle du bien</li><li>Interlocuteur d&#233;di&#233;</li></ul>
      <a class="btn btn-gold" href="#contact">Choisir S&#233;r&#233;nit&#233;</a>
    </div>
    <div class="f-card">
      <div class="f-name">Prestige</div>
      <div class="f-tag">La gestion patrimoniale, priorit&#233; absolue.</div>
      <div class="f-rate">12<small>% TTC</small></div>
      <ul class="f-list"><li>Tout S&#233;r&#233;nit&#233;, priorit&#233; maximale</li><li>Bilan patrimonial annuel</li><li>Accompagnement fiscal et valorisation</li><li>GLI &#224; tarif pr&#233;f&#233;rentiel</li></ul>
      <a class="btn btn-dark" href="#contact">Choisir Prestige</a>
    </div>
  </div>
  <div class="promo">
    <span class="pchip">Changement d'agence gratuit</span>
    <span class="pchip">Aucun frais de dossier cach&#233;</span>
    <span class="pchip">Aucun honoraire de vacance</span>
  </div>
</div></section>

<!-- ESTIMATION CTA -->
<section id="estimer" class="estim"><div class="wrap">
  <div class="eyebrow" style="color:var(--or)">Estimation offerte</div>
  <h2>Combien peut rapporter votre bien dans le Douaisis&nbsp;?</h2>
  <p>Recevez une estimation de loyer au juste prix du march&#233; local et un premier avis sur la gestion de votre bien, sans engagement.</p>
  <div class="cta-row" style="justify-content:center; display:flex; gap:14px; flex-wrap:wrap;">
    <a class="btn btn-gold" href="#contact">Recevoir mon estimation offerte</a>
    <a class="btn btn-ghost" href="tel:0698442242">Parler &#224; un conseiller</a>
  </div>
</div></section>
`;
}

const faqLd = {
  "@context": "https://schema.org", "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Quelles communes du Douaisis ATRIUM couvre-t-il ?", "acceptedAnswer": { "@type": "Answer", "text": "Douai, Sin-le-Noble, Waziers, Auby, Flers-en-Escrebieux, Cuincy, Lambres-lez-Douai, Dechy, Guesnain, Roost-Warendin, Lallaing et Râches, et partout en France sur demande." } },
    { "@type": "Question", "name": "Combien coûte la gestion locative dans le Douaisis ?", "acceptedAnswer": { "@type": "Answer", "text": "Trois formules : Essentiel 8 %, Sérénité 10 % et Prestige 12 % TTC des loyers encaissés. Quittance gratuite, aucun honoraire de vacance." } },
    { "@type": "Question", "name": "Puis-je changer d'agence en cours de bail ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, gratuitement. Nous reprenons votre mandat sans interrompre vos encaissements et gérons toutes les formalités de transfert." } }
  ]
};
const bcLd = {
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE + "/" },
    { "@type": "ListItem", "position": 2, "name": "Gestion locative dans le Douaisis", "item": SITE + "/gestion-locative" }
  ]
};

export async function getStaticProps() {
  return { props: { body: buildHub() } };
}

export default function Hub({ body }) {
  const canonical = SITE + "/gestion-locative";
  return (
    <>
      <Head>
        <title>Gestion locative dans le Douaisis | ATRIUM par Le Temple de l&apos;Immobilier</title>
        <meta name="description" content="Gestion locative à Douai et dans tout le Douaisis par ATRIUM, cabinet titulaire de la carte G. 12 communes couvertes, 20 ans d'expertise, loyers sécurisés." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ATRIUM · Le Temple de l'Immobilier" />
        <meta property="og:title" content="Gestion locative dans le Douaisis | ATRIUM" />
        <meta property="og:description" content="12 communes du Douaisis couvertes. Cabinet local, carte G, garantie financière 110 000 €." />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={SITE + "/og-atrium.png"} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcLd) }} />
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <ContactForm />
      <Footer />
    </>
  );
}
