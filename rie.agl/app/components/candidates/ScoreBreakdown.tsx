'use client';

import type { ScoringResult } from '../../types';
import { ScoreBar } from '../common/StatusBadge';
import { getScoreColor } from '../../lib/utils';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

interface ScoreBreakdownProps {
  scoring: ScoringResult;
}

const DIMENSIONS = [
  { key: 'skillsMatch', label: 'Skills Match', weight: 0.35, shortLabel: 'Skills' },
  { key: 'experienceMatch', label: 'Experience Match', weight: 0.25, shortLabel: 'Experience' },
  { key: 'education', label: 'Education', weight: 0.15, shortLabel: 'Education' },
  { key: 'certifications', label: 'Certifications', weight: 0.10, shortLabel: 'Certs' },
  { key: 'semanticAi', label: 'Semantic AI Fit', weight: 0.10, shortLabel: 'AI Fit' },
  { key: 'resumeQuality', label: 'Resume Quality', weight: 0.05, shortLabel: 'Quality' },
] as const;

export default function ScoreBreakdown({ scoring }: ScoreBreakdownProps) {
  const overall = scoring.overallScore;
  const scoreColor = getScoreColor(overall);

  const radarData = DIMENSIONS.map(d => ({
    subject: d.shortLabel,
    score: scoring[d.key].score,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6">
      {/* ── Overall Score Ring ── */}
      <div className="flex items-center gap-6 p-6 rounded-2xl" style={{ background: '#EEF2F9' }}>
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#D5DFF0" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={scoreColor} strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 40 * overall / 100} ${2 * Math.PI * 40 * (1 - overall / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1.2s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black" style={{ color: scoreColor }}>
              {overall.toFixed(0)}
            </span>
            <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>/ 100</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold mb-1" style={{ color: '#142440' }}>
            ATS Score: {overall.toFixed(1)}
          </div>
          <div className="text-sm mb-3" style={{ color: '#6B7280' }}>
            Weighted across 6 evaluation dimensions
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {scoring.skillsMatch.matchedSkills.slice(0, 4).map(skill => (
              <span
                key={skill}
                className="px-2 py-1 rounded-full font-medium"
                style={{ background: '#DCFCE7', color: '#15803D' }}
              >
                ✓ {skill}
              </span>
            ))}
            {scoring.skillsMatch.missingSkills.slice(0, 2).map(skill => (
              <span
                key={skill}
                className="px-2 py-1 rounded-full font-medium"
                style={{ background: '#FEE2E2', color: '#991B1B' }}
              >
                ✗ {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Radar Chart ── */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#1C355E"
              fill="#1C355E"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
              formatter={(v) => [`${v}/100`, 'Score']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Dimension Bars ── */}
      <div className="space-y-3">
        {DIMENSIONS.map(d => (
          <ScoreBar
            key={d.key}
            label={d.label}
            score={scoring[d.key].score}
            weight={d.weight}
          />
        ))}
      </div>

      {/* ── Red Flags ── */}
      {scoring.redFlags.length > 0 && (
        <div
          className="p-4 rounded-xl border"
          style={{ background: '#FEE2E2', borderColor: '#FECACA' }}
        >
          <div className="font-semibold text-sm mb-2" style={{ color: '#991B1B' }}>
            ⚠ AI Red Flags
          </div>
          <ul className="space-y-1">
            {scoring.redFlags.map((flag, i) => (
              <li key={i} className="text-sm" style={{ color: '#B91C1C' }}>
                • {flag}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
