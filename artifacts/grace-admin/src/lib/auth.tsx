import { createContext, useContext, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  useGetSetupStatus,
  useLogin,
  useLogout,
  useSetupAdmin,
  getGetCurrentUserQueryKey,
  getGetSetupStatusQueryKey,
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

  const meQuery = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      retry: (failureCount, error) =>
        isNetworkError(error) ? failureCount < 8 : false,
      retryDelay: (attempt) => Math.min(8_000, 500 * 2 ** attempt),
      staleTime: 30_000,
      // 401 = signed out; keep polling only when the API itself is unreachable.
      refetchInterval: (query) =>
        isNetworkError(query.state.error) ? 2_000 : false,
    },
  });

  const setupStatusQuery = useGetSetupStatus({
    query: {
      queryKey: getGetSetupStatusQueryKey(),
      retry: (failureCount, error) =>
        isNetworkError(error) ? failureCount < 8 : false,
      retryDelay: (attempt) => Math.min(8_000, 500 * 2 ** attempt),
      staleTime: 5_000,
      // Skip when already signed in — setup is only relevant for guests.
      enabled: !meQuery.isSuccess || !meQuery.data,
      refetchInterval: (query) =>
        isNetworkError(query.state.error) ? 2_000 : false,
    },
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const setupMutation = useSetupAdmin();

  const refreshUser = () =>
    queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });

  const refreshSetupStatus = () =>
    queryClient.invalidateQueries({ queryKey: getGetSetupStatusQueryKey() });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ data: { username, password } });
    await refreshUser();
  };

  const setup = async (username: string, password: string) => {
    await setupMutation.mutateAsync({ data: { username, password } });
    await Promise.all([refreshUser(), refreshSetupStatus()]);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    await Promise.all([refreshUser(), refreshSetupStatus()]);
  };

  // A 401 from /auth/me simply means "not signed in" — surface it as null.
  // react-query keeps the last successful `data` when a refetch errors, so we
  // gate on isSuccess to immediately drop the user after logout returns 401.
  const user = meQuery.isSuccess ? (meQuery.data ?? null) : null;
  const needsSetup = !user && setupStatusQuery.data?.needsSetup === true;

  const meNetworkError =
    !meQuery.isSuccess && meQuery.isError && isNetworkError(meQuery.error);
  const setupNetworkError =
    !user &&
    !setupStatusQuery.isSuccess &&
    setupStatusQuery.isError &&
    isNetworkError(setupStatusQuery.error);
  // Keep the gate on "Loading…" (not an error screen) while the API is unreachable.
  const isConnecting = Boolean(meNetworkError || setupNetworkError);

  const isLoading =
    meQuery.isLoading ||
    (!user && !isConnecting && setupStatusQuery.isLoading) ||
    isConnecting;

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
