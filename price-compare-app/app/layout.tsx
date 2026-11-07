import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BasketScout UK | Side-by-Side Receipt & Supermarket Map",
  description: "Compare receipt prices and walking distances across nearby UK supermarkets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        {/* Leaflet Interactive Map CSS & JS (100% Free OpenStreetMap, No API Key!) */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          defer
        ></script>
      </head>
      <body className="antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
