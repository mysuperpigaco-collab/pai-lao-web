// Generic per-session cache for list/search pages so that returning (Back)
// restores filters + the cards already loaded via infinite scroll + scroll
// position, instead of resetting to the first page.
//
// Keyed by a page name so multiple pages can use it independently.
// The (potentially large) item list is written only when it changes; the
// scroll offset is written to a separate tiny key on every scroll frame.

export interface SearchState<T = unknown> {
  filters: Record<string, string>;
  items: T[];
  total: number;
  page: number;
  scrollY: number;
  ts: number;
}

const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
const mainKey = (name: string) => `pl-search-${name}`;
const scrollKey = (name: string) => `pl-search-${name}-scroll`;

export function readSearchState<T = unknown>(name: string): SearchState<T> | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(mainKey(name));
    if (!raw) return null;
    const snap = JSON.parse(raw) as SearchState<T>;
    if (!snap || typeof snap.ts !== "number" || Date.now() - snap.ts > MAX_AGE_MS) {
      sessionStorage.removeItem(mainKey(name));
      sessionStorage.removeItem(scrollKey(name));
      return null;
    }
    const sy = sessionStorage.getItem(scrollKey(name));
    if (sy != null) {
      const n = Number(sy);
      if (Number.isFinite(n)) snap.scrollY = n;
    }
    return snap;
  } catch {
    return null;
  }
}

export function saveSearchState<T = unknown>(name: string, snap: Omit<SearchState<T>, "ts">): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(mainKey(name), JSON.stringify({ ...snap, ts: Date.now() }));
  } catch {
    // sessionStorage full / unavailable — ignore, it's only a convenience cache
  }
}

export function patchSearchScroll(name: string, scrollY: number): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(scrollKey(name), String(Math.round(scrollY)));
  } catch {
    // ignore
  }
}

export function clearSearchState(name: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(mainKey(name));
    sessionStorage.removeItem(scrollKey(name));
  } catch {
    // ignore
  }
}
