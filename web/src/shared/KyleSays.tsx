import type { ReactNode } from "react";

type Pose = "default" | "mirrored" | "sleepy";

const POSE_CLASS: Record<Pose, string> = {
  default: "",
  mirrored: " is-mirrored",
  sleepy: " is-sleepy",
};

/**
 * Kyle, the yellow dinosaur, speaking in the first person. Used where the other apps print grey text:
 * empty states, warnings, greetings. One drawing for now, flipped or tilted to suggest a mood.
 */
export function KyleSays({ children, pose = "default", size = "medium", className = "" }: { children: ReactNode; pose?: Pose; size?: "small" | "medium" | "large"; className?: string }) {
  return (
    <div className={`kyle-says is-${size}${POSE_CLASS[pose]} ${className}`.trim()}>
      <img className="kyle-says-figure" src="/Kyle.png" alt="" width="455" height="548" />
      <p className="kyle-says-bubble">{children}</p>
    </div>
  );
}
