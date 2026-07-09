import { useState, type FormEvent } from "react";
import { useResetPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toFriendlyError } from "@/lib/errors";

type Props = {
  onBack: () => void;
};

export default function ForgotPassword({ onBack }: Props) {
  const resetPassword = useResetPassword();
  const [username, setUsername] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword.mutateAsync({
        data: { username, resetCode, newPassword },
      });
      setSuccess(true);
    } catch (err) {
      setError(toFriendlyError(err).description);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-950 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-emerald-900">
            Reset password
          </CardTitle>
          <CardDescription>
            Enter your username, recovery code, and a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-emerald-700">
                Your password was updated. You can sign in with your new password.
              </p>
              <Button type="button" className="w-full" onClick={onBack}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-username">Username</Label>
                <Input
                  id="reset-username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-code">Recovery code</Label>
                <Input
                  id="reset-code"
                  type="password"
                  autoComplete="off"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ask your site administrator for the recovery code.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Reset password
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBack}
              >
                Back to sign in
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
