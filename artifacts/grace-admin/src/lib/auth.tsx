import { createContext, useContext, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
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

  // Establishes a passwordless session in the background for API writes.
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

  const refreshUser = () =>
    queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });

  const user = meQuery.isSuccess ? (meQuery.data ?? null) : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: false,
        needsSetup: false,
        login: async () => {
          await refreshUser();
        },
        setup: async () => {
          await refreshUser();
        },
        logout: async () => {
          await refreshUser();
        },
      }}
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
