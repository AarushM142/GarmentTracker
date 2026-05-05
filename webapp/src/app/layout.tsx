import type { Metadata } from "next";
import { Nunito, Fraunces } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GarmentTracker — Production Management",
  description: "End-to-end garment production tracking for planners, inventory, accounts, and floor staff.",
  manifest: "/manifest.json",
};

import { SWRegistration } from "@/components/SWRegistration";
import { ToastProvider } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${fraunces.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <SWRegistration />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
