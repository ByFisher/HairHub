"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { EmptyState, ErrorAlert, SkeletonCards } from "@/components/feedback/Skeleton";
import { ShopCard } from "@/components/user/ShopCard";
import { useAuth } from "@/components/providers/auth-provider";
import { useFavorites } from "@/components/user/use-favorites";
import { useApiQuery } from "@/lib/use-api";
import type { Shop } from "@/types/api";

export function FavoriteShops() {
  const { user } = useAuth();
  const favorites = useFavorites();
  const shops = useApiQuery<Shop[]>(["/user/favorite-shops", user?.id ?? "guest"], {
    enabled: user?.role === "customer",
    list: true,
  });

  const removeFavorite = async (shopId: string) => {
    if (await favorites.toggle(shopId)) shops.refresh();
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/10 bg-gradient-to-br from-rose-950/35 via-zinc-950 to-zinc-950 p-4 sm:p-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-200/15 bg-rose-400/10 text-rose-300">
            <Heart size={20} className="fill-rose-400/20" />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Favorilerim</h1>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">Kalp ile işaretlediğiniz salonlara buradan kolayca ulaşın.</p>
          </div>
        </div>
        {!shops.isLoading && (
          <span className="rounded-full border border-zinc-700/80 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300">
            {shops.data?.length ?? 0} salon
          </span>
        )}
      </div>

      <ErrorAlert message={shops.error || favorites.error} onRetry={shops.refresh} />
      {shops.isLoading ? (
        <SkeletonCards />
      ) : (shops.data ?? []).length === 0 ? (
        <div className="space-y-4">
          <EmptyState message="Henüz favori salonunuz yok. Salon kartlarındaki kalp düğmesine dokunarak favorilerinize ekleyebilirsiniz." />
          <div className="text-center">
            <Link href="/shops" className="inline-flex min-h-11 items-center rounded-lg bg-zinc-100 px-4 text-xs font-semibold text-zinc-950 transition hover:bg-white">
              Salonları keşfet
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shops.data?.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              isFavorite={favorites.has(shop.id)}
              favoritePending={favorites.pendingShopId === shop.id}
              onFavorite={() => void removeFavorite(shop.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
