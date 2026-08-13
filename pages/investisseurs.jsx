import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";
import ContactForm from "../ContactForm";
import body from "../investisseurs";

export default function Page() {
  return (
    <>
      <Head>
        <title>Gestion locative pour investisseurs | ATRIUM</title>
        <meta name="description" content="ATRIUM optimise la gestion locative des investisseurs : dégressivité multi-lots, GLI préférentielle, accompagnement fiscal, reporting patrimonial." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://atrium.templeimmo.com/investisseurs" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="ATRIUM · Le Temple de l'Immobilier" />
        <meta property="og:title" content="Gestion locative pour investisseurs | ATRIUM" />
        <meta property="og:description" content="Dégressivité multi-lots, GLI préférentielle, accompagnement fiscal et reporting patrimonial. Votre rendement piloté par un cabinet local." />
        <meta property="og:url" content="https://atrium.templeimmo.com/investisseurs" />
        <meta property="og:image" content="https://atrium.templeimmo.com/og-atrium.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Gestion locative pour investisseurs | ATRIUM" />
        <meta name="twitter:description" content="Dégressivité multi-lots, GLI préférentielle, accompagnement fiscal, reporting patrimonial." />
        <meta name="twitter:image" content="https://atrium.templeimmo.com/og-atrium.png" />
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <ContactForm />
      <Footer />
    </>
  );
}
