import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-dm" });
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: {
    default: "Grace High School Gayaza Admin",
    template: "%s · Grace Admin",
  },
  description: "Content dashboard for Grace High School Gayaza.",
  robots: { index: false, follow: false },
};

const themeScript = `
try {
  var stored = localStorage.getItem("ghs-theme");
  var dark = stored === "dark" || (!stored && matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) document.documentElement.classList.add("dark");
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${sans.variable} ${serif.variable} font-sans antialiased`}>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
