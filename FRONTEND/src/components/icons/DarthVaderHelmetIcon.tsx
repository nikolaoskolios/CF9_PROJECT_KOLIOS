import type { HTMLAttributes } from "react"

import helmetMask from "/assets/images/darth-vader-helmet-mask.png"

// Rendered as a CSS mask (not <img>) so it fills with `currentColor` and
// follows the surrounding text color across light/dark theme automatically,
// from a single black-on-transparent asset.
export function DarthVaderHelmetIcon({
  className,
  style,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      role="img"
      aria-label="Darth Vader helmet"
      className={`inline-block bg-current ${className ?? ""}`}
      style={{
        WebkitMaskImage: `url(${helmetMask})`,
        maskImage: `url(${helmetMask})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        ...style,
      }}
      {...props}
    />
  )
}
