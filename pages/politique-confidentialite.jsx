import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";

const HTML = `<div class="legal-page">
  <h1>Politique de confidentialité</h1>
  <div class="maj">Protection des données personnelles (RGPD) &middot; Dernière mise à jour : 9 août 2026</div>

  <p>Le Temple de l'Immobilier, à travers sa marque ATRIUM, attache une grande importance à la protection de vos données personnelles. La présente politique explique quelles données sont collectées, pourquoi, et quels sont vos droits.</p>

  <h2>Responsable du traitement</h2>
  <div class="box">
    <p style="margin:0;"><b>LE TEMPLE DE L'IMMOBILIER</b> (SARL U)<br>10 rue Saint-Jacques, 59500 Douai<br>Courriel : contact@templeimmo.com &middot; Téléphone : 03 27 95 61 14</p>
  </div>

  <h2>Données collectées</h2>
  <p>Lorsque vous remplissez le formulaire de contact, nous collectons uniquement les informations que vous nous transmettez :</p>
  <ul>
    <li>votre nom ;</li>
    <li>votre adresse électronique ;</li>
    <li>votre numéro de téléphone (facultatif) ;</li>
    <li>la ville de votre bien (facultatif) ;</li>
    <li>le profil indiqué (bailleur, investisseur, locataire) et votre message ;</li>
    <li>l'horodatage de votre demande et votre consentement.</li>
  </ul>

  <h2>Finalités et base légale</h2>
  <p>Ces données sont utilisées pour répondre à votre demande, vous recontacter et gérer notre relation (mise en location, gestion locative, état des lieux, estimation). Le traitement repose sur <b>votre consentement</b> et sur l'exécution de <b>mesures précontractuelles</b> prises à votre demande.</p>

  <h2>Destinataires et sous-traitants</h2>
  <p>Vos données sont destinées au seul personnel habilité du cabinet. Elles sont traitées par des prestataires techniques agissant pour notre compte :</p>
  <ul>
    <li><b>Base de données</b> : Supabase, avec hébergement au sein de l'Union européenne (région de Paris, France).</li>
    <li><b>Envoi des courriels</b> : Brevo (Sendinblue SA), société française.</li>
    <li><b>Hébergement du site</b> : Vercel Inc. (États-Unis). Des garanties appropriées encadrent tout traitement en dehors de l'Union européenne.</li>
  </ul>
  <p>Vos données ne sont jamais vendues ni cédées à des tiers à des fins commerciales.</p>

  <h2>Durée de conservation</h2>
  <p>Les données des prospects non clients sont conservées trois ans à compter du dernier contact. Les données des clients sont conservées le temps de la relation contractuelle, puis pour les durées légales de conservation applicables.</p>

  <h2>Vos droits</h2>
  <p>Conformément au Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité, ainsi que du droit de retirer votre consentement à tout moment.</p>
  <p>Pour exercer ces droits, écrivez-nous à <a href="mailto:contact@templeimmo.com">contact@templeimmo.com</a>. Un justificatif d'identité pourra vous être demandé.</p>
  <p>Vous pouvez également introduire une réclamation auprès de la CNIL :</p>
  <div class="box">
    <p style="margin:0;"><b>CNIL</b> — 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07<br>www.cnil.fr</p>
  </div>

  <h2>Cookies</h2>
  <p>Ce site n'utilise pas de cookies publicitaires ni de traceurs de mesure d'audience. Seuls d'éventuels cookies strictement nécessaires au bon fonctionnement du site peuvent être déposés ; ils ne nécessitent pas votre consentement.</p>

  <h2>Sécurité</h2>
  <p>Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données : accès restreint par rôle, cloisonnement des données au niveau de la base, et chiffrement des informations sensibles.</p>

  <h2>Décision automatisée</h2>
  <p>Aucune décision produisant des effets juridiques à votre égard n'est prise sur le seul fondement d'un traitement automatisé, et aucun profilage n'est réalisé.</p>

  <p style="margin-top:30px;"><a href="/mentions-legales">Consulter les mentions légales</a></p>
</div>`;

export default function Page() {
  return (
    <>
      <Head>
        <title>Politique de confidentialité (RGPD) — ATRIUM by Le Temple de l&apos;Immobilier</title>
        <meta name="description" content="Politique de confidentialité et protection des données personnelles (RGPD) du site ATRIUM, Le Temple de l'Immobilier à Douai." />
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
        .legal-page ul { padding-left: 20px; }
        .legal-page a { color: #a9853f; text-decoration: none; font-weight: 600; }
        .legal-page a:hover { text-decoration: underline; }
        .legal-page .box { background: #fffdf8; border: 1px solid #e6ddca; border-left: 3px solid #c9a961; border-radius: 8px; padding: 16px 20px; margin: 10px 0 6px; }
      `}</style>
    </>
  );
}
