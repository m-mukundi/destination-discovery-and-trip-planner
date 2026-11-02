import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as authApi from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until /auth/me answers

  // The session cookie survives a page refresh, so ask who is logged in.
  useEffect(() => {
    let cancelled = false;

    authApi
      .getMe()
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch((error) => console.error('Could not check login:', error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
  }, []);

  const register = useCallback(async (details) => {
    const data = await authApi.register(details);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
