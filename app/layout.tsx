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
  title: "Synaptic Plasticity as Memory — BDH Interactive Explainer",
  description:
    "An interactive walkthrough of how Hebbian synaptic plasticity can act as short-term memory in neural language models, and why a fixed-size recurrent state can replace a growing KV-cache. Based on Pathway's Baby Dragon Hatchling (BDH) architecture.",
  keywords: [
    "synaptic plasticity",
    "Hebbian learning",
    "KV-cache",
    "BDH",
    "Dragon Hatchling",
    "Pathway",
    "state space models",
    "attention",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
