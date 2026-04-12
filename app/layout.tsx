import type { Metadata } from "next";
import "./styles.css";
import { Providers } from "./components/providers";

export const metadata: Metadata = {
  title: "Chayan — Cuemath Tutor Screener",
  description: "AI-powered voice screening by Cuemath.",
  openGraph: {
    title: "Chayan — Cuemath Tutor Screener",
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
      <body className="bg-background text-on-surface antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
