/**
 * Bootstrap is unused for passwordless admin access.
 * Staff rows are created on first dashboard request via ensurePasswordlessSession.
 */
export async function ensureAdminUser(): Promise<void> {
  // no-op — passwords are not used for the dashboard anymore
}
