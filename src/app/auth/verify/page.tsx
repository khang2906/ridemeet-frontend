"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// Reads ?token=&name= from the URL and shows a button, not an automatic POST
// on load. The magic-link email points here instead of straight at the API
// specifically so a mail scanner prefetching the link (Outlook Safe Links and
// similar) can't burn the single-use token before the person actually clicks
// it — see the module docstring in ridemeet-backend/app/routes/auth.py.
function VerifyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyToken } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const token = searchParams.get("token");
  const name = searchParams.get("name") ?? undefined;

  if (!token) {
    return (
      <p className="text-sm text-muted-foreground">
        This link is missing its login token. Request a new one from the
        homepage.
      </p>
    );
  }

  async function handleClick() {
    // Redundant in practice — the component already returned early above if
    // token was missing, so this closure only ever gets created when it's
    // present. TypeScript can't see across that gap (narrowing doesn't carry
    // into a separately-defined nested function), so it needs re-checking
    // here to know `token` is a `string`, not `string | null`.
    if (!token) return;
    setStatus("loading");
    try {
      await verifyToken(token, name);
      router.push("/");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-3">
      <p>{name ? `Finish signing in as ${name}` : "Finish signing in"}</p>
      <Button onClick={handleClick} disabled={status === "loading"}>
        {status === "loading" ? "Signing in…" : "Finish signing in"}
      </Button>
      {status === "error" && (
        <p className="text-sm text-destructive">
          That login link is no longer valid — it may have expired or already
          been used. Request a new one from the homepage.
        </p>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      {/* useSearchParams needs a Suspense boundary in the App Router, since
          the value isn't known until the client reads the URL. */}
      <Suspense fallback={null}>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
