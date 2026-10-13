import { z } from "zod";

const email = z.string().trim().email("Geçerli bir e-posta adresi girin.");
const password = z.string().min(12, "Parola en az 12 karakter olmalıdır.");
export const invalidTaxNumberMessage = "Geçerli bir Vergi Kimlik Numarası giriniz.";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta adresi girin."),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta adresi girin."),
  token: z.string().min(1, "Şifre sıfırlama bağlantısı geçersiz."),
  password: z.string().min(12, "Parola en az 12 karakter olmalıdır."),
  passwordConfirmation: z.string(),
}).refine((values) => values.password === values.passwordConfirmation, {
  message: "Parolalar eşleşmiyor.",
  path: ["passwordConfirmation"],
});

export function isValidTurkishTaxNumber(value: string): boolean {
  if (!/^\d{10}$/.test(value) || /^(\d)\1{9}$/.test(value)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    let digit = (Number(value[index]) + 9 - index) % 10;
    digit = (digit * 2 ** (9 - index)) % 9;
    sum += digit === 0 ? 9 : digit;
  }

  return (10 - (sum % 10)) % 10 === Number(value[9]);
}

const shopOwnerAccountFields = {
  fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalıdır.").max(120),
  email,
  phone: z.string().trim().min(1, "Telefon numarası gereklidir.").max(40, "Telefon en fazla 40 karakter olabilir."),
  password,
  passwordConfirmation: z.string(),
};

const latitude = z.string().trim().refine((value) => (
  value === "" || (Number.isFinite(Number(value)) && Number(value) >= -90 && Number(value) <= 90)
), "Enlem -90 ile 90 arasında olmalıdır.");
const longitude = z.string().trim().refine((value) => (
  value === "" || (Number.isFinite(Number(value)) && Number(value) >= -180 && Number(value) <= 180)
), "Boylam -180 ile 180 arasında olmalıdır.");

export const shopOwnerAccountSchema = z.object(shopOwnerAccountFields).refine(
  (values) => values.password === values.passwordConfirmation,
  { message: "Parolalar eşleşmiyor.", path: ["passwordConfirmation"] },
);

export const customerRegistrationSchema = z.object({
  fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalıdır.").max(120),
  email,
  password,
  passwordConfirmation: z.string(),
  phone: z.string().trim().min(1, "Telefon numarası gereklidir.").max(40, "Telefon en fazla 40 karakter olabilir."),
  city: z.string().trim().min(1, "İl seçilmelidir.").max(120),
  district: z.string().trim().min(1, "İlçe seçilmelidir.").max(120),
}).refine((values) => values.password === values.passwordConfirmation, {
  message: "Parolalar eşleşmiyor.",
  path: ["passwordConfirmation"],
});

export const shopOwnerRegistrationSchema = z.object({
  ...shopOwnerAccountFields,
  shopName: z.string().trim().min(2, "Dükkan adı en az 2 karakter olmalıdır.").max(120),
  genderType: z.enum(["male", "female", "unisex"]),
  city: z.string().trim().min(1, "İl gereklidir.").max(120),
  district: z.string().trim().min(1, "İlçe gereklidir.").max(120),
  address: z.string().trim().min(5, "Açık adres en az 5 karakter olmalıdır.").max(255, "Açık adres en fazla 255 karakter olabilir."),
  taxNumber: z.string().trim()
    .regex(/^\d{10,11}$/, "10 haneli VKN veya 11 haneli TCKN girin.")
    .refine((value) => value.length !== 10 || isValidTurkishTaxNumber(value), invalidTaxNumberMessage),
  latitude,
  longitude,
}).refine((values) => values.password === values.passwordConfirmation, {
  message: "Parolalar eşleşmiyor.",
  path: ["passwordConfirmation"],
}).refine((values) => Boolean(values.latitude) === Boolean(values.longitude), {
  message: "Konum için hem enlem hem boylam girilmelidir.",
  path: ["latitude"],
});

export type CustomerRegistrationForm = z.infer<typeof customerRegistrationSchema>;
export type ShopOwnerRegistrationForm = z.infer<typeof shopOwnerRegistrationSchema>;
