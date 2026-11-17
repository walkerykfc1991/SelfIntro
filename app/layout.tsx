import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Atmosphere } from "@/components/atmosphere";
import { Corners } from "@/components/corners";
import { Cursor } from "@/components/cursor";
import { Motion } from "@/components/motion";
import { contact, documentTitle, name, role, summary } from "@/lib/content";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const sans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-geist",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-geist",
});

const description = summary[0];

export const metadata: Metadata = {
  metadataBase: new URL("https://walkerykfc1991.github.io/SelfIntro"),
  title: documentTitle,
  description,
  authors: [{ name }],
  alternates: { canonical: "/" },
  openGraph: {
    title: documentTitle,
    description,
    type: "website",
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: documentTitle,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#090a08",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name,
  jobTitle: role,
  email: contact.email,
  url: "https://walkerykfc1991.github.io/SelfIntro/",
  sameAs: [contact.linkedin],
  worksFor: { "@type": "Organization", name: "MediFast" },
  description,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Atmosphere />
        <Cursor />
        <Motion />
        <Corners />
        <div className="page-layer">{children}</div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
