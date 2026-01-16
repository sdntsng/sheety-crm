import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import SessionProvider from "@/providers/SessionProvider";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "SheetyCRM - Sales Pipeline powered by Google Sheets",
    description: "A modern CRM that uses Google Sheets as its database",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} antialiased`}>
                <SessionProvider>
                    <div className="min-h-screen flex flex-col">
                        <Header />
                        <main className="flex-1 bg-[var(--bg-paper)]">
                            {children}
                        </main>
                    </div>
                </SessionProvider>
            </body>
        </html>
    );
}
