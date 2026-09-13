/**
 * Builds an SVG path ("d" attribute) tracing the rough shape of a route,
 * scaled to fit inside a width x height box — a "sparkline" for a card in a
 * list, not an accurate mini-map.
 *
 * Two corrections keep the shape actually recognizable rather than warped:
 *
 * 1. A single uniform scale is used for both axes (picked from whichever axis
 *    is the tighter fit), not one scale per axis. Stretching each axis
 *    independently to fill the box distorts the shape — a nearly-straight
 *    route can end up looking like a completely different route just because
 *    the box's aspect ratio doesn't match the route's.
 * 2. Longitude is corrected by cos(latitude) before scaling. A degree of
 *    longitude covers less real-world distance than a degree of latitude
 *    away from the equator (by exactly that factor) — at Munich's ~48°N this
 *    is a real ~33% effect, and skipping it makes routes look subtly (or not
 *    so subtly) sheared compared to their actual shape.
 */
export function routeThumbnailPath(
  points: [number, number][],
  width: number,
  height: number,
  padding = 2
): string {
  if (points.length === 0) return "";

  const lats = points.map(([lat]) => lat);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const avgLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const lngScale = Math.cos(avgLatRad);
  const projectedLngs = points.map(([, lng]) => lng * lngScale);
  const minLng = Math.min(...projectedLngs);
  const maxLng = Math.max(...projectedLngs);

  // A route running exactly north-south or east-west collapses one axis to
  // zero range; dividing by that would produce NaN coordinates, so treat a
  // flat axis as having *some* range instead of crashing the render.
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  // Whichever axis is the tighter fit sets the scale for both — this is what
  // "preserve aspect ratio" actually means, as opposed to filling the box.
  const scale = Math.min(innerWidth / lngRange, innerHeight / latRange);
  const usedWidth = lngRange * scale;
  const usedHeight = latRange * scale;
  const offsetX = padding + (innerWidth - usedWidth) / 2;
  const offsetY = padding + (innerHeight - usedHeight) / 2;

  return points
    .map(([lat], i) => {
      const projLng = projectedLngs[i];
      const x = offsetX + (projLng - minLng) * scale;
      // SVG y grows downward; latitude grows northward. Without the flip,
      // every route would render upside down.
      const y = offsetY + (1 - (lat - minLat) / latRange) * usedHeight;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
