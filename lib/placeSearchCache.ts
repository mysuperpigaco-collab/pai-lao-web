// Remembers the place search/explore state for one browser session so that
// returning to /place (e.g. Back from a place detail) restores the filters,
// the cards already loaded via infinite scroll, and the scroll position —
// instead of resetting to the first page.
//
// The (potentially large) snapshot is written only when filters/cards change.
// The scroll position is written to a separate tiny key on every scroll frame,
// so scrolling never re-serializes the whole card list.

export interface PlaceSearchSnapshot<T = unknown> {
  cat: string;
  province: string;
  district: string;
  sort: string;
  q: string;
  inputQ: string;
  places: T[];
  total: number;
  page: number;
  scrollY: number;
  ts: number;
}

const KEY = "pl-place-search";
const SCROLL_KEY = "pl-place-search-scroll";
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

export function readPlaceSearch<T = unknown>(): PlaceSearchSnapshot<T> | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as PlaceSearchSnapshot<T>;
    if (!snap || typeof snap.ts !== "number" || Date.now() - snap.ts > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      sessionStorage.removeItem(SCROLL_KEY);
      return null;
    }
    // Overlay the latest scroll position (written separately on every frame)
    const sy = sessionStorage.getItem(SCROLL_KEY);
    if (sy != null) {
      const n = Number(sy);
      if (Number.isFinite(n)) snap.scrollY = n;
    }
    return snap;
  } catch {
    return null;
  }
}

export function savePlaceSearch<T = unknown>(snap: Omit<PlaceSearchSnapshot<T>, "ts">): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...snap, ts: Date.now() }));
  } catch {
    // sessionStorage full / unavailable — ignore, it's only a convenience cache
  }
}

export function patchPlaceSearchScroll(scrollY: number): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SCROLL_KEY, String(Math.round(scrollY)));
  } catch {
    // ignore
  }
}

export function clearPlaceSearch(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(SCROLL_KEY);
  } catch {
    // ignore
  }
}
