import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Better Budget",
  description: "Stop being poor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="p-4 bg-gray-800 text-white">
          <h1 className="text-2xl font-bold">Better Budget</h1>
        </header>
        <main>{children}</main>
        <footer className="p-4 bg-gray-800 text-white text-center">
          <p>&copy; 2023 Better Budget. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
