import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Chayan — AI Tutor Screener",
  description:
    "Voice-first AI screening for Cuemath tutor candidates. Complete a structured interview in your browser — no app install required.",
  openGraph: {
    title: "Chayan — AI Tutor Screener",
    description: "Voice-first AI screening for Cuemath tutor candidates.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="bg-grid" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
