import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SpotifyAuthProvider } from "@/context/SpotifyAuthContext";
import { SpotifyApiProvider } from "@/context/SpotifyApiContext";
import { ConvexClientProvider } from "@/components/provider/convex-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guess thier repeat",
  description: "Guess thier repeat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen`}
      >
        <ConvexClientProvider>
          <SpotifyAuthProvider>
            <SpotifyApiProvider>
              <Toaster position="bottom-center" />
              {children}
            </SpotifyApiProvider>
          </SpotifyAuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
