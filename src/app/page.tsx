import Link from "next/link";
import { AuthStatus } from "@/components/AuthStatus";
import { EventsExplorer } from "@/components/EventsExplorer";
import { Button } from "@/components/ui/button";
import type { EventListItem, Sport } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getEvents(sport?: string): Promise<EventListItem[]> {
  const url = new URL(`${API_URL}/api/events`);
  if (sport) url.searchParams.set("sport", sport);
  // no-store: always fetch fresh data, never use Next.js's cache
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export default async function Home({
  searchParams,
}: {
  // In Next.js 15+, searchParams is a Promise — must be awaited
  searchParams: Promise<{ sport?: string }>;
}) {
  const { sport } = await searchParams;
  const events = await getEvents(sport);

  return (
    // h-dvh (dynamic viewport height), not h-screen (100vh) — on iOS Safari
    // 100vh is measured as if the address bar were fully collapsed, so a
    // 100vh-tall page renders taller than what's actually visible, pushing
    // everything below the header off-screen with no way to scroll to it.
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-4">
        <h1 className="text-3xl font-bold">RideMeet</h1>
        <div className="flex items-center gap-3">
          <Button render={<Link href="/events/new" />} nativeButton={false}>+ New event</Button>
          <AuthStatus />
        </div>
      </header>

      {/* The map fills the rest of the viewport (Komoot-style); the event
          list, filter, and selected event's details all live in floating
          panels over it instead of separate pages/views. */}
      <EventsExplorer sport={sport as Sport | undefined} events={events} />
    </div>
  );
}
