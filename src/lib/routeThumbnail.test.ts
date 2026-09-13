import { describe, expect, it } from "vitest";

import { routeThumbnailPath } from "@/lib/routeThumbnail";

describe("routeThumbnailPath", () => {
  it("returns an empty string for no points", () => {
    expect(routeThumbnailPath([], 40, 24)).toBe("");
  });

  it("starts with M and continues with L commands", () => {
    const path = routeThumbnailPath(
      [[48.0, 11.0], [48.1, 11.1], [48.2, 11.2]],
      40,
      24
    );
    expect(path.startsWith("M")).toBe(true);
    expect(path.match(/L/g)).toHaveLength(2);
  });

  it("flips latitude so north renders at the top, not the bottom", () => {
    // Two points due north of each other (same lng, increasing lat). SVG y
    // grows downward, so the northern (higher-lat) point must land at the
    // smaller y — getting this backwards renders every route upside down
    // without any visible error, which is exactly the kind of bug worth
    // pinning with a test rather than trusting eyeballing a tiny thumbnail.
    const path = routeThumbnailPath([[48.0, 11.0], [48.1, 11.0]], 40, 24, 0);
    const [, firstY] = path.match(/M[\d.]+,([\d.]+)/)!;
    const [, secondY] = path.match(/L[\d.]+,([\d.]+)/)!;
    expect(Number(secondY)).toBeLessThan(Number(firstY));
  });

  it("does not produce NaN when every point shares the same latitude", () => {
    const path = routeThumbnailPath([[48.0, 11.0], [48.0, 11.1]], 40, 24);
    expect(path).not.toContain("NaN");
  });

  it("does not produce NaN when every point shares the same longitude", () => {
    const path = routeThumbnailPath([[48.0, 11.0], [48.1, 11.0]], 40, 24);
    expect(path).not.toContain("NaN");
  });

  it("handles a single point without crashing", () => {
    expect(() => routeThumbnailPath([[48.0, 11.0]], 40, 24)).not.toThrow();
  });

  it("preserves aspect ratio instead of stretching to fill the box", () => {
    // A roughly square real-world route, rendered into a box that's much
    // wider than it is tall. Stretching each axis independently to fill the
    // box would use close to the full 100px width; preserving aspect ratio
    // must not — the route's own shape, not the box's, decides how wide it
    // ends up.
    const squareRoute: [number, number][] = [
      [48.0, 11.0],
      [48.01, 11.0],
      [48.01, 11.01],
      [48.0, 11.01],
    ];
    const path = routeThumbnailPath(squareRoute, 100, 10, 0);
    const xs = [...path.matchAll(/[ML]([\d.]+),/g)].map((m) => Number(m[1]));
    const usedWidth = Math.max(...xs) - Math.min(...xs);
    expect(usedWidth).toBeLessThan(20);
  });
});
