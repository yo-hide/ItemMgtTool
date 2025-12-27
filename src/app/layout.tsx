import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "アイテム管理ツール",
  description: "アイテム管理ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
