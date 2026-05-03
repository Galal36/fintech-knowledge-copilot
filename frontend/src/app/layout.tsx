import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Knowledge Operations System",
  description: "Knowledge ingestion, retrieval, and proactive insights dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
