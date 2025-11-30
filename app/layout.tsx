import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
// Suppress Buffer deprecation warnings from third-party dependencies
import "@/lib/suppress-buffer-deprecation";

export const metadata: Metadata = {
  title: {
    default: "Kibble - Task Management",
    template: "%s | Kibble",
  },
  description: "A modern, full-stack task management application with class-based boards, intelligent alerts, and a beautiful Kanban interface",
  applicationName: "Kibble",
  keywords: ["task management", "kanban", "productivity", "education", "boards", "tasks"],
  authors: [{ name: "Kibble" }],
  creator: "Kibble",
  publisher: "Kibble",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  openGraph: {
    type: "website",
    siteName: "Kibble",
    title: "Kibble - Task Management",
    description: "A modern, full-stack task management application with class-based boards, intelligent alerts, and a beautiful Kanban interface",
  },
  twitter: {
    card: "summary",
    title: "Kibble - Task Management",
    description: "A modern, full-stack task management application with class-based boards, intelligent alerts, and a beautiful Kanban interface",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kibble",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#000000" },
    { media: "(prefers-color-scheme: dark)", color: "#FFFFFF" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
