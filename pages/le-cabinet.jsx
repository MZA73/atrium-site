import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";
import ContactForm from "../ContactForm";
import body from "../le-cabinet";

const SITE = "https://atrium.templeimmo.com";

const aboutLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "Le cabinet ATRIUM — Le Temple de l'Immobilier",
  "url": SITE + "/le-cabinet",
  "about": {
    "@type": "RealEstateAgent",
    "name": "ATRIUM · Gestion locative — Le Temple de l'Immobilier",
    "url": SITE,
    "telephone": "+33698442242",
    "email": "contact@templeimmo.com",
    "priceRange": "8 %-12 % TTC",
    "address": { "@type": "PostalAddress", "streetAddress": "10 rue Saint-Jacques", "postalCode": "59500", "addressLocality": "Douai", "addressRegion": "Hauts-de-France", "addressCountry": "FR" },
    "parentOrganization": { "@type": "Organization", "name": "Le Temple de l'Immobilier", "url": "https://templeimmo.com" }
  }
};
const bcLd = {
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE + "/" },
    { "@type": "ListItem", "position": 2, "name": "Le cabinet", "item": SITE + "/le-cabinet" }
  ]
};

export default function LeCabinet() {
  const canonical = SITE + "/le-cabinet";
  return (
    <>
      <Head>
        <title>Le cabinet | ATRIUM par Le Temple de l&apos;Immobilier</title>
        <meta name="description" content="ATRIUM, pôle gestion locative du Temple de l'Immobilier à Douai. 20 ans d'expertise, carte T + G, garantie financière 110 000 €, comptes mandants séparés." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ATRIUM · Le Temple de l'Immobilier" />
        <meta property="og:title" content="Le cabinet | ATRIUM par Le Temple de l'Immobilier" />
        <meta property="og:description" content="20 ans d'expertise à Douai, carte T + G, garantie financière 110 000 €." />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={SITE + "/og-atrium.png"} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcLd) }} />
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <ContactForm />
      <Footer />
    </>
  );
}
