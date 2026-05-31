"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { sanitizeEmail, sanitizeName, sanitizePassword } from "@/lib/auth/sanitize";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

interface EmailAuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const EmailAuthContext = createContext<EmailAuthContextValue | null>(null);

interface AuthResponseData {
  error?: string;
  user?: AuthUser;
}

/**
 * Handles HTTP responses with automatic token refresh on 401.
 * If the response is 401 and we haven't already tried to refresh,
 * attempt a silent token refresh and retry the original request.
 */
async function handleAuthResponse<T>(
  response: Response,
  retryFn?: () => Promise<Response>
): Promise<{ ok: boolean; data: T; status: number }> {
  if (response.status === 401 && retryFn) {
    try {
      // Attempt silent token refresh
      const refreshRes = await fetch("/api/auth/refresh", {
        method: "POST",
      });

      if (refreshRes.ok || refreshRes.status === 204) {
        // Token was refreshed, retry original request
        const retryRes = await retryFn();
        const data = await retryRes.json();
        return {
          ok: retryRes.ok,
          data,
          status: retryRes.status,
        };
      }
    } catch (err) {
      // Refresh failed, will handle 401 normally
      console.debug("Silent token refresh failed", err);
    }
  }

  const data = await response.json();
  return {
    ok: response.ok,
    data,
    status: response.status,
  };
}

export function EmailAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: AuthUser | null) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      let attempt = 0;
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedPassword = sanitizePassword(password);

      const doLogin = async (): Promise<Response> => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: sanitizedEmail,
            password: sanitizedPassword,
          }),
        });
        return res;
      };

      const result = await handleAuthResponse<AuthResponseData>(await doLogin(), doLogin);

      if (!result.ok) {
        throw new Error(result.data?.error ?? "Login failed");
      }

      setUser((result.data as { user: AuthUser }).user);
    },
    []
  );

  const signup = useCallback(
    async (email: string, name: string, password: string) => {
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedName = sanitizeName(name);
      const sanitizedPassword = sanitizePassword(password);

      const doSignup = async (): Promise<Response> => {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: sanitizedEmail,
            name: sanitizedName,
            password: sanitizedPassword,
          }),
        });
        return res;
      };

      const result = await handleAuthResponse<AuthResponseData>(await doSignup(), doSignup);

      if (!result.ok) {
        throw new Error(result.data?.error ?? "Sign up failed");
      }

      setUser((result.data as { user: AuthUser }).user);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  // Enhanced handleAuthResponse for context-level errors
  useEffect(() => {
    // Intercept 401s that happen outside of login/signup flows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_session_expired" && e.newValue === "true") {
        setUser(null);
        router.push("/login?reason=session_expired");
        localStorage.removeItem("auth_session_expired");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  return (
    <EmailAuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </EmailAuthContext.Provider>
  );
}

export function useEmailAuth() {
  const ctx = useContext(EmailAuthContext);
  if (!ctx) throw new Error("useEmailAuth must be used within EmailAuthProvider");
  return ctx;
}
