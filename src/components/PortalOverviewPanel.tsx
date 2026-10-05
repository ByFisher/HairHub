"use client";

import { ErrorAlert, SkeletonRows } from "@/components/feedback/Skeleton";
import { useApiQuery } from "@/lib/use-api";

interface AdminOverview {
  customers: number;
  shops: { total: number; active: number; pending: number };
  appointments: { total: number; upcoming: number };
  pendingContent: number;
}

interface ShopOverview {
  shopName: string;
  appointments: { total: number; today: number; upcoming: number };
  customers: number;
  staff: number;
  services: number;
}

const numberFormat = new Intl.NumberFormat("tr-TR");

export function PortalOverviewPanel({ role }: { role: "admin" | "shop" }) {
  const path = role === "admin" ? "/admin/overview" : "/shop/overview";
  const query = useApiQuery<AdminOverview | ShopOverview>([path]);

  if (query.isLoading) return <SkeletonRows rows={2} columns={4} />;

  return (
    <section className="space-y-4">
      <ErrorAlert message={query.error} onRetry={query.refresh} />
      {role === "admin" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {query.data && "shops" in query.data && [
            { label: "Müşteri hesabı", value: query.data.customers, detail: "Toplam müşteri hesabı" },
            { label: "Onaylı dükkan", value: query.data.shops.active, detail: `${query.data.shops.total} toplam dükkan` },
            { label: "Onay bekleyen", value: query.data.shops.pending, detail: "Dükkan başvurusu" },
            { label: "Yaklaşan randevu", value: query.data.appointments.upcoming, detail: `${query.data.appointments.total} toplam randevu` },
            { label: "İçerik onayı", value: query.data.pendingContent, detail: "İnceleme bekliyor" },
          ].map((metric) => (
            <article key={metric.label} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">{numberFormat.format(metric.value)}</p>
              <p className="mt-1 text-[11px] text-zinc-500">{metric.detail}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {query.data && "shopName" in query.data && [
            { label: "Bugünkü randevu", value: query.data.appointments.today, detail: query.data.shopName },
            { label: "Yaklaşan randevu", value: query.data.appointments.upcoming, detail: `${query.data.appointments.total} toplam randevu` },
            { label: "Müşteri", value: query.data.customers, detail: "Randevusu bulunan müşteri" },
            { label: "Onaylı personel", value: query.data.staff, detail: "Dükkan kadrosu" },
            { label: "Aktif hizmet", value: query.data.services, detail: "Yayındaki hizmetler" },
          ].map((metric) => (
            <article key={metric.label} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">{numberFormat.format(metric.value)}</p>
              <p className="mt-1 text-[11px] text-zinc-500">{metric.detail}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}