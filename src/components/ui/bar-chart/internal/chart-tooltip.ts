// chart-tooltip.ts — builds the HTML string for ApexCharts custom tooltip.
// Renders a dark balloon matching Figma 3404:2299 (BTChartCard tooltip spec).

import type { BTChartTooltipItem } from '@/components/ui/bar-chart/internal/chart.types';

export interface BTChartTooltipOptions {
  placement?: 'left' | 'right' | 'none';
}

/**
 * Generates an HTML string for use in ApexCharts `tooltip.custom` callback.
 *
 * @param title  Optional headline centered at the top (e.g. "Jan", "A 40%").
 * @param items  Optional legend rows below the separator.
 * @returns HTML string ready to be returned from the ApexCharts custom function.
 */
export function buildTooltipHtml(
  title: string | null | undefined,
  items: BTChartTooltipItem[],
  options: BTChartTooltipOptions = {},
): string {
  const hasItems = items.length > 0;
  const placement = options.placement ?? 'left';
  const arrowPath = placement === 'right'
    ? 'M8 0 L1 7 Q0 8 1 9 L8 16 Z'
    : 'M0 0 L7 7 Q8 8 7 9 L0 16 Z';

  const titleHtml = title
    ? `<div class="bt-chart-tooltip__title">${escapeHtml(title)}</div>`
    : '';

  const separatorHtml =
    title && hasItems
      ? `<div class="bt-chart-tooltip__separator"></div>`
      : '';

  const rowsHtml = hasItems
    ? items
        .map(
          (item) => `
        <div class="bt-chart-tooltip__row">
          <span class="bt-chart-tooltip__swatch" style="background:${item.color}"></span>
          ${item.label ? `<span class="bt-chart-tooltip__label">${escapeHtml(item.label)}</span>` : ''}
          <span class="bt-chart-tooltip__value">${escapeHtml(item.value)}</span>
        </div>`,
        )
        .join('')
    : '';

  const bodyHtml = `
    <div class="bt-chart-tooltip__body">
      ${titleHtml}
      ${separatorHtml}
      ${rowsHtml}
    </div>
  `;

  if (placement === 'none') {
    return `<div class="bt-chart-tooltip bt-chart-tooltip--plain">${bodyHtml}</div>`;
  }

  return `
    <div class="bt-chart-tooltip bt-chart-tooltip--${placement}">
      <div class="bt-chart-tooltip__arrow-col" aria-hidden="true">
        <svg class="bt-chart-tooltip__arrow" width="8" height="16" viewBox="0 0 8 16" fill="none">
          <path d="${arrowPath}" fill="var(--bg-inverse)"></path>
        </svg>
      </div>
      ${bodyHtml}
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
