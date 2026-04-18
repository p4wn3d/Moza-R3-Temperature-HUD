import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moza HUD",
  description: "Lightweight Racing Telemetry Overlay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-transparent">{children}</body>
    </html>
  );
}
