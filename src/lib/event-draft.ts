/**
 * The "Post an event" form: its data shape, validation rules, and
 * conversion into a real FreeEvent. Kept separate from the UI so the rules
 * are easy to find and change (and can be reused on the server later).
 */
import type { Area } from "./site";
import { toIsoInSiteZone } from "./dates";
import type { CategoryId, FreeEvent } from "./types";

export interface EventDraft {
  title: string;
  category: CategoryId | "";
  date: string; // "2026-11-21" (from <input type="date">)
  startTime: string; // "18:00"
  endTime: string; // optional
  venue: string;
  address: string;
  area: Area | "";
  description: string;
  coverImage: string; // optional data URL
  tags: string; // comma separated, e.g. "jazz, outdoor"
  link: string; // optional
  organizer: string;
  confirmFree: boolean;
}

export type DraftErrors = Partial<Record<keyof EventDraft, string>>;

export const EMPTY_DRAFT: EventDraft = {
  title: "",
  category: "",
  date: "",
  startTime: "18:00",
  endTime: "",
  venue: "",
  address: "",
  area: "",
  description: "",
  coverImage: "",
  tags: "",
  link: "",
  organizer: "",
  confirmFree: false,
};

export const LIMITS = {
  titleMax: 80,
  descriptionMin: 20,
  descriptionMax: 1000,
};

/** Field order matters: the form focuses the FIRST field with an error. */
export function validateDraft(draft: EventDraft, now: Date): DraftErrors {
  const errors: DraftErrors = {};
  const title = draft.title.trim();
  const description = draft.description.trim();

  if (title.length < 3) errors.title = "Give your event a name (at least 3 characters).";
  else if (title.length > LIMITS.titleMax) errors.title = `Keep the name under ${LIMITS.titleMax} characters.`;

  if (!draft.category) errors.category = "Pick a category so people can find it.";

  if (!draft.date) errors.date = "Choose a date.";
  if (!draft.startTime) errors.startTime = "Choose a start time.";
  if (draft.date && draft.startTime) {
    const start = new Date(toIsoInSiteZone(draft.date, draft.startTime));
    if (start.getTime() < now.getTime()) errors.date = "This date and time has already passed.";
    if (draft.endTime && draft.endTime <= draft.startTime) {
      errors.endTime = "End time should be after the start time.";
    }
  }

  if (!draft.venue.trim()) errors.venue = "Where is it? Add the venue or place name.";
  if (!draft.address.trim()) errors.address = "Add an address so people can get there.";
  if (!draft.area) errors.area = "Pick the area.";

  if (description.length < LIMITS.descriptionMin) {
    errors.description = `Tell people a bit more (at least ${LIMITS.descriptionMin} characters).`;
  } else if (description.length > LIMITS.descriptionMax) {
    errors.description = `Keep it under ${LIMITS.descriptionMax} characters.`;
  }

  if (draft.link.trim() && !isHttpUrl(draft.link.trim())) {
    errors.link = "Enter a full link starting with https://";
  }

  if (!draft.organizer.trim()) errors.organizer = "Who's hosting? (your name or group)";

  if (!draft.confirmFree) errors.confirmFree = "Only free events can be posted.";

  return errors;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** "Jazz, #outdoor ,  picnic" -> ["jazz", "outdoor", "picnic"] */
export function parseTags(input: string): string[] {
  const tags = input
    .split(",")
    .map((t) => t.trim().replace(/^#/, "").toLowerCase())
    .filter(Boolean);
  return [...new Set(tags)].slice(0, 8);
}

/**
 * Builds a FreeEvent from the form. Missing values get placeholders so this
 * also works for the live preview while the form is half-filled.
 */
export function draftToEvent(draft: EventDraft, id: string, fallbackStart: Date): FreeEvent {
  const hasDate = Boolean(draft.date && draft.startTime);
  return {
    id,
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category || "community",
    startsAt: hasDate ? toIsoInSiteZone(draft.date, draft.startTime) : fallbackStart.toISOString(),
    endsAt: hasDate && draft.endTime ? toIsoInSiteZone(draft.date, draft.endTime) : undefined,
    venue: draft.venue.trim(),
    address: draft.address.trim(),
    area: draft.area || "Phoenix",
    organizer: draft.organizer.trim(),
    link: draft.link.trim() || undefined,
    coverImage: draft.coverImage || undefined,
    tags: parseTags(draft.tags),
    interestedCount: 0,
    source: "local",
  };
}

/** Unique-enough id for locally posted events. A database will generate real ids. */
export function createLocalEventId(): string {
  return `local-${crypto.randomUUID().slice(0, 8)}`;
}
