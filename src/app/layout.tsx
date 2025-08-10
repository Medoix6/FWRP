import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FWRP",
  description: "Food Waste Reduction Platform",
  icons: {
    icon: [
      { url: '/Logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/Logo.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: '/Logo.png',
    apple: '/Logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://widget.cloudinary.com/v2.0/global/all.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
