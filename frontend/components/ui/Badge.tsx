import { clsx } from "clsx";

const colors = {
  blue: "bg-blue-900/40 text-blue-300 ring-blue-800/50",
  green: "bg-green-900/40 text-green-300 ring-green-800/50",
  red: "bg-red-900/40 text-red-300 ring-red-800/50",
  zinc: "bg-zinc-800 text-zinc-300 ring-zinc-700",
  amber: "bg-amber-900/40 text-amber-300 ring-amber-800/50",
};

interface Props {
  color?: keyof typeof colors;
  children: React.ReactNode;
}

export function Badge({ color = "zinc", children }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        colors[color]
      )}
    >
      {children}
    </span>
  );
}
