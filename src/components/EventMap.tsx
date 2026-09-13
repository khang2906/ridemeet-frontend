"use client";

import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";

import { markerIcon } from "@/lib/leaflet-icon";
import { routeColorFor } from "@/lib/routeColors";

export function EventMap({
  lat,
  lng,
  label,
  eventId,
  routePoints,
}: {
  lat: number;
  lng: number;
  label: string;
  eventId: number;
  routePoints?: [number, number][] | null;
}) {
  return (
    <MapContainer
      // A route can extend well beyond the meeting point — bounds-fit to it
      // when present, same as the homepage map does for multiple markers,
      // instead of centering tightly on a point that might sit at one edge
      // of a long ride.
      {...(routePoints && routePoints.length > 1
        ? { bounds: routePoints, boundsOptions: { padding: [16, 16] as [number, number] } }
        : { center: [lat, lng] as [number, number], zoom: 14 })}
      scrollWheelZoom={false}
      className="h-64 w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {routePoints && routePoints.length > 1 && (
        <Polyline
          positions={routePoints}
          pathOptions={{ color: routeColorFor(eventId), weight: 4, opacity: 0.8 }}
        />
      )}
      <Marker position={[lat, lng]} icon={markerIcon}>
        <Popup>{label}</Popup>
      </Marker>
    </MapContainer>
  );
}
