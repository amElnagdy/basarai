import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Serif, Hanken_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Basar",
  description: "A brand studio for platform-ready images",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <ClerkProvider>
          {children}
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
