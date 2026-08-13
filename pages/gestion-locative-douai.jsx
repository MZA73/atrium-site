import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";
import ContactForm from "../ContactForm";
import body from "../douai";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Combien coûte la gestion locative à Douai ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Trois formules : Essentiel 8 %, Sérénité 10 % (la plus choisie) et Prestige 12 % TTC des loyers encaissés. Ces honoraires sont à la charge du propriétaire, sans frais caché ni honoraire de vacance." }
    },
    {
      "@type": "Question",
      "name": "Quels frais restent à la charge du locataire ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Uniquement la mise en location (dès 8 €/m² à Douai) et l'état des lieux (dès 3 €/m²), dans le respect des plafonds de la loi ALUR. La quittance de loyer est gratuite." }
    },
    {
      "@type": "Question",
      "name": "Puis-je changer d'agence en cours de bail ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui. Nous reprenons votre mandat de gestion sans interrompre vos encaissements et gérons toutes les formalités de transfert." }
    },
    {
      "@type": "Question",
      "name": "Gérez-vous les impayés de loyer ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui : relances, mise en demeure et suivi. La formule Prestige peut inclure une garantie loyers impayés." }
    },
    {
      "@type": "Question",
      "name": "Faites-vous de la location saisonnière ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui, via notre service de conciergerie séjour : annonces, ménage, linge et optimisation des réservations en courte durée, sur devis." }
    },
    {
      "@type": "Question",
      "name": "Intervenez-vous en dehors de Douai ?",
      "acceptedAnswer": { "@type": "Answer", "text": "Oui, dans tout le Douaisis : Sin-le-Noble, Waziers, Auby, Flers-en-Escrebieux, Cuincy, Lambres-lez-Douai, Dechy, Guesnain, Roost-Warendin, Lallaing et Râches." }
    }
  ]
};

export default function Page() {
  return (
    <>
      <Head>
        <title>Gestion locative à Douai | ATRIUM par Le Temple de l'Immobilier</title>
        <meta name="description" content="Gestion locative à Douai et dans le Douaisis par ATRIUM, cabinet titulaire de la carte G. 20 ans d'expertise, 2 100 mandats, loyers sécurisés, fiscalité incluse." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://atrium.templeimmo.com/gestion-locative-douai" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="ATRIUM · Le Temple de l'Immobilier" />
        <meta property="og:title" content="Gestion locative à Douai | ATRIUM" />
        <meta property="og:description" content="Cabinet titulaire de la carte G à Douai. 20 ans d'expertise, 2 100 mandats, loyers sécurisés, fiscalité incluse." />
        <meta property="og:url" content="https://atrium.templeimmo.com/gestion-locative-douai" />
        <meta property="og:image" content="https://atrium.templeimmo.com/og-atrium.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Gestion locative à Douai | ATRIUM" />
        <meta name="twitter:description" content="Carte G, 20 ans d'expertise, loyers sécurisés, fiscalité incluse." />
        <meta name="twitter:image" content="https://atrium.templeimmo.com/og-atrium.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <ContactForm />
      <Footer />
    </>
  );
}
