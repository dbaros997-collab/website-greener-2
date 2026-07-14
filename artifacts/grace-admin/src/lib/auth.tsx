import { createContext, useContext, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  useLogin,
  useLogout,
  getGetCurrentUserQueryKey,
  type AuthUser,
} from "@workspace/api-client-react";
import { isNetworkError } from "@/lib/errors";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  needsSetup: boolean;
  login: (username: string, password: string) => Promise<void>;
  setup: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // /auth/me auto-creates a passwordless session via requireAuth.
  const meQuery = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: (failureCount, error) =>
        isNetworkError(error) ? failureCount < 8 : failureCount < 3,
      retryDelay: (attempt) => Math.min(8_000, 500 * 2 ** attempt),
      staleTime: 30_000,
      refetchInterval: (query) =>
        isNetworkError(query.state.error) ? 2_000 : false,
    },
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const refreshUser = () =>
    queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });

  const login = async (_username: string, _password: string) => {
    // Passwordless: body is ignored by the API.
    await loginMutation.mutateAsync({
      data: { username: "admin", password: "passwordless" },
    });
    await refreshUser();
  };

  const setup = async (username: string, password: string) => {
    await login(username, password);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    await refreshUser();
  };

  const user = meQuery.isSuccess ? (meQuery.data ?? null) : null;
  const needsSetup = false;

  const meNetworkError =
    !meQuery.isSuccess && meQuery.isError && isNetworkError(meQuery.error);
  const isLoading = meQuery.isLoading || meNetworkError;

  return (
    <AuthContext.Provider
      value={{ user, isLoading, needsSetup, login, setup, logout }}
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
