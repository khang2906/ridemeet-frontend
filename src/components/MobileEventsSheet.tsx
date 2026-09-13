"use client";

import { useEffect, useRef, useState } from "react";
import { GripHorizontal } from "lucide-react";

import { EventCard } from "@/components/EventCard";
import { SportFilterSelect } from "@/components/SportFilterSelect";
import { groupByDay } from "@/lib/groupByDay";
import type { EventListItem, Sport } from "@/types";

export type SheetSnap = "collapsed" | "half" | "full";

const COLLAPSED_HEIGHT = 88; // just the handle + "N events" row
const HALF_FRACTION = 0.45; // of viewport height
const FULL_FRACTION = 0.9;

// Google/Apple Maps-style draggable bottom sheet for phone widths (the
// left floating panel used at md: and up doesn't fit a phone screen). Drag
// is only wired up on the handle bar, not the whole sheet — letting the
// event list underneath scroll normally at half/full height without the
// drag-vs-scroll gesture arbitration a full native sheet needs.
export function MobileEventsSheet({
  sport,
  events,
  selectedEventId,
  onSelectEvent,
  snap,
  onSnapChange,
  filteredByViewport,
}: {
  sport: Sport | undefined;
  events: EventListItem[];
  selectedEventId: number | null;
  onSelectEvent: (id: number) => void;
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  filteredByViewport: boolean;
}) {
  const groups = groupByDay(events);
  // Snap heights depend on viewport height, which isn't known during SSR —
  // these fallbacks just avoid a flash of the wrong size before the effect
  // below runs; they're immediately replaced on mount.
  const [heights, setHeights] = useState({ half: 320, full: 640 });
  useEffect(() => {
    function updateHeights() {
      setHeights({
        half: window.innerHeight * HALF_FRACTION,
        full: window.innerHeight * FULL_FRACTION,
      });
    }
    updateHeights();
    window.addEventListener("resize", updateHeights);
    return () => window.removeEventListener("resize", updateHeights);
  }, []);

  const snapHeight: Record<SheetSnap, number> = {
    collapsed: COLLAPSED_HEIGHT,
    half: heights.half,
    full: heights.full,
  };

  // While dragging, the sheet follows the finger directly (no transition,
  // no snapping) — visibleHeight holds that live value. It's null when not
  // dragging, so the CSS height falls back to the committed `snap` prop.
  const [visibleHeight, setVisibleHeight] = useState<number | null>(null);
  const dragStart = useRef<{ pointerY: number; startHeight: number } | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { pointerY: e.clientY, startHeight: snapHeight[snap] };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragStart.current) return;
    const delta = dragStart.current.pointerY - e.clientY; // up = positive
    const next = dragStart.current.startHeight + delta;
    setVisibleHeight(Math.min(heights.full, Math.max(COLLAPSED_HEIGHT, next)));
  }

  function handlePointerUp() {
    if (visibleHeight != null) {
      // Snap to whichever of the three points is closest to where it was
      // released, rather than tracking velocity/flick direction — simpler,
      // and still feels natural for a list this short.
      const distances: [SheetSnap, number][] = [
        ["collapsed", Math.abs(visibleHeight - COLLAPSED_HEIGHT)],
        ["half", Math.abs(visibleHeight - heights.half)],
        ["full", Math.abs(visibleHeight - heights.full)],
      ];
      distances.sort((a, b) => a[1] - b[1]);
      onSnapChange(distances[0][0]);
    }
    dragStart.current = null;
    setVisibleHeight(null);
  }

  const currentHeight = visibleHeight ?? snapHeight[snap];
  const isDragging = visibleHeight != null;

  return (
    <div
      className="absolute right-0 bottom-0 left-0 z-10 flex flex-col rounded-t-lg border-t border-border bg-background/95 shadow-md backdrop-blur"
      style={{
        height: currentHeight,
        transition: isDragging ? "none" : "height 200ms ease-out",
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (!isDragging) onSnapChange(snap === "collapsed" ? "half" : "collapsed");
        }}
        className="flex shrink-0 cursor-grab touch-none flex-col items-center gap-1 py-2 active:cursor-grabbing"
      >
        <GripHorizontal size={20} className="text-muted-foreground" />
        <div className="flex w-full items-center justify-between px-4">
          <span className="text-sm font-medium">
            {events.length} {events.length === 1 ? "event" : "events"}
          </span>
          {/* Stops both events at this boundary — otherwise a tap here
              bubbles up to the handle bar's own pointerdown/click handlers,
              which read it as "the user tapped/dragged the sheet" and toggle
              the snap point. That's what made picking a sport also collapse
              the whole list: the dropdown and the drag handle were fighting
              over the same tap. */}
          <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
            <SportFilterSelect sport={sport} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {events.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {filteredByViewport
              ? "No events in this area. Try zooming out or panning the map."
              : "No upcoming events."}
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.key}>
              <h3 className="sticky top-0 z-10 bg-background/95 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
                {group.label}
              </h3>
              <div className="space-y-2 pb-2">
                {group.events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    selected={event.id === selectedEventId}
                    onClick={() => onSelectEvent(event.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
