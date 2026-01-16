import type { Metadata } from "next";
import { Crimson_Pro, JetBrains_Mono } from "next/font/google"; // Distinctive Typography
import "./globals.css";
import Header from "@/components/Header";
import SessionProvider from "@/providers/SessionProvider";

const serif = Crimson_Pro({
    subsets: ["latin"],
    variable: "--font-serif",
    weight: ["400", "600", "700"],
    display: "swap",
});

const mono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "SheetyCRM - Digital Workspace",
    description: "A tactile, paper-inspired CRM built on Google Sheets",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${serif.variable} ${mono.variable} antialiased font-serif`}>
                <SessionProvider>
                    <div className="min-h-screen flex flex-col bg-paper text-ink">
                        <Header />
                        <main className="flex-1 relative">
                            {children}
                        </main>
                    </div>
                </SessionProvider>
            </body>
        </html>
    );
}
