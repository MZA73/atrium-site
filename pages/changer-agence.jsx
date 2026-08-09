import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";
import body from "../changer";

export default function Page() {
  return (
    <>
      <Head>
        <title>Changer d'agence de gestion locative | ATRIUM</title>
        <meta name="description" content="Changez d'agence simplement et gratuitement avec ATRIUM : reprise de mandat encadrée, sans coupure, comptes clairs dès le premier mois." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <Footer />
    </>
  );
}
