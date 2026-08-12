import Head from "next/head";
import Header from "../../Header";
import Footer from "../../Footer";
import ContactForm from "../../ContactForm";
import COMMUNES, { bySlug, generables, hrefOf } from "../../communes";

const SITE = "https://atrium.templeimmo.com";

function buildHtml(c, voisins) {
  const liens = voisins
    .map((v) => `<a class="pchip" href="${hrefOf(v)}">${v.nom}</a>`)
    .join("\n    ");
  const reperes = (c.reperes || [])
    .map((r) => `<span class="pchip">${r}</span>`)
    .join("\n    ");
  return `<!-- HERO -->
<section class="hero"><div class="wrap">
  <div class="hero-txt">
    <div class="eyebrow hero-eyebrow">Gestion locative &nbsp;&#183;&nbsp; ${c.nom} &amp; Douaisis</div>
    <div class="hero-national">Tous secteurs &nbsp;&#183;&nbsp; national sur demande</div>
    <h1>Gestion locative &#224; <span class="g">${c.nom}</span></h1>
    <p class="sub">${c.angle} Votre bien g&#233;r&#233; de A &#224; Z par un cabinet install&#233; &#224; Douai depuis vingt ans, fort de plus de 2&nbsp;100 mandats. Loyers s&#233;curis&#233;s, comptes clairs, fiscalit&#233; incluse.</p>
    <p class="reassure">Estimation locative offerte et sans engagement &#224; ${c.nom}. Un conseiller vous r&#233;pond sous 24 heures.</p>
    <div class="cta-row">
      <a class="btn btn-gold" href="#estimer">Estimer mon loyer &#224; ${c.nom}</a>
      <a class="btn btn-ghost" href="#contact">&#202;tre rappel&#233; sous 24 h</a>
    </div>
    <div class="badges">
      <div class="badge"><span class="bn">Carte G</span><span class="bl">Gestion en propre</span></div>
      <div class="badge"><span class="bn">110 000 &#8364;</span><span class="bl">Garantie financi&#232;re</span></div>
      <div class="badge"><span class="bn">${c.cp}</span><span class="bl">${c.nom}</span></div>
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
  <div class="ti"><b>${c.nom}</b><span>votre commune couverte</span></div>
  <div class="sep"></div>
  <div class="ti"><b>110&nbsp;000 &#8364;</b><span>garantie financi&#232;re, carte G</span></div>
</div></div>

<!-- INTRO LOCALE -->
<section><div class="wrap">
  <div class="sec-head">
    <div class="eyebrow">Le sp&#233;cialiste local</div>
    <h2>La gestion locative &#224; ${c.nom}, par ceux qui connaissent le terrain</h2>
    <p>${c.local}</p>
    <div class="rule-c"></div>
  </div>
  <div class="cover-grid">
    <div class="cov"><h3>Un loyer juste &#224; ${c.nom}</h3><p>Nous fixons votre loyer au bon prix du march&#233; local pour louer vite et bien, sans laisser d'argent sur la table.</p></div>
    <div class="cov"><h3>Une relocation rapide</h3><p>Un r&#233;seau local, une diffusion efficace et une s&#233;lection rigoureuse des candidats pour r&#233;duire la vacance.</p></div>
    <div class="cov"><h3>Un interlocuteur proche</h3><p>Un cabinet physique &#224; Douai, &#224; quelques minutes de ${c.nom}, et un conseiller d&#233;di&#233; qui r&#233;pond.</p></div>
  </div>
  <div class="promo" style="margin-top:22px;">
    ${reperes}
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
      <ul class="f-list">
        <li>Encaissement et reversement des loyers</li>
        <li>Quittancement et r&#233;vision de loyer</li>
        <li>Gestion des impay&#233;s</li>
        <li>Reversement et relev&#233;s trimestriels</li>
      </ul>
      <a class="btn btn-dark" href="#contact">Choisir Essentiel</a>
    </div>
    <div class="f-card reco">
      <div class="f-badge">Le plus choisi</div>
      <div class="f-name">S&#233;r&#233;nit&#233;</div>
      <div class="f-tag">Le confort complet, cadence mensuelle.</div>
      <div class="f-rate">10<small>% TTC</small></div>
      <ul class="f-list">
        <li>Tout Essentiel, en <b>mensuel</b></li>
        <li><b>Aide &#224; la d&#233;claration 2044 incluse</b></li>
        <li>Visite technique annuelle du bien</li>
        <li>Interlocuteur d&#233;di&#233;</li>
      </ul>
      <a class="btn btn-gold" href="#contact">Choisir S&#233;r&#233;nit&#233;</a>
    </div>
    <div class="f-card">
      <div class="f-name">Prestige</div>
      <div class="f-tag">La gestion patrimoniale, priorit&#233; absolue.</div>
      <div class="f-rate">12<small>% TTC</small></div>
      <ul class="f-list">
        <li>Tout S&#233;r&#233;nit&#233;, priorit&#233; maximale</li>
        <li>Bilan patrimonial annuel</li>
        <li>Accompagnement fiscal et valorisation</li>
        <li>GLI &#224; tarif pr&#233;f&#233;rentiel</li>
      </ul>
      <a class="btn btn-dark" href="#contact">Choisir Prestige</a>
    </div>
  </div>
  <div class="promo">
    <span class="pchip">Changement d'agence gratuit</span>
    <span class="pchip">Aucun frais de dossier cach&#233;</span>
    <span class="pchip">Aucun honoraire de vacance</span>
  </div>
</div></section>

<!-- COMMUNES VOISINES -->
<section><div class="wrap">
  <div class="sec-head">
    <div class="eyebrow">&#192; proximit&#233;</div>
    <h2>ATRIUM g&#232;re aussi votre bien autour de ${c.nom}</h2>
    <p>Nous intervenons dans tout le Douaisis. D&#233;couvrez nos autres secteurs :</p>
    <div class="rule-c"></div>
  </div>
  <div class="promo">
    ${liens}
    <a class="pchip" href="/gestion-locative">Tout le Douaisis</a>
    <a class="pchip" href="/gestion-locative-douai">Douai</a>
  </div>
</div></section>

<!-- ESTIMATION CTA -->
<section id="estimer" class="estim"><div class="wrap">
  <div class="eyebrow" style="color:var(--or)">Estimation offerte</div>
  <h2>Combien peut rapporter votre bien &#224; ${c.nom}&nbsp;?</h2>
  <p>Recevez une estimation de loyer au juste prix du march&#233; local et un premier avis sur la gestion de votre bien, sans engagement.</p>
  <div class="cta-row" style="justify-content:center; display:flex; gap:14px; flex-wrap:wrap;">
    <a class="btn btn-gold" href="#contact">Recevoir mon estimation offerte</a>
    <a class="btn btn-ghost" href="tel:0698442242">Parler &#224; un conseiller</a>
  </div>
  <p class="reassure" style="margin:20px auto 0;">100 % gratuit, sans engagement. Vous d&#233;cidez ensuite, en toute libert&#233;.</p>
</div></section>

<!-- FAQ -->
<section id="faq"><div class="wrap">
  <div class="sec-head">
    <div class="eyebrow">Questions fr&#233;quentes</div>
    <h2>Gestion locative &#224; ${c.nom} : vos questions</h2>
    <div class="rule-c"></div>
  </div>
  <div class="faq">
    <details class="qa" open><summary>Combien co&#251;te une gestion locative &#224; ${c.nom} ? <span class="pl">+</span></summary><p>Nos honoraires de gestion courante sont de 8 % (Essentiel), 10 % (S&#233;r&#233;nit&#233;) ou 12 % TTC (Prestige) des loyers encaiss&#233;s, selon le niveau de service. La quittance est gratuite, il n'y a aucun honoraire de vacance, et la garantie loyers impay&#233;s est propos&#233;e en option &#224; tarif pr&#233;f&#233;rentiel.</p></details>
    <details class="qa"><summary>Connaissez-vous le march&#233; locatif de ${c.nom} ? <span class="pl">+</span></summary><p>Oui. Notre cabinet est install&#233; &#224; Douai, &#224; quelques minutes de ${c.nom}, et suit le march&#233; du Douaisis au quotidien. Nous r&#233;alisons une estimation locative offerte, fond&#233;e sur le march&#233; r&#233;el de votre secteur, pour fixer le juste prix qui loue vite.</p></details>
    <details class="qa"><summary>Comment confier mon bien de ${c.nom} &#224; ATRIUM ? <span class="pl">+</span></summary><p>C'est simple et gratuit, m&#234;me en cours de bail. Nous r&#233;cup&#233;rons votre dossier aupr&#232;s de votre agence actuelle, reprenons la relation avec le locataire et vous livrons des comptes clairs d&#232;s le premier mois, sans interruption.</p></details>
    <details class="qa"><summary>Mes loyers sont-ils garantis ? <span class="pl">+</span></summary><p>Vos fonds sont d&#233;pos&#233;s sur un compte mandant d&#233;di&#233;, sous garantie financi&#232;re de 110 000 &#8364;, jamais m&#234;l&#233;s &#224; nos honoraires. Nous traitons les impay&#233;s et proposons la garantie loyers impay&#233;s pour couvrir totalement le risque.</p></details>
  </div>
</div></section>
`;
}

function faqLd(c) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": `Combien coûte une gestion locative à ${c.nom} ?`, "acceptedAnswer": { "@type": "Answer", "text": "Trois formules : Essentiel 8 %, Sérénité 10 % (la plus choisie) et Prestige 12 % TTC des loyers encaissés. Quittance gratuite, aucun honoraire de vacance, garantie loyers impayés en option à tarif préférentiel." } },
      { "@type": "Question", "name": `Connaissez-vous le marché locatif de ${c.nom} ?`, "acceptedAnswer": { "@type": "Answer", "text": `Oui. Notre cabinet est installé à Douai, à quelques minutes de ${c.nom}, et suit le marché du Douaisis au quotidien. Estimation locative offerte, fondée sur le marché réel du secteur.` } },
      { "@type": "Question", "name": `Comment confier mon bien de ${c.nom} à ATRIUM ?`, "acceptedAnswer": { "@type": "Answer", "text": "C'est simple et gratuit, même en cours de bail. Nous récupérons votre dossier, reprenons la relation avec le locataire et livrons des comptes clairs dès le premier mois, sans interruption." } },
      { "@type": "Question", "name": "Mes loyers sont-ils garantis ?", "acceptedAnswer": { "@type": "Answer", "text": "Vos fonds sont déposés sur un compte mandant dédié, sous garantie financière de 110 000 €, jamais mêlés à nos honoraires. Garantie loyers impayés proposée en option." } }
    ]
  };
}

function breadcrumbLd(c) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE + "/" },
      { "@type": "ListItem", "position": 2, "name": "Gestion locative dans le Douaisis", "item": SITE + "/gestion-locative" },
      { "@type": "ListItem", "position": 3, "name": c.nom, "item": SITE + "/gestion-locative/" + c.slug }
    ]
  };
}

function areaLd(c) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "ATRIUM · Gestion locative — Le Temple de l'Immobilier",
    "url": SITE + "/gestion-locative/" + c.slug,
    "telephone": "+33698442242",
    "email": "contact@templeimmo.com",
    "priceRange": "8 %-12 % TTC",
    "address": { "@type": "PostalAddress", "streetAddress": "10 rue Saint-Jacques", "postalCode": "59500", "addressLocality": "Douai", "addressRegion": "Hauts-de-France", "addressCountry": "FR" },
    "areaServed": { "@type": "City", "name": c.nom, "postalCode": c.cp },
    "parentOrganization": { "@type": "Organization", "name": "Le Temple de l'Immobilier", "url": "https://templeimmo.com" }
  };
}

export async function getStaticPaths() {
  return { paths: generables.map((c) => ({ params: { commune: c.slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const c = bySlug(params.commune);
  const voisins = (c.voisins || []).map(bySlug).filter(Boolean);
  const body = buildHtml(c, voisins);
  return { props: { c, body, faq: faqLd(c), bc: breadcrumbLd(c), area: areaLd(c) } };
}

export default function CommunePage({ c, body, faq, bc, area }) {
  const canonical = SITE + "/gestion-locative/" + c.slug;
  return (
    <>
      <Head>
        <title>{`Gestion locative à ${c.nom} (${c.cp}) | ATRIUM par Le Temple de l'Immobilier`}</title>
        <meta name="description" content={`Gestion locative à ${c.nom} et dans le Douaisis par ATRIUM, cabinet titulaire de la carte G. ${c.angle} 20 ans d'expertise, loyers sécurisés, fiscalité incluse.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ATRIUM · Le Temple de l'Immobilier" />
        <meta property="og:title" content={`Gestion locative à ${c.nom} | ATRIUM`} />
        <meta property="og:description" content={`Votre bien géré de A à Z à ${c.nom} par un cabinet local, carte G, garantie financière 110 000 €.`} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={SITE + "/og-atrium.png"} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(area) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bc) }} />
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <ContactForm />
      <Footer />
    </>
  );
}
