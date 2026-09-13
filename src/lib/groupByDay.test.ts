import { describe, expect, it } from "vitest";

import { groupByDay } from "@/lib/groupByDay";
import type { EventListItem } from "@/types";

/** A minimal event — only `date` matters to grouping. */
function event(id: number, date: string): EventListItem {
  return {
    id,
    sport: "bike",
    title: `Event ${id}`,
    date,
    meeting_point: "Flaucher",
    pace: "25 km/h",
    max_participants: null,
    lat: 48.1112,
    lng: 11.5514,
    route_points: null,
  };
}

/** An ISO UTC string `days` from now at the given *local* hour. */
function localIso(days: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

describe("groupByDay", () => {
  it("labels today and tomorrow rather than printing their dates", () => {
    const groups = groupByDay([event(1, localIso(0, 12)), event(2, localIso(1, 12))]);

    expect(groups.map((g) => g.label)).toEqual(["Today", "Tomorrow"]);
  });

  it("puts events on the same local day in one group", () => {
    const groups = groupByDay([event(1, localIso(3, 8)), event(2, localIso(3, 19))]);

    expect(groups).toHaveLength(1);
    expect(groups[0].events.map((e) => e.id)).toEqual([1, 2]);
  });

  it("groups by local day, not UTC day", () => {
    // 00:30 local is the previous day in UTC during CEST. Grouping on the raw
    // ISO string would file this under yesterday.
    const justAfterMidnight = localIso(2, 0, 30);
    const laterThatDay = localIso(2, 20);

    const groups = groupByDay([event(1, justAfterMidnight), event(2, laterThatDay)]);

    expect(groups).toHaveLength(1);
  });

  it("keeps the incoming order and does not merge non-adjacent days", () => {
    const groups = groupByDay([
      event(1, localIso(1, 9)),
      event(2, localIso(2, 9)),
      event(3, localIso(3, 9)),
    ]);

    expect(groups.map((g) => g.events[0].id)).toEqual([1, 2, 3]);
  });

  it("returns nothing for an empty list", () => {
    expect(groupByDay([])).toEqual([]);
  });

  it("gives each group a distinct key for React", () => {
    const groups = groupByDay([event(1, localIso(1, 9)), event(2, localIso(2, 9))]);
    const keys = groups.map((g) => g.key);

    expect(new Set(keys).size).toBe(keys.length);
  });
});
