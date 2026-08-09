import { Html, Head, Main, NextScript } from "next/document";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": "https://atrium.templeimmo.com/#organization",
  "name": "ATRIUM · Gestion locative — Le Temple de l'Immobilier",
  "url": "https://atrium.templeimmo.com",
  "image": "https://atrium.templeimmo.com/logo-atrium.png",
  "logo": "https://atrium.templeimmo.com/logo-atrium.png",
  "telephone": "+33698442242",
  "email": "contact@templeimmo.com",
  "priceRange": "8 %-12 % TTC",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "10 rue Saint-Jacques",
    "postalCode": "59500",
    "addressLocality": "Douai",
    "addressRegion": "Hauts-de-France",
    "addressCountry": "FR"
  },
  "areaServed": [
    { "@type": "City", "name": "Douai" },
    { "@type": "City", "name": "Sin-le-Noble" },
    { "@type": "City", "name": "Waziers" },
    { "@type": "City", "name": "Auby" },
    { "@type": "City", "name": "Flers-en-Escrebieux" },
    { "@type": "City", "name": "Cuincy" },
    { "@type": "City", "name": "Lambres-lez-Douai" },
    { "@type": "City", "name": "Dechy" },
    { "@type": "City", "name": "Guesnain" },
    { "@type": "City", "name": "Roost-Warendin" },
    { "@type": "City", "name": "Lallaing" },
    { "@type": "City", "name": "Râches" }
  ],
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "09:30", "closes": "12:30" },
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "14:00", "closes": "18:30" }
  ],
  "parentOrganization": {
    "@type": "Organization",
    "name": "Le Temple de l'Immobilier",
    "url": "https://templeimmo.com"
  },
  "sameAs": ["https://templeimmo.com"]
};

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
