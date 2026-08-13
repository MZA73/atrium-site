import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";
import ContactForm from "../ContactForm";
import body from "../changer";

export default function Page() {
  return (
    <>
      <Head>
        <title>Changer d'agence de gestion locative | ATRIUM</title>
        <meta name="description" content="Changez d'agence simplement et gratuitement avec ATRIUM : reprise de mandat encadrée, sans coupure, comptes clairs dès le premier mois." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://atrium.templeimmo.com/changer-agence" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="ATRIUM · Le Temple de l'Immobilier" />
        <meta property="og:title" content="Changer d'agence de gestion locative | ATRIUM" />
        <meta property="og:description" content="Reprise de mandat encadrée et gratuite, sans coupure, comptes clairs dès le premier mois. Le changement se fait sans effort de votre côté." />
        <meta property="og:url" content="https://atrium.templeimmo.com/changer-agence" />
        <meta property="og:image" content="https://atrium.templeimmo.com/og-atrium.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Changer d'agence de gestion locative | ATRIUM" />
        <meta name="twitter:description" content="Reprise de mandat encadrée et gratuite, sans coupure, comptes clairs dès le premier mois." />
        <meta name="twitter:image" content="https://atrium.templeimmo.com/og-atrium.png" />
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <ContactForm />
      <Footer />
    </>
  );
}
