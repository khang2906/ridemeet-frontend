"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

export function EventDetailPanel({
  eventId,
  onClose,
}: {
  eventId: number;
  onClose: () => void;
}) {
  const [event, setEvent] = useState<Event | null>(null);
  // Bumped after a successful RSVP to re-run the fetch below and pick up the
  // new attendee, since this panel isn't part of a server component render.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setEvent(null);
    fetch(`${API_URL}/api/events/${eventId}`)
      .then((res) => res.json())
      .then((data: Event) => {
        if (!cancelled) setEvent(data);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, refreshKey]);

  return (
    // Phone: fills the row it's in (which spans the viewport), floating over
    // the map and the bottom sheet. Desktop: a 320px column parked next to the
    // events list — w-80 rather than the old max-w-96, so list + toggle + this
    // still fit inside the 768px md: breakpoint where side-by-side begins.
    <div className="pointer-events-auto z-20 h-full w-full overflow-y-auto rounded-lg border border-border bg-background/95 p-4 shadow-md backdrop-blur md:w-80 md:shrink-0">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
      >
        <X size={16} />
      </button>

      {!event ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="flex items-center gap-2 pr-8">
            <Badge variant="secondary">{SPORT_LABELS[event.sport]}</Badge>
            <span className="text-xs text-muted-foreground">{formatDate(event.date)}</span>
          </div>
          <h2 className="mt-1 text-xl font-bold pr-8">{event.title}</h2>

          <div className="mt-3 space-y-1 text-sm">
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
            {event.route_points && (
              <p>
                ⬇{" "}
                <a
                  href={`${API_URL}/api/events/${event.id}/gpx`}
                  className="text-primary hover:underline"
                >
                  Download route (GPX)
                </a>
              </p>
            )}
          </div>

          {event.description && (
            <p className="mt-3 text-sm whitespace-pre-wrap">{event.description}</p>
          )}

          <div className="mt-4 border-t border-border pt-3">
            <h3 className="mb-2 text-sm font-semibold">
              Who&apos;s going ({event.rsvps.length})
            </h3>
            {event.rsvps.length === 0 ? (
              <p className="mb-3 text-sm text-muted-foreground">
                No one has RSVP&apos;d yet. Be the first!
              </p>
            ) : (
              <ul className="mb-3 space-y-1 text-sm">
                {event.rsvps.map((rsvp) => (
                  <li key={rsvp.id}>👤 {rsvp.name}</li>
                ))}
              </ul>
            )}
            <RsvpForm
              eventId={event.id}
              rsvps={event.rsvps}
              onRsvped={() => setRefreshKey((k) => k + 1)}
            />
          </div>
        </>
      )}
    </div>
  );
}
