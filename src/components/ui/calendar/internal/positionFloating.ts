/**
 * positionFloating — shared smart-flip positioning utility.
 *
 * Measures available space around a trigger element and places a floating
 * panel (already rendered in the DOM at position:fixed) below or above
 * depending on which direction has more room. Clamps horizontally so the
 * panel never overflows the viewport edges.
 *
 * Usage:
 *   // After the panel is in the DOM (watch flush:'post' or nextTick):
 *   positionBelow(triggerEl, panelEl, { gap: 4, margin: 8 });
 *
 * Also exported: positionDropdown — same algorithm but centres the panel
 * horizontally over an anchor element (for header pill dropdowns).
 */

export interface PositionOptions {
  /** Gap between trigger edge and panel edge. Default: 4. */
  gap?: number;
  /** Minimum distance from viewport edges. Default: 8. */
  margin?: number;
}

/**
 * Position a panel below or above `trigger`, left-aligned (then clamped).
 * Mutates `panel.style.top / left` and returns the resolved direction.
 */
export function positionBelow(
  trigger: HTMLElement,
  panel: HTMLElement,
  opts: PositionOptions = {},
): 'below' | 'above' {
  const { gap = 4, margin = 8 } = opts;
  const tRect = trigger.getBoundingClientRect();
  const pRect = panel.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // ── Vertical: prefer below, flip above when there's not enough space ────────
  const spaceBelow = vh - tRect.bottom - gap;
  const spaceAbove = tRect.top - gap;
  const goAbove    = spaceBelow < pRect.height && spaceAbove >= pRect.height;

  const top = goAbove
    ? tRect.top  - pRect.height - gap
    : tRect.bottom + gap;

  // ── Horizontal: align to trigger start edge, clamp to viewport ─────────────
  const isRtl = getComputedStyle(trigger).direction === 'rtl';
  let left = isRtl ? tRect.right - pRect.width : tRect.left;
  if (left + pRect.width > vw - margin) left = vw - margin - pRect.width;
  if (left < margin)                    left = margin;

  panel.style.top  = `${Math.round(top)}px`;
  panel.style.left = `${Math.round(left)}px`;

  return goAbove ? 'above' : 'below';
}

export type PopoverSide   = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign  = 'start' | 'center' | 'end';

/**
 * Position a popover panel relative to a trigger with auto-flip on all axes.
 * Respects the requested `side` but flips to the opposite if there is no room.
 */
export function positionPopover(
  trigger: HTMLElement,
  panel: HTMLElement,
  opts: { side?: PopoverSide; align?: PopoverAlign; sideOffset?: number; margin?: number } = {},
): void {
  const { side = 'bottom', align = 'start', sideOffset = 8, margin = 8 } = opts;
  const tRect = trigger.getBoundingClientRect();
  const pRect = panel.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // ── Resolve side with auto-flip ─────────────────────────────────────────────
  let resolvedSide = side;
  if (side === 'bottom') {
    const fits = vh - tRect.bottom - sideOffset >= pRect.height;
    if (!fits && tRect.top - sideOffset >= pRect.height) resolvedSide = 'top';
  } else if (side === 'top') {
    const fits = tRect.top - sideOffset >= pRect.height;
    if (!fits && vh - tRect.bottom - sideOffset >= pRect.height) resolvedSide = 'bottom';
  } else if (side === 'right') {
    const fits = vw - tRect.right - sideOffset >= pRect.width;
    if (!fits && tRect.left - sideOffset >= pRect.width) resolvedSide = 'left';
  } else /* left */ {
    const fits = tRect.left - sideOffset >= pRect.width;
    if (!fits && vw - tRect.right - sideOffset >= pRect.width) resolvedSide = 'right';
  }

  // ── Main axis ───────────────────────────────────────────────────────────────
  let top  = 0;
  let left = 0;
  if      (resolvedSide === 'bottom') top  = tRect.bottom + sideOffset;
  else if (resolvedSide === 'top')    top  = tRect.top - pRect.height - sideOffset;
  else if (resolvedSide === 'right')  left = tRect.right  + sideOffset;
  else /* left */                     left = tRect.left  - pRect.width - sideOffset;

  // ── Cross axis (alignment) — flip start/end in RTL ──────────────────────────
  const isRtl = getComputedStyle(trigger).direction === 'rtl';
  const resolvedAlign = isRtl
    ? (align === 'start' ? 'end' : align === 'end' ? 'start' : align)
    : align;

  if (resolvedSide === 'top' || resolvedSide === 'bottom') {
    if      (resolvedAlign === 'start')  left = tRect.left;
    else if (resolvedAlign === 'center') left = tRect.left + tRect.width / 2 - pRect.width / 2;
    else /* end */                       left = tRect.right - pRect.width;

    // Clamp horizontally
    left = Math.min(left, vw - margin - pRect.width);
    left = Math.max(left, margin);
  } else {
    if      (align === 'start')  top = tRect.top;
    else if (align === 'center') top = tRect.top + tRect.height / 2 - pRect.height / 2;
    else /* end */               top = tRect.bottom - pRect.height;

    // Clamp vertically
    top = Math.min(top, vh - margin - pRect.height);
    top = Math.max(top, margin);
  }

  panel.style.top  = `${Math.round(top)}px`;
  panel.style.left = `${Math.round(left)}px`;
}

/**
 * Position a small dropdown centred horizontally over `anchor`, below or above.
 * Used by BTCalendarHeader month/year pills.
 */
export function positionCentered(
  anchor: HTMLElement,
  dropdown: HTMLElement,
  opts: PositionOptions = {},
): void {
  const { gap = 4, margin = 8 } = opts;
  const aRect = anchor.getBoundingClientRect();
  const dRect = dropdown.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Vertical: prefer below, flip above
  const spaceBelow = vh - aRect.bottom - gap;
  const spaceAbove = aRect.top - gap;
  const goAbove    = spaceBelow < dRect.height && spaceAbove >= dRect.height;

  const top = goAbove
    ? aRect.top  - dRect.height - gap
    : aRect.bottom + gap;

  // Horizontal: centre over anchor, clamp
  let left = aRect.left + aRect.width / 2 - dRect.width / 2;
  if (left + dRect.width > vw - margin) left = vw - margin - dRect.width;
  if (left < margin)                    left = margin;

  dropdown.style.top  = `${Math.round(top)}px`;
  dropdown.style.left = `${Math.round(left)}px`;
}
