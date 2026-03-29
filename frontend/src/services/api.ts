const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ── Types ──────────────────────────────────────────────────────────────────

export type PatientStatus = "Stable" | "Under Treatment" | "Critical";

export interface Doctor {
  id: number;
  email: string;
  name: string;
  specialty: string;
  patient_count: number;
  created_at: string;
}

export interface Patient {
  id: number;
  doctor_id: number;
  full_name: string;
  age: number;
  status: PatientStatus;
  phone: string;
  address: string;
  clinical_notes: string;
  created_at: string;
  updated_at: string;
}

export interface PatientListResponse {
  patients: Patient[];
  total: number;
}

export interface InteractionResult {
  drug_1: string;
  drug_2: string;
  interaction_found: boolean;
  severity: "none" | "mild" | "moderate" | "severe" | "contraindicated";
  summary: string;
  mechanism: string;
  side_effects: string[];
  risks: string[];
  poisoning_risk: {
    exists: boolean;
    description: string;
  };
  recommendations: string[];
  disclaimer: string;
}

export interface InteractionCheckResponse {
  success: boolean;
  data: InteractionResult;
  timestamp: string;
}

export interface InteractionHistory {
  id: number;
  drug_1: string;
  drug_2: string;
  result: InteractionResult;
  patient_id: number | null;
  created_at: string;
}

// ── Token storage ──────────────────────────────────────────────────────────

const TOKEN_KEY = "medassist_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ── HTTP client ────────────────────────────────────────────────────────────

type FetchOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error(data?.detail || "Request failed"), {
      status: res.status,
      data,
    });
  }

  return res.json() as Promise<T>;
}

// ── API ────────────────────────────────────────────────────────────────────

export const api = {
  health: () => request<{ status: string }>("/health", { auth: false }),

  auth: {
    register: (data: { email: string; password: string; name: string; specialty: string }) =>
      request<Doctor>("/auth/register", { method: "POST", body: data, auth: false }),

    login: (data: { email: string; password: string }) =>
      request<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: data,
        auth: false,
      }),

    me: () => request<Doctor>("/auth/me"),
  },

  patients: {
    list: (skip = 0, limit = 50) =>
      request<PatientListResponse>(`/api/v1/patients?skip=${skip}&limit=${limit}`),

    search: (q: string) =>
      request<PatientListResponse>(`/api/v1/patients/search?q=${encodeURIComponent(q)}`),

    get: (id: number) => request<Patient>(`/api/v1/patients/${id}`),

    create: (data: {
      full_name: string;
      age: number;
      status: PatientStatus;
      phone?: string;
      address?: string;
      clinical_notes?: string;
    }) => request<Patient>("/api/v1/patients", { method: "POST", body: data }),

    update: (
      id: number,
      data: Partial<{
        full_name: string;
        age: number;
        status: PatientStatus;
        phone: string;
        address: string;
        clinical_notes: string;
      }>,
    ) => request<Patient>(`/api/v1/patients/${id}`, { method: "PUT", body: data }),

    delete: (id: number) =>
      request<{ success: boolean; message: string }>(`/api/v1/patients/${id}`, {
        method: "DELETE",
      }),

    interactions: (id: number) =>
      request<InteractionHistory[]>(`/api/v1/patients/${id}/interactions`),
  },

  interactions: {
    check: (drug_1: string, drug_2: string, patient_id?: number) =>
      request<InteractionCheckResponse>("/api/v1/check-interaction", {
        method: "POST",
        body: { drug_1, drug_2, ...(patient_id !== undefined && { patient_id }) },
      }),

    history: () => request<InteractionHistory[]>("/api/v1/history"),
  },
};
