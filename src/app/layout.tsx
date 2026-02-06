import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AderaBot-Hermes - AI Knowledge Assistant | Adera-Hybrid-App",
  description: "AderaBot-Hermes is a custom knowledge chatbot for the Adera-Hybrid-App PTP delivery service. Access intelligent support with multi-source knowledge from PDFs, websites, and database queries.",
  keywords: ["AderaBot-Hermes", "Adera-Hybrid-App", "AI chatbot", "PTP delivery", "knowledge assistant", "customer support", "OpenRouter", "LLM"],
  authors: [{ name: "Adera Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AderaBot-Hermes - AI Knowledge Assistant",
    description: "Custom knowledge chatbot for PTP delivery service with multi-source knowledge base",
    url: "https://adera.example.com",
    siteName: "Adera-Hybrid-App",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AderaBot-Hermes - AI Knowledge Assistant",
    description: "Custom knowledge chatbot for PTP delivery service",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
