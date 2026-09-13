import { describe, expect, it } from "vitest";

import { routeColorFor } from "@/lib/routeColors";

describe("routeColorFor", () => {
  it("is deterministic for the same id", () => {
    expect(routeColorFor(42)).toBe(routeColorFor(42));
  });

  it("gives different ids different colors, in general", () => {
    expect(routeColorFor(1)).not.toBe(routeColorFor(2));
  });

  it("cycles rather than producing unlimited distinct colors", () => {
    const colors = new Set(Array.from({ length: 50 }, (_, id) => routeColorFor(id)));
    // A hand-picked palette is necessarily small, so 50 ids must repeat some
    // colors — proving this cycles, unlike e.g. a per-id generated hue, which
    // wouldn't have this property at all.
    expect(colors.size).toBeLessThan(50);
  });
});
