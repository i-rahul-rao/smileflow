import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import TanStackProvider from "@/components/providers/TanStackProvider";
import { Toaster } from "sonner";
import { shadcn } from "@clerk/themes";

const robotoSans = Roboto({
  variable: "--font-roboto-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "SmileFlow - AI Powered Dental Assistant",
  description:
    "Get instant dental advice through voice calls with our AI assistant. Avaiable 24/7.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TanStackProvider>
      <ClerkProvider
        appearance={{
          theme: shadcn,
        }}
      >
        <html lang="en">
          <body
            className={`${robotoSans.variable} ${robotoMono.variable} antialiased dark`}
          >
            {/* this is done in the home page component */}
            {/* <UserSync /> */}
            <Toaster />
            {children}
          </body>
        </html>
      </ClerkProvider>
    </TanStackProvider>
  );
}
