// ─── Domain Types ─────────────────────────────────────────────────────────────

export type Division = "Port" | "Rail" | "Logistics";
export type Region =
  | "West Africa"
  | "East Africa"
  | "Southern Africa"
  | "Central Africa"
  | "North Africa";
export type EmploymentType = "full_time" | "contract" | "internship";
export type ExperienceLevel = "Entry" | "Mid" | "Senior" | "Executive";
export type JobStatus = "draft" | "published" | "closed" | "archived";
export type UserRole = "admin" | "hr_manager" | "recruiter";
export type DecisionCategory =
  | "fast_track"
  | "auto_invite"
  | "hr_review"
  | "feedback"
  | "auto_reject";
export type ApplicationStatus =
  | "pending"
  | "scoring"
  | "scored"
  | "hr_review"
  | "interview_invited"
  | "rejected"
  | "hired";

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  division?: Division;
  region?: Region;
  isActive: boolean;
  avatarInitials: string;
  createdAt: string;
}

// ─── Job ──────────────────────────────────────────────────────────────────────

export interface JobRequirement {
  category: string;
  items: string[];
}

export interface Job {
  id: string;
  title: string;
  slug: string;
  description: string;
  summary: string;
  requirements: JobRequirement[];
  division: Division;
  region: Region;
  location: string;
  country: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  status: JobStatus;
  createdBy: string;
  publishedAt?: string;
  closingDate?: string;
  applicantCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Candidate ────────────────────────────────────────────────────────────────

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  createdAt: string;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface ScoreDimension {
  score: number;
  weight: number;
  weighted: number;
  notes?: string;
}

export interface ScoringResult {
  id: string;
  applicationId: string;
  skillsMatch: ScoreDimension & { matchedSkills: string[]; missingSkills: string[] };
  experienceMatch: ScoreDimension & { relevantYears: number };
  education: ScoreDimension & { degrees: string[] };
  certifications: ScoreDimension & { found: string[] };
  semanticAi: ScoreDimension & { assessment: string };
  resumeQuality: ScoreDimension & { strengths: string; weaknesses: string };
  overallScore: number;
  aiSummary: string;
  redFlags: string[];
  recommendation: DecisionCategory;
  createdAt: string;
}

// ─── Application ──────────────────────────────────────────────────────────────

export interface Application {
  id: string;
  jobId: string;
  job?: Job;
  candidateId: string;
  candidate: Candidate;
  coverLetter?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  status: ApplicationStatus;
  atsScore?: number;
  decisionCategory?: DecisionCategory;
  scoringResult?: ScoringResult;
  notes?: string;
  consentGiven: boolean;
  invitedAt?: string;
  rejectedAt?: string;
  hiredAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface TimeToHireDataPoint {
  month: string;
  avgDays: number;
  target: number;
}

export interface PipelineFunnelStage {
  stage: string;
  count: number;
  pct: number;
  color: string;
}

export interface ScoreDistributionBucket {
  range: string;
  count: number;
  category: string;
  fill: string;
}

export interface RecruiterStat {
  name: string;
  screenings: number;
  interviews: number;
  hires: number;
  avgScore: number;
}

export interface AnalyticsSummary {
  totalApplications: number;
  openPositions: number;
  avgTimeToHire: number;
  avgAtsScore: number;
  hiresThisMonth: number;
  offersAccepted: number;
  complianceScore: number;
  cvScreenedToday: number;
  timeToHireTrend: TimeToHireDataPoint[];
  pipelineFunnel: PipelineFunnelStage[];
  scoreDistribution: ScoreDistributionBucket[];
  recruiterStats: RecruiterStat[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthSession {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarInitials: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  candidateId?: string;
  applicationId?: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// ─── Filter/Search ────────────────────────────────────────────────────────────

export interface JobFilters {
  division?: Division | "all";
  region?: Region | "all";
  employmentType?: EmploymentType | "all";
  experienceLevel?: ExperienceLevel | "all";
  status?: JobStatus | "all";
  search?: string;
}

export interface CandidateFilters {
  jobId?: string;
  status?: ApplicationStatus | "all";
  decisionCategory?: DecisionCategory | "all";
  search?: string;
  minScore?: number;
  maxScore?: number;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface ApplicationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  coverLetter?: string;
  resumeFile: File;
  consentGiven: boolean;
}

export interface JobFormData {
  title: string;
  description: string;
  summary: string;
  division: Division;
  region: Region;
  location: string;
  country: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  closingDate?: string;
  requirements: JobRequirement[];
}
