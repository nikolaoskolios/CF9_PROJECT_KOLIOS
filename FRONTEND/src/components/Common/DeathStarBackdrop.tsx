import deathStarBg from "/assets/images/death-star-bg.png"

/**
 * Decorative Death Star image fixed to the top-right of the viewport.
 * Purely visual: no pointer events, and painted early enough in the DOM
 * that opaque foreground content (cards, tables, forms) still occludes it.
 */
export function DeathStarBackdrop() {
  return (
    <img
      src={deathStarBg}
      alt=""
      aria-hidden="true"
      className="fixed top-0 right-0 h-[75vh] w-auto opacity-[0.18] pointer-events-none select-none"
    />
  )
}
