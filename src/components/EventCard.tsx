import { Badge } from "@/components/ui/badge";
import { routeColorFor } from "@/lib/routeColors";
import { routeThumbnailPath } from "@/lib/routeThumbnail";
import { cn } from "@/lib/utils";
import { SPORT_LABELS, type EventListItem } from "@/types";

const THUMBNAIL_WIDTH = 48;
const THUMBNAIL_HEIGHT = 28;

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventCard({
  event,
  selected,
  onClick,
}: {
  event: EventListItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-md border p-2 text-left text-sm transition-colors hover:bg-muted",
        selected ? "border-primary bg-muted" : "border-border"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">{event.title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {/* The shape, not an accurate mini-map — same color as this
              event's line on the main map, via routeColorFor(event.id). */}
          {event.route_points && event.route_points.length > 1 && (
            <svg
              width={THUMBNAIL_WIDTH}
              height={THUMBNAIL_HEIGHT}
              viewBox={`0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}`}
              aria-hidden="true"
            >
              <path
                d={routeThumbnailPath(event.route_points, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)}
                fill="none"
                stroke={routeColorFor(event.id)}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <Badge variant="secondary">{SPORT_LABELS[event.sport]}</Badge>
        </div>
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {formatDate(event.date)} · {event.meeting_point}
      </p>
    </button>
  );
}
