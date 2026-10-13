"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LocateFixed, X } from "lucide-react";
import { registerShopOwner } from "@/lib/auth";
import {
  invalidTaxNumberMessage,
  isValidTurkishTaxNumber,
  shopOwnerAccountSchema,
  shopOwnerRegistrationSchema,
} from "@/lib/auth-schemas";
import { useApiQuery } from "@/lib/use-api";
import { Combobox } from "@/components/ui/Combobox";
import { FormField, FormFieldset, FormInput, FormListbox, FormTextarea } from "@/components/ui/form";
import type { GenderTarget } from "@/types/api";

type ApplicationFields = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  shopName: string;
  city: string;
  district: string;
  genderType: GenderTarget;
  address: string;
  taxNumber: string;
  latitude: string;
  longitude: string;
};

const initialFields: ApplicationFields = {
  name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  shopName: "",
  city: "",
  district: "",
  genderType: "unisex",
  address: "",
  taxNumber: "",
  latitude: "",
  longitude: "",
};

const accountFields: {
  key: "name" | "email" | "phone" | "password" | "password_confirmation";
  label: string;
  type?: string;
  autoComplete?: string;
}[] = [
  { key: "name", label: "Ad soyad", autoComplete: "name" },
  { key: "email", label: "E-posta", type: "email", autoComplete: "email" },
  { key: "phone", label: "Telefon", type: "tel", autoComplete: "tel" },
  { key: "password", label: "Parola", type: "password", autoComplete: "new-password" },
  { key: "password_confirmation", label: "Parola tekrarı", type: "password", autoComplete: "new-password" },
];

export function ShopOwnerApplicationDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialFields);
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [taxNumberError, setTaxNumberError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const { data: cities = [], error: citiesError, isLoading: citiesLoading } = useApiQuery<string[]>(["/locations/cities"], { list: true });
  const { data: districts = [], error: districtsError, isLoading: districtsLoading } = useApiQuery<string[]>(
    ["/locations/districts", values.city],
    { list: true, enabled: Boolean(values.city), query: { city: values.city } },
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (step === 1) {
      const validatedAccount = shopOwnerAccountSchema.safeParse({
        fullName: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        passwordConfirmation: values.password_confirmation,
      });
      if (!validatedAccount.success) {
        setError(validatedAccount.error.issues[0]?.message ?? "Hesap bilgilerini kontrol edin.");
        return;
      }
      setStep(2);
      return;
    }

    const validated = shopOwnerRegistrationSchema.safeParse({
      fullName: values.name,
      email: values.email,
      password: values.password,
      passwordConfirmation: values.password_confirmation,
      shopName: values.shopName,
      phone: values.phone,
      city: values.city,
      district: values.district,
      genderType: values.genderType,
      address: values.address,
      taxNumber: values.taxNumber,
      latitude: values.latitude,
      longitude: values.longitude,
    });
    if (!validated.success) {
      const taxNumberIssue = validated.error.issues.find((issue) => issue.path[0] === "taxNumber");
      setTaxNumberError(taxNumberIssue?.message ?? "");
      setError(validated.error.issues[0]?.message ?? "İşletme bilgilerini kontrol edin.");
      return;
    }
    setTaxNumberError("");
    setIsSubmitting(true);

    try {
      await registerShopOwner({
        fullName: validated.data.fullName,
        email: validated.data.email,
        password: validated.data.password,
        shopName: validated.data.shopName,
        phone: validated.data.phone,
        city: validated.data.city,
        district: validated.data.district,
        genderType: validated.data.genderType,
        address: validated.data.address,
        taxNumber: validated.data.taxNumber,
        latitude: validated.data.latitude ? Number(validated.data.latitude) : null,
        longitude: validated.data.longitude ? Number(validated.data.longitude) : null,
      });
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
        router.push("/approval-pending");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Başvuru gönderilemedi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const captureLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Tarayıcınız konum almayı desteklemiyor. Koordinatları elle girebilirsiniz.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValues((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(7),
          longitude: coords.longitude.toFixed(7),
        }));
        setIsLocating(false);
      },
      (reason) => {
        const message = reason.code === reason.PERMISSION_DENIED
          ? "Konum izni verilmedi. Tarayıcı ayarlarından izin verin veya koordinatları elle girin."
          : reason.code === reason.TIMEOUT
            ? "Konum isteği zaman aşımına uğradı. Yeniden deneyin veya koordinatları elle girin."
            : "Konum belirlenemedi. Yeniden deneyin veya koordinatları elle girin.";
        setLocationError(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const latitude = Number(values.latitude);
  const longitude = Number(values.longitude);
  const mapUrl = values.latitude && values.longitude
    && Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
    ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onClose();
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="shop-application-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-left shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="shop-application-title" className="text-base font-semibold text-zinc-100">İşletmeni HairHub’a ekle</h2>
            <p className="mt-1 text-xs text-zinc-500">Başvurunuz Süper Admin onayına gönderilir.</p>
          </div>
          <button type="button" disabled={isSubmitting} onClick={onClose} aria-label="Formu kapat" className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50"><X size={18} /></button>
        </div>
        <ol aria-label="Başvuru adımları" className="mb-5 grid grid-cols-2 gap-2">
          {["Temel hesap bilgileri", "İşletme ve konum"].map((label, index) => {
            const stepNumber = index + 1;
            const isCurrent = step === stepNumber;
            return (
              <li key={label} aria-current={isCurrent ? "step" : undefined} className={`rounded-md border px-3 py-2 text-xs ${isCurrent ? "border-zinc-400 bg-zinc-900 text-zinc-100" : "border-zinc-800 text-zinc-500"}`}>
                <span className="mr-2">{stepNumber}.</span>{label}
              </li>
            );
          })}
        </ol>
        <form onSubmit={submit}>
          <FormFieldset className="grid gap-3 sm:grid-cols-2">
            {step === 1 ? (
              accountFields.map((field) => (
                <FormField key={field.key} label={field.label} description={field.key === "password" || field.key === "password_confirmation" ? "En az 12 karakter kullanın." : "Başvuru sahibi bilgilerinizi girin."}>
                  <FormInput
                    type={field.type ?? "text"}
                    required
                    minLength={field.key === "password" || field.key === "password_confirmation" ? 12 : undefined}
                    maxLength={field.key === "phone" ? 40 : field.key === "name" ? 120 : field.key === "password" || field.key === "password_confirmation" ? undefined : 255}
                    autoComplete={field.autoComplete}
                    value={values[field.key]}
                    onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                  />
                </FormField>
              ))
            ) : (
              <>
                <FormField label="Dükkan adı" description="Salonunuzun müşterilere gösterilecek adı.">
                  <FormInput required minLength={2} maxLength={120} value={values.shopName} onChange={(event) => setValues((current) => ({ ...current, shopName: event.target.value }))} />
                </FormField>
                <FormListbox
                  label="Hizmet verdiğiniz kitle"
                  description="İşletmeniz erkek, kadın veya tüm müşterilere hizmet verebilir."
                  value={values.genderType}
                  onChange={(genderType) => setValues((current) => ({ ...current, genderType: genderType || "unisex" }))}
                  clearable={false}
                  options={[
                    { value: "male", label: "Erkek" },
                    { value: "female", label: "Kadın" },
                    { value: "unisex", label: "Herkes (Unisex)" },
                  ]}
                />
                <Combobox
                  label="İl"
                  description="İşletmenizin bulunduğu ili seçin."
                  options={cities}
                  value={values.city}
                  onChange={(city) => setValues((current) => ({ ...current, city, district: "" }))}
                  placeholder={citiesLoading ? "İller yükleniyor..." : "İl seçin"}
                  searchPlaceholder="İl ara..."
                  disabled={citiesLoading || Boolean(citiesError)}
                />
                <Combobox
                  label="İlçe"
                  description="İşletmenizin bulunduğu ilçeyi seçin."
                  options={districts}
                  value={values.district}
                  onChange={(district) => setValues((current) => ({ ...current, district }))}
                  placeholder={!values.city ? "Önce il seçin" : districtsLoading ? "İlçeler yükleniyor..." : "İlçe seçin"}
                  searchPlaceholder="İlçe ara..."
                  disabled={!values.city || districtsLoading || Boolean(districtsError)}
                />
                <FormFieldset className="sm:col-span-2">
                  <FormField label="Açık adres" description="Sokağı, bina numarasını ve konumu tarif eden adresi yazın.">
                    <FormTextarea required minLength={5} maxLength={255} value={values.address} onChange={(event) => setValues((current) => ({ ...current, address: event.target.value }))} />
                  </FormField>
                </FormFieldset>
                <FormField label="Vergi kimlik no / TCKN" description="Başvuru için zorunludur; 10 haneli geçerli VKN veya 11 haneli TCKN girin.">
                  <FormInput
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    pattern="[0-9]{10,11}"
                    maxLength={11}
                    value={values.taxNumber}
                    aria-invalid={Boolean(taxNumberError)}
                    aria-describedby={taxNumberError ? "tax-number-error" : undefined}
                    onChange={(event) => {
                      const taxNumber = event.target.value.replace(/\D/g, "").slice(0, 11);
                      setValues((current) => ({ ...current, taxNumber }));
                      const hasInvalidVkn = taxNumber.length === 10 && !isValidTurkishTaxNumber(taxNumber);
                      setTaxNumberError(hasInvalidVkn ? invalidTaxNumberMessage : "");
                      if (!hasInvalidVkn) {
                        setError((current) => current === invalidTaxNumberMessage ? "" : current);
                      }
                    }}
                  />
                  {taxNumberError && <p id="tax-number-error" role="alert" className="mt-1 text-xs text-rose-300">{taxNumberError}</p>}
                </FormField>
                <FormFieldset className="sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-medium text-zinc-200">Konum pini</h3>
                      <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">GPS ile konum alın veya koordinatları elle girin. Konum isteğe bağlıdır.</p>
                    </div>
                    <button type="button" onClick={captureLocation} disabled={isLocating} className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-700 px-3 text-xs text-zinc-200 hover:bg-zinc-900 disabled:opacity-50">
                      <LocateFixed size={14} aria-hidden="true" />
                      {isLocating ? "Konum alınıyor..." : "GPS ile konum al"}
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <FormField label="Enlem" description="Örnek: 41.0082">
                      <FormInput type="number" step="any" min={-90} max={90} inputMode="decimal" value={values.latitude} onChange={(event) => { setLocationError(""); setValues((current) => ({ ...current, latitude: event.target.value })); }} />
                    </FormField>
                    <FormField label="Boylam" description="Örnek: 28.9784">
                      <FormInput type="number" step="any" min={-180} max={180} inputMode="decimal" value={values.longitude} onChange={(event) => { setLocationError(""); setValues((current) => ({ ...current, longitude: event.target.value })); }} />
                    </FormField>
                  </div>
                  {locationError && <p role="alert" className="mt-2 text-xs text-rose-300">{locationError}</p>}
                  {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-zinc-300 underline underline-offset-4 hover:text-white">Pini OpenStreetMap’te görüntüle</a>}
                </FormFieldset>
                {(citiesError || districtsError) && (
                  <p role="alert" className="text-xs text-rose-300 sm:col-span-2">{citiesError || districtsError}</p>
                )}
              </>
            )}
            {error && <p role="alert" className="rounded-md border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-300 sm:col-span-2">{error}</p>}
          </FormFieldset>
          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <div>
              {step === 1
                ? <button type="button" disabled={isSubmitting} onClick={onClose} className="h-10 rounded-md border border-zinc-800 px-4 text-xs text-zinc-300 disabled:opacity-50">Vazgeç</button>
                : <button type="button" disabled={isSubmitting} onClick={() => { setError(""); setStep(1); }} className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-800 px-4 text-xs text-zinc-300 disabled:opacity-50"><ArrowLeft size={14} aria-hidden="true" />Geri</button>}
            </div>
            <button type="submit" disabled={isSubmitting || (step === 2 && (Boolean(citiesError) || Boolean(districtsError)))} className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-100 px-4 text-xs font-medium text-zinc-950 disabled:opacity-50">
              {isSubmitting ? "Başvuru gönderiliyor..." : step === 1 ? <>İleri<ArrowRight size={14} aria-hidden="true" /></> : "Başvuruyu gönder"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
