"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { FormField, FormFieldset, FormInput } from "@/components/ui/form";
import { requestPasswordReset } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/auth-schemas";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const validated = forgotPasswordSchema.safeParse({ email });
    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? "E-posta adresinizi kontrol edin.");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(validated.data.email);
      setIsSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "İstek gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-zinc-100">
      <section className="w-full max-w-sm space-y-5 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-center gap-3">
          <BrandLogo size={40} className="rounded-lg" />
          <div><h1 className="text-base font-semibold">Şifremi unuttum</h1><p className="text-xs text-zinc-500">Hesabınıza erişiminizi yenileyin</p></div>
        </div>
        {isSent ? (
          <p role="status" className="rounded-md border border-emerald-900 bg-emerald-950/30 p-3 text-sm leading-relaxed text-emerald-200">
            Eğer e-posta adresiniz sistemimizde kayıtlıysa şifre sıfırlama bağlantısı gönderildi.
          </p>
        ) : (
          <form onSubmit={submit}>
            <FormFieldset className="space-y-4">
              <FormField label="E-posta" description="Hesabınızla ilişkili e-posta adresini girin.">
                <FormInput type="email" required autoComplete="email" maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} />
              </FormField>
              {error && <p role="alert" className="rounded-md border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-300">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="h-10 w-full rounded-md bg-zinc-100 text-sm font-medium text-zinc-950 disabled:opacity-50">
                {isSubmitting ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
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
