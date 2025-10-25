import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EcoRoute - Smart Route Planning for Sustainable Travel",
  description: "AI-powered route planning that optimizes for environmental impact. Find eco-friendly routes with real-time traffic analysis and sustainability insights.",
  keywords: ["eco route", "sustainable travel", "AI route planning", "environmental impact", "green transportation"],
  authors: [{ name: "EcoRoute Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#22c55e",
  openGraph: {
    title: "EcoRoute - Smart Route Planning",
    description: "AI-powered eco-friendly route planning for sustainable travel",
    url: "https://ecoroute.app",
    siteName: "EcoRoute",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EcoRoute - Smart Route Planning",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EcoRoute - Smart Route Planning",
    description: "AI-powered eco-friendly route planning for sustainable travel",
    images: ["/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-white text-gray-900 font-sans`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="min-h-screen relative overflow-hidden">
            {children}
          </div>
          <Toaster 
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: 'white',
                border: '1px solid #e5e7eb',
                color: '#374151',
              },
              className: 'font-sans',
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
