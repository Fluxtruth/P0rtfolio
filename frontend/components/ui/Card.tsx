import { type HTMLAttributes } from "react";
import { clsx } from "clsx";

interface Props extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function Card({ title, children, className, ...props }: Props) {
  return (
    <div
      className={clsx("rounded-xl border border-zinc-800 bg-zinc-900 p-5", className)}
      {...props}
    >
      {title && (
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
