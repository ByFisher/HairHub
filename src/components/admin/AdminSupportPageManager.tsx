"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { ErrorAlert } from "@/components/feedback/Skeleton";
import { FormField, FormFieldset, FormInput, FormTextarea } from "@/components/ui/form";
import { currentUser } from "@/lib/auth";
import { adminApi, type SupportPageContent, type SupportPageFaq } from "@/lib/services";

const EMPTY_CONTENT: SupportPageContent = {
  title: "",
  introduction: "",
  message: "",
  support_email: "",
  support_phone: "",
  working_hours: "",
  faqs: [],
};

export function AdminSupportPageManager() {
  const [content, setContent] = useState(EMPTY_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    currentUser()
      .then((user) => {
        if (!active) return;
        if (user.role !== "super_admin") {
          setError("Destek sayfasını yalnızca Süper Admin düzenleyebilir.");
          return;
        }
        setIsAuthorized(true);
        return adminApi.supportPage().then(({ data }) => {
          if (!active) return;
          setContent({
            ...data,
            support_email: data.support_email ?? "",
            support_phone: data.support_phone ?? "",
            working_hours: data.working_hours ?? "",
          });
          setIsContentLoaded(true);
        });
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Destek sayfası yüklenemedi.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []);

  const updateField = <K extends keyof SupportPageContent>(key: K, value: SupportPageContent[K]) => {
    setContent((current) => ({ ...current, [key]: value }));
    setNotice("");
  };

  const updateFaq = (index: number, faq: SupportPageFaq) => {
    setContent((current) => ({
      ...current,
      faqs: current.faqs.map((item, itemIndex) => itemIndex === index ? faq : item),
    }));
    setNotice("");
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);

    try {
      const { data } = await adminApi.saveSupportPage({
        ...content,
        support_email: content.support_email?.trim() || null,
        support_phone: content.support_phone?.trim() || null,
        working_hours: content.working_hours?.trim() || null,
      });
      setContent({
        ...data,
        support_email: data.support_email ?? "",
        support_phone: data.support_phone ?? "",
        working_hours: data.working_hours ?? "",
      });
      setNotice("Destek sayfası kaydedildi ve ziyaretçilere yayınlandı.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Destek sayfası kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-100">Destek sayfası içeriği</h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            Burada kaydettiğiniz değişiklikler /support sayfasında hemen yayınlanır. Metin biçimlendirmesi güvenlik için düz metindir.
          </p>
        </div>
        <Link href="/support" target="_blank" className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900">
          Önizle <ExternalLink size={13} aria-hidden="true" />
        </Link>
      </div>

      {error && (
        <ErrorAlert message={error} />
      )}
      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-md border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-200">
          <CheckCircle2 size={15} aria-hidden="true" />{notice}
        </p>
      )}

      {isLoading ? (
        <p role="status" className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-xs text-zinc-500">Destek sayfası içeriği yükleniyor...</p>
      ) : isAuthorized && !isContentLoaded ? (
        <p role="alert" className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-xs text-zinc-400">İçerik güvenli biçimde kaydedilmiyor; sayfayı yenileyip tekrar deneyin.</p>
      ) : isAuthorized && (
        <form onSubmit={save} className="space-y-5">
          <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="text-sm font-medium text-zinc-200">Sayfa metinleri</h3>
            <FormFieldset className="grid gap-4">
              <FormField label="Başlık" description="Destek sayfasında görünen ana başlık.">
                <FormInput required maxLength={160} value={content.title} onChange={(event) => updateField("title", event.target.value)} />
              </FormField>
              <FormField label="Kısa açıklama" description="Başlığın altında gösterilir.">
                <FormTextarea required maxLength={2000} rows={3} value={content.introduction} onChange={(event) => updateField("introduction", event.target.value)} />
              </FormField>
              <FormField label="Destek mesajı" description="İletişim alanından önce gösterilir.">
                <FormTextarea required maxLength={5000} rows={4} value={content.message} onChange={(event) => updateField("message", event.target.value)} />
              </FormField>
            </FormFieldset>
          </section>

          <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="text-sm font-medium text-zinc-200">İletişim bilgileri</h3>
            <FormFieldset className="grid gap-4 sm:grid-cols-2">
              <FormField label="Destek e-postası" description="Boş bırakılırsa sayfada gösterilmez.">
                <FormInput type="email" maxLength={255} autoComplete="email" value={content.support_email ?? ""} onChange={(event) => updateField("support_email", event.target.value)} />
              </FormField>
              <FormField label="Telefon" description="Boş bırakılırsa sayfada gösterilmez.">
                <FormInput type="tel" maxLength={40} autoComplete="tel" value={content.support_phone ?? ""} onChange={(event) => updateField("support_phone", event.target.value)} />
              </FormField>
              <FormField label="Çalışma saatleri" description="Örn. Hafta içi 09.00–18.00">
                <FormInput maxLength={200} value={content.working_hours ?? ""} onChange={(event) => updateField("working_hours", event.target.value)} />
              </FormField>
            </FormFieldset>
          </section>

          <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-zinc-200">Sık sorulan sorular</h3>
                <p className="mt-1 text-xs text-zinc-500">En fazla 20 soru ekleyebilirsiniz.</p>
              </div>
              <button
                type="button"
                disabled={content.faqs.length >= 20}
                onClick={() => updateField("faqs", [...content.faqs, { question: "", answer: "" }])}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={14} aria-hidden="true" /> Soru ekle
              </button>
            </div>
            {content.faqs.length === 0 && <p className="text-xs text-zinc-500">Henüz soru eklenmedi.</p>}
            <div className="space-y-3">
              {content.faqs.map((faq, index) => (
                <fieldset key={index} className="grid gap-3 rounded-md border border-zinc-800 p-4 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-3">
                    <FormField label={`Soru ${index + 1}`} description="En fazla 200 karakter.">
                      <FormInput required maxLength={200} value={faq.question} onChange={(event) => updateFaq(index, { ...faq, question: event.target.value })} />
                    </FormField>
                    <FormField label="Yanıt" description="En fazla 2000 karakter.">
                      <FormTextarea required maxLength={2000} rows={3} value={faq.answer} onChange={(event) => updateFaq(index, { ...faq, answer: event.target.value })} />
                    </FormField>
                  </div>
                  <button
                    type="button"
                    aria-label={`Soru ${index + 1} sil`}
                    onClick={() => updateField("faqs", content.faqs.filter((_, itemIndex) => itemIndex !== index))}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-zinc-800 px-3 text-xs text-zinc-400 hover:border-rose-900 hover:text-rose-300 sm:self-start"
                  >
                    <Trash2 size={14} aria-hidden="true" /> Sil
                  </button>
                </fieldset>
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <button type="submit" disabled={isSaving || isLoading} className="inline-flex items-center gap-2 rounded-md bg-cyan-300 px-4 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">
              <Save size={14} aria-hidden="true" /> {isSaving ? "Kaydediliyor..." : "Değişiklikleri yayınla"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
