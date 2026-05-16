import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./globals.css";

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
  themeColor: "#ffffff",
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
        <Theme
          accentColor="crimson"
          grayColor="sand"
          radius="large"
          scaling="100%"
          panelBackground="solid"
        >
          {children}
        </Theme>
      </body>
    </html>
  );
}
