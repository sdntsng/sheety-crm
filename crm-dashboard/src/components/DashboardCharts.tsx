"use client";

import { useMemo } from "react";

type FunnelDatum = { stage: string; count: number; value: number };
type TrendDatum = { week_start: string; count: number };
type MixDatum = { label: string; count: number };

interface DashboardChartsProps {
  funnelData: FunnelDatum[];
  trendData: TrendDatum[];
  mixData: MixDatum[];
}

const CHART_COLORS = [
  "#1f6feb",
  "#2ea043",
  "#bc8cff",
  "#d29922",
  "#f85149",
  "#4f8cc9",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const toPoint = (angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(radians),
      y: cy + radius * Math.sin(radians),
    };
  };
  const start = toPoint(startAngle);
  const end = toPoint(endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

export default function DashboardCharts({
  funnelData,
  trendData,
  mixData,
}: DashboardChartsProps) {
  const maxFunnel = Math.max(...funnelData.map((item) => item.count), 1);
  const maxTrend = Math.max(...trendData.map((item) => item.count), 1);
  const totalMix = Math.max(mixData.reduce((sum, item) => sum + item.count, 0), 1);

  const mixSegments = useMemo(() => {
    return mixData.reduce<
      Array<MixDatum & { startAngle: number; endAngle: number; color: string }>
    >((segments, item, index) => {
      const previousEnd = segments.length > 0 ? segments[segments.length - 1].endAngle : -90;
      const angle = (item.count / totalMix) * 360;
      segments.push({
        ...item,
        startAngle: previousEnd,
        endAngle: previousEnd + angle,
        color: CHART_COLORS[index % CHART_COLORS.length],
      });
      return segments;
    }, []);
  }, [mixData, totalMix]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section className="paper-card p-4 bg-white">
        <h3 className="font-sans font-bold text-lg mb-3">Pipeline Funnel</h3>
        <div className="space-y-3">
          {funnelData.map((item, index) => (
            <div key={item.stage} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">
                  {item.stage}
                </span>
                <span className="font-mono text-xs">
                  {item.count} • {formatCurrency(item.value)}
                </span>
              </div>
              <div className="h-3 bg-[var(--bg-paper)] border border-[var(--border-pencil)] rounded-full overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.max((item.count / maxFunnel) * 100, 4)}%`,
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                  title={`${item.stage}: ${item.count} deals (${formatCurrency(item.value)})`}
                />
              </div>
            </div>
          ))}
          {funnelData.length === 0 && (
            <p className="font-mono text-xs text-[var(--text-secondary)]">
              No stage data available.
            </p>
          )}
        </div>
      </section>

      <section className="paper-card p-4 bg-white">
        <h3 className="font-sans font-bold text-lg mb-3">New Deals Trend</h3>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 420 190" className="w-full min-w-[320px]">
            <line x1="32" y1="160" x2="390" y2="160" stroke="#9ca3af" strokeWidth="1" />
            <line x1="32" y1="20" x2="32" y2="160" stroke="#9ca3af" strokeWidth="1" />
            {trendData.map((item, index) => {
              const x = 32 + (index * 358) / Math.max(trendData.length - 1, 1);
              const y = 160 - (item.count / maxTrend) * 130;
              const next = trendData[index + 1];
              const nextX = next
                ? 32 + ((index + 1) * 358) / Math.max(trendData.length - 1, 1)
                : x;
              const nextY = next ? 160 - (next.count / maxTrend) * 130 : y;
              return (
                <g key={item.week_start}>
                  {next && (
                    <line
                      x1={x}
                      y1={y}
                      x2={nextX}
                      y2={nextY}
                      stroke="#1f6feb"
                      strokeWidth="3"
                    />
                  )}
                  <circle cx={x} cy={y} r="5" fill="#1f6feb">
                    <title>{`${item.week_start}: ${item.count} new deals`}</title>
                  </circle>
                  <text x={x} y={176} textAnchor="middle" className="text-[9px] fill-gray-600">
                    {new Date(item.week_start).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      <section className="paper-card p-4 bg-white">
        <h3 className="font-sans font-bold text-lg mb-3">Lead Mix</h3>
        <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
          <svg viewBox="0 0 180 180" className="w-40 h-40">
            {mixSegments.map((segment) => (
              <path
                key={segment.label}
                d={describeArc(90, 90, 76, segment.startAngle, segment.endAngle)}
                fill={segment.color}
              >
                <title>{`${segment.label}: ${segment.count} leads`}</title>
              </path>
            ))}
            <circle cx="90" cy="90" r="38" fill="white" />
            <text x="90" y="95" textAnchor="middle" className="text-[10px] fill-gray-700">
              {totalMix} leads
            </text>
          </svg>
          <div className="space-y-1">
            {mixSegments.map((segment) => (
              <div key={segment.label} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="font-mono text-[10px] text-[var(--text-secondary)] truncate">
                  {segment.label} ({segment.count})
                </span>
              </div>
            ))}
            {mixSegments.length === 0 && (
              <p className="font-mono text-xs text-[var(--text-secondary)]">
                No lead mix data available.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
