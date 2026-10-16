
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function readStoredSession() {
  try {
    const storages = [sessionStorage, localStorage];

    for (const storage of storages) {
      const token = storage.getItem("shopnest_token");
      const savedUser = storage.getItem("shopnest_user");

      if (token && savedUser) {
        const user = JSON.parse(savedUser);

        if (user && typeof user === "object" && user.id) {
          return { token, user };
        }
      }
    }
  } catch (error) {
    console.error("Could not read saved session:", error);
  }

  return { token: null, user: null };
}

function clearStoredSession() {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem("shopnest_token");
    storage.removeItem("shopnest_user");
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);
  const [authLoading, setAuthLoading] = useState(
    () => Boolean(readStoredSession().token)
  );

  const login = useCallback((token, user, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    otherStorage.removeItem("shopnest_token");
    otherStorage.removeItem("shopnest_user");

    storage.setItem("shopnest_token", token);
    storage.setItem("shopnest_user", JSON.stringify(user));

    setSession({ token, user });
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setSession({ token: null, user: null });
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (!session.token) {
      setAuthLoading(false);
      return;
    }

    const controller = new AbortController();

    const verifyToken = async () => {
      setAuthLoading(true);

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
          signal: controller.signal,
        });

        if (response.status === 401) {
          clearStoredSession();
          setSession({ token: null, user: null });
          return;
        }

        if (!response.ok) {
          // A server/network issue is not proof that the token is invalid.
          return;
        }

        const data = await response.json();

        if (!data.success || !data.user) {
          return;
        }

        setSession((current) => {
          if (current.token !== session.token) {
            return current;
          }

          localStorage.getItem("shopnest_token") === session.token
            ? localStorage.setItem(
                "shopnest_user",
                JSON.stringify(data.user)
              )
            : sessionStorage.setItem(
                "shopnest_user",
                JSON.stringify(data.user)
              );

          return { ...current, user: data.user };
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Could not verify session:", error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setAuthLoading(false);
        }
      }
    };

    verifyToken();

    return () => controller.abort();
  }, [session.token]);

  const value = {
    user: session.user,
    token: session.token,
    isAuthenticated: Boolean(session.token && session.user),
    authLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
