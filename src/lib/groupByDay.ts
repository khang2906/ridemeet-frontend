import type { EventListItem } from "@/types";

// Hand-rolled rather than left to toLocaleDateString: Node's SSR runtime and
// the browser can carry different ICU/locale data for the same "de-DE" short-
// weekday format — observed producing "Di. 15. Sept." on one side and
// "Di., 15. Sept." on the other for the identical Date. That's a real
// hydration mismatch, not a cosmetic one: React discards and re-renders the
// whole label client-side when server and client output disagree. A fixed
// table can't disagree with itself, since nothing about it depends on the
// runtime's locale data.
const WEEKDAYS_DE_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTHS_DE_SHORT = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

export interface EventDayGroup {
  /** "Today", "Tomorrow", or a date like "Sa, 5. Sep". */
  label: string;
  /** Stable key for React — the local calendar date, e.g. "2026-09-05". */
  key: string;
  events: EventListItem[];
}

/** The local calendar day an ISO timestamp falls on, as "YYYY-MM-DD". */
function localDayKey(date: Date): string {
  // Built from the local getters rather than toISOString(), which would use UTC
  // and put a 00:30 Munich event on the previous day.
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function labelFor(date: Date, now: Date): string {
  const today = localDayKey(now);

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = localDayKey(tomorrowDate);

  const key = localDayKey(date);
  if (key === today) return "Today";
  if (key === tomorrow) return "Tomorrow";

  return `${WEEKDAYS_DE_SHORT[date.getDay()]}, ${date.getDate()}. ${MONTHS_DE_SHORT[date.getMonth()]}`;
}

/**
 * Group events into consecutive day buckets, preserving the incoming order.
 *
 * The API already sorts by date, so this only has to detect where one day ends
 * and the next begins — no sorting, and events for the same day can't end up in
 * two separate buckets.
 *
 * Day boundaries are computed in the *viewer's* timezone. Dates arrive as UTC
 * ISO strings, so a ride at 00:30 Munich time is 22:30 UTC the day before —
 * grouping on the raw string would file it under the wrong day.
 */
export function groupByDay(events: EventListItem[]): EventDayGroup[] {
  const now = new Date();
  const groups: EventDayGroup[] = [];

  for (const event of events) {
    const date = new Date(event.date);
    const key = localDayKey(date);

    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.events.push(event);
    } else {
      groups.push({ key, label: labelFor(date, now), events: [event] });
    }
  }

  return groups;
}
