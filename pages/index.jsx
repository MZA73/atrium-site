import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";
import ContactForm from "../ContactForm";
import body from "../home";

export default function Page() {
  return (
    <>
      <Head>
        <title>ATRIUM · Gestion locative à Douai | by Le Temple de l'Immobilier</title>
        <meta name="description" content="ATRIUM, le pôle gestion locative du Temple de l'Immobilier à Douai. 20 ans d'expertise, 2 100 mandats, carte G, garantie financière 110 000 €. Estimation de loyer offerte." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://atrium.templeimmo.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="ATRIUM · Le Temple de l'Immobilier" />
        <meta property="og:title" content="ATRIUM · Gestion locative à Douai" />
        <meta property="og:description" content="Le pôle gestion locative du Temple de l'Immobilier à Douai. 20 ans d'expertise, 2 100 mandats, carte G, garantie financière 110 000 €. Estimation de loyer offerte." />
        <meta property="og:url" content="https://atrium.templeimmo.com/" />
        <meta property="og:image" content="https://atrium.templeimmo.com/og-atrium.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ATRIUM · Gestion locative à Douai" />
        <meta name="twitter:description" content="20 ans d'expertise, 2 100 mandats, carte G. Estimation de loyer offerte." />
        <meta name="twitter:image" content="https://atrium.templeimmo.com/og-atrium.png" />
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <ContactForm />
      <Footer />
    </>
  );
}
