# RIE AGL — Resume Intelligent Evaluator for Africa Global Logistics

## Complete Technical Specification & Build Guide

**Confidential • Strategic Proposal • May 2026**

---

## 1. Project Overview

RIE AGL is an intelligent recruitment engine built specifically for Africa Global Logistics (AGL). It is **not a generic ATS** — it is a custom AI-powered recruitment platform designed for AGL's operational scale across 51 countries, 23,000+ employees, 24 port concessions, and 2 rail concessions.

### Core Value Proposition
- Automates CV screening, ATS scoring, candidate ranking, and decision workflows
- Reduces time-to-hire from 42 days to 21 days (50% faster)
- Saves 23+ hours per hire in manual screening
- Ensures 100% POPIA compliance with full audit trails
- Projects $360K annual savings at 50 hires per quarter

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EMPLOYER DASHBOARD                        │
│              React + TypeScript (Frontend)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    BACKEND API                               │
│              Node.js + NestJS (Backend)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    DATABASE                                  │
│              PostgreSQL (Primary Data Store)                  │
└────────────┬─────────────────────┬──────────────────────────┘
             │                     │
┌────────────▼──────────┐ ┌────────▼─────────────────────────┐
│      AWS S3            │ │      REDIS + BULLMQ              │
│  Encrypted Storage     │ │   Queue System                   │
│  (CV Files & Assets)   │ │   (Background Job Processing)    │
└────────────────────────┘ └──────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                    AI ENGINE                                 │
│         OpenAI API + ATS Scoring Algorithm                   │
│    (Six-Dimensional Candidate Evaluation)                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + TypeScript | Employer dashboard, public job portal |
| **Backend** | Node.js + NestJS | REST API, authentication, business logic |
| **Database** | PostgreSQL | Job postings, candidates, scores, audit logs |
| **File Storage** | AWS S3 (AES-256 encrypted) | CV uploads, documents |
| **Queue System** | Redis + BullMQ | Background AI processing, email notifications |
| **AI Engine** | OpenAI API | Semantic analysis, resume parsing, scoring |
| **Authentication** | JWT (JSON Web Tokens) | Secure employer portal access |
| **Transport Security** | TLS 1.3 | Encrypted data in transit |

---

## 3. Frontend Specifications

### 3.1 Employer Dashboard (JWT-Authenticated)

**Route:** `/employer/*`

#### Features:
1. **Job Management**
   - Create, edit, publish, and archive job postings
   - Categorize by division (Port, Rail, Logistics) and geographic region
   - Rich text job descriptions with compliance disclaimers

2. **Applicant Pipeline**
   - Sortable table of all applicants per job
   - Columns: Name, ATS Score, AI Recommendation, Status, Applied Date, Division, Region
   - Color-coded status indicators:
     - 🟢 **90-100**: Highly Recommended (Fast-Track)
     - 🟢 **80-89**: Interview Invitation (Auto-Invite)
     - 🟡 **70-79**: HR Review Queue
     - 🟠 **60-69**: Possible Rejection (Feedback)
     - 🔴 **<60**: Auto Rejection

3. **Candidate Detail View**
   - Original CV download (with access logging)
   - Six-dimensional score breakdown visualization
   - AI-generated candidate summary
   - One-click interview invitation with templated, branded emails
   - Manual override controls (Promote, Reject, Re-evaluate)

4. **Analytics Dashboard**
   - Time-to-hire trends
   - Source effectiveness (where candidates come from)
   - Pipeline health metrics
   - Recruiter productivity stats
   - Exportable reports (CSV/PDF)

5. **User Management** (Admin only)
   - Role-based permissions (HR Manager, Recruiter, Admin)
   - Team member invitations

### 3.2 Public Job Portal (No Authentication Required)

**Route:** `/careers/*`

#### Features:
1. **Job Listings Page**
   - Filter by: Division, Country/Region, Job Type, Experience Level
   - Search by keyword
   - Clean, mobile-responsive design
   - AGL branding throughout

2. **Job Detail Page**
   - Full job description
   - Requirements and qualifications
   - "Apply Now" button

3. **Application Form**
   - Personal information (name, email, phone)
   - Resume/CV upload (PDF, DOC, DOCX — max 10MB)
   - Cover letter (optional)
   - Consent checkbox for POPIA compliance
   - **No account creation required** — applicants apply as guests
   - Confirmation message upon submission

### 3.3 Frontend Technical Requirements

- **Framework:** React 18+ with TypeScript
- **State Management:** Redux Toolkit or Zustand
- **UI Library:** Tailwind CSS + Headless UI (or Material-UI)
- **Charts:** Recharts or Chart.js for analytics
- **File Upload:** React Dropzone with progress indicators
- **Forms:** React Hook Form + Zod validation
- **Routing:** React Router v6
- **HTTP Client:** Axios with interceptors for JWT handling
- **Notifications:** React Hot Toast or Sonner
- **Responsive:** Mobile-first design (works on phones, tablets, desktops)

---

## 4. Backend Specifications

### 4.1 API Structure (NestJS Modules)

```
src/
├── auth/                    # JWT authentication & role guards
├── users/                   # User management (HR team members)
├── jobs/                    # Job posting CRUD
├── candidates/              # Candidate data & CV handling
├── applications/            # Job applications & scoring
├── scoring/                 # AI scoring engine integration
├── decisions/               # Decision workflow engine
├── notifications/           # Email & WhatsApp notifications
├── analytics/               # Reporting & metrics
├── audit/                   # Compliance audit logs
├── storage/                 # AWS S3 file operations
└── common/                  # Guards, interceptors, pipes, decorators
```

### 4.2 Core API Endpoints

#### Authentication
```
POST   /auth/login                    # Employer login (email + password)
POST   /auth/refresh                  # Refresh JWT token
POST   /auth/logout                   # Invalidate token
POST   /auth/forgot-password          # Password reset flow
```

#### Jobs (Employer Only)
```
GET    /jobs                          # List all jobs (with filters)
POST   /jobs                          # Create new job
GET    /jobs/:id                      # Get job details
PATCH  /jobs/:id                      # Update job
DELETE /jobs/:id                      # Archive job
GET    /jobs/:id/applicants           # List applicants for a job
GET    /jobs/public                   # Public job listings (no auth)
GET    /jobs/public/:slug             # Public job detail (no auth)
```

#### Applications (Public)
```
POST   /applications                  # Submit application (public, no auth)
       # Body: { jobId, firstName, lastName, email, phone, 
       #         resumeFile, coverLetter, consentGiven }
GET    /applications/:id/status       # Check application status (public)
```

#### Candidates (Employer Only)
```
GET    /candidates                    # List all candidates (with filters)
GET    /candidates/:id                # Get candidate details + score breakdown
GET    /candidates/:id/cv             # Download original CV (logs access)
POST   /candidates/:id/decision       # Manual override (promote/reject/re-evaluate)
POST   /candidates/:id/invite         # Send interview invitation
```

#### Scoring (Internal/Background)
```
POST   /scoring/process/:applicationId  # Trigger AI scoring (async via BullMQ)
GET    /scoring/results/:applicationId  # Get scoring results
```

#### Analytics (Employer Only)
```
GET    /analytics/time-to-hire          # Time-to-hire trends
GET    /analytics/pipeline-health       # Pipeline funnel metrics
GET    /analytics/recruiter-productivity # Per-recruiter stats
GET    /analytics/source-effectiveness  # Candidate source breakdown
GET    /analytics/compliance            # POPIA audit summary
GET    /analytics/export                # Export reports (CSV/PDF)
```

#### Audit (Employer Only, Admin)
```
GET    /audit/logs                      # Full audit trail
GET    /audit/ai-decisions              # AI decision log
GET    /audit/data-access               # Data access log
```

### 4.3 Database Schema (PostgreSQL)

#### Tables:

```sql
-- Users (HR Team Members)
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM('admin', 'hr_manager', 'recruiter') DEFAULT 'recruiter',
  division_id UUID,
  region_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Divisions
divisions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- 'Port', 'Rail', 'Logistics'
  description TEXT
)

-- Regions
regions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- 'West Africa', 'East Africa', etc.
  country_codes JSONB -- ['ZA', 'NG', 'KE', ...]
)

-- Job Postings
jobs (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB, -- structured requirements
  division_id UUID REFERENCES divisions(id),
  region_id UUID REFERENCES regions(id),
  location VARCHAR(255),
  employment_type ENUM('full_time', 'contract', 'internship'),
  experience_level VARCHAR(50),
  status ENUM('draft', 'published', 'closed', 'archived') DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  published_at TIMESTAMP,
  closing_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Candidates
candidates (
  id UUID PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  location VARCHAR(255),
  linkedin_url VARCHAR(500),
  portfolio_url VARCHAR(500),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Applications
applications (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  candidate_id UUID REFERENCES candidates(id),
  cover_letter TEXT,
  resume_url VARCHAR(500), -- S3 URL
  resume_file_name VARCHAR(255),
  resume_file_size INTEGER,
  status ENUM('pending', 'scoring', 'scored', 'hr_review', 'interview_invited', 'rejected', 'hired') DEFAULT 'pending',
  ats_score DECIMAL(5,2),
  decision_category ENUM('fast_track', 'auto_invite', 'hr_review', 'feedback', 'auto_reject'),
  invited_at TIMESTAMP,
  rejected_at TIMESTAMP,
  hired_at TIMESTAMP,
  notes TEXT,
  consent_given BOOLEAN DEFAULT false,
  ip_address VARCHAR(45), -- for audit
  user_agent TEXT, -- for audit
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(job_id, candidate_id)
)

-- Scoring Results (Six Dimensions)
scoring_results (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  skills_match_score DECIMAL(5,2), -- 35% weight
  experience_match_score DECIMAL(5,2), -- 25% weight
  education_score DECIMAL(5,2), -- 15% weight
  certifications_score DECIMAL(5,2), -- 10% weight
  semantic_ai_score DECIMAL(5,2), -- 10% weight
  resume_quality_score DECIMAL(5,2), -- 5% weight
  overall_score DECIMAL(5,2), -- weighted total
  ai_summary TEXT, -- AI-generated candidate summary
  skills_extracted JSONB, -- structured extracted skills
  experience_extracted JSONB, -- structured extracted experience
  education_extracted JSONB,
  raw_ai_response JSONB, -- full OpenAI response for audit
  created_at TIMESTAMP
)

-- Audit Logs (POPIA Compliance)
audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id), -- null for system actions
  candidate_id UUID REFERENCES candidates(id),
  application_id UUID REFERENCES applications(id),
  action VARCHAR(100) NOT NULL, -- 'view', 'download', 'score', 'decide', 'invite'
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP
)

-- Interview Invitations
interview_invitations (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  sent_by UUID REFERENCES users(id),
  template_used VARCHAR(100),
  custom_message TEXT,
  scheduled_date TIMESTAMP,
  location VARCHAR(255),
  meeting_link VARCHAR(500),
  status ENUM('sent', 'accepted', 'declined', 'completed', 'cancelled'),
  sent_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Email/WhatsApp Notifications
notifications (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  type ENUM('email', 'whatsapp'),
  template VARCHAR(100),
  recipient VARCHAR(255),
  subject VARCHAR(255),
  body TEXT,
  status ENUM('pending', 'sent', 'failed', 'delivered'),
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP
)
```

### 4.4 Background Job Processing (BullMQ + Redis)

#### Job Queues:

1. **`scoring-queue`** — AI Resume Processing
   - Triggered on application submission
   - Steps:
     1. Download resume from S3
     2. Extract text (PDF/DOC parsing)
     3. Send to OpenAI API for analysis
     4. Parse and validate AI response
     5. Calculate weighted score
     6. Save scoring_results record
     7. Update application status and decision_category
     8. Send notification to candidate (confirmation)
     9. Send notification to HR (new applicant alert)

2. **`notification-queue`** — Email/WhatsApp Delivery
   - Interview invitations
   - Application confirmations
   - Rejection notifications
   - HR alerts

3. **`audit-queue`** — Compliance Logging
   - Async audit log writes for high-volume operations

---

## 5. AI Scoring Engine

### 5.1 Six-Dimensional Scoring Formula

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Skills Match** | 35% | Technical and operational skills vs. job requirements |
| **Experience Match** | 25% | Relevant years and type of experience |
| **Education** | 15% | Degree relevance and level |
| **Certifications** | 10% | Professional certifications (maritime, logistics, safety) |
| **Semantic AI** | 10% | Overall contextual fit via OpenAI semantic analysis |
| **Resume Quality** | 5% | Completeness, formatting, clarity |

**Overall Score =** (Skills × 0.35) + (Experience × 0.25) + (Education × 0.15) + (Certifications × 0.10) + (Semantic AI × 0.10) + (Resume Quality × 0.05)

### 5.2 Decision Engine Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  Score Range    │  Category          │  Action             │
├─────────────────────────────────────────────────────────────┤
│  90 - 100       │  Highly Recommended │  Fast-Track        │
│  80 - 89        │  Strong Match       │  Auto-Invite         │
│  70 - 79        │  Moderate Match     │  HR Review (Manual)  │
│  60 - 69        │  Weak Match         │  Feedback / Possible │
│  < 60           │  Poor Match         │  Auto-Reject         │
└─────────────────────────────────────────────────────────────┘
```

**Critical Rule:** HR retains final authority. Every stage allows manual override. 70-79 scores **require** mandatory HR checkpoint.

### 5.3 OpenAI Integration

**Model:** GPT-4o (or latest available)

**Prompt Strategy:**
- System prompt defines AGL's industry context (logistics, ports, rail, Africa)
- Job description and requirements injected as context
- Resume text provided for analysis
- Structured JSON output requested for consistent parsing

**Example Prompt Structure:**
```
You are an expert logistics recruiter evaluating candidates for Africa Global Logistics.
Analyze the following resume against the job requirements and return a JSON object with:

{
  "skills_match": { "score": 0-100, "matched_skills": [...], "missing_skills": [...] },
  "experience_match": { "score": 0-100, "relevant_years": number, "relevance_notes": "..." },
  "education": { "score": 0-100, "degrees": [...], "relevance": "..." },
  "certifications": { "score": 0-100, "certifications_found": [...] },
  "semantic_fit": { "score": 0-100, "assessment": "..." },
  "resume_quality": { "score": 0-100, "strengths": "...", "weaknesses": "..." },
  "overall_summary": "2-3 sentence summary for HR",
  "red_flags": [...],
  "recommendation": "fast_track | invite | review | feedback | reject"
}
```

**Error Handling:**
- If OpenAI fails or times out, application stays in "pending" status
- Retry logic: 3 attempts with exponential backoff
- Fallback: Manual HR review notification if all retries fail

---

## 6. Security & Compliance

### 6.1 POPIA Compliance (South Africa)

- **Lawful Processing:** Explicit consent checkbox on every application
- **Purpose Limitation:** Data used only for recruitment; no marketing
- **Data Minimization:** Only collect necessary fields
- **Accuracy:** Candidates can request corrections
- **Security:** AES-256 at rest, TLS 1.3 in transit
- **Retention:** Auto-delete candidate data after 12 months of inactivity (configurable)
- **Right to Deletion:** API endpoint for candidate data deletion requests
- **Audit Trail:** Every data access logged in `audit_logs` table

### 6.2 Authentication & Authorization

- **JWT Tokens:** Access token (15 min expiry) + Refresh token (7 days)
- **Role-Based Access Control (RBAC):**
  - `admin`: Full system access, user management, audit logs
  - `hr_manager`: All jobs, all candidates, analytics, team oversight
  - `recruiter`: Assigned jobs and candidates, cannot delete or override certain actions
- **Password Policy:** Min 12 chars, uppercase, lowercase, number, special char
- **Rate Limiting:** 100 requests/minute per IP, 1000/hour per user
- **CORS:** Strict whitelist of allowed origins

### 6.3 Data Protection

- **S3 Encryption:** Server-side encryption with AWS KMS
- **Database Encryption:** Sensitive fields (PII) encrypted at application level
- **Backup Encryption:** Automated daily backups, encrypted, 30-day retention
- **Access Logging:** Every CV download, candidate view, score access logged
- **API Security:** Helmet.js, input sanitization, SQL injection prevention, XSS protection

### 6.4 Bias Prevention

- **Algorithmic Audits:** Monthly review of scoring distribution by demographic
- **Blind Screening Option:** Configurable to hide name, gender, age, photo from initial scoring
- **Score Distribution Monitoring:** Alerts if scores skew by region, gender, or other protected attributes
- **Human Review Mandate:** All 70-79 scores require human eyes

---

## 7. File Storage (AWS S3)

### 7.1 Bucket Structure

```
agl-rie-production/
├── resumes/
│   ├── {candidate_id}/
│   │   └── {application_id}_{timestamp}.pdf
│   └── ...
├── exports/
│   ├── analytics/
│   └── audit/
└── templates/
    ├── email/
    └── whatsapp/
```

### 7.2 S3 Configuration

- **Region:** `af-south-1` (Cape Town) or nearest to AGL primary operations
- **Encryption:** SSE-KMS with customer-managed key
- **Versioning:** Enabled
- **Lifecycle:** Move to Glacier after 1 year, delete after 3 years
- **Access:** Private buckets, pre-signed URLs for downloads (15-min expiry)

---

## 8. Notification System

### 8.1 Email Notifications (Primary)

**Provider:** SendGrid or AWS SES

**Templates:**
1. **Application Confirmation** → Candidate (immediately after apply)
2. **New Applicant Alert** → HR/Recruiter (after scoring completes)
3. **Interview Invitation** → Candidate (with calendar invite .ics)
4. **Rejection Notification** → Candidate (templated, kind, with feedback option)
5. **HR Review Required** → HR (for 70-79 scores)
6. **Password Reset** → User
7. **Weekly Pipeline Digest** → HR Managers

### 8.2 WhatsApp Notifications (Phase 2 Enhancement)

**Provider:** Twilio WhatsApp Business API or Meta Business API

**Use Cases:**
- Interview reminders
- Application status updates
- Quick candidate communication

---

## 9. Analytics & Reporting

### 9.1 Key Metrics

| Metric | Calculation | Target |
|--------|-------------|--------|
| Time-to-Hire | Application date → Hire date | 21 days |
| Cost-per-Hire | Total recruitment cost / hires | Reduce 30% |
| CVs Screened per Day | Total screened / recruiter days | 150 (10x improvement) |
| Hours per Hire | Total recruiter hours / hires | 8 hours |
| Candidates Reviewed | Per recruiter per week | 500 |
| Admin Tasks per Week | Manual data entry tasks | 8 |
| Offer Acceptance Rate | Offers accepted / offers made | +18% with AI |
| Source Effectiveness | Hires by source / applications by source | Track ROI |
| Compliance Score | Audit pass rate | 100% |

### 9.2 Dashboard Widgets

- **Funnel Visualization:** Applied → Scored → HR Review → Interview → Offer → Hired
- **Score Distribution Histogram:** ATS scores across all applicants
- **Geographic Heat Map:** Applicants and hires by country/region
- **Recruiter Leaderboard:** Productivity metrics per team member
- **Trend Lines:** Time-to-hire over last 12 months
- **AI Accuracy Tracking:** Correlation between AI scores and hiring outcomes

---

## 10. Implementation Roadmap

### Phase 1: Setup (Weeks 1-4)
- Infrastructure provisioning (AWS, PostgreSQL, Redis)
- CI/CD pipeline setup
- Development environment configuration
- Database schema creation
- S3 bucket setup with encryption

### Phase 2: Core Platform (Weeks 5-8)
- Authentication system (JWT, roles)
- User management APIs
- Job posting CRUD (employer + public)
- Application submission (public portal)
- Basic file upload to S3
- Frontend scaffolding (React, routing, layout)

### Phase 3: AI Engine (Weeks 9-12)
- OpenAI API integration
- Resume text extraction (PDF/DOCX parsing)
- Six-dimensional scoring algorithm
- BullMQ queue setup for async processing
- Scoring results storage and API
- Decision engine workflow

### Phase 4: Dashboard (Weeks 13-16)
- Employer dashboard UI (jobs, applicants, candidate detail)
- Analytics charts and reports
- Interview invitation flow
- Manual override controls
- CV download with access logging
- Email notification templates

### Phase 5: UAT & Hardening (Weeks 17-20)
- User Acceptance Testing with AGL HR team
- POPIA compliance audit
- Security penetration testing
- Performance testing (load test with 10,000+ applications)
- Bias audit on scoring algorithm
- Documentation and training materials

### Phase 6: Go-Live (Weeks 21-24)
- Production deployment
- Data migration (if applicable)
- HR team training
- Phased rollout (1 division → all divisions)
- Monitoring and support
- Post-launch optimization

---

## 11. Environment Configuration

### 11.1 Required Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3000
API_URL=https://api.rie-agl.com
FRONTEND_URL=https://careers.agl.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/rie_agl

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# AWS
AWS_REGION=af-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=agl-rie-production
AWS_S3_RESUME_PREFIX=resumes/

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.2

# Email (SendGrid)
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@agl.com
EMAIL_FROM_NAME="AGL Recruitment"

# WhatsApp (Twilio - Phase 2)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=...

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# POPIA
DATA_RETENTION_DAYS=365
POPIA_CONSENT_VERSION=1.0
```

---

## 12. Deployment

### 12.1 Infrastructure

- **Cloud Provider:** AWS
- **Compute:** ECS Fargate (containerized) or EC2 with auto-scaling
- **Database:** RDS PostgreSQL (Multi-AZ for HA)
- **Cache:** ElastiCache Redis
- **Storage:** S3 with CloudFront CDN for static assets
- **Load Balancer:** ALB with SSL termination
- **DNS:** Route 53
- **Monitoring:** CloudWatch + Datadog or New Relic
- **Error Tracking:** Sentry

### 12.2 Docker Configuration

**Backend Dockerfile:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 13. Testing Strategy

### 13.1 Backend Tests
- **Unit Tests:** Jest — services, utilities, scoring logic
- **Integration Tests:** Supertest — API endpoints
- **E2E Tests:** Full flow from application to hire
- **Security Tests:** OWASP ZAP or Burp Suite
- **Load Tests:** k6 or Artillery — simulate 1000 concurrent applications

### 13.2 Frontend Tests
- **Unit Tests:** Vitest — components, hooks, utilities
- **Integration Tests:** React Testing Library
- **E2E Tests:** Playwright — critical user flows
- **Accessibility:** axe-core or Lighthouse

### 13.3 AI Testing
- **Prompt Testing:** Evaluate scoring consistency across diverse resumes
- **Bias Testing:** Test with anonymized resumes from different demographics
- **Edge Cases:** Empty resumes, non-English resumes, corrupted files

---

## 14. Future Enhancements (Post-MVP)

1. **WhatsApp Interview Notifications** — Meet Africa's mobile-first workforce
2. **AI-Generated Interview Questions** — Role-specific, competency-based per candidate
3. **AI Recruiter Chatbot** — 24/7 candidate engagement for FAQs
4. **Video Interview Integration** — One-way video screening before live interviews
5. **Advanced Analytics** — Predictive dashboards forecasting talent gaps
6. **Multi-Company SaaS** — Offer RIE to AGL's logistics partners (revenue opportunity)

---

## 15. Success Criteria

| Criteria | Measurement |
|----------|-------------|
| Time-to-Hire | ≤ 21 days average |
| Recruiter Productivity | 150 CVs screened/day, 500 candidates reviewed/week |
| Cost Savings | $360K annually at 50 hires/quarter |
| Compliance | 100% POPIA audit pass |
| User Adoption | 90% of HR team actively using within 30 days |
| Candidate Satisfaction | > 80% positive feedback on application experience |
| AI Accuracy | > 85% correlation between AI scores and hiring manager ratings |

---

## 16. Support & Maintenance

- **SLA:** 99.9% uptime
- **Support Hours:** 24/7 for critical issues, business hours for non-critical
- **Response Times:**
  - Critical (system down): 15 minutes
  - High (scoring failures): 1 hour
  - Medium (UI bugs): 4 hours
  - Low (feature requests): 2 business days
- **Maintenance Windows:** Sundays 02:00-04:00 CAT (low activity)
- **Backups:** Daily automated, monthly tested restore

---

## 17. Contact & Ownership

**Project:** RIE AGL — Resume Intelligent Evaluator for Africa Global Logistics  
**Client:** Africa Global Logistics (AGL)  
**Scale:** 51 countries, 23,000+ employees, 24 port concessions, 2 rail concessions  
**Status:** Strategic Proposal — May 2026  
**Classification:** Confidential

---

## Appendix A: API Response Examples

### Application Submission (Public)
```json
POST /applications
{
  "success": true,
  "data": {
    "applicationId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "message": "Application received. You will receive a confirmation email shortly.",
    "estimatedReviewTime": "2-3 business days"
  }
}
```

### Scoring Results (Employer)
```json
GET /scoring/results/550e8400-e29b-41d4-a716-446655440000
{
  "success": true,
  "data": {
    "overallScore": 87.5,
    "decisionCategory": "auto_invite",
    "dimensions": {
      "skillsMatch": { "score": 92, "weight": 0.35, "weighted": 32.2 },
      "experienceMatch": { "score": 85, "weight": 0.25, "weighted": 21.25 },
      "education": { "score": 80, "weight": 0.15, "weighted": 12.0 },
      "certifications": { "score": 90, "weight": 0.10, "weighted": 9.0 },
      "semanticAi": { "score": 88, "weight": 0.10, "weighted": 8.8 },
      "resumeQuality": { "score": 85, "weight": 0.05, "weighted": 4.25 }
    },
    "aiSummary": "Strong candidate with 8 years of port operations experience...",
    "matchedSkills": ["Port Management", "Logistics Coordination", "SAP ERP"],
    "missingSkills": ["Rail Operations"],
    "redFlags": [],
    "recommendation": "auto_invite"
  }
}
```

---

## Appendix B: Frontend Component Hierarchy

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── DashboardLayout.tsx
│   ├── jobs/
│   │   ├── JobCard.tsx
│   │   ├── JobForm.tsx
│   │   └── JobList.tsx
│   ├── candidates/
│   │   ├── CandidateTable.tsx
│   │   ├── CandidateDetail.tsx
│   │   ├── ScoreBreakdown.tsx
│   │   └── CVViewer.tsx
│   ├── analytics/
│   │   ├── MetricCard.tsx
│   │   ├── FunnelChart.tsx
│   │   ├── ScoreDistribution.tsx
│   │   └── TrendChart.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── FileUpload.tsx
│       └── StatusBadge.tsx
├── pages/
│   ├── public/
│   │   ├── JobListings.tsx
│   │   ├── JobDetail.tsx
│   │   └── ApplicationForm.tsx
│   └── employer/
│       ├── Dashboard.tsx
│       ├── Jobs.tsx
│       ├── Applicants.tsx
│       ├── CandidateProfile.tsx
│       ├── Analytics.tsx
│       └── Settings.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useJobs.ts
│   ├── useCandidates.ts
│   └── useAnalytics.ts
├── store/
│   └── index.ts (Redux/Zustand)
├── utils/
│   ├── api.ts
│   ├── constants.ts
│   └── helpers.ts
└── types/
    └── index.ts (TypeScript interfaces)
```

---

## Appendix C: Decision Engine State Machine

```
[PENDING] ──scoring queued──► [SCORING] ──AI complete──► [SCORED]
                                                              │
                    ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
                    │                                         │                                         │
                    ▼                                         ▼                                         ▼
              [90-100]                                    [80-89]                                   [70-79]
           Highly Recommended                            Strong Match                             Moderate Match
                    │                                         │                                         │
                    ▼                                         ▼                                         ▼
            [FAST_TRACK]                                [AUTO_INVITE]                              [HR_REVIEW]
           (Auto-flag for HR)                    (Send interview invite)                 (Queue for manual review)
                    │                                         │                                         │
                    ▼                                         ▼                                         ▼
           HR can override to:                        HR can override to:                     HR must decide:
           - INTERVIEW_INVITED                        - HR_REVIEW                             - INTERVIEW_INVITED
           - HR_REVIEW                                - FEEDBACK                              - FEEDBACK
           - FEEDBACK                                 - AUTO_REJECT                             - AUTO_REJECT
           - AUTO_REJECT                              - FAST_TRACK                              - FAST_TRACK

                    [60-69]                                   [<60]
                 Weak Match                                Poor Match
                    │                                         │
                    ▼                                         ▼
                 [FEEDBACK]                              [AUTO_REJECT]
            (Send feedback, possible)              (Send rejection notification)
                    │                                         │
                    ▼                                         ▼
           HR can override to:                        HR can override to:
           - INTERVIEW_INVITED                        - INTERVIEW_INVITED
           - HR_REVIEW                                - HR_REVIEW
           - AUTO_REJECT                              - FEEDBACK

                    │
                    ▼
              [INTERVIEW_INVITED]
                    │
                    ▼
              [ACCEPTED / DECLINED / COMPLETED]
                    │
                    ▼
              [HIRED] or [REJECTED]
```

---

**End of Specification**

*This document contains all information required for Antigravity to build the complete RIE AGL system — frontend, backend, database, AI integration, security, and deployment infrastructure.*
