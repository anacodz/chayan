import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Chayan — Cuemath Tutor Screener",
  description: "AI-powered voice screening for Cuemath tutor candidates.",
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
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-background text-on-surface antialiased">
        {children}
      </body>
    </html>
  );
}
