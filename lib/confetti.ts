export async function fireConfetti(colors?: string[]) {
  const confetti = (await import("canvas-confetti")).default;
  confetti({
    particleCount: 90,
    spread: 65,
    origin: { y: 0.72 },
    colors: colors ?? ["#4facfe", "#43e97b", "#f59e0b", "#ec4899", "#a78bfa"],
  });
}

export function tryFireConfetti(key: string, colors?: string[]) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, "1");
  fireConfetti(colors);
}
