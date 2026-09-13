import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EventMapLoader } from "@/components/EventMapLoader";
import { RsvpForm } from "@/components/RsvpForm";
import { safeHttpUrl } from "@/lib/utils";
import { SPORT_LABELS, type Event } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function getEvent(id: string): Promise<Event | null> {
  const res = await fetch(`${API_URL}/api/events/${id}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch event");
  return res.json();
}

export default async function EventDetailPage({
  params,
}: {
  // In Next.js 15+, route params are a Promise — must be awaited
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← Back to events
      </Link>

      <div className="flex items-center gap-2 mt-4 mb-1">
        <Badge variant="secondary">{SPORT_LABELS[event.sport]}</Badge>
        <span className="text-sm text-muted-foreground">
          {formatDate(event.date)}
        </span>
      </div>
      <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

      <div className="space-y-1 text-sm mb-4">
        <p>📍 {event.meeting_point}</p>
        <p>⚡ {event.pace}</p>
        {event.max_participants && (
          <p>
            👥 {event.rsvps.length} / {event.max_participants} going
          </p>
        )}
        {safeHttpUrl(event.route_link) && (
          <p>
            🔗{" "}
            <a
              href={safeHttpUrl(event.route_link)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View route
            </a>
          </p>
        )}
      </div>

      {event.description && (
        <p className="text-sm mb-4 whitespace-pre-wrap">{event.description}</p>
      )}

      {event.lat != null && event.lng != null && (
        <div className="mb-6">
          <EventMapLoader
            lat={event.lat}
            lng={event.lng}
            label={event.meeting_point}
            eventId={event.id}
            routePoints={event.route_points}
          />
          {event.route_points && (
            <a
              href={`${API_URL}/api/events/${event.id}/gpx`}
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              ⬇ Download route (GPX)
            </a>
          )}
        </div>
      )}

      <div className="border-t pt-4">
        <h2 className="font-semibold mb-2">
          Who&apos;s going ({event.rsvps.length})
        </h2>
        {event.rsvps.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-4">
            No one has RSVP&apos;d yet. Be the first!
          </p>
        ) : (
          <ul className="text-sm mb-4 space-y-1">
            {event.rsvps.map((rsvp) => (
              <li key={rsvp.id}>👤 {rsvp.name}</li>
            ))}
          </ul>
        )}
        <RsvpForm eventId={event.id} />
      </div>
    </main>
  );
}
