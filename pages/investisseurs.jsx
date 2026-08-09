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
      </Head>
      <Header />
      <main dangerouslySetInnerHTML={{ __html: body }} />
      <ContactForm />
      <Footer />
    </>
  );
}
