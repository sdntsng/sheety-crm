import type { Metadata } from "next";
import { Outfit, JetBrains_Mono, Playfair_Display } from "next/font/google"; // Distinctive Geometric Sans + Editorial Serif
import "./globals.css";
import Header from "@/components/Header";
import SessionProvider from "@/providers/SessionProvider";
import PostHogProvider from "@/providers/PostHogProvider";
import PostHogPageView from "@/components/PostHogPageView";
import Footer from "@/components/Footer";
import { Suspense } from "react";

const sans = Outfit({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const mono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

const serif = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-serif",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Sheety - Digital CRM Workspace",
    description: "A tactile, paper-inspired CRM built on Google Sheets",
    icons: {
        icon: "/icon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${sans.variable} ${mono.variable} ${serif.variable} antialiased font-sans`}>
                <PostHogProvider>
                    <Suspense fallback={null}>
                        <PostHogPageView />
                    </Suspense>
                    <SessionProvider>
                        <div className="min-h-screen flex flex-col bg-paper text-ink">
                            <Header />
                            <main className="flex-1 relative">
                                {children}
                            </main>
                            <Footer />
                        </div>
                    </SessionProvider>
                </PostHogProvider>
            </body>
        </html>
    );
}
