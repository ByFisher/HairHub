"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Scissors, UserRound } from "lucide-react";
import { ErrorAlert, SkeletonRows } from "@/components/feedback/Skeleton";
import { useApiQuery } from "@/lib/use-api";
import type { Appointment } from "@/types/api";

const STATUS_LABEL: Record<Appointment["status"], string> = {
  pending: "Dükkan onayı bekleniyor",
  confirmed: "Randevu onaylandı",
  completed: "Randevu tamamlandı",
  cancelled: "Randevu iptal edildi",
  cancelled_by_shop: "Dükkan randevuyu iptal etti",
  no_show: "Randevuya gidilmedi",
};

const PAYMENT_STATUS_LABEL: Record<Appointment["payment"]["status"], string> = {
  unpaid: "Henüz ödeme alınmadı",
  pending: "Ödeme bekleniyor",
  paid: "Ödeme tamamlandı",
  failed: "Ödeme tamamlanamadı",
  refund_pending: "İade işleniyor",
  refunded: "Ödeme iade edildi",
  refund_failed: "İade tamamlanamadı",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "Dükkanda nakit",
  at_shop_card: "Dükkanda kart",
  demo: "Demo ödeme",
  iyzico_checkout_form: "iyzico güvenli ödeme",
};

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function AppointmentDetails({ appointmentId }: { appointmentId: string }) {
  const searchParams = useSearchParams();
  const query = useApiQuery<Appointment>(["/appointments/:appointmentId", appointmentId]);
  const appointment = query.data;
  const created = searchParams.get("created") === "1";
  const paymentResult = searchParams.get("payment");
  const address = appointment?.shop?.address;
  const location = address ? [address.district.name, address.district.city.name].filter(Boolean).join(", ") : "";

  if (query.isLoading) return <SkeletonRows rows={5} columns={2} />;

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <Link href="/my-appointments" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100">
        <ArrowLeft size={14} /> Randevularıma dön
      </Link>
      <ErrorAlert message={query.error} onRetry={query.refresh} />
      {!appointment ? (
        <p role="alert" className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400">
          Randevu bulunamadı veya bu randevuyu görüntüleme yetkiniz yok.
        </p>
      ) : (
        <>
          {created && <p role="status" className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-300">Randevunuz oluşturuldu. Dükkan onayladığında bildirim alacaksınız.</p>}
          {paymentResult === "success" && <p role="status" className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-300">Ödemeniz başarıyla tamamlandı.</p>}
          {paymentResult === "demo-success" && <p role="status" className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-300">Demo ödeme tamamlandı; gerçek tahsilat yapılmadı.</p>}
          {paymentResult === "failed" && <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-300">Ödeme tamamlanmadı. Randevu detaylarından durumunu kontrol edebilirsiniz.</p>}
          {paymentResult === "verification-pending" && <p role="status" className="rounded-lg border border-amber-900 bg-amber-950/30 p-3 text-xs text-amber-300">Ödeme sonucu doğrulanıyor.</p>}
          {paymentResult === "refunded" && <p role="status" className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-300">Ödeme randevunuza iade edildi.</p>}

          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 pb-5">
            <div>
              <p className="text-xs text-zinc-500">Randevu #{appointment.id}</p>
              <h1 className="mt-1 text-xl font-semibold text-zinc-100">{appointment.shop?.name ?? "Randevu detayları"}</h1>
            </div>
            <span className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200">
              {STATUS_LABEL[appointment.status]}
            </span>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center gap-2 text-zinc-300"><CalendarDays size={15} /><h2 className="text-xs font-medium">Tarih ve saat</h2></div>
              <p className="mt-3 text-sm text-zinc-100">{formatWhen(appointment.startsAt)}</p>
              <p className="mt-1 text-xs text-zinc-500">Bitiş: {new Intl.DateTimeFormat("tr-TR", { timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(appointment.endsAt))}</p>
            </article>
            <article className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center gap-2 text-zinc-300"><UserRound size={15} /><h2 className="text-xs font-medium">Personel</h2></div>
              <p className="mt-3 text-sm text-zinc-100">{appointment.staff ? `${appointment.staff.firstName} ${appointment.staff.lastName}` : "—"}</p>
              <p className="mt-1 text-xs text-zinc-500">{appointment.staff?.title ?? ""}</p>
            </article>
            <article className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:col-span-2">
              <div className="flex items-center gap-2 text-zinc-300"><MapPin size={15} /><h2 className="text-xs font-medium">Dükkan</h2></div>
              <p className="mt-3 text-sm text-zinc-100">{appointment.shop?.name ?? "—"}</p>
              {location && <p className="mt-1 text-xs text-zinc-500">{location}</p>}
              {appointment.shop && <Link href={`/shops/${encodeURIComponent(appointment.shop.id)}`} className="mt-3 inline-block text-xs text-zinc-300 underline decoration-zinc-700 underline-offset-4 hover:text-white">Dükkan bilgilerini görüntüle</Link>}
            </article>
          </div>

          <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center gap-2 text-zinc-300"><Scissors size={15} /><h2 className="text-xs font-medium">Hizmetler</h2></div>
            <ul className="mt-3 divide-y divide-zinc-800">
              {(appointment.services?.length ? appointment.services : appointment.service ? [appointment.service] : []).map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div><p className="text-sm text-zinc-200">{service.name}</p><p className="mt-1 text-xs text-zinc-500">{service.durationMinutes} dakika</p></div>
                  <p className="whitespace-nowrap text-sm text-zinc-200">{service.price.toLocaleString("tr-TR")} ₺</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-zinc-800 pt-3 text-xs">
              <div className="flex justify-between text-zinc-400"><span>Hizmetler toplamı</span><span>{(appointment.basePrice ?? appointment.totalPrice).toLocaleString("tr-TR")} ₺</span></div>
              {!!appointment.discountAmount && <div className="flex justify-between text-emerald-300"><span>İndirim</span><span>−{appointment.discountAmount.toLocaleString("tr-TR")} ₺</span></div>}
              <div className="flex justify-between border-t border-zinc-800 pt-3 text-sm font-semibold text-zinc-100"><span>Toplam</span><span>{appointment.totalPrice.toLocaleString("tr-TR")} ₺</span></div>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-xs font-medium text-zinc-300">Ödeme</h2>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-zinc-400">{appointment.payment.method ? PAYMENT_METHOD_LABEL[appointment.payment.method] ?? appointment.payment.method : "Ödeme yöntemi belirtilmedi"}</span>
              <span className="text-zinc-200">{PAYMENT_STATUS_LABEL[appointment.payment.status]}</span>
            </div>
            {appointment.payment.status === "refunded" && <p className="mt-2 text-xs text-zinc-500">İade tutarı: {appointment.payment.refundAmount.toLocaleString("tr-TR")} {appointment.payment.currency}</p>}
          </section>

          {appointment.note && <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"><h2 className="text-xs font-medium text-zinc-300">Randevu notu</h2><p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400">{appointment.note}</p></section>}
          {appointment.cancellationReason && <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"><h2 className="text-xs font-medium text-zinc-300">İptal nedeni</h2><p className="mt-2 text-sm text-zinc-400">{appointment.cancellationReason}</p></section>}
        </>
      )}
    </section>
  );
}