import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { conferenceConfig } from "@/config/conference.config";
import { premiumFontVars } from "@/lib/fonts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://indiansportsmedicine.com"; // TODO: confirm actual domain

export const metadata: Metadata = {
  title: {
    default: `${conferenceConfig.shortName} - ${conferenceConfig.name}`,
    template: `%s | ${conferenceConfig.shortName}`,
  },
  description: `${conferenceConfig.name} — ${conferenceConfig.tagline}. ${conferenceConfig.venue.city}, September 5–6, 2026, with a post-conference workshop on September 7. Organized by the Telangana Association of Sports Medicine (TASM).`,
  keywords: [
    "TASMC 2026",
    "TASMC26",
    "Telangana Association of Sports Medicine Conference",
    "sports medicine conference India",
    "sports medicine Hyderabad",
    "Telangana Association of Sports Medicine",
    "TASM",
    "athlete health",
    "sports injury",
    "sports rehabilitation",
    "sports physiotherapy",
    "exercise science",
    "sports orthopaedics",
    "Hyderabad medical conference",
    "medical conference 2026",
  ],
  authors: [{ name: "Telangana Association of Sports Medicine (TASM)" }],
  creator: "PurpleHat Events",
  publisher: "Telangana Association of Sports Medicine (TASM)",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${conferenceConfig.shortName} - ${conferenceConfig.name}`,
    description: `${conferenceConfig.tagline}. Hyderabad, September 5–6, 2026. Post-conference workshop September 7. Organized by TASM.`,
    url: siteUrl,
    siteName: conferenceConfig.shortName,
    images: [
      {
        url: "/logos/ismc-og.png", // TODO: add OG image
        width: 1200,
        height: 630,
        alt: `${conferenceConfig.shortName} — Telangana Association of Sports Medicine Conference`,
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${conferenceConfig.shortName} - Telangana Association of Sports Medicine Conference`,
    description: `${conferenceConfig.tagline}. Hyderabad, September 5–6, 2026.`,
    images: ["/logos/ismc-og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Favicon is provided by app/icon.svg (TASMC monogram). ISSH favicons removed.
  verification: {
    // Add Google Search Console verification if available
    // google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: conferenceConfig.name,
    description: `${conferenceConfig.tagline}. Organized by the Telangana Association of Sports Medicine (TASM).`,
    startDate: "2026-09-05",
    endDate: "2026-09-06",
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: conferenceConfig.venue.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: conferenceConfig.venue.city,
        addressRegion: conferenceConfig.venue.state,
        addressCountry: "IN",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Telangana Association of Sports Medicine (TASM)",
      url: siteUrl,
    },
    image: `${siteUrl}/logos/ismc-og.png`,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/register`,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${premiumFontVars} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
