import type { Car, CarsResponse, CarsQuery, ApiError } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const TOKEN_KEY = "token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function onUnauthorized(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = "/login";
}

async function apiFetch<T>(
  url: string,
  options: RequestInit & { skipAuthRedirect?: boolean } = {}
): Promise<T> {
  const { skipAuthRedirect, ...init } = options;
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401 && !skipAuthRedirect) {
    onUnauthorized();
    throw new Error("Unauthorized");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err?.error ?? `Request failed: ${res.status}`);
  }
  return data as T;
}

export async function login(
  loginName: string,
  password: string
): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: loginName, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err?.error ?? "Ошибка входа");
  }
  return data as { token: string };
}

export type { Car, CarsResponse, CarsQuery };

export async function fetchCars(params: CarsQuery = {}): Promise<CarsResponse> {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") search.set(k, String(v));
  });
  const url = `${API_BASE}/api/cars?${search.toString()}`;
  return apiFetch<CarsResponse>(url);
}

export async function fetchCar(id: number): Promise<Car> {
  return apiFetch<Car>(`${API_BASE}/api/cars/${id}`);
}

export function logout(): void {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
  onUnauthorized();
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
