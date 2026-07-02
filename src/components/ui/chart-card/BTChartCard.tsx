/**
 * BTChartCard — organism wrapper for chart molecules.
 *
 * Figma node 3404:2299 · ChartCard
 *
 * Layout order: Title + subtext → Summary? → Legend? → children (chart slot)
 *
 * @example
 * ```tsx
 * <BTChartCard
 *   title="Monthly Revenue"
 *   subtext="Last 10 months"
 *   summary={[{label:'Total',value:'1,248',unit:'%'}]}
 *   legend={[{label:'Revenue',color:'#0EA5E9'}]}
 * >
 *   <BTBarChart data={basicData} />
 * </BTChartCard>
 * ```
 */
import '@/components/ui/chart-card/BTChartCard.css';
import type { ReactNode } from 'react';
import type { BTChartLegendItem, BTChartSummaryItem } from '@/components/ui/chart-card/BTChartCard.types';

export interface BTChartCardProps {
  title: string;
  subtext?: string;
  summary?: BTChartSummaryItem[];
  legend?: BTChartLegendItem[];
  hasCard?: boolean;
  children?: ReactNode;
}

export function BTChartCard({
  title,
  subtext,
  summary,
  legend,
  hasCard = true,
  children,
}: BTChartCardProps) {
  return (
    <div className={`bt-chart-card${hasCard ? ' bt-chart-card--has-card' : ''}`}>
      {/* Header */}
      <div className="bt-chart-card__header-gap">
        <div className="bt-chart-card__title">{title}</div>
        {subtext && <div className="bt-chart-card__subtext">{subtext}</div>}
      </div>

      {/* Summary row */}
      {summary && summary.length > 0 && (
        <div className="bt-chart-card__summary">
          {summary.map((item, i) => (
            <div key={i} className="bt-chart-card__summary-item">
              <span className="bt-chart-card__summary-label">{item.label}</span>
              <div className="bt-chart-card__summary-value-row">
                <span className="bt-chart-card__summary-value">{item.value}</span>
                {item.unit && (
                  <span className="bt-chart-card__summary-unit">{item.unit}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend row (above chart) */}
      {legend && legend.length > 0 && (
        <div className="bt-chart-card__legend">
          {legend.map((item, i) => (
            <div key={i} className="bt-chart-card__legend-item">
              <span
                className="bt-chart-card__legend-swatch"
                style={{ background: item.color }}
              />
              <span className="bt-chart-card__legend-label">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart slot */}
      {children}
    </div>
  );
}
