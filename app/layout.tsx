import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { NotificationProvider } from './components/ui/Notification';
import ClientNotesWrapper from './components/notepad/ClientNotesWrapper';

// 防止Font Awesome圖標閃爍
config.autoAddCss = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SwgER - 現代化Swagger UI",
  description: "一個高品質、現代化的Swagger UI替代品",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="trancy-zh-Hant">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <NotificationProvider>
          {children}
          <ClientNotesWrapper />
        </NotificationProvider>
      </body>
    </html>
  );
}
