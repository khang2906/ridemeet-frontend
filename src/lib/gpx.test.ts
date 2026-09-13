// @vitest-environment jsdom
//
// Needs a real DOMParser, which doesn't exist in vitest's default "node"
// environment — only this file pays for jsdom, everything else stays fast.
import { describe, expect, it } from "vitest";

import { downsampleRoute, parseGpx } from "@/lib/gpx";

const SAMPLE = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="48.1112" lon="11.5514"></trkpt>
  <trkpt lat="48.1120" lon="11.5520"></trkpt>
  <trkpt lat="48.1130" lon="11.5530"></trkpt>
</trkseg></trk></gpx>`;

describe("parseGpx", () => {
  it("extracts lat/lng pairs from trkpt elements", () => {
    expect(parseGpx(SAMPLE)).toEqual([
      [48.1112, 11.5514],
      [48.112, 11.552],
      [48.113, 11.553],
    ]);
  });

  it("throws on malformed XML rather than returning nothing silently", () => {
    expect(() => parseGpx("<gpx><trk>")).toThrow();
  });

  it("throws when the file has no track points", () => {
    expect(() => parseGpx("<gpx><trk><trkseg></trkseg></trk></gpx>")).toThrow();
  });

  it("skips a trkpt missing a lat or lon rather than inserting a bogus point", () => {
    // getAttribute returns null for a missing attribute, and Number(null) is
    // 0 — without an explicit null check this would silently insert (0, 0),
    // a real coordinate in the Gulf of Guinea, instead of skipping the point.
    const partial = `<gpx><trk><trkseg>
      <trkpt lat="48.11" lon="11.55"></trkpt>
      <trkpt lon="11.55"></trkpt>
    </trkseg></trk></gpx>`;
    expect(parseGpx(partial)).toEqual([[48.11, 11.55]]);
  });
});

describe("downsampleRoute", () => {
  it("leaves a short list unchanged", () => {
    const points: [number, number][] = [[0, 0], [1, 1], [2, 2]];
    expect(downsampleRoute(points, 100)).toEqual(points);
  });

  it("caps a long list to exactly maxPoints", () => {
    const points: [number, number][] = Array.from({ length: 1000 }, (_, i) => [i, i]);
    expect(downsampleRoute(points, 100)).toHaveLength(100);
  });

  it("always keeps the first and last point exactly", () => {
    const points: [number, number][] = Array.from({ length: 1000 }, (_, i) => [i, i * 2]);
    const result = downsampleRoute(points, 50);
    expect(result[0]).toEqual(points[0]);
    expect(result[result.length - 1]).toEqual(points[points.length - 1]);
  });
});
