import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";
import ContactForm from "../ContactForm";
import body from "../sejour";

export default function Page() {
  return (
    <>
      <Head>
        <title>Conciergerie courte durée ATRIUM Séjour | Le Temple de l'Immobilier</title>
        <meta name="description" content="ATRIUM Séjour, conciergerie de location courte durée dans le Douaisis : annonces, accueil voyageurs, ménage et linge, tarification dynamique. Sur devis." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://atrium.templeimmo.com/conciergerie-sejour" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="ATRIUM · Le Temple de l'Immobilier" />
        <meta property="og:title" content="Conciergerie courte durée ATRIUM Séjour" />
        <meta property="og:description" content="Annonces, accueil voyageurs, ménage et linge, tarification dynamique. Votre location courte durée gérée de A à Z dans le Douaisis." />
        <meta property="og:url" content="https://atrium.templeimmo.com/conciergerie-sejour" />
        <meta property="og:image" content="https://atrium.templeimmo.com/og-atrium.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Conciergerie courte durée ATRIUM Séjour" />
        <meta name="twitter:description" content="Annonces, accueil voyageurs, ménage et linge, tarification dynamique. Sur devis." />
        <meta name="twitter:image" content="https://atrium.templeimmo.com/og-atrium.png" />
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <ContactForm />
      <Footer />
    </>
  );
}
