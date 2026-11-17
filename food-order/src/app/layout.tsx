import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import "./globals.css";

const display = Noto_Serif_TC({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
});

const body = Noto_Sans_TC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "茶記 Cha Kee · 港式點餐",
  description: "港式茶餐廳點餐：套餐、飲品、少冰少糖自選。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-HK"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
