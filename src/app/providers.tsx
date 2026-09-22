"use client";

import { AuthProvider } from "@/contexts/AuthContext";

// Kept as its own file, separate from layout.tsx, so layout.tsx itself never
// needs "use client" — a server component can render a client component and
// pass server-rendered children into it (Next.js's "slot" pattern), so this
// one small boundary is enough without making the whole tree client-rendered.
export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
