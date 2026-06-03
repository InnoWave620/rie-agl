'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, Cell, AreaChart, Area,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { AnalyticsSummary } from '../../types';

// ─── Time to Hire Trend ───────────────────────────────────────────────────────

export function TimeToHireChart({ data }: { data: AnalyticsSummary['timeToHireTrend'] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
        <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
          formatter={(v, name) => [`${v} days`, name === 'avgDays' ? 'Avg. Time-to-Hire' : 'Target']}
        />
        <ReferenceLine y={21} stroke="#22C55E" strokeDasharray="4 4" strokeWidth={1.5} />
        <Line
          type="monotone" dataKey="avgDays" stroke="#1C355E" strokeWidth={2.5}
          dot={{ r: 4, fill: '#1C355E', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          name="Avg. Time-to-Hire"
        />
        <Line
          type="monotone" dataKey="target" stroke="#22C55E" strokeWidth={2}
          strokeDasharray="4 4" dot={false} name="Target (21 days)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Pipeline Funnel ──────────────────────────────────────────────────────────

export function PipelineFunnelChart({ data }: { data: AnalyticsSummary['pipelineFunnel'] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
        <YAxis dataKey="stage" type="category" tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }} width={80} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v, _, props: any) => [`${v} (${props.payload.pct}%)`, props.payload.stage]}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Score Distribution ───────────────────────────────────────────────────────

export function ScoreDistributionChart({ data }: { data: AnalyticsSummary['scoreDistribution'] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
        <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v, _, props: any) => [`${v} candidates`, props.payload.category]}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Application Volume Area Chart ───────────────────────────────────────────

const VOLUME_DATA = [
  { week: 'W1', apps: 18, scored: 15 },
  { week: 'W2', apps: 24, scored: 22 },
  { week: 'W3', apps: 31, scored: 29 },
  { week: 'W4', apps: 27, scored: 25 },
  { week: 'W5', apps: 35, scored: 34 },
  { week: 'W6', apps: 42, scored: 40 },
  { week: 'W7', apps: 47, scored: 47 },
];

export function ApplicationVolumeChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={VOLUME_DATA} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
        <defs>
          <linearGradient id="appsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1C355E" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#1C355E" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="scoredGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F58220" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#F58220" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
        <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }} />
        <Area type="monotone" dataKey="apps" stroke="#1C355E" strokeWidth={2} fill="url(#appsGradient)" name="Applications" />
        <Area type="monotone" dataKey="scored" stroke="#F58220" strokeWidth={2} fill="url(#scoredGradient)" name="AI Scored" />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
