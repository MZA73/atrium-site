import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/500.css";
import "@fontsource/eb-garamond/600.css";
import "@fontsource/eb-garamond/700.css";
import "@fontsource/eb-garamond/400-italic.css";
import "@fontsource/eb-garamond/500-italic.css";
import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "../globals.css";

// Note securite : la signature du cabinet (sign-mo.png) N'EST PLUS prechargee
// ici. Elle ne doit jamais etre exposee sur les pages publiques. Elle est
// chargee uniquement dans /finaliser-bail (page reservee a l'administrateur),
// au moment ou l'on appose le cachet sur le bail signe.
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
