import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "./components/providers";

export const metadata: Metadata = {
  title: "Cuemath — Tutor Screener",
  description: "AI-powered voice screening by Cuemath.",
  openGraph: {
    title: "Cuemath — Tutor Screener",
    description: "AI-powered voice screening for Cuemath tutor candidates.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="bg-background text-on-surface antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
