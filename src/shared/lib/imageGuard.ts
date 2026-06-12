import type { MouseEvent } from "react";

/** Basic anti-save deterrent: disables drag + right-click menu on images.
 *  NOTE: deterrent only — image bytes still reach the browser, so this does
 *  not prevent a determined download (DevTools, screenshot, JS disabled). */
export const imageGuardProps = {
  draggable: false,
  onContextMenu: (e: MouseEvent) => e.preventDefault(),
} as const;
