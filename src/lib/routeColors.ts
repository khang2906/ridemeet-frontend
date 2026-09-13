// Hand-picked rather than generated (e.g. hashing the event id into a hue) —
// a fixed palette guarantees every color reads clearly against the map's
// tiles and is visually distinct from its neighbours, which an algorithmic
// approach can't promise.
const ROUTE_COLORS = [
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#d97706", // amber
  "#9333ea", // purple
  "#0d9488", // teal
  "#db2777", // pink
  "#65a30d", // lime
];

/**
 * A consistent color for one event's route, shared between its line on the
 * map and its thumbnail on the card so the two visually match.
 *
 * Keyed by the event's id, not its position in whatever list happens to be
 * rendered right now — position-based coloring would make an event's color
 * depend on what else is currently visible, breaking the map/card match the
 * moment the viewport changes and the set of visible events shifts.
 */
export function routeColorFor(eventId: number): string {
  return ROUTE_COLORS[eventId % ROUTE_COLORS.length];
}
