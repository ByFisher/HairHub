"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { ErrorAlert, EmptyState, SkeletonRows } from "@/components/feedback/Skeleton";
import { FormField, FormFieldset, FormTextarea } from "@/components/ui/form";
import { submitSponsorApprovalRequest } from "@/lib/portal-api";
import { useApiQuery } from "@/lib/use-api";
import type { SponsorApprovalKind, SponsorApprovalRequest } from "@/types/portal";

const presets: Record<string, { kind: SponsorApprovalKind | "support"; title: string; placeholder: string }> = {
  campaigns: { kind: "campaign", title: "Reklam kampanyası talebi", placeholder: "Kampanya hedefinizi, süresini ve tanıtımını istediğiniz hizmeti açıklayın." },
  targeting: { kind: "targeting", title: "Bölge hedefleme talebi", placeholder: "Hedeflemek istediğiniz şehir, ilçe ve kitleyi açıklayın." },
  budget: { kind: "budget", title: "Bütçe talebi", placeholder: "Talep ettiğiniz bütçe ve kullanım amacını açıklayın." },
  billing: { kind: "support", title: "Fatura ve bakiye talebi", placeholder: "Fatura veya bakiye konusundaki talebinizi açıklayın." },
  support: { kind: "support", title: "Sponsor destek talebi", placeholder: "Hesap veya kampanya konusundaki destek ihtiyacınızı açıklayın." },
};

const statusStyles: Record<SponsorApprovalRequest["status"], string> = {
  "Onay Bekliyor": "border-amber-900 bg-amber-950/30 text-amber-300",
  Onaylandı: "border-emerald-900 bg-emerald-950/30 text-emerald-300",
  Reddedildi: "border-rose-900 bg-rose-950/30 text-rose-300",
  "Yanıt Bekliyor": "border-amber-900 bg-amber-950/30 text-amber-300",
  Yanıtlandı: "border-zinc-700 bg-zinc-900 text-zinc-300",
};

function kindLabel(kind: SponsorApprovalRequest["kind"]) {
  return { campaign: "Kampanya talebi", budget: "Bütçe talebi", targeting: "Hedefleme talebi", support: "Destek talebi" }[kind];
}

export function SponsorRequestsPanel({ section }: { section: string }) {
  const preset = presets[section];
  const [details, setDetails] = useState("");
  const [notice, setNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requests = useApiQuery<SponsorApprovalRequest[]>(["/sponsor/approval-requests"], { list: true });
  const items = requests.data ?? [];

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!preset) return;
    setIsSubmitting(true);
    setNotice("");
    setSubmitError("");
    try {
      await submitSponsorApprovalRequest({ kind: preset.kind, title: preset.title, details: details.trim() });
      setDetails("");
      setNotice("Talebiniz canlı sisteme kaydedildi ve yetkili ekibe iletildi.");
      requests.refresh();
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "Talep kaydedilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      {(section === "analytics" || section === "dashboard") && (
        <p className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs leading-5 text-zinc-400">
          Kampanya gösterim ve tıklama ölçümü henüz yapılandırılmadı. Bu alan gerçek kampanya performansı uydurmaz; yalnızca kayıtlı talep geçmişini gösterir.
        </p>
      )}
      {section === "billing" && (
        <p className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs leading-5 text-zinc-400">
          Sponsor fatura ve harcama kayıtları için canlı ödeme sağlayıcısı bağlı değil. Fatura verisi yerine yetkili ekibe gerçek bir talep gönderebilirsiniz.
        </p>
      )}
      {section === "campaigns" && (
        <p className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs leading-5 text-zinc-400">
          Bu form kampanya yayınlamaz; talebi canlı onay kuyruğuna kaydeder. Kampanya gösterimi, onay ve sağlayıcı entegrasyonu tamamlandıktan sonra açılır.
        </p>
      )}
      {preset && (
        <form onSubmit={submit} className="max-w-2xl rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <FormFieldset className="space-y-3">
            <FormField label="Açıklama" description="En az 8, en fazla 3000 karakter.">
              <FormTextarea required minLength={8} maxLength={3000} value={details} onChange={(event) => setDetails(event.target.value)} placeholder={preset.placeholder} />
            </FormField>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-950 disabled:opacity-50">
              <Send size={13} />{isSubmitting ? "Kaydediliyor..." : "Talebi ilet"}
            </button>
            {notice && <p role="status" className="text-xs text-emerald-400">{notice}</p>}
            {submitError && <p role="alert" className="text-xs text-rose-300">{submitError}</p>}
          </FormFieldset>
        </form>
      )}
      <ErrorAlert message={requests.error} onRetry={requests.refresh} />
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <h2 className="font-medium text-zinc-300">Canlı talep geçmişi</h2>
        <span>{items.length} kayıt</span>
      </div>
      {requests.isLoading ? <SkeletonRows rows={4} columns={4} /> : items.length === 0 ? (
        <EmptyState message="Henüz talep kaydı yok." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="bg-zinc-900/70 text-zinc-500"><tr>
              <th className="px-3 py-3 font-medium">Talep</th>
              <th className="px-3 py-3 font-medium">Açıklama</th>
              <th className="px-3 py-3 font-medium">Durum</th>
              <th className="px-3 py-3 font-medium">Tarih</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-800/70 bg-zinc-950">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-3 text-zinc-200">{item.title}<p className="mt-1 text-[10px] text-zinc-500">{kindLabel(item.kind)}</p></td>
                  <td className="max-w-md px-3 py-3 text-zinc-400">{item.details}</td>
                  <td className="px-3 py-3"><span className={`inline-flex rounded border px-2 py-1 text-[10px] ${statusStyles[item.status]}`}>{item.status}</span></td>
                  <td className="whitespace-nowrap px-3 py-3 text-zinc-500">{new Date(item.createdAt).toLocaleString("tr-TR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}