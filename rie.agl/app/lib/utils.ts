import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DecisionCategory, ApplicationStatus, Division, JobStatus } from "../types";

// ─── Class Utilities ──────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Score Utilities ──────────────────────────────────────────────────────────

export function getScoreBadgeClass(category?: DecisionCategory | null): string {
  switch (category) {
    case "fast_track":  return "badge badge-fast-track";
    case "auto_invite": return "badge badge-auto-invite";
    case "hr_review":   return "badge badge-hr-review";
    case "feedback":    return "badge badge-feedback";
    case "auto_reject": return "badge badge-auto-reject";
    default:            return "badge" + " bg-gray-100 text-gray-600";
  }
}

export function getScoreLabel(category?: DecisionCategory | null): string {
  switch (category) {
    case "fast_track":  return "Fast Track";
    case "auto_invite": return "Auto Invite";
    case "hr_review":   return "HR Review";
    case "feedback":    return "Feedback";
    case "auto_reject": return "Auto Reject";
    default:            return "Pending";
  }
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "#22C55E";
  if (score >= 80) return "#22C55E";
  if (score >= 70) return "#F59E0B";
  if (score >= 60) return "#FB923C";
  return "#EF4444";
}

export function getCategoryFromScore(score: number): DecisionCategory {
  if (score >= 90) return "fast_track";
  if (score >= 80) return "auto_invite";
  if (score >= 70) return "hr_review";
  if (score >= 60) return "feedback";
  return "auto_reject";
}

// ─── Status Utilities ─────────────────────────────────────────────────────────

export function getStatusLabel(status: ApplicationStatus): string {
  const labels: Record<ApplicationStatus, string> = {
    pending: "Pending",
    scoring: "AI Scoring...",
    scored: "Scored",
    hr_review: "HR Review",
    interview_invited: "Interview Invited",
    rejected: "Rejected",
    hired: "Hired",
  };
  return labels[status] ?? status;
}

export function getStatusClass(status: ApplicationStatus): string {
  switch (status) {
    case "hired":            return "badge bg-green-100 text-green-800";
    case "interview_invited": return "badge bg-blue-100 text-blue-800";
    case "hr_review":        return "badge badge-hr-review";
    case "scored":           return "badge bg-navy-50 text-navy";
    case "scoring":          return "badge bg-purple-100 text-purple-800";
    case "rejected":         return "badge badge-auto-reject";
    default:                 return "badge bg-gray-100 text-gray-600";
  }
}

export function getJobStatusClass(status: JobStatus): string {
  switch (status) {
    case "published": return "badge badge-published";
    case "draft":     return "badge badge-draft";
    case "closed":    return "badge badge-closed";
    case "archived":  return "badge badge-archived";
    default:          return "badge bg-gray-100 text-gray-600";
  }
}

export function getDivisionClass(division: Division): string {
  switch (division) {
    case "Port":      return "badge badge-port";
    case "Rail":      return "badge badge-rail";
    case "Logistics": return "badge badge-logistics";
    default:          return "badge bg-gray-100 text-gray-600";
  }
}

// ─── Format Utilities ─────────────────────────────────────────────────────────

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);
  if (days > 30) return formatDate(iso);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export function formatEmploymentType(type: string): string {
  const map: Record<string, string> = {
    full_time: "Full Time",
    contract: "Contract",
    internship: "Internship",
  };
  return map[type] ?? type;
}

export function formatScore(score?: number | null): string {
  if (score == null) return "—";
  return score.toFixed(1);
}

export function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getInitials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? singular + "s")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
