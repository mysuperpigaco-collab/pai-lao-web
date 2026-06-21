// Canonical trip-mood list. `value` is what gets stored in DB (Trip.mood /
// Trip.moods) — it matches the legacy <option> values so old data still works.
// `th` is the short label shown on chips; `icon` for the picker/filter.
export interface TripMood {
  value: string;
  icon: string;
  th: string;
  en: string;
}

export const TRIP_MOODS: TripMood[] = [
  { value: "Cafe Hopping",       icon: "☕",  th: "คาเฟ่",      en: "Café" },
  { value: "สายลุย Adventurous",  icon: "🧗",  th: "สายลุย",     en: "Adventure" },
  { value: "กินแหลก Foodie",      icon: "🍲",  th: "กินแหลก",    en: "Foodie" },
  { value: "พักผ่อน Relaxing",    icon: "🏖️", th: "พักผ่อน",    en: "Relaxing" },
  { value: "ธรรมชาติ Nature",     icon: "🌿",  th: "ธรรมชาติ",   en: "Nature" },
  { value: "วัฒนธรรม Culture",    icon: "🛕",  th: "วัฒนธรรม",   en: "Culture" },
];

export const TRIP_MOOD_VALUES = TRIP_MOODS.map(m => m.value);

/** Short label for a stored mood value (handles legacy strings via prefix match). */
export function tripMoodLabel(value: string): string {
  const m = TRIP_MOODS.find(x => x.value === value || value.startsWith(x.th));
  return m ? m.th : value;
}
