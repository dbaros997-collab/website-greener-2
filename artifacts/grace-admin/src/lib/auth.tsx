import { createContext, useContext, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  useLogin,
  useLogout,
  getGetCurrentUserQueryKey,
  type AuthUser,
} from "@workspace/api-client-react";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
      staleTime: 30_000,
    },
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const refreshUser = () =>
    queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ data: { username, password } });
    await refreshUser();
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    await refreshUser();
  };

  // A 401 from /auth/me simply means "not signed in" — surface it as null.
  // react-query keeps the last successful `data` when a refetch errors, so we
  // gate on isSuccess to immediately drop the user after logout returns 401.
  const user = meQuery.isSuccess ? (meQuery.data ?? null) : null;

  return (
    <AuthContext.Provider
      value={{ user, isLoading: meQuery.isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
