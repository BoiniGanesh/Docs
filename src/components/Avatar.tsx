const COLORS = ["bg-blue-600", "bg-emerald-600", "bg-purple-600", "bg-amber-600", "bg-rose-600"];

/** Initials avatar with a stable color per name. */
export default function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  const dims = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full text-white font-semibold ${color} ${dims}`}>
      {initials}
    </span>
  );
}
