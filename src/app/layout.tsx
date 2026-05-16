import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { ThemeProviders } from "@/components/theme-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Property Search",
  description: "Unified property search across RightMove, Zoopla, and more.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111110" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProviders>{children}</ThemeProviders>
      </body>
    </html>
  );
}
