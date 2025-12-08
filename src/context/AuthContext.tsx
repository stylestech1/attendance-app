"use client";
import {
  useContext,
  createContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setToken } from "@/redux/features/authSlice";

// Types
type Role = "admin" | "employee" | null;

type AuthState = {
  role: Role;
  token: string | null;
  id: string | null;
};

type AuthContextType = {
  id?: string | null;
  auth: AuthState;
  loading: boolean;
  login: (payload: {
    token: string;
    role: Exclude<Role, null>;
    id?: string | null;
  }) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  authLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    role: null,
    id: null,
  });
  const dispatch = useDispatch();

  const TOKEN_KEY = "employeeSystem_auth_token";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(TOKEN_KEY);

    if (!raw) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed.token) {
        setAuth({
          token: parsed.token,
          role: parsed.role || null,
          id: parsed.id || null,
        });
        dispatch(setToken(parsed.token));
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = ({
    token,
    role,
    id,
  }: {
    token: string;
    role: Exclude<Role, null>;
    id?: string | null;
  }) => {
    const payload = { token, role, id: id ?? null };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(payload));
    setAuth(payload);
    dispatch(setToken(token));

    if (role === "admin") {
      router.push("/admin");
    } else if (role === "employee") {
      if (id) {
        router.push(`/employee/${id}`);
      } else {
        router.push("/employee");
      }
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setAuth({ token: null, role: null, id: null });
    router.push("/login");
    dispatch(setToken(null));
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        loading,
        login,
        logout,
        isAuthenticated: !!auth.token,
        isAdmin: auth.role === "admin",
        isEmployee: auth.role === "employee",
        authLoading: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
