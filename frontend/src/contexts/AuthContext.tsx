import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { api, getToken, setToken, clearToken, type Doctor } from "@/services/api";

interface AuthContextType {
  doctor: Doctor | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: {
    email: string;
    password: string;
    name: string;
    specialty: string;
  }) => Promise<void>;
  refreshDoctor: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());

  const refreshDoctor = useCallback(async () => {
    try {
      const d = await api.auth.me();
      setDoctor(d);
    } catch {
      setDoctor(null);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    setToken(res.access_token);
    setTokenState(res.access_token);
    const d = await api.auth.me();
    setDoctor(d);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setDoctor(null);
  }, []);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      specialty: string;
    }) => {
      await api.auth.register(data);
      await login(data.email, data.password);
    },
    [login],
  );

  return (
    <AuthContext.Provider
      value={{ doctor, token, login, logout, register, refreshDoctor }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
