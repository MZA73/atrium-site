import { useState } from "react";

// ATRIUM  Formulaire de contact (M1). Ecrit le lead via la route serveur
// /api/contact, qui l'enregistre dans la base et notifie par Brevo.
export default function ContactForm() {
  const [etat, setEtat] = useState("idle"); // idle | envoi | ok | erreur
  const [erreur, setErreur] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setEtat("envoi");
    setErreur("");
    const f = e.currentTarget;
    const data = {
      nom: f.nom.value,
      email: f.email.value,
      telephone: f.telephone.value,
      ville_bien: f.ville_bien.value,
      interet: f.interet.value,
      message: f.message.value,
      consent: f.consent.checked,
      website: f.website.value, // honeypot
    };
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (r.ok && j.ok) {
        setEtat("ok");
        f.reset();
      } else {
        setEtat("erreur");
        setErreur(
          j.error === "consentement_requis"
            ? "Merci d'accepter la politique de confidentialite."
            : j.error === "champs_invalides"
            ? "Renseignez au moins votre nom et un email valide."
            : "Une erreur est survenue. Reessayez ou appelez le cabinet."
        );
      }
    } catch {
      setEtat("erreur");
      setErreur("Connexion impossible. Reessayez ou appelez le cabinet.");
    }
  }

  return (
    <section id="contact" className="contact-atrium">
      <div className="wrap">
        <div className="c-head">
          <div className="eyebrow">Parlons de votre bien</div>
          <h2>Confiez votre bien a ATRIUM</h2>
          <p>Une question, une estimation, un projet de gestion ? Ecrivez-nous, on vous repond sous 24 h.</p>
        </div>

        {etat === "ok" ? (
          <div className="c-ok" role="status">
            <div className="c-ok-mark">&#10003;</div>
            <h3>Message bien recu.</h3>
            <p>Un conseiller ATRIUM vous rappelle sous 24 heures. Merci de votre confiance.</p>
          </div>
        ) : (
          <form className="c-form" onSubmit={onSubmit} noValidate>
            <div className="row">
              <label>
                Vous etes
                <select name="interet" defaultValue="bailleur">
                  <option value="bailleur">Proprietaire bailleur</option>
                  <option value="investisseur">Investisseur</option>
                  <option value="locataire">Locataire</option>
                </select>
              </label>
              <label>
                Ville du bien
                <input name="ville_bien" type="text" placeholder="Douai, Sin-le-Noble..." />
              </label>
            </div>
            <div className="row">
              <label>
                Nom complet <span className="req">*</span>
                <input name="nom" type="text" required placeholder="Votre nom" />
              </label>
              <label>
                Email <span className="req">*</span>
                <input name="email" type="email" required placeholder="vous@email.fr" />
              </label>
            </div>
            <div className="row">
              <label>
                Telephone
                <input name="telephone" type="tel" placeholder="06 ..." />
              </label>
            </div>
            <label className="full">
              Votre message
              <textarea name="message" rows={4} placeholder="Decrivez votre bien ou votre besoin en quelques mots." />
            </label>

            {/* Honeypot anti-spam : cache, ne pas remplir */}
            <input name="website" type="text" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />

            <label className="consent">
              <input name="consent" type="checkbox" required />
              <span>
                J'accepte que mes donnees soient utilisees pour etre recontacte au sujet de ma demande,
                conformement a la{" "}
                <a href="/politique-confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "#c9a961" }}>
                  politique de confidentialite
                </a>
                . Elles ne sont jamais cedees.
              </span>
            </label>

            {etat === "erreur" && <div className="c-err">{erreur}</div>}

            <button type="submit" className="c-btn" disabled={etat === "envoi"}>
              {etat === "envoi" ? "Envoi en cours..." : "Etre rappele sous 24 h"}
            </button>
            <p className="c-alt">
              Ou directement : <a href="mailto:contact@templeimmo.com">contact@templeimmo.com</a> &nbsp;&middot;&nbsp;
              <a href="tel:0327956114">03 27 95 61 14</a>
            </p>
          </form>
        )}
      </div>

      <style jsx>{`
        .contact-atrium {
          background: #0d0d0d;
          color: #f3efe6;
          padding: 88px 0;
        }
        .contact-atrium .wrap {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .c-head {
          text-align: center;
          margin-bottom: 34px;
        }
        .c-head .eyebrow {
          color: #c9a961;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-size: 14px;
          font-weight: 600;
        }
        .c-head h2 {
          font-family: "Cinzel", serif;
          color: #fff;
          font-size: 40px;
          margin: 12px 0 10px;
          font-weight: 600;
        }
        .c-head p {
          color: #b7ae98;
          font-size: 18px;
          margin: 0;
        }
        .c-form {
          background: #141414;
          border: 1px solid rgba(201, 169, 97, 0.28);
          border-radius: 14px;
          padding: 30px;
        }
        .row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .c-form label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          font-size: 14.5px;
          color: #d8d0bf;
          margin-bottom: 16px;
          flex: 1 1 220px;
        }
        .c-form label.full {
          flex-basis: 100%;
        }
        .req {
          color: #c9a961;
        }
        .c-form input,
        .c-form select,
        .c-form textarea {
          background: #0d0d0d;
          border: 1px solid rgba(201, 169, 97, 0.35);
          border-radius: 8px;
          padding: 12px 13px;
          color: #f3efe6;
          font-size: 15.5px;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .c-form input:focus,
        .c-form select:focus,
        .c-form textarea:focus {
          outline: none;
          border-color: #c9a961;
        }
        .hp {
          position: absolute;
          left: -9999px;
          width: 1px;
          height: 1px;
          opacity: 0;
        }
        .consent {
          flex-direction: row !important;
          align-items: flex-start;
          gap: 11px !important;
          font-size: 13.5px !important;
          color: #a99f8b !important;
          line-height: 1.5;
        }
        .consent input {
          margin-top: 3px;
          width: 17px;
          height: 17px;
          flex: 0 0 auto;
          accent-color: #c9a961;
        }
        .c-btn {
          width: 100%;
          margin-top: 8px;
          background: linear-gradient(180deg, #d8bd7e, #c9a961);
          color: #0d0d0d;
          border: none;
          border-radius: 9px;
          padding: 16px;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.12s, filter 0.15s;
        }
        .c-btn:hover {
          filter: brightness(1.06);
        }
        .c-btn:disabled {
          opacity: 0.65;
          cursor: default;
        }
        .c-err {
          background: rgba(180, 60, 50, 0.18);
          border: 1px solid rgba(200, 90, 80, 0.5);
          color: #f0c9c3;
          padding: 11px 14px;
          border-radius: 8px;
          font-size: 14.5px;
          margin-bottom: 14px;
        }
        .c-alt {
          text-align: center;
          color: #8f8674;
          font-size: 14px;
          margin: 16px 0 0;
        }
        .c-alt a {
          color: #c9a961;
          text-decoration: none;
        }
        .c-ok {
          background: #141414;
          border: 1px solid rgba(201, 169, 97, 0.4);
          border-radius: 14px;
          padding: 46px 30px;
          text-align: center;
        }
        .c-ok-mark {
          width: 62px;
          height: 62px;
          margin: 0 auto 18px;
          border-radius: 50%;
          background: linear-gradient(180deg, #d8bd7e, #c9a961);
          color: #0d0d0d;
          font-size: 32px;
          line-height: 62px;
          font-weight: 700;
        }
        .c-ok h3 {
          font-family: "Cinzel", serif;
          color: #fff;
          font-size: 26px;
          margin: 0 0 8px;
        }
        .c-ok p {
          color: #b7ae98;
          font-size: 17px;
          margin: 0;
        }
        @media (max-width: 560px) {
          .c-head h2 {
            font-size: 30px;
          }
          .c-form {
            padding: 22px 18px;
          }
        }
      `}</style>
    </section>
  );
}
