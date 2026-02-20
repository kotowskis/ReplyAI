import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReplyAI — Odpowiadaj na opinie klientów z AI",
  description:
    "Generuj profesjonalne odpowiedzi na opinie z Google i Facebooka. Oszczędź czas i buduj reputację firmy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
