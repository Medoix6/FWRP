import "../app/globals.css";
import Script from "next/script";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Preload Cloudinary widget globally for all pages */}
      <Script 
        src="https://upload-widget.cloudinary.com/global/all.js" 
        strategy="beforeInteractive"
      />
      <Component {...pageProps} />
    </>
  );
}
