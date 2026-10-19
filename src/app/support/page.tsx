"use client";

import Link from "next/link";
import { ArrowLeft, Clock3, Mail, Phone } from "lucide-react";
import { useApiQuery } from "@/lib/use-api";
import type { SupportPageContent } from "@/lib/services";

const DEFAULT_CONTENT: SupportPageContent = {
  title: "Size nasıl yardımcı olabiliriz?",
  introduction: "HairHub kullanımıyla ilgili yanıtları ve destek iletişim bilgilerini burada bulabilirsiniz.",
  message: "Destek iletişim bilgilerini ve sık sorulan soruları aşağıda bulabilirsiniz.",
  support_email: null,
  support_phone: null,
  working_hours: null,
  faqs: [
    {
      question: "Nasıl randevu alabilirim?",
      answer: "Salonları keşfedin, istediğiniz salonu ve hizmeti seçin; ardından uygun gün ve saati belirleyerek randevu talebinizi oluşturun.",
    },
    {
      question: "Randevularımı nereden görebilirim?",
      answer: "Hesabınıza giriş yaptıktan sonra randevularım sayfasından randevularınızı görüntüleyebilirsiniz.",
    },
    {
      question: "İşletmemi HairHub’a nasıl ekleyebilirim?",
      answer: "İşletme hesabı oluştur bağlantısından başvurunuzu gönderin. Başvurunuz yönetim ekibi tarafından incelenir.",
    },
  ],
};

export default function SupportPage() {
  const supportPage = useApiQuery<{ data: SupportPageContent }>(["/support-page"]);
  const content = supportPage.data?.data ?? DEFAULT_CONTENT;
  const hasContactDetails = content.support_email || content.support_phone || content.working_hours;

  return (
    <main className="min-h-screen bg-[#080b10] px-5 py-12 text-zinc-100 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-zinc-400 transition hover:text-white">
          <ArrowLeft size={14} aria-hidden="true" /> Ana sayfaya dön
        </Link>

        {supportPage.error && (
          <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-900/70 bg-amber-950/30 p-3 text-xs text-amber-200">
            <span>Güncel destek içeriği şu anda yüklenemedi. Varsayılan yardım bilgileri gösteriliyor.</span>
            <button type="button" onClick={supportPage.refresh} className="rounded border border-amber-800 px-2.5 py-1.5 hover:bg-amber-950/60">
              Yeniden dene
            </button>
          </div>
        )}

        <header className="mt-8 rounded-2xl border border-zinc-800 bg-[radial-gradient(ellipse_at_top_right,_rgba(92,225,230,0.14),_transparent_55%)] bg-zinc-950/90 p-6 shadow-2xl shadow-black/20 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300"><span className="font-brand">HairHub</span> Destek</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">{content.title}</h1>
          <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-7 text-zinc-300">{content.introduction}</p>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-white">Destek ekibimiz</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-300">{content.message}</p>

            {hasContactDetails ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {content.support_email && (
                  <a href={`mailto:${content.support_email}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-cyan-900">
                    <Mail size={18} className="shrink-0 text-cyan-300" aria-hidden="true" />
                    <span className="min-w-0"><span className="block text-[10px] uppercase tracking-wider text-zinc-500">E-posta</span><span className="mt-1 block truncate text-sm text-zinc-100">{content.support_email}</span></span>
                  </a>
                )}
                {content.support_phone && (
                  <a href={`tel:${content.support_phone.replace(/[^\d+]/g, "")}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-cyan-900">
                    <Phone size={18} className="shrink-0 text-cyan-300" aria-hidden="true" />
                    <span className="min-w-0"><span className="block text-[10px] uppercase tracking-wider text-zinc-500">Telefon</span><span className="mt-1 block truncate text-sm text-zinc-100">{content.support_phone}</span></span>
                  </a>
                )}
                {content.working_hours && (
                  <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 sm:col-span-2">
                    <Clock3 size={18} className="shrink-0 text-cyan-300" aria-hidden="true" />
                    <span><span className="block text-[10px] uppercase tracking-wider text-zinc-500">Çalışma saatleri</span><span className="mt-1 block text-sm text-zinc-100">{content.working_hours}</span></span>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-xs leading-6 text-zinc-400">
                İletişim bilgileri henüz yayınlanmadı. Sık sorulan sorular bölümüne göz atabilir veya hesabınızdan destek talebi oluşturabilirsiniz.
              </p>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-[#071016] transition hover:bg-cyan-200">
                Hesabına giriş yap
              </Link>
              <Link href="/register/shop" className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
                İşletme başvurusu
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Hızlı yardım</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Sık sorulan sorular</h2>
            {content.faqs.length ? (
              <div className="mt-5 divide-y divide-zinc-800">
                {content.faqs.map((faq, index) => (
                  <details key={`${faq.question}-${index}`} className="group py-4 first:pt-0 last:pb-0">
                    <summary className="cursor-pointer list-none pr-5 text-sm font-medium text-zinc-200 marker:hidden focus-visible:outline-2 focus-visible:outline-cyan-400">
                      <span className="flex items-start justify-between gap-3">
                        {faq.question}
                        <span aria-hidden="true" className="text-cyan-300 transition group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-3 whitespace-pre-line text-xs leading-6 text-zinc-400">{faq.answer}</p>
                  </details>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs text-zinc-500">Henüz sık sorulan soru eklenmedi.</p>
            )}
          </aside>
        </section>

        {supportPage.isLoading && <p role="status" className="mt-4 text-center text-[11px] text-zinc-600">Güncel destek bilgileri yükleniyor...</p>}
      </div>
    </main>
  );
}
