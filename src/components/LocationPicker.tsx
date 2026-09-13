"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { Input } from "@/components/ui/input";
import { markerIcon } from "@/lib/leaflet-icon";

const MUNICH: [number, number] = [48.1374, 11.5755];
// Not per-event coloring (routeColorFor) — there's no event yet while this
// form is open, and only one route is ever previewed here at a time, so a
// fixed color is all this needs.
const ROUTE_PREVIEW_COLOR = "#2563eb";

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

type LocationPickerProps = {
  meetingPoint: string;
  onMeetingPointChange: (value: string) => void;
  lat: number | null;
  lng: number | null;
  onPositionChange: (lat: number, lng: number) => void;
  onClear: () => void;
  // The just-uploaded route, shown on this same map so a meeting point picked
  // far from where the route actually goes is obvious immediately — not
  // something to discover later on the homepage map.
  routePreviewPoints?: [number, number][] | null;
};

// Listens for clicks on the map. Has to be a child of MapContainer — react-leaflet's
// event hooks only work inside the map's own context, so this can't live in the parent.
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Re-fits the view whenever the pin or the route preview changes, rather than
// only once at mount — the map is created before either exists (nothing is
// picked yet), so a static center/zoom would never react to the user's own
// actions. Depends on the raw values, not a combined array built in the
// render body, since a fresh array reference every render would re-fit on
// every unrelated keystroke elsewhere in the form.
function FitBoundsOnChange({
  lat,
  lng,
  routePreviewPoints,
}: {
  lat: number | null;
  lng: number | null;
  routePreviewPoints: [number, number][] | null | undefined;
}) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [
      ...(lat != null && lng != null ? [[lat, lng] as [number, number]] : []),
      ...(routePreviewPoints ?? []),
    ];
    if (points.length > 0) {
      map.fitBounds(points, { padding: [24, 24] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, routePreviewPoints, map]);
  return null;
}

export function LocationPicker({
  meetingPoint,
  onMeetingPointChange,
  lat,
  lng,
  onPositionChange,
  onClear,
  routePreviewPoints,
}: LocationPickerProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  function handleInputChange(value: string) {
    onMeetingPointChange(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    // Debounce: wait 300ms after the user stops typing before hitting Nominatim,
    // otherwise every keystroke fires a request.
    debounceTimer.current = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      )
        .then((r) => r.json())
        .then(setSuggestions);
    }, 300);
  }

  function selectSuggestion(place: NominatimResult) {
    onMeetingPointChange(place.display_name);
    setSuggestions([]);
    onPositionChange(parseFloat(place.lat), parseFloat(place.lon));
  }

  function handleMapClick(clickLat: number, clickLng: number) {
    setSuggestions([]);
    onPositionChange(clickLat, clickLng);

    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${clickLat}&lon=${clickLng}&format=json`)
      .then((r) => r.json())
      .then((result) => {
        if (result?.display_name) onMeetingPointChange(result.display_name);
      });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[0]) selectSuggestion(suggestions[0]);
    }
    if (e.key === "Escape") {
      setSuggestions([]);
    }
  }

  return (
    <div>
      <div className="relative">
        <Input
          value={meetingPoint}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          // mousedown (not blur) closes the list, so a suggestion click registers
          // before the input's blur event would otherwise hide the list first.
          onBlur={() => setSuggestions([])}
          placeholder="Type to search, or click the map"
          autoComplete="off"
          required
        />
        {suggestions.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-[1000] max-h-60 overflow-auto rounded-lg border border-border bg-background shadow-md">
            {suggestions.map((place) => (
              <li
                key={`${place.lat}-${place.lon}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(place);
                }}
                className="cursor-pointer truncate px-2.5 py-1.5 text-sm hover:bg-muted"
              >
                {place.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {lat != null && lng != null && (
        <button
          type="button"
          onClick={onClear}
          className="mt-1 text-xs text-muted-foreground hover:underline"
        >
          Clear pin
        </button>
      )}

      {/* Static center/zoom at mount — FitBoundsOnChange takes over from there,
          since neither a pin nor a route exists yet when this first renders. */}
      <MapContainer center={MUNICH} zoom={12} className="mt-2 h-64 w-full rounded-lg">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onClick={handleMapClick} />
        <FitBoundsOnChange lat={lat} lng={lng} routePreviewPoints={routePreviewPoints} />
        {routePreviewPoints && routePreviewPoints.length > 1 && (
          <Polyline
            positions={routePreviewPoints}
            pathOptions={{ color: ROUTE_PREVIEW_COLOR, weight: 4, opacity: 0.8 }}
          />
        )}
        {lat != null && lng != null && (
          <Marker
            position={[lat, lng]}
            icon={markerIcon}
            // Leaflet markers stop their click from reaching the map's own
            // click handler — without this, clicking directly on the pin did
            // nothing at all, silently. This is what makes "click it again"
            // actually remove it, matching what clicking a placed pin should do.
            eventHandlers={{ click: onClear }}
          />
        )}
      </MapContainer>
    </div>
  );
}
