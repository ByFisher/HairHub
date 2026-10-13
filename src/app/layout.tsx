import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SplashScreen } from "@/components/ui/splash-screen";
import { AuthProvider } from "@/components/providers/auth-provider";
import { GenderProvider } from "@/components/providers/gender-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HairHub | Sana uygun salon, kolay randevu",
  description: "Yakınındaki salonları keşfet, hizmetleri incele ve randevunu kolayca oluştur.",
  icons: { icon: "/hairhub.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#09090b] font-sans text-zinc-100">
        <GenderProvider>
          <ThemeProvider>
            <AuthProvider>
              <SplashScreen />
              {children}
            </AuthProvider>
          </ThemeProvider>
        </GenderProvider>
      </body>
    </html>
  );
}
