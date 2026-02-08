import type { Metadata } from "next";
import { Lato, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Communication Insight Extractor",
  description: "Extract insights from Slack-like messages using LLM analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${lato.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
