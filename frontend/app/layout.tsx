// frontend/app/layout.tsx
import type { Metadata } from "next";
import { AuthProvider } from "./contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "EasyMenu - Digital Menu System",
  description: "Replace printed menus with a QR code. Update items, prices and photos anytime.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}