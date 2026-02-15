import type { ReactNode } from "react";
import { Lora, Raleway } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import Link from "next/link";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${lora.variable} ${raleway.variable}`}>
      <body className="min-h-screen bg-cream-50 flex flex-col">
        <NavBar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
        <footer className="w-full border-t border-cream-200 bg-white/50 py-4">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>Drift is not a medical tool. If you need support, please reach out to a professional.</p>
            <Link href="/privacy" className="hover:text-coral-500 transition-colors">
              Privacy
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
