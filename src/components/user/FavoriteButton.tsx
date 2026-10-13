"use client";

import { Heart } from "lucide-react";

export function FavoriteButton({
  isFavorite,
  isPending,
  onClick,
}: {
  isFavorite: boolean;
  isPending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={isFavorite}
      disabled={isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300 disabled:cursor-wait disabled:opacity-60 ${
        isFavorite
          ? "border-rose-300/40 bg-rose-950/85 text-rose-300 shadow-[0_8px_24px_rgba(244,63,94,0.2)] hover:border-rose-200/60 hover:bg-rose-900/90"
          : "border-white/20 bg-zinc-950/65 text-white shadow-lg hover:scale-105 hover:border-white/40 hover:bg-zinc-900/90 hover:text-rose-200 active:scale-95"
      }`}
    >
      <Heart
        size={19}
        strokeWidth={1.8}
        className={`transition-transform duration-200 ${isFavorite ? "scale-105 fill-rose-400 text-rose-300" : ""}`}
      />
    </button>
  );
}
