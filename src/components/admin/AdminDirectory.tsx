"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { ADMIN_ENTITY_PATH, adminApi, type AdminDirectoryFilters } from "@/lib/services";
import { useApiMutation, useApiQuery } from "@/lib/use-api";
import { ErrorAlert, EmptyState, SkeletonRows } from "@/components/feedback/Skeleton";
import type { AdminProfessional, MaskedUser, Paginated, Shop, Sponsor } from "@/types/api";
import { FormField, FormFieldset, FormInput, FormListbox } from "@/components/ui/form";
import { AdminShopServiceClassification } from "@/components/admin/AdminShopServiceClassification";
import type { GenderTarget } from "@/types/api";

type View = keyof typeof ADMIN_ENTITY_PATH;
type UserDirectoryTab = "customers" | "hairdressers" | "barbers";

function listFromResponse<T>(response: T[] | Paginated<T> | undefined): T[] {
  if (!response) return [];
  return Array.isArray(response) ? response : response.data;
}

function detailText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? "—";
}

const VIEW_CONFIG: Record<View, { label: string; empty: string }> = {
  customers: { label: "Kullanıcılar (KVKK maskeli)", empty: "Kayıtlı kullanıcı yok." },
  shops: { label: "Dükkanlar", empty: "Kayıtlı dükkan yok." },
  sponsors: { label: "Sponsorlar", empty: "Kayıtlı sponsor yok." },
};

/** Süper Admin dizini: /admin/users, /admin/shops, /admin/sponsors uçlarından canlı veri. */
export function AdminDirectory({ view, initialStatus = "" }: { view: View; initialStatus?: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [filters, setFilters] = useState<AdminDirectoryFilters>({ perPage: 25, status: initialStatus || undefined });
  const [directoryTab, setDirectoryTab] = useState<UserDirectoryTab>("customers");
  const config = view === "shops" && initialStatus === "pending_approval"
    ? { label: "Bekleyen Dükkan Onayları", empty: "Onay bekleyen dükkan başvurusu yok." }
    : VIEW_CONFIG[view];
  const directoryConfig = directoryTab === "customers"
    ? { label: "Kullanıcılar (KVKK maskeli)", empty: "Kayıtlı kullanıcı yok." }
    : directoryTab === "hairdressers"
      ? { label: "Kuaförler", empty: "Kayıtlı kuaför yok." }
      : { label: "Berberler", empty: "Kayıtlı berber yok." };
  const entityPath = ADMIN_ENTITY_PATH[view];
  const userPath = "/admin/users";
  const shopPath = initialStatus === "pending_approval" ? "/admin/pending-approvals" : entityPath;

  const users = useApiQuery<MaskedUser[] | Paginated<MaskedUser>>([userPath, "admin", filters], {
    enabled: view === "customers" && directoryTab === "customers",
    query: { search: filters.search, status: filters.status, per_page: filters.perPage },
  });
  const shops = useApiQuery<Shop[] | Paginated<Shop>>([shopPath, "admin", filters], {
    enabled: view === "shops",
    query: initialStatus === "pending_approval"
      ? { search: filters.search, per_page: filters.perPage }
      : { search: filters.search, status: filters.status, city: filters.city, per_page: filters.perPage },
  });
  const professionals = useApiQuery<AdminProfessional[] | Paginated<AdminProfessional>>(
    ["/admin/shop-staff", directoryTab, "admin", filters],
    {
      enabled: view === "customers" && directoryTab !== "customers",
      query: {
        title: directoryTab === "hairdressers" ? "Kuaför" : "Berber",
        search: filters.search,
        status: filters.status,
        per_page: filters.perPage,
      },
    },
  );
  const sponsors = useApiQuery<Sponsor[] | Paginated<Sponsor>>([entityPath, "admin", filters], {
    enabled: view === "sponsors",
    query: { search: filters.search, status: filters.status, per_page: filters.perPage },
  });

  const setUserStatus = useApiMutation<{ id: string; status: "active" | "suspended" }, MaskedUser>((input) =>
    adminApi.setUserStatus(input.id, input.status),
  );
  const setShopStatus = useApiMutation<{ id: string; status: "active" | "suspended" }, Shop>((input) =>
    adminApi.setShopStatus(input.id, input.status),
  );
  const setShopGender = useApiMutation<{ id: string; genderType: GenderTarget }, Shop>((input) =>
    adminApi.updateShopGender(input.id, input.genderType),
  );

  const query = view === "customers"
    ? directoryTab === "customers" ? users : professionals
    : view === "shops" ? shops : sponsors;
  const userRecords = listFromResponse(users.data);
  const shopRecords = listFromResponse(shops.data);
  const sponsorRecords = listFromResponse(sponsors.data);
  const professionalRecords = listFromResponse(professionals.data);
  const recordCount = view === "customers"
    ? directoryTab === "customers" ? userRecords.length : professionalRecords.length
    : view === "shops" ? shopRecords.length : sponsorRecords.length;
  const isLoading = query.isLoading;
  const error = query.error;
  const sectionConfig = view === "customers" ? directoryConfig : config;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, search, status: status || undefined, page: 1 }));
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">{sectionConfig.label}</h2>
          <p className="mt-1 text-[11px] text-zinc-500">
            {isLoading ? "Yükleniyor…" : `${recordCount} kayıt listelendi`}
          </p>
        </div>
        {view === "customers" && directoryTab === "customers" && (
          <span className="inline-flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[10px] text-zinc-400">
            <Lock size={11} /> KVKK: ad, telefon ve e-posta maskeli
          </span>
        )}
      </div>

      {view === "customers" && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kullanıcı ve çalışan türü">
          {([
            ["customers", "Kullanıcılar"],
            ["hairdressers", "Kuaförler"],
            ["barbers", "Berberler"],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={directoryTab === tab}
              onClick={() => {
                setDirectoryTab(tab);
                setStatus("");
                setFilters((current) => ({ ...current, status: undefined, page: 1 }));
              }}
              className={`rounded-md border px-3 py-2 text-xs font-medium transition ${
                directoryTab === tab
                  ? "border-zinc-500 bg-zinc-100 text-zinc-950"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit}>
        <FormFieldset className="flex flex-wrap items-end gap-2">
        <FormField label="Kayıtlarda ara" description={directoryTab === "customers" ? "İsimle arayın." : "İsim veya salon adıyla arayın."}>
          <FormInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kayıtlarda ara..." className="sm:w-72" />
        </FormField>
        {initialStatus !== "pending_approval" && (
          <FormListbox
            label="Durum"
            description="Kayıtları hesaba ait duruma göre filtreleyin."
            value={status}
            onChange={setStatus}
            placeholder="Tüm durumlar"
            options={[
              ...(view === "customers" && directoryTab !== "customers"
                ? [
                    { value: "approved", label: "Onaylandı" },
                    { value: "pending_approval", label: "Onay bekliyor" },
                    { value: "rejected", label: "Reddedildi" },
                  ]
                : [
                    { value: "active", label: "Aktif" },
                    { value: "pending_approval", label: "Onay bekliyor" },
                    { value: "suspended", label: "Askıda" },
                  ]),
            ]}
            className="sm:w-56"
          />
        )}
        <button type="submit" className="h-9 rounded-md bg-zinc-100 px-4 text-xs font-medium text-zinc-950 hover:bg-white">
          Uygula
        </button>
        </FormFieldset>
      </form>

      <ErrorAlert message={error} onRetry={query.refresh} />
      {(setUserStatus.error || setShopStatus.error || setShopGender.error) && <ErrorAlert message={setUserStatus.error || setShopStatus.error || setShopGender.error} />}

      {isLoading ? (
        <SkeletonRows rows={5} columns={4} />
      ) : recordCount === 0 ? (
        <EmptyState message={sectionConfig.empty} />
      ) : view === "customers" && directoryTab !== "customers" ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {professionalRecords.map((person) => (
            <article key={person.id} className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-zinc-100">{person.firstName} {person.lastName}</h3>
                  <p className="mt-1 text-xs text-zinc-400">{person.shopName} · {person.shopDistrict}, {person.shopCity}</p>
                </div>
                <span className="rounded border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300">
                  {person.approvalStatus === "approved" ? "Onaylandı" : person.approvalStatus === "rejected" ? "Reddedildi" : "Onay bekliyor"}
                </span>
              </div>
              <dl className="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                <div><dt className="text-zinc-500">Unvan</dt><dd className="mt-0.5 text-zinc-200">{person.title}</dd></div>
                <div><dt className="text-zinc-500">Salon telefonu</dt><dd className="mt-0.5 text-zinc-200">{person.shopPhone}</dd></div>
                <div><dt className="text-zinc-500">Deneyim</dt><dd className="mt-0.5 text-zinc-200">{person.experienceYears} yıl</dd></div>
                <div><dt className="text-zinc-500">Müşteri puanı</dt><dd className="mt-0.5 text-zinc-200">{person.averageRating.toLocaleString("tr-TR")} / 5 ({person.reviewCount} değerlendirme)</dd></div>
                <div><dt className="text-zinc-500">Tamamlanan randevu</dt><dd className="mt-0.5 text-zinc-200">{person.completedAppointmentCount}</dd></div>
                <div><dt className="text-zinc-500">İşletme sahibi puanı</dt><dd className="mt-0.5 text-zinc-200">{person.ownerRating.toLocaleString("tr-TR")} / 5</dd></div>
              </dl>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">{person.biography || "Biyografi girilmemiş."}</p>
              <details className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                <summary className="cursor-pointer text-xs text-zinc-300">Tüm kayıt bilgileri</summary>
                <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                  <div><dt className="text-zinc-500">Personel / salon kayıt numarası</dt><dd className="mt-1 break-all text-zinc-300">{person.id} / {person.shopId}</dd></div>
                  <div><dt className="text-zinc-500">Kayıt tarihi</dt><dd className="mt-1 text-zinc-300">{new Date(person.createdAt).toLocaleString("tr-TR")}</dd></div>
                  <div><dt className="text-zinc-500">Fotoğraf bağlantısı</dt><dd className="mt-1 break-all text-zinc-300">{person.photoUrl || "—"}</dd></div>
                  <div><dt className="text-zinc-500">Onay durumu</dt><dd className="mt-1 text-zinc-300">{person.approvalStatus} · {person.isApproved ? "Onaylı" : "Onaysız"}</dd></div>
                  <div><dt className="text-zinc-500">Müşteri puanları</dt><dd className="mt-1 text-zinc-300">{detailText(person.customerRatings)}</dd></div>
                  <div><dt className="text-zinc-500">Uzmanlıklar</dt><dd className="mt-1 whitespace-pre-wrap text-zinc-300">{detailText(person.skills)}</dd></div>
                  <div><dt className="text-zinc-500">Çalışma saatleri</dt><dd className="mt-1 whitespace-pre-wrap text-zinc-300">{detailText(person.workingHours)}</dd></div>
                  <div><dt className="text-zinc-500">İş kayıtları</dt><dd className="mt-1 whitespace-pre-wrap text-zinc-300">{detailText(person.workLogs)}</dd></div>
                </dl>
              </details>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
          <table className={`w-full ${view === "shops" ? "min-w-[920px]" : "min-w-[640px]"} text-left text-xs`}>
            <thead className="bg-zinc-900/60 text-zinc-500">
              <tr>
                <th className="px-3 py-3 font-medium">Kayıt</th>
                <th className="px-3 py-3 font-medium">İletişim</th>
                {view === "shops" && <th className="px-3 py-3 font-medium">Hedef kitle</th>}
                <th className="px-3 py-3 font-medium">Durum</th>
                <th className="px-3 py-3 text-right font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 bg-zinc-950">
              {view === "customers" &&
                userRecords.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-3 text-zinc-200">
                      {user.firstName} {user.maskedSurname}
                      <p className="mt-0.5 text-[10px] text-zinc-600">{user.role} · {new Date(user.createdAt).toLocaleDateString("tr-TR")}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">
                      {user.maskedPhone}
                      <p className="mt-0.5 text-[10px] text-zinc-600">{user.maskedEmail}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">{user.status}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        disabled={setUserStatus.isPending}
                        onClick={async () => {
                          if (await setUserStatus.run({ id: user.id, status: user.status === "active" ? "suspended" : "active" })) {
                            users.refresh();
                          }
                        }}
                        className="rounded border border-zinc-800 px-2.5 py-1.5 text-[11px] text-zinc-300 hover:bg-zinc-900 disabled:opacity-50"
                      >
                        {user.status === "active" ? "Askıya al" : "Aktifleştir"}
                      </button>
                    </td>
                  </tr>
                ))}

              {view === "shops" &&
                shopRecords.map((shop) => (
                  <tr key={shop.id}>
                    <td className="px-3 py-3 text-zinc-200">
                      <p>{shop.name}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-600">{shop.address.district.name} / {shop.address.district.city.name}</p>
                      <AdminShopServiceClassification shopId={shop.id} />
                    </td>
                    <td className="px-3 py-3 text-zinc-400">{shop.phone}</td>
                    <td className="px-3 py-3">
                      <FormListbox
                        label={`${shop.name} hedef kitlesi`}
                        description="Bu salonun hangi modlarda listeleneceğini ayarlayın."
                        value={shop.genderType}
                        onChange={async (genderType) => {
                          if (genderType && await setShopGender.run({ id: shop.id, genderType })) shops.refresh();
                        }}
                        clearable={false}
                        options={[
                          { value: "male", label: "Erkek" },
                          { value: "female", label: "Kadın" },
                          { value: "unisex", label: "Erkek ve kadın" },
                        ]}
                        className="min-w-40"
                      />
                    </td>
                    <td className="px-3 py-3 text-zinc-400">{shop.status}</td>
                    <td className="px-3 py-3 text-right text-[11px] text-zinc-500">
                      {shop.status === "pending_approval" || shop.status === "suspended" ? (
                        <button
                          type="button"
                          disabled={setShopStatus.isPending}
                          onClick={async () => {
                            if (await setShopStatus.run({ id: shop.id, status: "active" })) shops.refresh();
                          }}
                          className="rounded border border-emerald-900 px-2.5 py-1.5 text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-50"
                        >
                          Onayla / aktifleştir
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={setShopStatus.isPending}
                          onClick={async () => {
                            if (await setShopStatus.run({ id: shop.id, status: "suspended" })) shops.refresh();
                          }}
                          className="rounded border border-rose-900 px-2.5 py-1.5 text-rose-300 hover:bg-rose-950/40 disabled:opacity-50"
                        >
                          Askıya al
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

              {view === "sponsors" &&
                sponsorRecords.map((sponsor) => (
                  <tr key={sponsor.id}>
                    <td className="px-3 py-3 text-zinc-200">
                      {sponsor.companyName}
                      <p className="mt-0.5 text-[10px] text-zinc-600">{sponsor.contactName}</p>
                    </td>
                    <td className="px-3 py-3 text-zinc-400">{sponsor.email}</td>
                    <td className="px-3 py-3 text-zinc-400">{sponsor.status}</td>
                    <td className="px-3 py-3 text-right text-[11px] text-zinc-300">
                      {sponsor.dailyBudget.toLocaleString("tr-TR")} ₺ / gün
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
