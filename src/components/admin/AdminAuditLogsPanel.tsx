"use client";

import { useState } from "react";
import { ErrorAlert, EmptyState, SkeletonRows } from "@/components/feedback/Skeleton";
import { FormField, FormFieldset, FormInput } from "@/components/ui/form";
import { useApiQuery } from "@/lib/use-api";
import type { Paginated } from "@/types/api";

interface AuditLog {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  action: string;
  subjectType: string;
  subjectId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function AdminAuditLogsPanel() {
  const [actionDraft, setActionDraft] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const result = useApiQuery<Paginated<AuditLog>>(["/admin/audit-logs", action, page], {
    query: { action, page, per_page: 50 },
  });
  const rows = result.data?.data ?? [];
  const meta = result.data?.meta;

  return (
    <section className="space-y-4">
      <form onSubmit={(event) => { event.preventDefault(); setAction(actionDraft.trim()); setPage(1); }} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <FormFieldset className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
          <FormField label="İşlem türü" description="Audit action adına göre filtrele.">
            <FormInput value={actionDraft} onChange={(event) => setActionDraft(event.target.value)} placeholder="ör. admin.user_status_changed" />
          </FormField>
          <button type="submit" className="h-10 rounded-md bg-zinc-100 px-4 text-xs font-semibold text-zinc-950">Filtrele</button>
        </FormFieldset>
      </form>
      <ErrorAlert message={result.error} onRetry={result.refresh} />
      {meta && <p className="text-xs text-zinc-500">{meta.total.toLocaleString("tr-TR")} kayıt</p>}
      {result.isLoading ? <SkeletonRows rows={5} columns={5} /> : rows.length === 0 ? <EmptyState message="Audit kaydı bulunamadı." /> : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead className="bg-zinc-900/70 text-zinc-500"><tr>
              <th className="px-3 py-3 font-medium">Tarih</th>
              <th className="px-3 py-3 font-medium">İşlemi yapan</th>
              <th className="px-3 py-3 font-medium">Eylem</th>
              <th className="px-3 py-3 font-medium">Kayıt</th>
              <th className="px-3 py-3 font-medium">Ayrıntı</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-800/70 bg-zinc-950">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-3 py-3 text-zinc-400">{new Date(row.createdAt).toLocaleString("tr-TR")}</td>
                  <td className="px-3 py-3 text-zinc-300">{row.actorName ?? `Kullanıcı #${row.actorUserId ?? "—"}`}</td>
                  <td className="px-3 py-3 font-mono text-zinc-200">{row.action}</td>
                  <td className="px-3 py-3 text-zinc-400">{row.subjectType.split("\\").at(-1)} #{row.subjectId ?? "—"}</td>
                  <td className="max-w-sm px-3 py-3 font-mono text-[10px] text-zinc-500">{row.metadata ? JSON.stringify(row.metadata) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && meta.lastPage > 1 && (
        <nav aria-label="Audit kayıt sayfaları" className="flex items-center justify-between text-xs text-zinc-400">
          <span>Sayfa {page} / {meta.lastPage}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded border border-zinc-800 px-3 py-2 disabled:opacity-40">Önceki</button>
            <button type="button" disabled={page >= meta.lastPage} onClick={() => setPage((value) => value + 1)} className="rounded border border-zinc-800 px-3 py-2 disabled:opacity-40">Sonraki</button>
          </div>
        </nav>
      )}
    </section>
  );
}