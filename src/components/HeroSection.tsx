"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Moon,
  Sun,
  Sparkles,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";

type GenderFilter = "male" | "female" | "all";

export function HeroSection() {
  const router = useRouter();
  const [selectedGender, setSelectedGender] = useState<GenderFilter>("male");
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Butona tıklandığında seçilen cinsiyet filtresine göre sayfadaki keşif alanına kaydırma veya rotaya yönlendirme
  const handleExplore = () => {
    if (typeof document !== "undefined") {
      const discoveryEl = document.getElementById("salonlari-kesfet");
      if (discoveryEl) {
        discoveryEl.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    const targetUrl = `/shops?gender=${selectedGender}`;
    router.push(targetUrl);
  };

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("light");
      document.documentElement.classList.toggle("dark");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#080b10] text-zinc-100 font-sans flex flex-col justify-between selection:bg-[#5ce1e6]/30 selection:text-white">
      {/* =========================================================================
          1. ARKA PLAN: SİBER KARELİ AĞ & NEON PARLAMALAR
      ========================================================================= */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* İnce Kareli Izgara (Grid) */}
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(92, 225, 230, 0.14) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(92, 225, 230, 0.14) 1px, transparent 1px)
            `,
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at 50% 45%, black 40%, transparent 85%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 40%, transparent 85%)",
          }}
        />

        {/* Üst Kenarlık */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5ce1e6]/30 to-transparent" />

        {/* Çok Katmanlı Neon Küre Parlamaları */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.18, 0.28, 0.18],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/4 h-[44rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(92,225,230,0.18)_0%,rgba(92,225,230,0.04)_50%,transparent_70%)] blur-3xl"
        />

        <motion.div
          animate={{
            scale: [1.05, 0.95, 1.05],
            opacity: [0.12, 0.22, 0.12],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[35%] top-[38%] h-[28rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,rgba(217,70,239,0.03)_50%,transparent_75%)] blur-3xl"
        />

        <div className="absolute left-[65%] top-[38%] h-[28rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.15)_0%,transparent_65%)] blur-3xl" />
      </div>

      {/* =========================================================================
          2. HEADER / NAVBAR
      ========================================================================= */}
      <header className="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        {/* Sol Üst: Logo ve İsim */}
        <Link href="/" className="group flex items-center gap-2.5 transition" aria-label="HairHub Ana Sayfa">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-zinc-800 to-zinc-950 shadow-[0_0_15px_rgba(255,255,255,0.08)] group-hover:border-[#5ce1e6]/60 group-hover:shadow-[0_0_18px_rgba(92,225,230,0.3)] transition"
          >
            <span className="font-bold text-lg tracking-wider text-white">H</span>
            <div className="absolute inset-0 rounded-full border border-[#5ce1e6]/25 group-hover:border-[#5ce1e6]/60 transition" />
          </motion.div>
          <span className="text-base font-semibold tracking-tight text-white group-hover:text-zinc-200 transition">
            HairHub
          </span>
        </Link>

        {/* Orta: Hap (Pill) Cinsiyet Filtre Butonları */}
        <div className="hidden md:flex items-center rounded-full border border-white/10 bg-zinc-900/60 p-1 backdrop-blur-md shadow-inner">
          {([
            { id: "male", label: "Erkek" },
            { id: "female", label: "Kadın" },
            { id: "all", label: "Tümü" },
          ] as const).map(({ id, label }) => {
            const isActive = selectedGender === id;
            return (
              <motion.button
                key={id}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setSelectedGender(id)}
                style={{
                  backgroundColor: isActive ? "#ffffff" : "transparent",
                  color: isActive ? "#000000" : "#a1a1aa",
                }}
                className={`relative rounded-full px-5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "!bg-white !text-black shadow-[0_2px_12px_rgba(255,255,255,0.3)]"
                    : "!bg-transparent !text-zinc-400 hover:!text-zinc-100"
                }`}
              >
                {label}
              </motion.button>
            );
          })}
        </div>

        {/* Sağ Üst: İşletme Hesabı, Üye Ol, Tema, Giriş */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/register/shop"
            className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/[0.03] px-3.5 text-xs font-medium text-zinc-300 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            İşletme hesabı oluştur
          </Link>

          <Link
            href="/register"
            className="inline-flex h-9 items-center rounded-full px-3 text-xs font-medium text-zinc-400 transition hover:text-white"
          >
            Üye ol
          </Link>

          {/* Karanlık/Aydınlık Mod Butonu */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Tema değiştir"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", color: "#d4d4d8" }}
            className="flex h-9 items-center gap-2 rounded-full border border-white/10 !bg-white/[0.04] px-2.5 !text-zinc-300 transition hover:border-white/20 hover:!text-white"
          >
            <Moon size={14} className={isDarkTheme ? "text-cyan-300" : "text-zinc-500"} />
            <span className="text-[10px] text-zinc-600">|</span>
            <Sun size={14} className={!isDarkTheme ? "text-amber-300" : "text-zinc-500"} />
          </button>

          {/* Giriş yap -> */}
          <Link
            href="/login"
            className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 text-xs font-medium text-zinc-200 backdrop-blur-sm transition hover:border-[#5ce1e6]/40 hover:bg-white/[0.09] hover:text-white"
          >
            Giriş yap
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5 text-zinc-400 group-hover:text-white" />
          </Link>
        </div>

        {/* Mobil Hamburger Butonu */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((p) => !p)}
            style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#fff" }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 !bg-white/[0.05] !text-white"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobil Açılır Menü */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden relative z-40 mx-5 rounded-2xl border border-white/10 bg-[#0d121a]/95 p-4 backdrop-blur-xl shadow-2xl flex flex-col gap-3"
        >
          <div className="flex items-center justify-around rounded-full border border-white/10 bg-zinc-900/80 p-1">
            {(["male", "female", "all"] as const).map((gender) => {
              const isActive = selectedGender === gender;
              return (
                <button
                  key={gender}
                  type="button"
                  onClick={() => setSelectedGender(gender)}
                  style={{
                    backgroundColor: isActive ? "#ffffff" : "transparent",
                    color: isActive ? "#000000" : "#a1a1aa",
                  }}
                  className={`flex-1 rounded-full py-1 text-center text-xs font-semibold ${
                    isActive ? "!bg-white !text-black shadow-sm" : "!bg-transparent !text-zinc-400"
                  }`}
                >
                  {gender === "male" ? "Erkek" : gender === "female" ? "Kadın" : "Tümü"}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <Link
              href="/register/shop"
              className="flex items-center justify-center h-9 rounded-lg border border-white/10 bg-white/[0.04] text-xs text-zinc-300"
            >
              İşletme hesabı
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center h-9 rounded-lg border border-[#5ce1e6]/30 bg-[#5ce1e6]/10 text-xs font-semibold text-[#5ce1e6]"
            >
              Giriş yap
            </Link>
          </div>
        </motion.div>
      )}

      {/* =========================================================================
          3. MERKEZİ ANİMASYONLU HOLOGRAFİK ALAN (GÖRSELLER KALDIRILDI, ANİMASYON KORUNDU)
      ========================================================================= */}
      <section className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-4 py-8 sm:py-12 lg:py-16">
        {/* Holografik Zemin Projektör Halkaları (Dönen & Parlayan Merkez Animasyonu) */}
        <div className="relative flex items-center justify-center w-full max-w-4xl h-[220px] sm:h-[280px] md:h-[320px] my-2 select-none pointer-events-none">
          {/* En Dıştaki Geniş Hologram Parlama Alanı */}
          <motion.div
            animate={{
              scale: [0.95, 1.1, 0.95],
              opacity: [0.35, 0.65, 0.35],
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-56 sm:h-72 w-[22rem] sm:w-[38rem] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(92,225,230,0.35)_0%,rgba(168,85,247,0.15)_45%,transparent_75%)] blur-2xl"
          />

          {/* Dönen Dış Neon Cyan Kesikli Halkası */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            className="absolute h-52 sm:h-64 w-[20rem] sm:w-[34rem] rounded-[100%] border border-cyan-400/40 border-dashed opacity-85 shadow-[0_0_40px_rgba(92,225,230,0.4)]"
          />

          {/* Ters Yönde Dönen İç Magenta/Mor Halka */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute h-36 sm:h-44 w-[15rem] sm:w-[26rem] rounded-[100%] border border-fuchsia-400/50 opacity-75 shadow-[0_0_30px_rgba(217,70,239,0.35)]"
          />

          {/* Merkezde Hızlı Dönen İnce Kesikli İvme Halkası */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute h-24 sm:h-30 w-[10rem] sm:w-[17rem] rounded-[100%] border border-cyan-300/50 border-dotted opacity-90 shadow-[0_0_20px_rgba(92,225,230,0.5)]"
          />

          {/* Zemin Yoğun Ritmik Işık Havuzu (Pulse / Glow) */}
          <motion.div
            animate={{
              scale: [0.9, 1.18, 0.9],
              opacity: [0.65, 0.95, 0.65],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-20 sm:h-28 w-44 sm:w-64 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(92,225,230,0.8)_0%,rgba(92,225,230,0.25)_55%,transparent_80%)] blur-lg"
          />

          {/* Merkez Hologram Çekirdeği (Işıltılı Nokta) */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-3 w-3 rounded-full bg-cyan-200 shadow-[0_0_20px_#5ce1e6,0_0_40px_#5ce1e6]"
          />
        </div>

        {/* =========================================================================
            4. ANA METİN & PARLAYAN KEŞFETMEYE BAŞLA BUTONU
        ========================================================================= */}
        <div className="relative z-20 mt-4 sm:mt-6 text-center max-w-4xl px-4 flex flex-col items-center">
          {/* Büyük Editoryal Başlık */}
          <h1 className="text-balance text-2xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] leading-[1.12]">
            <span className="block tracking-wider">GELECEĞİN BAKIMINI KEŞFET:</span>
            <span className="mt-1 block tracking-normal bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
              AKILLI RANDEVU VE SALON KEŞFİ
            </span>
          </h1>

          {/* Neon Cyan Parlayan Buton (#5ce1e6 + box-shadow: 0 0 30px rgba(92,225,230,0.8)) */}
          <div className="mt-6 sm:mt-8">
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleExplore}
              style={{
                backgroundColor: "#5ce1e6",
                color: "#080b10",
                boxShadow: "0 0 30px rgba(92, 225, 230, 0.8), 0 0 60px rgba(92, 225, 230, 0.35)",
              }}
              className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-3.5 text-sm sm:text-base font-bold !bg-[#5ce1e6] !text-[#080b10] transition-all duration-300 hover:!bg-[#4ee0e5] hover:shadow-[0_0_45px_rgba(92,225,230,0.95)] cursor-pointer"
            >
              <span>Keşfetmeye Başla</span>
              <Sparkles size={16} className="text-[#080b10] transition-transform group-hover:rotate-12" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. ALT ŞERİT (FOOTER)
      ========================================================================= */}
      <footer className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 text-xs text-zinc-500 sm:px-8 lg:px-12 border-t border-white/[0.04]">
        <div>
          <p>HairHub © 2026. Tüm hakları saklıdır.</p>
        </div>

        <div>
          <Link
            href="/support"
            className="flex items-center gap-1.5 transition hover:text-zinc-300 hover:underline underline-offset-4"
          >
            <HelpCircle size={13} className="text-zinc-500" />
            <span>Desteğe ihtiyacınız var mı?</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default HeroSection;
