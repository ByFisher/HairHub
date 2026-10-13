"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { FormField, FormFieldset, FormInput } from "@/components/ui/form";
import { resetPassword as submitPasswordReset } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/auth-schemas";

export default function ResetPasswordForm({
  token,
  initialEmail,
}: {
  token: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReset, setIsReset] = useState(false);

  useEffect(() => {
    if (!isReset) return;
    const timeout = window.setTimeout(() => router.replace("/login?passwordReset=1"), 1800);
    return () => window.clearTimeout(timeout);
  }, [isReset, router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const validated = resetPasswordSchema.safeParse({ email, token, password, passwordConfirmation });
    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? "Bilgilerinizi kontrol edin.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPasswordReset({
        email: validated.data.email,
        token: validated.data.token,
        password: validated.data.password,
        password_confirmation: validated.data.passwordConfirmation,
      });
      setIsReset(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Şifre güncellenemedi. Yeni bir bağlantı isteyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-zinc-100">
      <section className="w-full max-w-sm space-y-5 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-center gap-3">
          <BrandLogo size={40} className="rounded-lg" />
          <div><h1 className="text-base font-semibold">Yeni şifre belirleyin</h1><p className="text-xs text-zinc-500">HairHub hesabınız için yeni bir parola oluşturun</p></div>
        </div>
        {isReset ? (
          <p role="status" className="rounded-md border border-emerald-900 bg-emerald-950/30 p-3 text-sm leading-relaxed text-emerald-200">
            Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz.
          </p>
        ) : !token ? (
          <div className="space-y-4">
            <p role="alert" className="rounded-md border border-rose-900 bg-rose-950/30 p-3 text-sm text-rose-300">Şifre sıfırlama bağlantısı eksik veya geçersiz.</p>
            <Link href="/forgot-password" className="block text-center text-xs text-zinc-200 hover:text-white">Yeni bir bağlantı isteyin</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            <FormFieldset className="space-y-4">
              {!initialEmail && (
                <FormField label="E-posta" description="Şifre sıfırlama isteğinde kullandığınız e-posta adresi.">
                  <FormInput type="email" required autoComplete="email" maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} />
                </FormField>
              )}
              <FormField label="Yeni şifre" description="En az 12 karakter kullanın.">
                <FormInput type="password" required minLength={12} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </FormField>
              <FormField label="Yeni şifre tekrarı" description="Yeni şifrenizi tekrar girin.">
                <FormInput type="password" required minLength={12} autoComplete="new-password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} />
              </FormField>
              {error && <p role="alert" className="rounded-md border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-300">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="h-10 w-full rounded-md bg-zinc-100 text-sm font-medium text-zinc-950 disabled:opacity-50">
                {isSubmitting ? "Şifre güncelleniyor..." : "Şifremi Yenile"}
              </button>
            </FormFieldset>
          </form>
        )}
        <p className="text-center text-xs text-zinc-500">
          <Link href="/login" className="text-zinc-200 hover:text-white">Giriş sayfasına dön</Link>
        </p>
      </section>
    </main>
  );
}
