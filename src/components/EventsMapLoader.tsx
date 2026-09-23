"use client";

import dynamic from "next/dynamic";
import type { EventListItem, MapBounds } from "@/types";

// Same reasoning as EventMapLoader.tsx / LocationPickerLoader.tsx: Leaflet
// touches `window` at module-load time, which crashes during the server-side
// render Next.js still does for "use client" components.
const EventsMap = dynamic(
  () => import("@/components/EventsMap").then((mod) => mod.EventsMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
  }
);

export function EventsMapLoader({
  events,
  selectedEventId,
  onSelectEvent,
  onBoundsChange,
}: {
  events: EventListItem[];
  selectedEventId: number | null;
  onSelectEvent: (id: number) => void;
  onBoundsChange: (bounds: MapBounds) => void;
}) {
  return (
    <EventsMap
      events={events}
      selectedEventId={selectedEventId}
      onSelectEvent={onSelectEvent}
      onBoundsChange={onBoundsChange}
    />
  );
}
