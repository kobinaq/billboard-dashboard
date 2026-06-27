import { cn } from "lib/utils";

export function Card({ className, children }) {
  return <section className={cn("panel p-6", className)}>{children}</section>;
}
