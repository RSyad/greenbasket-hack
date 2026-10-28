import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenBasket | Instant Grocery Carbon & Cost Swapper",
  description: "Snap a supermarket receipt to cut your carbon footprint and grocery bill.",
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
      </head>
      <body className="antialiased bg-emerald-50/40 text-slate-900">
        {children}
      </body>
    </html>
  );
}
