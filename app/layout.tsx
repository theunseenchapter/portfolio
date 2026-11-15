import type { Metadata, Viewport } from "next";
import { DM_Mono, Instrument_Serif, Manrope } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "./admin.css";
import EditButton from "@/components/admin/EditButton";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const serif = Instrument_Serif({ subsets: ["latin"], variable: "--font-serif", weight: "400", style: ["normal", "italic"] });
// Self-hosted pixel fonts for the arcade console (OFL: Press Start 2P, VT323).
const pixel = localFont({ src: "./fonts/PressStart2P.woff2", variable: "--font-pixel", display: "swap" });
const vt = localFont({ src: "./fonts/VT323.woff2", variable: "--font-vt", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Vivek Yadav — Software Engineer",
  description: "Software engineer building reliable backend systems, data tooling and AI products. Java, Python, SQL, React.",
};
export const viewport: Viewport = { themeColor: "#09090b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} ${mono.variable} ${pixel.variable} ${vt.variable}`}>{children}<EditButton /></body>
    </html>
  );
}
