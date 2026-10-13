"use client";

import { useState } from "react";
import { adminApi } from "@/lib/services";
import { useApiMutation, useApiQuery } from "@/lib/use-api";
import { ErrorAlert } from "@/components/feedback/Skeleton";
import { FormListbox } from "@/components/ui/form";
import type { AdminShopServiceClassification as ServiceClassification, GenderTarget } from "@/types/api";

const TARGET_OPTIONS = [
  { value: "male", label: "Erkek" },
  { value: "female", label: "Kadın" },
  { value: "unisex", label: "Erkek ve kadın" },
] as const;

export function AdminShopServiceClassification({ shopId }: { shopId: string }) {
  const [expanded, setExpanded] = useState(false);
  const services = useApiQuery<ServiceClassification[]>(["/admin/shops/:shopId/services", shopId], {
    enabled: expanded,
    list: true,
  });
  const updateGender = useApiMutation<
    { serviceId: string; targetGender: GenderTarget },
    ServiceClassification
  >(({ serviceId, targetGender }) => adminApi.updateShopServiceGender(shopId, serviceId, targetGender));

  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="text-[10px] text-zinc-500 underline decoration-zinc-700 underline-offset-2 hover:text-zinc-300"
      >
        {expanded ? "Hizmet ayarlarını gizle" : "Hizmet hedef kitlelerini düzenle"}
      </button>
      {expanded && (
        <div className="mt-2 min-w-64 space-y-2 rounded border border-zinc-800 bg-zinc-900/60 p-2">
          <ErrorAlert message={services.error || updateGender.error} onRetry={services.refresh} />
          {services.isLoading ? (
            <p className="text-[10px] text-zinc-500">Hizmetler yükleniyor…</p>
          ) : services.data?.length ? (
            services.data.map((service) => (
              <div key={service.id} className="flex items-center justify-between gap-3">
                <span className="truncate text-[10px] text-zinc-300" title={service.name}>{service.name}</span>
                <FormListbox
                  label={`${service.name} hedef kitlesi`}
                  description="Hizmetin gösterileceği modları belirleyin."
                  value={service.targetGender}
                  onChange={async (targetGender) => {
                    if (targetGender && await updateGender.run({ serviceId: service.id, targetGender })) {
                      services.refresh();
                    }
                  }}
                  clearable={false}
                  options={TARGET_OPTIONS}
                  className="w-36 shrink-0"
                />
              </div>
            ))
          ) : (
            <p className="text-[10px] text-zinc-500">Bu dükkana ait hizmet bulunmuyor.</p>
          )}
        </div>
      )}
    </div>
  );
}