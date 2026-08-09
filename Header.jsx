import Link from "next/link";
import { useState } from "react";

const SLOGAN = "Dorénavant, la pierre ne vous laissera plus jamais de marbre.";
const House = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M9.5 20v-6h5v6" /></svg>
);
const Key = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="8.5" cy="8.5" r="4" /><path d="M11.5 11.5l8.5 8.5" /><path d="M18 18l2-2M15.5 20.5l2-2" /></svg>
);

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuStyle = open
    ? { display: "flex", position: "absolute", top: "78px", left: 0, right: 0, flexDirection: "column", background: "#0D0D0D", padding: "18px 28px", gap: "16px", borderBottom: "1px solid rgba(201,169,97,.3)" }
    : undefined;
  return (
    <>
      <header className="nav">
        <div className="wrap">
          <Link className="brand" href="/">
            <span><span className="bt">ATRIUM</span><span className="bs">by Le Temple de l&apos;Immobilier</span></span>
          </Link>
          <nav className="menu" style={menuStyle}>
            <Link href="/gestion-locative-douai">Gestion locative</Link>
            <Link href="/investisseurs">Investisseurs</Link>
            <Link href="/conciergerie-sejour">Conciergerie</Link>
            <Link href="/changer-agence">Changer d&apos;agence</Link>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
          </nav>
          <a className="nav-space" href="#">Espace client</a>
          <a className="cta-nav" href="#estimer">Estimer mon loyer</a>
          <span className="burger" onClick={() => setOpen(!open)}>&#9776;</span>
        </div>
      </header>
      <div className="marquee" aria-label={SLOGAN}>
        <div className="track">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i}><span className="sl">{SLOGAN}</span><span className="dot">&#9670;</span></span>
          ))}
        </div>
      </div>
      <div className="client-bar">
        <span className="cb-label">Vos espaces sécurisés</span>
        <a className="ca" href="#"><House /><span>Espace propriétaire</span></a>
        <a className="ca" href="#"><Key /><span>Espace locataire</span></a>
      </div>
    </>
  );
}
