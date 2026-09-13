const DEFAULT_MAX_POINTS = 100;

/**
 * Extracts [lat, lng] points from a GPX file's <trk>/<trkseg>/<trkpt>
 * elements. Uses the browser's built-in DOMParser rather than a hand-rolled
 * string parser — real exports from Strava/Komoot/Garmin vary in formatting
 * (attribute order, line breaks inside a tag), and a real XML parser handles
 * all of that correctly instead of being a source of "why didn't this file
 * parse" bugs. <rte>/<rtept> (routes, as opposed to recorded tracks) aren't
 * handled — not seen in practice from these exporters; revisit if one shows up.
 */
export function parseGpx(xmlText: string): [number, number][] {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");

  // DOMParser never throws on malformed XML — it returns a document whose
  // content describes the failure instead, via a <parsererror> element.
  if (doc.querySelector("parsererror")) {
    throw new Error("That file isn't valid XML.");
  }

  const points: [number, number][] = [];
  for (const trkpt of doc.querySelectorAll("trkpt")) {
    const latAttr = trkpt.getAttribute("lat");
    const lonAttr = trkpt.getAttribute("lon");
    if (latAttr == null || lonAttr == null) continue;

    const lat = Number(latAttr);
    const lon = Number(lonAttr);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      points.push([lat, lon]);
    }
  }

  if (points.length === 0) {
    throw new Error("No track points found — is this a GPX file with a recorded route?");
  }

  return points;
}

/**
 * Reduces a point list to at most maxPoints, evenly spaced by index. Always
 * keeps the first and last point exactly (a route's start and end matter more
 * than anything in between). Not a real simplification algorithm — e.g.
 * Douglas-Peucker, which keeps points where the route actually turns — just
 * good enough for "what's the rough shape of this ride," and much simpler to
 * write and test.
 */
export function downsampleRoute(
  points: [number, number][],
  maxPoints: number = DEFAULT_MAX_POINTS
): [number, number][] {
  if (points.length <= maxPoints) return points;

  const step = (points.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, i) => points[Math.round(i * step)]);
}
