'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const CHART_COLORS = [
  'var(--sol-chart-1)',
  'var(--sol-chart-2)',
  'var(--sol-chart-3)',
  'var(--sol-chart-4)',
  'var(--sol-chart-5)',
];

const axisStyle = {
  fontSize: 11,
  fontWeight: 600,
  fill: 'var(--sol-text-3)',
} as const;

function TooltipBox({ active, payload, label, money, suffix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="sol-chart-tip">
      {label ? <div className="k" style={{ marginBottom: 4 }}>{label}</div> : null}
      {payload.map((entry: any) => (
        <div key={entry.dataKey || entry.name} className="sol-row" style={{ gap: 8 }}>
          <span
            className="sol-swatch"
            style={{ background: entry.color || entry.payload?.fill, width: 7, height: 7 }}
          />
          <span className="k" style={{ flex: 1 }}>{entry.name}</span>
          <span className="v">
            {money ? `₦${Number(entry.value || 0).toLocaleString()}` : `${entry.value}${suffix || ''}`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({
  data,
  color = 'var(--sol-chart-1)',
  height = 30,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const rows = data.map((v, i) => ({ i, v }));
  const id = React.useId().replace(/[:]/g, '');
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#spark-${id})`}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export type TrendSeries = { key: string; name: string; color?: string; area?: boolean };

export function TrendChart({
  data,
  series,
  xKey = 'label',
  height = 260,
  money,
  yFormat,
  showGrid = true,
}: {
  data: Record<string, any>[];
  series: TrendSeries[];
  xKey?: string;
  height?: number;
  money?: boolean;
  yFormat?: (value: number) => string;
  showGrid?: boolean;
}) {
  return (
    <div className="sol-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -14, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`grad-${s.key}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color || CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.26} />
                <stop offset="100%" stopColor={s.color || CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>
          {showGrid ? (
            <CartesianGrid stroke="var(--sol-border)" strokeDasharray="3 5" vertical={false} />
          ) : null}
          <XAxis
            dataKey={xKey}
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            dy={6}
            minTickGap={18}
          />
          <YAxis
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            width={58}
            tickFormatter={(v: number) => (yFormat ? yFormat(v) : String(v))}
          />
          <Tooltip
            content={<TooltipBox money={money} />}
            cursor={{ stroke: 'var(--sol-border-strong)', strokeDasharray: '4 4' }}
          />
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color || CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2.2}
              fill={s.area === false ? 'transparent' : `url(#grad-${s.key}-${i})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--sol-surface)' }}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarsChart({
  data,
  series,
  xKey = 'label',
  height = 240,
  money,
  stacked,
  yFormat,
}: {
  data: Record<string, any>[];
  series: TrendSeries[];
  xKey?: string;
  height?: number;
  money?: boolean;
  stacked?: boolean;
  yFormat?: (value: number) => string;
}) {
  return (
    <div className="sol-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 6, left: -14, bottom: 0 }} barGap={4}>
          <CartesianGrid stroke="var(--sol-border)" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey={xKey} tick={axisStyle} tickLine={false} axisLine={false} dy={6} />
          <YAxis
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            width={58}
            tickFormatter={(v: number) => (yFormat ? yFormat(v) : String(v))}
          />
          <Tooltip content={<TooltipBox money={money} />} cursor={{ fill: 'var(--sol-surface-3)' }} />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              stackId={stacked ? 'a' : undefined}
              fill={s.color || CHART_COLORS[i % CHART_COLORS.length]}
              radius={stacked ? [0, 0, 0, 0] : [5, 5, 0, 0]}
              maxBarSize={34}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({
  data,
  height = 220,
  thickness = 22,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  return (
    <div className="sol-donut" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={`calc(50% - ${thickness}px)`}
            outerRadius="50%"
            paddingAngle={2}
            stroke="var(--sol-surface)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<TooltipBox suffix="%" />} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue ? (
        <div className="sol-donut-center">
          <strong>{centerValue}</strong>
          {centerLabel ? <small>{centerLabel}</small> : null}
        </div>
      ) : null}
    </div>
  );
}

export function MiniBars({
  data,
  color = 'var(--sol-chart-1)',
  height = 44,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const rows = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 2, right: 0, bottom: 0, left: 0 }} barCategoryGap={2}>
        <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Legend({
  items,
}: {
  items: { name: string; color?: string; value?: string }[];
}) {
  return (
    <div className="sol-legend">
      {items.map((item, i) => (
        <span key={item.name} className="sol-legend-item">
          <span
            className="sol-swatch"
            style={{ background: item.color || CHART_COLORS[i % CHART_COLORS.length] }}
          />
          {item.name}
          {item.value ? <strong className="sol-num">{item.value}</strong> : null}
        </span>
      ))}
    </div>
  );
}
