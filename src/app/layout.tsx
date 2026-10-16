import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, IBM_Plex_Mono } from "next/font/google";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { getUserOrNull } from "@/server/auth";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
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
  themeColor: "#4F46E5",
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
      className={`${plusJakartaSans.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-paper font-sans text-ink antialiased selection:bg-brand-600 selection:text-white">
        <Header user={headerUser} />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
