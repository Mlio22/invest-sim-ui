import { I18nProvider } from "@/lib/i18n/context";
import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Kapita",
    default: "Kapita — High-Stakes Investment Simulator",
  },
  description:
    "The ultimate investment simulator. Master the markets, climb the global rankings, and prove your strategy with zero risk.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sora.variable}>
      <body className="bg-[#0b1326] text-white antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
