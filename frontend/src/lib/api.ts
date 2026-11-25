export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("setor_token");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("setor_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("setor_token");
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Tidak dapat terhubung ke server API. Pastikan backend berjalan di port 8080."
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Terjadi kesalahan (${res.status})`);
  }
  return data as T;
}
