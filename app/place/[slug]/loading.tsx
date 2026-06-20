// No curtain on the place detail route, so the card→hero View Transition
// can play uninterrupted. The page now resolves in ~300ms, so the gap is
// tiny; during a card-click transition the previous page stays frozen on
// screen (the morph overlay covers this), so users never see a blank.
export default function Loading() {
  return null;
}
