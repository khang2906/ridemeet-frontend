/**
 * Reverse-geocodes coordinates to a human-readable place name via Nominatim.
 * Returns null on any failure (network error, no result) rather than
 * throwing — a missing address label is a minor UX gap, not worth surfacing
 * as an error the caller has to handle.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const result = await res.json();
    return typeof result?.display_name === "string" ? result.display_name : null;
  } catch {
    return null;
  }
}
