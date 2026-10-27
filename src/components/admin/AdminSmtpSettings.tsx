"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Mail, Save, Send } from "lucide-react";
import { ErrorAlert } from "@/components/feedback/Skeleton";
import { FormField, FormFieldset, FormInput } from "@/components/ui/form";
import { currentUser } from "@/lib/auth";
import { adminApi, type SmtpSettingsInput } from "@/lib/services";

type SmtpDraft = Omit<SmtpSettingsInput, "smtp_host" | "smtp_port" | "smtp_username" | "smtp_encryption"> & {
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_encryption: "tls" | "ssl" | "none" | "";
};

const EMPTY_SETTINGS: SmtpDraft = {
  sender_name: "",
  sender_email: "",
  smtp_mailer: "smtp",
  smtp_host: "",
  smtp_port: "",
  smtp_username: "",
  smtp_password: "",
  smtp_encryption: "",
};

export function AdminSmtpSettings() {
  const [savedSettings, setSavedSettings] = useState<SmtpDraft | null>(null);
  const [draft, setDraft] = useState<SmtpDraft>(EMPTY_SETTINGS);
  const [hasSavedPassword, setHasSavedPassword] = useState(false);
  const [isPersisted, setIsPersisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [smtpError, setSmtpError] = useState("");
  const [notice, setNotice] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testSubject, setTestSubject] = useState("HairHub test e-postası");
  const [testMessage, setTestMessage] = useState("Bu ileti, yönetim panelindeki e-posta ayarlarını test etmek için gönderildi.");

  useEffect(() => {
    let active = true;
    currentUser()
      .then((user) => {
        if (!active) return;
        if (user.role !== "super_admin") {
          setSmtpError("Bu alanı yalnızca Süper Admin kullanabilir.");
          return;
        }
        setIsAuthorized(true);
        return adminApi.smtpSettings().then(({ data }) => {
          if (!active || !data) return;
          const values: SmtpDraft = {
            sender_name: data.sender_name,
            sender_email: data.sender_email,
            smtp_mailer: data.smtp_mailer,
            smtp_host: data.smtp_host ?? "",
            smtp_port: data.smtp_port === null ? "" : String(data.smtp_port),
            smtp_username: data.smtp_username ?? "",
            smtp_password: "",
            smtp_encryption: data.smtp_encryption ?? "",
          };
          setSavedSettings(values);
          setDraft(values);
          setHasSavedPassword(data.has_password);
          setIsPersisted(data.source === "database");
        });
      })
      .catch((reason: unknown) => {
        if (active) setSmtpError(reason instanceof Error ? reason.message : "E-posta ayarları yüklenemedi.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, []);

  const updateField = <K extends keyof SmtpDraft>(key: K, value: SmtpDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice("");
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSmtpError("");
    setNotice("");
    setIsSaving(true);

    try {
      const result = await adminApi.saveSmtpSettings({
        ...draft,
        smtp_host: draft.smtp_mailer === "smtp" ? draft.smtp_host : null,
        smtp_port: draft.smtp_mailer === "smtp" ? Number(draft.smtp_port) : null,
        smtp_username: draft.smtp_mailer === "smtp" ? draft.smtp_username : null,
        smtp_encryption: draft.smtp_mailer === "smtp" ? draft.smtp_encryption || null : null,
      });
      const saved: SmtpDraft = { ...draft, smtp_password: "" };
      setSavedSettings(saved);
      setDraft(saved);
      setHasSavedPassword(result.data.has_password);
      setIsPersisted(true);
      setNotice("E-posta ayarları kaydedildi.");
    } catch (reason) {
      setSmtpError(reason instanceof Error ? reason.message : "E-posta ayarları kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const sendTest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSmtpError("");
    setNotice("");

    if (!isPersisted || !hasSavedPassword) {
      setSmtpError("Test e-postası göndermeden önce e-posta ayarlarını kaydedin.");
      return;
    }

    setIsSendingTest(true);
    try {
      const result = await adminApi.sendSmtpTestEmail({
        email: testEmail,
        subject: testSubject,
        message: testMessage,
      });
      setNotice(result.message);
    } catch (reason) {
      setSmtpError(reason instanceof Error ? reason.message : "Test e-postası gönderilemedi.");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-sm font-medium text-zinc-100">E-posta gönderim ayarları</h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          SMTP veya Resend HTTPS API üzerinden gönderim yapın. Saklanan parola ya da API anahtarı gösterilmez; boş bırakırsanız mevcut gizli bilgi korunur.
        </p>
      </div>

      {smtpError && <ErrorAlert message={smtpError} />}
      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-md border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-200">
          <CheckCircle2 size={15} aria-hidden="true" />{notice}
        </p>
      )}

      {isAuthorized && <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={save} className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-zinc-400" aria-hidden="true" />
            <h3 className="text-sm font-medium text-zinc-200">E-posta sağlayıcısı</h3>
          </div>
          {isLoading ? (
            <p className="text-xs text-zinc-500">Ayarlar yükleniyor...</p>
          ) : (
            <FormFieldset className="grid gap-3 sm:grid-cols-2">
              <FormField label="Gönderen adı" description="Alıcıda görünecek isim.">
                <FormInput required maxLength={120} autoComplete="organization" value={draft.sender_name} onChange={(event) => updateField("sender_name", event.target.value)} />
              </FormField>
              <FormField label="Gönderen e-posta" description="E-posta göndermeye yetkili adres.">
                <FormInput required type="email" maxLength={255} autoComplete="email" value={draft.sender_email} onChange={(event) => updateField("sender_email", event.target.value)} />
              </FormField>
              <FormField label="Gönderim yöntemi" description="Render Free için Resend HTTPS API önerilir.">
                <select required value={draft.smtp_mailer} onChange={(event) => updateField("smtp_mailer", event.target.value as SmtpDraft["smtp_mailer"])} className="mt-1 h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500">
                  <option value="smtp">SMTP</option>
                  <option value="resend">Resend HTTPS API</option>
                </select>
              </FormField>
              {draft.smtp_mailer === "smtp" ? (
                <>
                  <FormField label="SMTP host" description="Örnek: smtp.gmail.com">
                    <FormInput required maxLength={255} autoComplete="off" value={draft.smtp_host} onChange={(event) => updateField("smtp_host", event.target.value)} />
                  </FormField>
                  <FormField label="SMTP port" description="Sağlayıcınızın SMTP portu.">
                    <FormInput required type="number" min={1} max={65535} value={draft.smtp_port} onChange={(event) => updateField("smtp_port", event.target.value)} />
                  </FormField>
                  <FormField label="SMTP kullanıcı adı" description="SMTP hesabınızın kullanıcı adı.">
                    <FormInput required maxLength={255} autoComplete="username" value={draft.smtp_username} onChange={(event) => updateField("smtp_username", event.target.value)} />
                  </FormField>
                  <FormField label="SMTP şifreleme" description="Sağlayıcınızın TLS ayarını seçin.">
                    <select required value={draft.smtp_encryption} onChange={(event) => updateField("smtp_encryption", event.target.value as SmtpDraft["smtp_encryption"])} className="mt-1 h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-500">
                      <option value="" disabled>Şifreleme seçin</option>
                      <option value="tls">TLS / STARTTLS</option>
                      <option value="ssl">SSL / SMTPS</option>
                      <option value="none">Şifreleme yok</option>
                    </select>
                  </FormField>
                </>
              ) : (
                <p className="sm:col-span-2 text-xs leading-relaxed text-zinc-400">
                  E-postalar Resend API’sine HTTPS üzerinden gönderilir; SMTP portlarına bağlantı gerekmez. Gönderen adresi Resend’de doğrulanmış bir domain’e ait olmalıdır.
                </p>
              )}
              <FormField label={draft.smtp_mailer === "resend" ? "Resend API anahtarı" : "SMTP parola"} description={hasSavedPassword ? "Saklanan gizli bilgi korunur. Değiştirmek için yeni değer girin." : draft.smtp_mailer === "resend" ? "Resend hesabınızdaki API anahtarını girin." : "SMTP sağlayıcınızın parola veya uygulama anahtarı."}>
                <FormInput required={!hasSavedPassword} type="password" maxLength={4096} autoComplete="new-password" value={draft.smtp_password} onChange={(event) => updateField("smtp_password", event.target.value)} />
              </FormField>
            </FormFieldset>
          )}
          {isLoading && <span className="sr-only">SMTP ayar formu yükleniyor.</span>}
          <button type="submit" disabled={isLoading || isSaving} className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-100 px-4 text-xs font-medium text-zinc-950 hover:bg-white disabled:opacity-50">
            <Save size={14} aria-hidden="true" />{isSaving ? "Kaydediliyor..." : "Save"}
          </button>
        </form>

        <form onSubmit={sendTest} className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-zinc-400" aria-hidden="true" />
            <h3 className="text-sm font-medium text-zinc-200">Test e-postası</h3>
          </div>
          {!isPersisted && (
            <p className="flex items-center gap-2 rounded-md border border-amber-900 bg-amber-950/20 p-3 text-xs text-amber-200">
              <AlertTriangle size={14} aria-hidden="true" />Test göndermeden önce ayarları veritabanına kaydedin.
            </p>
          )}
          <FormFieldset className="space-y-3">
            <FormField label="Alıcı e-posta" description="Test mesajının gönderileceği adres.">
              <FormInput required type="email" maxLength={255} autoComplete="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} />
            </FormField>
            <FormField label="Konu" description="Test e-postasının konu satırı.">
              <FormInput required maxLength={255} value={testSubject} onChange={(event) => setTestSubject(event.target.value)} />
            </FormField>
            <FormField label="Mesaj" description="Test e-postasının içeriği.">
              <textarea required maxLength={10000} rows={6} value={testMessage} onChange={(event) => setTestMessage(event.target.value)} className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500" />
            </FormField>
          </FormFieldset>
          <button type="submit" disabled={!savedSettings || !isPersisted || !hasSavedPassword || isSendingTest} className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 px-4 text-xs font-medium text-zinc-200 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50">
            <Send size={14} aria-hidden="true" />{isSendingTest ? "Gönderiliyor..." : "Send Mail"}
          </button>
        </form>
      </div>}
    </section>
  );
}
