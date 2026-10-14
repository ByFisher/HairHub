import type { ApiErrorBody, Paginated } from "@/types/api";

const SERVER_API_URL = process.env.LARAVEL_API_URL?.replace(/\/+$/, "");
export const AUTH_EXPIRED_EVENT = "hairhub:auth-expired";
let csrfRequest: Promise<void> | undefined;

function apiBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return SERVER_API_URL ?? "";
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** Backend/Laravel bağlantısı koptuğunda kullanıcıya gösterilecek mesaj. */
  get isNetworkIssue() {
    return this.status === 0;
  }
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) {
    throw new ApiError(
      "Sunucu tarafı API isteği için LARAVEL_API_URL ayarlanmamış.",
      0,
    );
  }
  const url = new URL(`${baseUrl}/api/v1${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function toApiError(response: Response): Promise<ApiError> {
  const raw = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html") || /^\s*(?:<!doctype\s+html|<html\b)/i.test(raw)) {
    return new ApiError(
      `API yolu HTML sayfası döndürdü (HTTP ${response.status}). Next.js servisindeki LARAVEL_API_URL değerinin Laravel backend adresi olduğundan emin olun.`,
      response.status,
    );
  }

  let body: ApiErrorBody | null = null;
  try {
    body = raw ? (JSON.parse(raw) as ApiErrorBody) : null;
  } catch {
    body = null;
  }
  return new ApiError(
    body?.message || raw || `İstek başarısız oldu (${response.status}).`,
    response.status,
    body?.errors,
  );
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** Laravel Sanctum cookie oturumu için gerekli. */
  withCredentials?: boolean;
}

function csrfCookie() {
  if (typeof document === "undefined") return "";
  const value = document.cookie.split("; ").find((cookie) => cookie.startsWith("XSRF-TOKEN="))?.slice("XSRF-TOKEN=".length);
  return value ? decodeURIComponent(value) : "";
}

function notifyAuthExpired(response: Response) {
  if (response.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

async function ensureCsrfCookie() {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) {
    throw new ApiError(
      "Sunucu tarafı API isteği için LARAVEL_API_URL ayarlanmamış.",
      0,
    );
  }
  if (typeof window === "undefined") return;
  if (csrfCookie()) return;

  csrfRequest ??= fetch(`${baseUrl}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  }).then(async (response) => {
    if (!response.ok) {
      notifyAuthExpired(response);
      throw await toApiError(response);
    }
  }).finally(() => {
    csrfRequest = undefined;
  });
  try {
    await csrfRequest;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "Laravel CSRF oturumu başlatılamadı. Laravel API'nin çalıştığını ve Next.js servisindeki LARAVEL_API_URL adresinden erişilebildiğini doğrulayın. API çalışıyorsa CORS ve Sanctum stateful domain ayarlarını kontrol edin.",
      0,
    );
  }
  if (!csrfCookie()) throw new ApiError("Laravel CSRF çerezi alınamadı. CORS ve oturum ayarlarını kontrol edin.", 0);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, withCredentials = true, headers, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  let url: string;
  try {
    url = buildUrl(path, query);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("API adresi okunamadı.", 0);
  }

  const method = (rest.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) await ensureCsrfCookie();

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      credentials: withCredentials ? "include" : "omit",
      headers: {
        Accept: "application/json",
        ...(isFormData || body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(!["GET", "HEAD", "OPTIONS"].includes(method) && csrfCookie()
          ? { "X-XSRF-TOKEN": csrfCookie() }
          : {}),
        ...headers,
      },
      body: isFormData || body === undefined ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Sunucuya ulaşılamıyor. Bağlantınızı kontrol edin.", 0);
  }

  if (!response.ok) {
    notifyAuthExpired(response);
    throw await toApiError(response);
  }
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function downloadFile(path: string, query?: RequestOptions["query"]) {
  const url = buildUrl(path, query);
  let response: Response;
  try {
    response = await fetch(url, { credentials: "include", headers: { Accept: "text/csv" } });
  } catch {
    throw new ApiError("Sunucuya ulaşılamıyor. Bağlantınızı kontrol edin.", 0);
  }
  if (!response.ok) throw await toApiError(response);

  const disposition = response.headers.get("Content-Disposition");
  const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? "export.csv";
  return { blob: await response.blob(), filename };
}

/** Liste uçları hem dizi hem Laravel paginate zarfı dönebileceği için normalize eder. */
export async function requestList<T>(path: string, options: RequestOptions = {}): Promise<T[]> {
  const result = await request<Paginated<T> | T[]>(path, options);
  return Array.isArray(result) ? result : result.data;
}

export const get = <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" });
export const post = <T>(path: string, body?: unknown, options?: RequestOptions) =>
  request<T>(path, { ...options, method: "POST", body });
export const patch = <T>(path: string, body?: unknown, options?: RequestOptions) =>
  request<T>(path, { ...options, method: "PATCH", body });
export const put = <T>(path: string, body?: unknown, options?: RequestOptions) => {
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    body.set("_method", "PUT");
    return request<T>(path, { ...options, method: "POST", body });
  }
  return request<T>(path, { ...options, method: "PUT", body });
};
export const del = <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "DELETE" });

export const isApiConfigured = Boolean(SERVER_API_URL);
