// Override the global curtain loading screen for the place detail route only.
// With View Transitions enabled, the previous page stays visible until the
// detail RSC is ready, then the shared cover image morphs into the hero.
// A full-screen curtain here would hide that morph, so we render nothing.
export default function Loading() {
  return null;
}
