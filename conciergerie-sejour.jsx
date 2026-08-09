import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";
import body from "../sejour";

export default function Page() {
  return (
    <>
      <Head>
        <title>Conciergerie courte durée ATRIUM Séjour | Le Temple de l'Immobilier</title>
        <meta name="description" content="ATRIUM Séjour, conciergerie de location courte durée dans le Douaisis : annonces, accueil voyageurs, ménage et linge, tarification dynamique. Sur devis." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <Footer />
    </>
  );
}
