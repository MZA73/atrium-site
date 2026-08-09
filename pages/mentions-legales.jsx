import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";

const HTML = `<div class="legal-page">
  <h1>Mentions légales</h1>
  <div class="maj">Dernière mise à jour : 9 août 2026</div>

  <h2>Éditeur du site</h2>
  <p>Le présent site est édité par <b>LE TEMPLE DE L'IMMOBILIER</b>, dont ATRIUM est la marque dédiée à la gestion locative.</p>
  <div class="box">
    <p style="margin:0;">
      <b>LE TEMPLE DE L'IMMOBILIER</b> — SARL U (société à responsabilité limitée à associé unique)<br>
      Capital social : 10 000 €<br>
      Siège social : 10 rue Saint-Jacques, 59500 Douai<br>
      RCS Douai 490 000 536 &middot; SIREN 490 000 536 &middot; Code APE 6831Z<br>
      TVA intracommunautaire : FR 85 490 000 536<br>
      Groupe B &amp; Z Consulting<br>
      Téléphone : 03 27 95 61 14 &middot; Courriel : contact@templeimmo.com
    </p>
  </div>

  <h2>Directeur de la publication</h2>
  <p>Monsieur Mohammed ZAZOUA, gérant.</p>

  <h2>Activité réglementée</h2>
  <p>Activité de transaction et de gestion immobilières régie par la loi n° 70-9 du 2 janvier 1970 (loi Hoguet) et son décret d'application n° 72-678 du 20 juillet 1972.</p>
  <p>Carte professionnelle <b>CPI 5904 2025 000 000 004</b>, portant les mentions « Transactions sur immeubles et fonds de commerce » et « Gestion immobilière », délivrée par la CCI Grand Lille Hauts-de-France, en cours de validité jusqu'au 4 août 2029.</p>
  <p>Garantie financière et responsabilité civile professionnelle : <b>MARKEL INSURANCE SE</b>. Montant de la garantie financière : 110 000 €. Le cabinet est habilité à recevoir et détenir des fonds sur compte dédié.</p>

  <h2>Médiation de la consommation</h2>
  <p>Conformément aux articles L.612-1 et suivants du Code de la consommation, le client peut recourir gratuitement au médiateur de la consommation dont relève le cabinet :</p>
  <div class="box">
    <p style="margin:0;"><b>GIE MÉDIMMOCONSO</b><br>1 allée du Parc de Mesemena, CS 25222, 44505 La Baule Cedex<br>www.medimmoconso.fr</p>
  </div>
  <p>La plateforme européenne de règlement en ligne des litiges est par ailleurs accessible à l'adresse ec.europa.eu/consumers/odr.</p>

  <h2>Hébergement du site</h2>
  <p>Le site est hébergé par <b>Vercel Inc.</b>, 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — vercel.com. Les données transmises via le formulaire de contact sont, elles, stockées au sein de l'Union européenne (voir la politique de confidentialité).</p>

  <h2>Propriété intellectuelle</h2>
  <p>L'ensemble des contenus de ce site (textes, visuels, logo, charte graphique, mise en page) est la propriété exclusive du Temple de l'Immobilier, sauf mention contraire. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation écrite préalable, est interdite et constituerait une contrefaçon.</p>

  <h2>Responsabilité</h2>
  <p>Les informations diffusées sur ce site le sont à titre indicatif et n'ont pas de valeur contractuelle. Le cabinet s'efforce d'en assurer l'exactitude mais ne saurait être tenu responsable d'éventuelles erreurs, omissions, ou de l'indisponibilité temporaire du site. Les liens vers des sites tiers n'engagent pas la responsabilité du cabinet quant à leur contenu.</p>

  <p style="margin-top:30px;"><a href="/politique-confidentialite">Consulter la politique de confidentialité (RGPD)</a></p>
</div>`;

export default function Page() {
  return (
    <>
      <Head>
        <title>Mentions légales — ATRIUM by Le Temple de l&apos;Immobilier</title>
        <meta name="description" content="Mentions légales du site ATRIUM, pôle gestion locative du Temple de l'Immobilier à Douai." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header />
      <main className="legal-outer" dangerouslySetInnerHTML={{ __html: HTML }} />
      <Footer />
      <style jsx global>{`
        .legal-outer { background: #f7f4ee; }
        .legal-page { max-width: 860px; margin: 0 auto; padding: 54px 24px 72px; color: #2a2620; font-family: "EB Garamond", Georgia, serif; }
        .legal-page h1 { font-family: "Cinzel", serif; color: #0d0d0d; font-size: 32px; margin: 0 0 4px; }
        .legal-page .maj { color: #8a8069; font-size: 14px; margin-bottom: 26px; }
        .legal-page h2 { font-family: "Cinzel", serif; color: #0d0d0d; font-size: 18px; letter-spacing: .02em; margin: 30px 0 8px; border-left: 3px solid #c9a961; padding-left: 12px; }
        .legal-page p, .legal-page li { font-size: 16px; line-height: 1.7; color: #3a362d; }
        .legal-page a { color: #a9853f; text-decoration: none; font-weight: 600; }
        .legal-page a:hover { text-decoration: underline; }
        .legal-page .box { background: #fffdf8; border: 1px solid #e6ddca; border-left: 3px solid #c9a961; border-radius: 8px; padding: 16px 20px; margin: 10px 0 6px; }
      `}</style>
    </>
  );
}
