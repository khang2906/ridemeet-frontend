"use client";

import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/LoginDialog";
import { useAuth } from "@/contexts/AuthContext";

export function AuthStatus() {
  const { user, isLoading, logout } = useAuth();

  // Render nothing, not "Log in", while the /api/auth/me check is still in
  // flight — otherwise every page load briefly flashes the logged-out state
  // even for someone with a valid session.
  if (isLoading) return null;

  if (!user) return <LoginDialog />;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{user.display_name}</span>
      <Button variant="ghost" size="sm" onClick={() => logout()}>
        Log out
      </Button>
    </div>
  );
}
