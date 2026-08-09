import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";
import body from "../douai";

export default function Page() {
  return (
    <>
      <Head>
        <title>Gestion locative à Douai | ATRIUM by Le Temple de l'Immobilier</title>
        <meta name="description" content="Gestion locative à Douai et dans le Douaisis par ATRIUM, cabinet titulaire de la carte G. 20 ans d'expertise, 2 100 mandats, loyers sécurisés, fiscalité incluse." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <Footer />
    </>
  );
}
