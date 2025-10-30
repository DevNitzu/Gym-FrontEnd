// lib/auth.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function getAuth() {
    const token = (typeof window !== "undefined" && localStorage.getItem("auth:token")) || "";
    const empresa = (typeof window !== "undefined" && localStorage.getItem("auth:empresa")) || "";
    return { token, empresa };
}

export function buildAuthHeaders(extra?: HeadersInit): HeadersInit {
    const { token } = getAuth();
    return { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
    const headers = buildAuthHeaders(init?.headers as HeadersInit);
    const res = await fetch(input, { ...init, headers, mode: "cors", cache: "no-store" });
    if (res.status === 401) {
        const err: any = new Error("401"); err.__is401 = true; throw err;
    }
    return res;
}
