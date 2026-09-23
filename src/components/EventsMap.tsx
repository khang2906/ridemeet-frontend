"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { markerIcon } from "@/lib/leaflet-icon";
import { routeColorFor } from "@/lib/routeColors";
import type { EventListItem, MapBounds } from "@/types";

const MUNICH: [number, number] = [48.1374, 11.5755];
const USER_LOCATION_ZOOM = 12;

// Browser geolocation resolves async (and needs a permission prompt), so the
// map always paints its Munich/bounds-fit fallback first, then recenters
// once (or never, if it's denied/unsupported) — see FlyToUserLocation below.
function useUserLocation(): [number, number] | null {
  const [location, setLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setLocation([position.coords.latitude, position.coords.longitude]),
      () => {} // denied or failed — silently keep the fallback view
    );
  }, []);

  return location;
}

// Leaflet measures its container's size once, synchronously, on init — and
// under next/dynamic's ssr:false loading there's a timing race where that
// measurement can happen before layout has fully settled (most likely on a
// cold load, before the Leaflet JS chunk is cached), leaving the map stuck
// narrower than its actual container. invalidateSize() re-measures and fixes it.
function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Recenters on the user's location the first time it resolves — but not if
// they've already selected an event, or touched the map themselves, by then.
// Geolocation is async and can resolve seconds after the map first paints,
// so without the interaction guard this can suddenly zoom in on someone
// mid-pan/zoom with no warning — it looked "random" precisely because its
// timing has nothing to do with anything the user just did.
function FlyToUserLocation({
  location,
  hasSelection,
}: {
  location: [number, number] | null;
  hasSelection: boolean;
}) {
  const hasFlown = useRef(false);
  const hasInteracted = useRef(false);

  // dragstart/zoomstart fire for any user-driven pan or zoom (mouse drag,
  // scroll wheel, zoom buttons, double-click) — not for this component's own
  // setView below, since that only ever runs once `hasFlown` is already true.
  const map = useMapEvents({
    dragstart: () => {
      hasInteracted.current = true;
    },
    zoomstart: () => {
      hasInteracted.current = true;
    },
  });

  useEffect(() => {
    if (location && !hasFlown.current && !hasSelection && !hasInteracted.current) {
      hasFlown.current = true;
      map.setView(location, USER_LOCATION_ZOOM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return null;
}

// Pans to the selected event's marker. Only reacts to selectedEventId
// changing (not to `located` — that would re-trigger on every unrelated
// re-render) so it doesn't fight the initial bounds-fit on load.
//
// panTo, not flyTo with a zoom level: the events list is filtered to the map's
// viewport, so zooming in on selection would collapse the list to the single
// event just clicked. Panning keeps the zoom — and therefore the list — stable.
// Trade-off: from a far-out view the panned-to marker can stay small and hard
// to spot. See TODO.md.
function PanToSelected({
  selectedEvent,
}: {
  selectedEvent: (EventListItem & { lat: number; lng: number }) | undefined;
}) {
  const map = useMap();
  useEffect(() => {
    if (selectedEvent) {
      map.panTo([selectedEvent.lat, selectedEvent.lng]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent?.id]);
  return null;
}

// Reports the visible area upward whenever the map settles, so the list can be
// filtered to what's on screen. Must live inside <MapContainer> — useMapEvents,
// like useMap, only works on a descendant of the container.
function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (b: MapBounds) => void }) {
  function report(map: L.Map) {
    const b = map.getBounds();
    onBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  }

  const map = useMapEvents({
    moveend: () => report(map),
    zoomend: () => report(map),
  });

  // The initial view fires no move event, so report once on mount — otherwise
  // the list stays unfiltered until the user first touches the map.
  useEffect(() => {
    report(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

// Hard cap on how many routes ever render at once, regardless of sport or
// viewport — mounting dozens of overlapping polylines gets unreadable long
// before it gets slow. A plain constant since there's no principled "right"
// number yet, just "clearly fewer than would look like a tangle"; see
// TODO.md's "Scaling beyond one region" note for what replaces this if the
// event count ever grows enough for a fixed cap to feel arbitrary.
const MAX_ROUTES_SHOWN = 15;

export function EventsMap({
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
  // Events created before coordinates became mandatory can still have nulls —
  // this type guard both filters them out and tells TypeScript that everything
  // left over really does have real numbers, not `number | null`.
  const located = events.filter(
    (event): event is EventListItem & { lat: number; lng: number } =>
      event.lat != null && event.lng != null
  );

  const points: [number, number][] = located.map((event) => [event.lat, event.lng]);
  const selectedEvent = located.find((event) => event.id === selectedEventId);
  const userLocation = useUserLocation();

  // Shown regardless of sport now that MAX_ROUTES_SHOWN bounds the clutter —
  // mixing a bike route and a run no longer risks an unreadable tangle the
  // way it could with every matching route drawn at once. Soonest first
  // (not sliced by id or arbitrarily): `located` is built from the API's
  // date-ordered response, so .slice() here keeps that order rather than
  // needing a separate sort.
  const routedEvents = located
    .filter(
      (event): event is typeof event & { route_points: [number, number][] } =>
        event.route_points != null && event.route_points.length > 1
    )
    .slice(0, MAX_ROUTES_SHOWN);

  return (
    <MapContainer
      {...(points.length > 0
        ? { bounds: points, boundsOptions: { padding: [24, 24] as [number, number] } }
        : { center: MUNICH, zoom: 12 })}
      // Fills its parent's full-bleed flex-1 area edge-to-edge — no fixed height
      // or rounded corners here, unlike the small inline maps elsewhere in the app.
      className="h-full w-full isolate"
      // Default top-left zoom control sits under the floating sport
      // filter/view toggle bar (also top-left) — move it out of the way.
      zoomControl={false}
    >
      <ZoomControl position="bottomright" />
      <MapResizeFix />
      <FlyToUserLocation location={userLocation} hasSelection={selectedEventId != null} />
      <PanToSelected selectedEvent={selectedEvent} />
      <BoundsWatcher onBoundsChange={onBoundsChange} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {routedEvents.map((event) => (
        <Polyline
          key={event.id}
          positions={event.route_points}
          pathOptions={{ color: routeColorFor(event.id), weight: 4, opacity: 0.8 }}
        />
      ))}
      {located.map((event) => (
        <Marker
          key={event.id}
          position={[event.lat, event.lng]}
          icon={markerIcon}
          eventHandlers={{ click: () => onSelectEvent(event.id) }}
        />
      ))}
    </MapContainer>
  );
}
