import type { Metadata, Viewport } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SocketProvider } from "@/providers/SocketProvider";
import { VibeBackground } from "@/components/vibe/VibeBackground";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans" 
});

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "AmiSoul - Your Emotional Companion",
  description: "A safe harbor for your soul. Connect with Ami, your AI companion.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          roboto.variable
        )}
      >
        <SocketProvider>
          <VibeBackground />
          <main className="relative z-10 flex h-[100dvh] flex-col overflow-hidden">
            {children}
          </main>
        </SocketProvider>
      </body>
    </html>
  );
}
