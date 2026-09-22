"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "@/components/LoginDialog";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function RsvpForm({
  eventId,
  onRsvped,
}: {
  eventId: number;
  // Called after a successful RSVP instead of the default router.refresh() —
  // needed by the floating map detail panel, which fetches its event data
  // client-side rather than through the server component's own re-render.
  onRsvped?: () => void;
}) {
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Login is required to RSVP (see CLAUDE.md, "Planned pilot") — the backend
  // rejects an anonymous request with 401 regardless, this just avoids a
  // request that's certain to fail.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);
    try {
      // credentials: "include" so the backend can see the session cookie and
      // attach the RSVP to this account — without it, the request would be
      // treated as logged out even with a valid session.
      const res = await fetch(`${API_URL}/api/events/${eventId}/rsvp`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to RSVP");

      if (onRsvped) {
        onRsvped();
      } else {
        // Re-runs the server component's data fetch so the new RSVP shows up,
        // without a full page reload.
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Nothing to show until the /api/auth/me check resolves — otherwise this
  // would flash "Log in to RSVP" for a moment even for someone already logged in.
  if (isLoading) return null;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">Log in to RSVP</p>
        <LoginDialog />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-sm">
          RSVP as <span className="font-medium">{user.display_name}</span>
        </p>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "..." : "RSVP"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
