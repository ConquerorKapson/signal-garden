import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Garden — A quiet space for daily reflection",
  description: "Plant one signal each day. Watch your patterns bloom over time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-screen" suppressHydrationWarning>
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
