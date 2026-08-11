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
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
useEffect(() => { fetch("/sign-mo.png").then((r) => r.blob()).then((b) => { const fr = new FileReader(); fr.onload = () => { window.ATRIUM_SIGN_PNG = fr.result; }; fr.readAsDataURL(b); }).catch(() => {}); }, []);
  return <Component {...pageProps} />;
}
