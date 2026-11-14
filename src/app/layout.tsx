import type { Metadata } from "next";
import { Anton, Space_Grotesk } from "next/font/google";
import Frame from "@/components/Frame";
import "./globals.css";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "GDG on Campus TUM",
  description: "GDG on Campus Technical University of Mombasa",
  icons: {
    icon: [{ url: "/gdg-tum-icon-v2.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${space.variable}`}>
      <body className="min-h-screen" suppressHydrationWarning>
        <Frame>{children}</Frame>
      </body>
    </html>
  );
}
