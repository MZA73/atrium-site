import Head from "next/head";
import Header from "../Header";
import Footer from "../Footer";

// Page Honoraires ATRIUM. Barème obligatoire (arrêté du 10 janvier 2017, article 4).
// Toute modification de prix doit être reportée ici, au mandat et à l'affichage en vitrine le même jour.

const HTML = `<div class="bar-page">
  <div class="bar-eyebrow">Barème affiché en application de l’article 4 de l’arrêté du 10 janvier 2017</div>
  <h1>Honoraires</h1>
  <div class="maj">Barème en vigueur à compter du 1er octobre 2026. Tous les prix destinés aux particuliers sont exprimés toutes taxes comprises (TTC, TVA 20 %). Chaque ligne précise qui supporte l’honoraire.</div>

  <p class="lead">Un prix clair pour la gestion. Une rémunération transparente lorsque nous mobilisons des moyens supplémentaires. Quittance gratuite, aucun honoraire de vacance, aucun frais de dossier facturé au locataire.</p>

  <h2>1. Gestion locative courante</h2>
  <p>Honoraires proportionnels calculés sur les sommes effectivement encaissées au titre du loyer et des charges, à la charge exclusive du bailleur. Aucun honoraire n’est dû pendant les périodes de vacance du logement.</p>
  <table class="bar">
    <thead><tr><th>Formule</th><th>Contenu</th><th>Honoraires</th><th>À la charge de</th></tr></thead>
    <tbody>
      <tr><td><b>Essentiel</b></td><td>Encaissement, quittancement, révision annuelle, relevé de gérance trimestriel, suivi des impayés, interlocuteur cabinet.</td><td class="px">8 % TTC</td><td>Bailleur</td></tr>
      <tr><td><b>Sérénité</b></td><td>Essentiel, plus cadence mensuelle, récapitulatif détaillé, suivi de la récupération des charges, interlocuteur désigné.</td><td class="px">10 % TTC</td><td>Bailleur</td></tr>
      <tr><td><b>Prestige</b></td><td>Sérénité, plus ATRIUM Zen inclus, une visite technique annuelle, remise de 10 % sur les prestations à l’acte. Accessible à partir de 700 € de loyer mensuel ou de deux lots confiés.</td><td class="px">12 % TTC</td><td>Bailleur</td></tr>
      <tr><td><b>Ouverture de mandat</b></td><td>Constitution du dossier, vérifications réglementaires, paramétrage du bien. Une seule fois, à la signature.</td><td class="px">190 € TTC</td><td>Bailleur</td></tr>
    </tbody>
  </table>

  <h2>2. Mise en location</h2>
  <p>Honoraires de visite, de constitution du dossier du candidat, de rédaction du bail et d’établissement de l’état des lieux d’entrée. Conformément à l’article 5 de la loi du 6 juillet 1989, la part du locataire est plafonnée par mètre carré de surface habitable et ne peut excéder la part du bailleur.</p>
  <table class="bar">
    <thead><tr><th>Poste</th><th>Montant maximum</th><th>À la charge de</th></tr></thead>
    <tbody>
      <tr><td>Visite, constitution du dossier, rédaction du bail (Douai et Douaisis, zone non tendue)</td><td class="px">8,07 € TTC / m²</td><td>Locataire</td></tr>
      <tr><td>État des lieux d’entrée</td><td class="px">3,03 € TTC / m²</td><td>Locataire</td></tr>
      <tr><td>Part du bailleur : visite, dossier, bail et état des lieux d’entrée</td><td class="px">Le plus élevé entre un mois de loyer hors charges et 11,10 € TTC / m²</td><td>Bailleur</td></tr>
      <tr><td>Biens situés en zone tendue ou très tendue (gestion nationale)</td><td class="px">10,09 € ou 12,10 € TTC / m², plus 3,03 € TTC / m² d’état des lieux</td><td>Locataire, dans la limite de la part du bailleur</td></tr>
    </tbody>
  </table>
  <p class="note">Plafonds fixés par le décret n° 2014-890 du 1er août 2014, montants révisés par l’arrêté du 17 juillet 2025 applicables depuis le 1er janvier 2026. État des lieux de sortie : aucun honoraire au locataire.</p>

  <h2>3. Abonnements et services récurrents</h2>
  <p>Souscription libre, jamais imposée. Résiliable à tout moment.</p>
  <table class="bar">
    <thead><tr><th>Service</th><th>Contenu</th><th>Honoraires</th><th>À la charge de</th></tr></thead>
    <tbody>
      <tr><td><b>ATRIUM Zen</b></td><td>Portail premium, tableau de bord et reporting, priorité de traitement, bilan annuel simplifié, deux demandes administratives par an, archivage dix ans. Inclus dans Prestige.</td><td class="px">19,90 € TTC / mois</td><td>Bailleur</td></tr>
      <tr><td><b>Portail propriétaire premium</b></td><td>Accès en ligne aux documents et relevés.</td><td class="px">6 € TTC / mois</td><td>Bailleur</td></tr>
      <tr><td><b>Gestion multi-lots (colocation)</b></td><td>Gestion individualisée de chaque relation locative au sein d’un même logement.</td><td class="px">20 € TTC par lot actif et par mois, minimum 40 € TTC par logement</td><td>Bailleur</td></tr>
      <tr><td><b>ATRIUM Invest</b></td><td>Bilan annuel consolidé, arbitrage des loyers, plan à trois ans, estimation annuelle de valeur, coordination avec l’expert-comptable. À partir de deux lots.</td><td class="px">49 € TTC / mois par portefeuille</td><td>Bailleur</td></tr>
      <tr><td><b>Administration d’un lot vacant</b></td><td>Surveillance, relevés, courrier, sur souscription volontaire.</td><td class="px">45 € TTC / mois</td><td>Bailleur</td></tr>
    </tbody>
  </table>

  <h2>4. Prestations à l’acte</h2>
  <p>Facturées uniquement lorsqu’elles sont réalisées, mentionnées au relevé de gérance. Toute prestation supérieure à 150 € TTC fait l’objet d’un devis préalable écrit accepté par le bailleur.</p>
  <table class="bar">
    <thead><tr><th>Prestation</th><th>Honoraires TTC</th><th>À la charge de</th></tr></thead>
    <tbody>
      <tr><td>Régularisation annuelle des charges</td><td class="px">90 € (130 € en colocation)</td><td>Bailleur</td></tr>
      <tr><td>Assistance déclarative (revenus fonciers, aide à la déclaration)</td><td class="px">150 €</td><td>Bailleur</td></tr>
      <tr><td>Représentation en assemblée générale de copropriété</td><td class="px">180 €, puis 90 € par heure au-delà de trois heures</td><td>Bailleur</td></tr>
      <tr><td>Gestion d’un sinistre</td><td class="px">190 €, puis 90 € par heure</td><td>Bailleur</td></tr>
      <tr><td>Suivi d’un dossier contentieux</td><td class="px">290 €, puis 90 € par heure</td><td>Bailleur</td></tr>
      <tr><td>Procédure de recouvrement d’impayé</td><td class="px">190 €, plus 10 % des sommes recouvrées</td><td>Bailleur</td></tr>
      <tr><td>Mise en demeure</td><td class="px">90 €</td><td>Bailleur</td></tr>
      <tr><td>Déplacement exceptionnel</td><td class="px">90 € (130 € au-delà de 25 km)</td><td>Bailleur</td></tr>
      <tr><td>Intervention hors heures d’ouverture</td><td class="px">150 €</td><td>Bailleur</td></tr>
      <tr><td>État des lieux de sortie</td><td class="px">Minimum 180 € (150 € pour une chambre en colocation)</td><td>Bailleur</td></tr>
      <tr><td>Chiffrage des remises en état</td><td class="px">90 €</td><td>Bailleur</td></tr>
      <tr><td>Rédaction d’un acte ou d’un avenant</td><td class="px">110 €</td><td>Bailleur</td></tr>
      <tr><td>Inventaire des pièces amortissables (meublé)</td><td class="px">190 €</td><td>Bailleur</td></tr>
      <tr><td>Coordination des diagnostics obligatoires</td><td class="px">110 €</td><td>Bailleur</td></tr>
      <tr><td>Reportage photographique professionnel</td><td class="px">250 €</td><td>Bailleur</td></tr>
      <tr><td>Remise en location d’une chambre (colocation)</td><td class="px">420 €</td><td>Bailleur</td></tr>
      <tr><td>Remplacement d’un colocataire</td><td class="px">290 €</td><td>Bailleur</td></tr>
      <tr><td>Bilan annuel de performance locative</td><td class="px">150 €</td><td>Bailleur</td></tr>
      <tr><td>Clôture et transfert de dossier (fin de mandat)</td><td class="px">240 €</td><td>Bailleur</td></tr>
      <tr><td>État de situation supplémentaire</td><td class="px">25 €</td><td>Bailleur</td></tr>
      <tr><td>Duplicata de document</td><td class="px">20 €</td><td>Bailleur</td></tr>
    </tbody>
  </table>

  <h2>5. Permis de louer</h2>
  <p>Dans les communes soumises à la déclaration ou à l’autorisation préalable de mise en location (articles L.634-1 et L.635-1 du Code de la construction et de l’habitation), ATRIUM accomplit la formalité au nom du bailleur. Ces honoraires rémunèrent cette prestation ; ils ne correspondent à aucune taxe ni redevance légale et ne sont jamais facturés au locataire.</p>
  <table class="bar">
    <thead><tr><th>Prestation</th><th>Honoraires TTC</th><th>À la charge de</th></tr></thead>
    <tbody>
      <tr><td>Déclaration de mise en location : établissement et dépôt</td><td class="px">90 €</td><td>Bailleur</td></tr>
      <tr><td>Autorisation préalable : constitution et dépôt du dossier</td><td class="px">190 €</td><td>Bailleur</td></tr>
      <tr><td>Présence d’ATRIUM à la visite de conformité</td><td class="px">90 €</td><td>Bailleur</td></tr>
      <tr><td>Renouvellement ou nouvelle demande</td><td class="px">150 €</td><td>Bailleur</td></tr>
    </tbody>
  </table>

  <h2>6. Travaux, équipement et coordination</h2>
  <p>Sur devis préalable écrit. Nos packages intègrent la fourniture, la livraison, le montage, l’inventaire opposable et notre marge de distribution. Vous pouvez à tout moment choisir d’acheter vous-même et de ne nous confier que la coordination. ATRIUM intervient en assistance au maître d’ouvrage, jamais en maîtrise d’œuvre.</p>
  <table class="bar">
    <thead><tr><th>Prestation</th><th>Honoraires TTC</th><th>À la charge de</th></tr></thead>
    <tbody>
      <tr><td>Coordination de travaux courants</td><td class="px">10 % du montant des travaux, minimum 150 €</td><td>Bailleur</td></tr>
      <tr><td>Coordination d’un équipement ou d’un aménagement</td><td class="px">18 % du budget, minimum 490 €</td><td>Bailleur</td></tr>
      <tr><td>Conduite d’opération (rénovation, remise aux normes)</td><td class="px">12 % du montant de l’opération, minimum 1 200 €</td><td>Bailleur</td></tr>
      <tr><td>Pack Chambre Essentiel · Pack Chambre Signature</td><td class="px">1 090 € · 1 490 €</td><td>Bailleur</td></tr>
      <tr><td>Pack Cuisine Conforme · Pack Séjour · Pack Remise en état</td><td class="px">890 € · 990 € · 590 €</td><td>Bailleur</td></tr>
      <tr><td>Pack Colocation clé en main (quatre chambres et parties communes)</td><td class="px">4 900 €</td><td>Bailleur</td></tr>
    </tbody>
  </table>

  <h2>7. Professionnels de l’immobilier : ATRIUM Partenaires</h2>
  <p>Conditions réservées aux agences et réseaux titulaires d’une carte professionnelle, dans le cadre d’une convention écrite. Les prix sont indiqués hors taxes, TVA de 20 % en sus, l’équivalent toutes taxes comprises figurant entre parenthèses. Les honoraires facturés aux bailleurs restent ceux du présent barème : la rémunération d’un partenaire est à la charge exclusive d’ATRIUM et n’augmente jamais les honoraires du bailleur, qui en est informé dans son mandat.</p>
  <table class="bar">
    <thead><tr><th>Formule</th><th>Conditions</th><th>Rémunération</th><th>À la charge de</th></tr></thead>
    <tbody>
      <tr><td><b>Back-office en marque blanche</b></td><td>Préparation des documents de gestion de l’agence, sous son identité ; aucun fonds détenu, aucun mandat transféré. Palier appliqué à l’ensemble des lots actifs. Minimum de facturation 100 € HT par mois à compter du troisième mois.</td><td class="px">12 € HT (14,40 € TTC) par lot et par mois de 1 à 20 lots · 10 € HT (12 € TTC) de 21 à 100 lots · 8 € HT (9,60 € TTC) à partir de 101 lots</td><td>Agence partenaire</td></tr>
      <tr><td><b>Apport d’affaires</b></td><td>Présentation d’un bailleur qui signe un mandat de gestion ATRIUM. Versement au premier loyer encaissé.</td><td class="px">100 € TTC par mandat signé, 150 € TTC à partir du cinquième mandat de l’année civile</td><td>ATRIUM</td></tr>
      <tr><td><b>Délégation complète</b></td><td>Lots dont la gestion est confiée à ATRIUM par mandat signé directement du bailleur. Fin automatique en cas de départ du bailleur.</td><td class="px">10 % des honoraires de gestion hors taxes encaissés pendant 24 mois, plafonnés à 300 € HT par lot</td><td>ATRIUM</td></tr>
    </tbody>
  </table>

  <h2>Mentions réglementaires</h2>
  <div class="box">
    <p style="margin:0;">LE TEMPLE DE L’IMMOBILIER, SARLU au capital de 10 000 €, 10 rue Saint-Jacques, 59500 Douai, RCS Douai 490 000 536, TVA FR 85 490 000 536, exerçant sous la marque ATRIUM pour la gestion locative. Carte professionnelle CPI 5904 2025 000 000 004, mentions « Transactions sur immeubles et fonds de commerce » et « Gestion immobilière », délivrée par la CCI Grand Lille Hauts-de-France, valable jusqu’au 4 août 2029. Garantie financière de 110 000 € et assurance de responsabilité civile professionnelle : MARKEL INSURANCE SE, succursale française, 32 rue Guersant, 75017 Paris. Cabinet habilité à recevoir et détenir des fonds sur compte dédié. Médiateur de la consommation : GIE Médimmoconso, 1 allée du Parc de Mesemena, CS 25222, 44505 La Baule Cedex, www.medimmoconso.fr.</p>
  </div>
  <p class="note">Les honoraires de gestion et de mise en location sont stipulés au mandat de gestion signé du bailleur, qui précise la partie qui les supporte (article 6 de la loi n° 70-9 du 2 janvier 1970 et article 73 du décret n° 72-678 du 20 juillet 1972). Aucune somme n’est exigée avant la conclusion de l’opération. Ce barème est également affiché dans nos locaux. Dernière mise à jour : 7 octobre 2026.</p>
</div>`;

export default function Page() {
  return (
    <>
      <Head>
        <title>Honoraires · ATRIUM by Le Temple de l&apos;Immobilier</title>
        <meta name="description" content="Barème des honoraires ATRIUM : gestion locative 8, 10 et 12 % TTC, mise en location, abonnements, prestations à l'acte, permis de louer, conditions partenaires. Prix TTC, part du bailleur et du locataire." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://atrium.templeimmo.com/honoraires" />
      </Head>
      <Header />
      <main className="bar-outer" dangerouslySetInnerHTML={{ __html: HTML }} />
      <Footer />
      <style jsx global>{`
        .bar-outer { background: #f7f4ee; }
        .bar-page { max-width: 980px; margin: 0 auto; padding: 54px 24px 72px; color: #2a2620; font-family: "EB Garamond", Georgia, serif; }
        .bar-eyebrow { font-family: "Cinzel", serif; font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: #a9853f; margin-bottom: 10px; }
        .bar-page h1 { font-family: "Cinzel", serif; color: #0d0d0d; font-size: 36px; margin: 0 0 8px; }
        .bar-page .maj { color: #8a8069; font-size: 15px; line-height: 1.6; margin-bottom: 22px; }
        .bar-page .lead { font-size: 19px; line-height: 1.6; color: #0d0d0d; border-left: 3px solid #c9a961; padding-left: 16px; margin: 0 0 30px; }
        .bar-page h2 { font-family: "Cinzel", serif; color: #0d0d0d; font-size: 19px; letter-spacing: .02em; margin: 38px 0 10px; border-left: 3px solid #c9a961; padding-left: 12px; }
        .bar-page p, .bar-page li { font-size: 16px; line-height: 1.7; color: #3a362d; }
        .bar-page .note { font-size: 14px; color: #6e665a; }
        .bar-page a { color: #a9853f; text-decoration: none; font-weight: 600; }
        .bar-page .box { background: #fffdf8; border: 1px solid #e6ddca; border-left: 3px solid #c9a961; border-radius: 8px; padding: 16px 20px; margin: 10px 0 6px; }
        .bar-page .box p { font-size: 14px; line-height: 1.65; }
        table.bar { width: 100%; border-collapse: collapse; margin: 12px 0 6px; background: #fffdf8; border: 1px solid #e6ddca; font-size: 15px; }
        table.bar th { text-align: left; font-family: "Cinzel", serif; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: #f5e6b8; background: #0d0d0d; padding: 12px 14px; font-weight: 500; }
        table.bar td { padding: 12px 14px; border-top: 1px solid #e6ddca; vertical-align: top; line-height: 1.55; color: #3a362d; }
        table.bar td.px { white-space: normal; color: #0d0d0d; font-weight: 600; min-width: 150px; }
        table.bar tr:nth-child(even) td { background: #faf6ec; }
        @media (max-width: 720px) {
          table.bar, table.bar thead, table.bar tbody, table.bar tr, table.bar td { display: block; width: 100%; }
          table.bar thead { display: none; }
          table.bar tr { border-top: 2px solid #c9a961; padding: 6px 0; }
          table.bar td { border-top: 0; padding: 6px 14px; }
          table.bar td.px { min-width: 0; }
          table.bar td:nth-child(1) { font-weight: 600; color: #0d0d0d; padding-top: 12px; }
        }
      `}</style>
    </>
  );
}
