import type { Metadata, Viewport } from "next";
import { Source_Serif_4, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { getUserOrNull } from "@/server/auth";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-source-serif",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const isIndexingAllowed =
  process.env.ALLOW_INDEXING === "true" &&
  process.env.NEXT_PUBLIC_SITE_URL === "https://projects.vtuadda.com";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://projects.vtuadda.com"),
  title: {
    default: "VTU Adda Projects",
    template: "%s | VTU Adda Projects",
  },
  description: "Project kits, custom builds and mentoring for VTU engineering students",
  robots: isIndexingAllowed
    ? { index: true, follow: true }
    : { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://projects.vtuadda.com",
    siteName: "VTU Adda Projects",
    title: "VTU Adda Projects",
    description: "Project kits, custom builds and mentoring for VTU engineering students",
  },
  twitter: {
    card: "summary_large_image",
    title: "VTU Adda Projects",
    description: "Project kits, custom builds and mentoring for VTU engineering students",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBFAF7",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getUserOrNull();

  const headerUser = authUser?.user?.email
    ? {
        email: authUser.user.email,
        displayName: authUser.profile?.display_name || null,
      }
    : null;

  return (
    <html
      lang="en-IN"
      className={`${sourceSerif.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased">
        <Header user={headerUser} />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
