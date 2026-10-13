"use client";

import { Lottie } from "lottie-react";
import { useEffect, useState, type CSSProperties } from "react";

const animationPath = "/assets/xray_cybernetic_profile_lottie.json";

type HairHubXrayAnimationProps = {
  className?: string;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
};

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-l border-cyan-300/30 pl-2.5">
      <p className="text-[8px] font-medium uppercase tracking-[0.15em] text-cyan-100/55 sm:text-[9px]">
        {label}
      </p>
      <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-cyan-50 sm:text-xs">
        {value}
      </p>
      <p className="mt-0.5 hidden text-[8px] text-zinc-400 sm:block sm:text-[9px]">{detail}</p>
    </div>
  );
}

function HairFollicleIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 116"
      className="mx-auto h-[78px] w-full max-w-[132px] sm:h-[105px] sm:max-w-[148px]"
      fill="none"
    >
      <defs>
        <linearGradient id="follicle-root" x1="50" y1="39" x2="50" y2="106" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0abfc" stopOpacity=".75" />
          <stop offset=".48" stopColor="#67e8f9" stopOpacity=".48" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity=".15" />
        </linearGradient>
        <linearGradient id="follicle-scalp" x1="11" y1="37" x2="88" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" stopOpacity=".12" />
          <stop offset=".5" stopColor="#67e8f9" stopOpacity=".5" />
          <stop offset="1" stopColor="#d946ef" stopOpacity=".16" />
        </linearGradient>
      </defs>
      <path d="M12 37H88" stroke="url(#follicle-scalp)" strokeWidth="8" strokeLinecap="round" />
      <path d="M12 37H88" stroke="#a5f3fc" strokeOpacity=".8" strokeWidth="1" />
      <path d="M46 8C45 20 47 29 50 38C53 49 63 58 63 71C63 87 57 99 50 106C43 99 37 87 37 71C37 58 47 49 50 38" stroke="url(#follicle-root)" strokeWidth="2" />
      <path d="M44 44C39 56 32 64 34 78C35 89 41 98 50 106C59 98 65 89 66 78" stroke="#67e8f9" strokeOpacity=".65" strokeWidth="1" />
      <path d="M47 46V86M53 46V86M41 58H59M38 69H62M39 81H61M44 92H56" stroke="#a5f3fc" strokeOpacity=".46" strokeWidth=".8" />
      <path d="M49 38C47 29 45 20 46 8M51 38C53 27 53 18 51 10" stroke="#e879f9" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M41 76C44 72 47 72 50 76C53 80 56 80 59 76M42 86C45 82 48 82 51 86C54 90 57 90 60 86" stroke="#f0abfc" strokeOpacity=".85" strokeWidth="1.2" strokeDasharray="1 2" />
      <circle cx="50" cy="38" r="3" fill="#a5f3fc" />
      <circle cx="50" cy="38" r="6" stroke="#67e8f9" strokeOpacity=".32" />
      <circle cx="50" cy="38" r="5" stroke="#e879f9" strokeOpacity=".8" className="origin-center animate-ping" />
      <circle cx="45" cy="79" r="1.2" fill="#f0abfc" className="animate-pulse" />
      <circle cx="55" cy="85" r="1.2" fill="#67e8f9" className="animate-pulse" />
      <circle cx="49" cy="94" r="1" fill="#f0abfc" className="animate-pulse" />
      <path d="M19 47V55H29M81 47V55H71M50 110V115" stroke="#67e8f9" strokeOpacity=".6" strokeWidth=".8" />
      <circle cx="19" cy="47" r="1.5" fill="#67e8f9" />
    </svg>
  );
}

export function HairHubXrayAnimation({
  className = "",
  width = "100%",
  height = 360,
}: HairHubXrayAnimationProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnimation() {
      try {
        const response = await fetch(animationPath, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Animasyon dosyası yüklenemedi (HTTP ${response.status}).`);
        }

        const data: unknown = await response.json();
        if (typeof data !== "object" || data === null || Array.isArray(data)) {
          throw new Error("Animasyon dosyası geçerli bir Lottie JSON nesnesi değil.");
        }

        setAnimationData(data);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : "Animasyon yüklenirken bilinmeyen bir hata oluştu.");
      }
    }

    void loadAnimation();
    return () => controller.abort();
  }, []);

  return (
    <section
      aria-label="HairHub gelişmiş biyometrik tarama"
      className={`relative isolate flex flex-col overflow-hidden bg-[#050a12]/75 px-2 py-3 sm:px-4 sm:py-4 ${className}`}
      style={{ width, height }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_70%,rgba(8,145,178,0.19),transparent_42%),radial-gradient(ellipse_at_50%_48%,rgba(217,70,239,0.1),transparent_38%),linear-gradient(180deg,rgba(3,7,14,.15),rgba(3,7,14,.75))]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(103,232,249,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.13)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]"
      />

      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
        <div className="min-w-0">
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-100 sm:text-[10px] sm:tracking-[0.24em]">
            HairHub <span className="text-zinc-600">/</span> Gelişmiş biyometrik tarama
          </p>
          <p className="mt-0.5 text-[8px] uppercase tracking-[0.13em] text-zinc-500 sm:text-[9px]">
            Saç ve saç derisi analiz ediliyor
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-2 py-1 text-[7px] font-medium uppercase tracking-wider text-emerald-200/80 sm:text-[8px]">
          <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-300" />
          Örnek tarama
        </span>
      </header>

      <div className="relative grid min-h-0 flex-1 grid-cols-2 grid-rows-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 pt-1.5 md:grid-cols-[minmax(0,0.88fr)_minmax(250px,1.5fr)_minmax(0,0.88fr)] md:grid-rows-1 md:gap-2 md:pt-2">
        <div
          aria-label="Örnek tarama sonuçları: saç derisi pH 5,5; nem oranı yüzde 89; sebum normal, yüzde 2,1; saç dokusu orta, yüzde 19"
          className="z-20 order-2 flex min-w-0 flex-col justify-center gap-1.5 md:order-1 md:gap-3"
        >
          <p className="mb-0.5 text-[7px] uppercase tracking-[0.16em] text-cyan-100/45 md:text-[8px]">
            Tarama verileri <span className="text-zinc-600">·</span> örnek
          </p>
          <Metric label="Saç derisi pH" value="5,5" detail="Dengeli aralık" />
          <Metric label="Su dengesi" value="İyi · %89" detail="Nem oranı" />
          <Metric label="Sebum seviyesi" value="Normal · %2,1" detail="Yağ dengesi" />
          <Metric label="Saç dokusu" value="Orta · %19" detail="Tel profili" />
        </div>

        <div className="relative order-1 col-span-2 row-start-1 flex min-h-0 items-center justify-center md:order-2 md:col-span-1 md:row-start-auto">
          <div aria-hidden="true" className="absolute inset-x-[6%] inset-y-[2%] rounded-full border border-cyan-300/[0.14] shadow-[0_0_42px_rgba(34,211,238,0.08)]" />
          <div aria-hidden="true" className="absolute inset-x-[15%] inset-y-[10%] rounded-full border border-fuchsia-300/[0.12]" />
          {animationData ? (
            <>
              <Lottie
                src={animationData}
                autoplay
                loop
                className="relative z-0 h-[88%] w-full -translate-y-[4%] opacity-90"
                aria-label="Sibernetik profil animasyonu"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 360 320"
                className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
                fill="none"
              >
                <defs>
                  <clipPath id="scan-scalp-clip">
                    <path d="M151 115C144 96 155 77 174 73C193 69 204 82 207 97L220 112L211 118L214 124L207 131L204 142L193 151L190 166L177 173L164 181L157 192L201 192L205 177L193 151L179 149L164 139L155 128Z" />
                  </clipPath>
                  <linearGradient id="scan-heatmap" x1="155" y1="79" x2="207" y2="120" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a3e635" stopOpacity=".04" />
                    <stop offset=".5" stopColor="#bef264" stopOpacity=".56" />
                    <stop offset=".8" stopColor="#facc15" stopOpacity=".58" />
                    <stop offset="1" stopColor="#22d3ee" stopOpacity=".06" />
                  </linearGradient>
                  <linearGradient id="scan-mesh-glow" x1="151" y1="72" x2="211" y2="190" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#67e8f9" stopOpacity=".85" />
                    <stop offset=".48" stopColor="#22d3ee" stopOpacity=".72" />
                    <stop offset="1" stopColor="#e879f9" stopOpacity=".8" />
                  </linearGradient>
                  <radialGradient id="projector-beam" cx="0" cy="0" r="1" gradientTransform="matrix(0 120 -36 0 180 133)" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#67e8f9" stopOpacity=".22" />
                    <stop offset="1" stopColor="#67e8f9" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="projector-edge" x1="104" y1="270" x2="257" y2="299" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#67e8f9" stopOpacity=".08" />
                    <stop offset=".48" stopColor="#cffafe" stopOpacity=".85" />
                    <stop offset=".76" stopColor="#e879f9" stopOpacity=".8" />
                    <stop offset="1" stopColor="#d946ef" stopOpacity=".12" />
                  </linearGradient>
                </defs>
                <path d="M180 133L137 266H223L180 133Z" fill="url(#projector-beam)" />
                <path d="M151 115C144 96 155 77 174 73C193 69 204 82 207 97L220 112L211 118L214 124L207 131L204 142L193 151L190 166L177 173L164 181L157 192L201 192L205 177L193 151L179 149L164 139L155 128Z" fill="#07131c" fillOpacity=".16" clipPath="url(#scan-scalp-clip)" />
                <g clipPath="url(#scan-scalp-clip)" stroke="url(#scan-mesh-glow)" strokeOpacity=".68" strokeWidth=".7">
                  <path d="M139 82C160 91 192 92 226 81M138 93C160 102 194 102 228 91M136 105C161 113 196 113 230 102M135 117C161 125 196 124 232 114M136 130C162 136 194 136 231 127M139 143C162 149 191 149 228 141M145 157C165 162 188 161 219 155M151 171C170 174 189 173 211 168M155 184C173 185 190 184 205 181" />
                  <path d="M159 67C151 92 151 124 158 158C161 174 164 187 168 200M170 65C164 93 164 126 169 158C172 175 175 189 179 201M182 65C177 94 178 127 181 158C183 175 186 189 189 201M193 69C190 95 191 127 192 155C193 172 195 187 198 198M203 77C203 100 204 127 202 151C202 169 204 184 207 194" />
                </g>
                <path d="M145 78C158 64 172 57 187 59M190 58C207 64 217 77 222 94M137 95C127 119 130 144 141 160M218 91C233 115 230 143 218 161" stroke="#e879f9" strokeOpacity=".56" strokeWidth="1" strokeDasharray="2 5" />
                <path d="M134 113C143 94 153 78 168 69M224 112C215 91 205 76 192 66M142 152C158 163 192 166 214 151" stroke="#67e8f9" strokeOpacity=".44" strokeWidth=".7" />
                <circle cx="137" cy="95" r="1.4" fill="#f0abfc" className="animate-pulse" />
                <circle cx="222" cy="94" r="1.4" fill="#67e8f9" className="animate-pulse" />
                <path
                  d="M151 115C144 96 155 77 174 73C193 69 204 82 207 97L220 112L211 118L214 124L207 131L204 142L193 151L190 166L177 173L164 181L157 192L201 192L205 177L193 151L179 149L164 139L155 128Z"
                  stroke="url(#scan-mesh-glow)"
                  strokeWidth="1.2"
                />
                <path d="M153 84C167 66 194 67 207 86C213 94 215 106 211 114C195 108 180 102 164 106C157 101 152 93 153 84Z" fill="url(#scan-heatmap)" clipPath="url(#scan-scalp-clip)" />
                <path
                  d="M151 115C144 96 155 77 174 73C193 69 204 82 207 97L220 112L211 118L214 124L207 131L204 142L193 151"
                  stroke="#a5f3fc"
                  strokeOpacity=".9"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  clipPath="url(#scan-scalp-clip)"
                />
                <circle cx="202" cy="108" r="2" fill="#fde047" />
                <circle cx="202" cy="108" r="5" stroke="#fde047" strokeOpacity=".5" className="animate-pulse" />
                <g className="animate-pulse">
                  <ellipse cx="180" cy="267" rx="69" ry="13" stroke="url(#projector-edge)" strokeWidth="1.6" />
                  <ellipse cx="180" cy="267" rx="48" ry="8" stroke="#67e8f9" strokeOpacity=".44" strokeWidth=".8" />
                  <ellipse cx="180" cy="267" rx="25" ry="4" fill="#67e8f9" fillOpacity=".16" stroke="#a5f3fc" strokeOpacity=".85" />
                </g>
                <path d="M130 269L141 279H219L230 269L216 265H144L130 269Z" fill="#07121c" fillOpacity=".72" stroke="url(#projector-edge)" strokeWidth="1.2" />
                <path d="M143 278H217L211 284H149L143 278Z" fill="#0b1520" fillOpacity=".8" stroke="#67e8f9" strokeOpacity=".35" strokeWidth=".8" />
                <path d="M153 282H207" stroke="#e879f9" strokeOpacity=".8" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="180" cy="267" r="2" fill="#ecfeff" className="animate-ping" />
                <circle cx="124" cy="265" r="1.5" fill="#67e8f9" className="animate-pulse" />
                <circle cx="236" cy="264" r="1.5" fill="#e879f9" className="animate-pulse" />
              </svg>
            </>
          ) : error ? (
            <p role="alert" className="max-w-xs text-center text-[10px] leading-relaxed text-zinc-400">
              {error} Dosyayı <code className="text-zinc-200">public{animationPath}</code> konumuna ekleyin.
            </p>
          ) : (
            <p role="status" className="text-[10px] text-zinc-500">
              Simülasyon yükleniyor…
            </p>
          )}
        </div>

        <div className="z-20 order-3 flex min-w-0 flex-col justify-center gap-1 md:order-3 md:gap-2">
          <div className="flex items-center gap-2">
            <HairFollicleIllustration />
            <span className="hidden text-[7px] uppercase leading-relaxed tracking-[0.12em] text-cyan-100/45 sm:block md:hidden">
              Folikül<br />analizi
            </span>
          </div>
          <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-cyan-100/60 sm:text-[9px]">
            Saç derisi nemi <span className="text-cyan-50">%33</span>
          </p>
          <div className="h-px w-full bg-gradient-to-r from-cyan-300/35 to-transparent" />
          <p className="text-[7px] uppercase leading-relaxed tracking-[0.09em] text-zinc-400 sm:text-[8px]">
            Folikül sağlığı: <span className="text-emerald-200/85">iyi</span>
            <br />
            Yoğunluk: <span className="text-zinc-200">yüksek</span>
            <span className="mx-1 text-zinc-700">·</span>
            Kök gücü: <span className="text-zinc-200">yüksek</span>
          </p>
        </div>
      </div>
      <p className="sr-only">
        Gösterilen tarama metrikleri örnek amaçlıdır; gerçek bir ölçüm veya sağlık değerlendirmesi değildir.
      </p>
    </section>
  );
}
