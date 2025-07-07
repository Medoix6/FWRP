import "../app/globals.css";
import Script from "next/script";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script 
        src="https://upload-widget.cloudinary.com/global/all.js" 
        // strategy="beforeInteractive" // See: https://nextjs.org/docs/messages/no-before-interactive-script-outside-document
      />
      <Component {...pageProps} />
    </>
  );
}
