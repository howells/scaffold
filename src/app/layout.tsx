import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { siteUrl } from "@/lib/site-url";

import "./globals.css";

const description =
  "The baseline behind Howells projects: repo shape, tooling, package boundaries, agent workflow, and launch readiness, written down once and open to read.";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  description,
  metadataBase: new URL(siteUrl()),
  openGraph: {
    description,
    locale: "en_US",
    siteName: "Scaffold",
    title: "Scaffold",
    type: "website",
  },
  title: {
    default: "Scaffold",
    template: "%s | Scaffold",
  },
  twitter: {
    card: "summary_large_image",
    description,
    title: "Scaffold",
  },
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html className={inter.variable} lang="en" suppressHydrationWarning>
    <body className="flex min-h-screen flex-col">
      <RootProvider>{children}</RootProvider>
    </body>
  </html>
);

export default RootLayout;
