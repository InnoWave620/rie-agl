import type { DecisionCategory, ApplicationStatus, JobStatus, Division } from '../../types';
import { getScoreBadgeClass, getScoreLabel, getStatusClass, getStatusLabel, getJobStatusClass, getDivisionClass } from '../../lib/utils';

interface ScoreBadgeProps {
  category?: DecisionCategory | null;
  score?: number | null;
  showScore?: boolean;
}

export function ScoreBadge({ category, score, showScore = true }: ScoreBadgeProps) {
  return (
    <span className={getScoreBadgeClass(category)}>
      {showScore && score != null && (
        <span className="font-mono mr-1">{score.toFixed(1)}</span>
      )}
      {getScoreLabel(category)}
    </span>
  );
}

interface StatusBadgeProps {
  status: ApplicationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={getStatusClass(status)}>
      {status === 'scoring' && (
        <span className="inline-block w-2 h-2 rounded-full mr-1.5 animate-pulse" style={{ background: '#8B5CF6' }} />
      )}
      {getStatusLabel(status)}
    </span>
  );
}

interface JobStatusBadgeProps {
  status: JobStatus;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  return (
    <span className={getJobStatusClass(status)}>
      {status === 'published' && (
        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: '#22C55E' }} />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface DivisionBadgeProps {
  division: Division;
}

export function DivisionBadge({ division }: DivisionBadgeProps) {
  const icons: Record<Division, string> = {
    Port: '⚓',
    Rail: '🚂',
    Logistics: '📦',
  };
  return (
    <span className={getDivisionClass(division)}>
      <span className="mr-1">{icons[division]}</span>
      {division}
    </span>
  );
}

interface ScoreBarProps {
  score: number;
  label: string;
  weight: number;
}

export function ScoreBar({ score, label, weight }: ScoreBarProps) {
  const color = score >= 80 ? '#22C55E' : score >= 65 ? '#F59E0B' : '#EF4444';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium" style={{ color: '#374151' }}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#9CA3AF' }}>{(weight * 100).toFixed(0)}% weight</span>
          <span className="text-sm font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}
