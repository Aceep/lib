import { type ReactNode, useState } from "react";

/**
 * One drawing per mood. Each pose looks for its own sprite under /kyle/<pose>.png (or .gif when animated) and
 * falls back to the base drawing, flipped or tilted, until that sprite exists.
 */
export type KylePose = "default" | "search" | "sleep" | "carry" | "duplicate" | "error";

const FALLBACK_CLASS: Record<KylePose, string> = {
  default: "",
  search: " is-mirrored",
  sleep: " is-sleepy",
  carry: "",
  duplicate: " is-tilted",
  error: " is-mirrored",
};

export const BASE_SPRITE = "/Kyle.png";

export function spriteFor(pose: KylePose): string {
  return pose === "default" ? BASE_SPRITE : `/kyle/${pose}.png`;
}

/** Kyle, the yellow dinosaur, speaking in the first person where other apps print grey text. */
export function KyleSays({ children, pose = "default", size = "medium", className = "" }: { children: ReactNode; pose?: KylePose; size?: "small" | "medium" | "large"; className?: string }) {
  const [source, setSource] = useState(() => spriteFor(pose));
  const usesFallback = source === BASE_SPRITE;
  return (
    <div className={`kyle-says is-${size}${usesFallback ? FALLBACK_CLASS[pose] : ""} ${className}`.trim()}>
      <img className="kyle-says-figure" src={source} alt="" width="455" height="548" onError={() => setSource(BASE_SPRITE)} />
      <p className="kyle-says-bubble">{children}</p>
    </div>
  );
}
