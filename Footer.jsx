import footerHtml from "./footer";
export default function Footer() {
  return <div dangerouslySetInnerHTML={{ __html: footerHtml }} />;
}
