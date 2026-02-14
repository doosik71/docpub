// import type { Metadata } from "next"; // TypeScript 구문 제거
// import { Geist, Geist_Mono } from "next/font/google"; // Geist 폰트 관련 코드 제거
import "./globals.css";

// Geist 폰트 관련 변수 선언 제거
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata = { // Metadata 타입 제거
  title: "docpub - Collaborative XML Editor",
  description: "Open-source Collaborative XML DTP",
};

export default function RootLayout({
  children,
}) { // Readonly<{ children: React.ReactNode; }> 타입 제거
  return (
    <html lang="en">
      <body /* className={`${geistSans.variable} ${geistMono.variable} antialiased`} */ > {/* Geist 폰트 클래스 제거 */}
        {children}
      </body>
    </html>
  );
}
