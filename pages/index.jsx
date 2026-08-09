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
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <ContactForm />
      <Footer />
    </>
  );
}
