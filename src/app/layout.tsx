import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scholaris",
  description: "An educational AI tutor that teaches students how to think.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans text-slate-950">{children}</body>
    </html>
  );
}
