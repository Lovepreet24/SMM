import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SocialFlow | SMM Panel",
  description: "Your social media marketing dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
