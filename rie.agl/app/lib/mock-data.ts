import type {
  Job,
  Candidate,
  Application,
  ScoringResult,
  User,
  AnalyticsSummary,
} from "../types";

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const MOCK_JOBS: Job[] = [
  {
    id: "job-001",
    title: "Port Operations Manager",
    slug: "port-operations-manager-abidjan",
    summary:
      "Lead port operations at AGL's flagship terminal in Abidjan, overseeing 24/7 cargo handling and a team of 150+ staff.",
    description: `<p>Africa Global Logistics (AGL) is seeking an experienced <strong>Port Operations Manager</strong> to lead all operational activities at our Abidjan terminal — one of West Africa's busiest container ports.</p>

<p>In this role, you will oversee all aspects of port operations including vessel scheduling, cargo handling, equipment maintenance, and workforce management. You will work closely with shipping lines, customs authorities, and government agencies to ensure smooth, efficient, and compliant operations.</p>

<h3>About the Role</h3>
<p>You will be responsible for operational excellence, safety compliance, and continuous improvement initiatives at a terminal handling 1.2 million TEUs annually.</p>`,
    requirements: [
      {
        category: "Essential Requirements",
        items: [
          "10+ years in port or maritime operations",
          "Proven team leadership (100+ staff)",
          "IMDG / IMO certification",
          "Experience with TOS (Terminal Operating Systems)",
          "Strong knowledge of customs and trade regulations",
        ],
      },
      {
        category: "Preferred Qualifications",
        items: [
          "Port Management or Maritime qualification",
          "Experience in West Africa",
          "Bilingual: English and French",
          "LEAN / Six Sigma certification",
        ],
      },
    ],
    division: "Port",
    region: "West Africa",
    location: "Abidjan",
    country: "Côte d'Ivoire",
    employmentType: "full_time",
    experienceLevel: "Senior",
    status: "published",
    createdBy: "user-001",
    publishedAt: "2026-05-10T09:00:00Z",
    closingDate: "2026-06-30T23:59:59Z",
    applicantCount: 47,
    createdAt: "2026-05-08T10:00:00Z",
    updatedAt: "2026-05-10T09:00:00Z",
  },
  {
    id: "job-002",
    title: "Port Safety & Compliance Officer",
    slug: "port-safety-compliance-officer-lagos",
    summary:
      "Ensure ISPS, SOLAS, and local regulatory compliance at AGL's Lagos Apapa terminal with a focus on safety culture.",
    description: `<p>AGL is hiring a dedicated <strong>Port Safety & Compliance Officer</strong> at our Apapa terminal in Lagos, Nigeria. You will champion our safety-first culture and ensure full compliance with international maritime conventions and Nigerian port regulations.</p>`,
    requirements: [
      {
        category: "Essential Requirements",
        items: [
          "5+ years in maritime safety or HSE",
          "ISPS Code knowledge",
          "SOLAS familiarity",
          "Incident investigation experience",
          "Nigerian NIMASA regulatory knowledge",
        ],
      },
    ],
    division: "Port",
    region: "West Africa",
    location: "Lagos",
    country: "Nigeria",
    employmentType: "full_time",
    experienceLevel: "Mid",
    status: "published",
    publishedAt: "2026-05-15T09:00:00Z",
    closingDate: "2026-06-20T23:59:59Z",
    createdBy: "user-001",
    applicantCount: 32,
    createdAt: "2026-05-12T10:00:00Z",
    updatedAt: "2026-05-15T09:00:00Z",
  },
  {
    id: "job-003",
    title: "Rail Network Coordinator",
    slug: "rail-network-coordinator-nairobi",
    summary:
      "Coordinate AGL's Standard Gauge Railway freight operations on the Nairobi–Mombasa corridor, optimising transit times.",
    description: `<p>AGL is seeking a <strong>Rail Network Coordinator</strong> to manage freight scheduling and performance on our East African rail concession, connecting Nairobi's Inland Container Depot to Mombasa Port.</p>`,
    requirements: [
      {
        category: "Essential Requirements",
        items: [
          "5+ years in rail operations or logistics",
          "Experience with SGR or heavy rail",
          "Strong analytical and planning skills",
          "Stakeholder management",
        ],
      },
      {
        category: "Preferred",
        items: [
          "Experience with East Africa SGR",
          "Degree in Logistics / Transport Engineering",
          "Swahili language skills",
        ],
      },
    ],
    division: "Rail",
    region: "East Africa",
    location: "Nairobi",
    country: "Kenya",
    employmentType: "full_time",
    experienceLevel: "Mid",
    status: "published",
    publishedAt: "2026-05-18T09:00:00Z",
    closingDate: "2026-07-01T23:59:59Z",
    createdBy: "user-002",
    applicantCount: 28,
    createdAt: "2026-05-15T10:00:00Z",
    updatedAt: "2026-05-18T09:00:00Z",
  },
  {
    id: "job-004",
    title: "Rail Operations Engineer",
    slug: "rail-operations-engineer-dar-es-salaam",
    summary:
      "Provide technical engineering support for AGL's TAZARA rail concession operations in Tanzania, focusing on track and rolling stock.",
    description: `<p>We are looking for a <strong>Rail Operations Engineer</strong> to support the technical and operational integrity of our rail concession in Tanzania, working on track maintenance, rolling stock management, and capacity planning.</p>`,
    requirements: [
      {
        category: "Essential Requirements",
        items: [
          "Engineering degree (Civil, Mechanical, or Rail)",
          "3+ years in rail engineering",
          "Track maintenance or rolling stock experience",
          "AutoCAD / GIS proficiency",
        ],
      },
    ],
    division: "Rail",
    region: "East Africa",
    location: "Dar es Salaam",
    country: "Tanzania",
    employmentType: "contract",
    experienceLevel: "Mid",
    status: "published",
    publishedAt: "2026-05-20T09:00:00Z",
    closingDate: "2026-06-25T23:59:59Z",
    createdBy: "user-002",
    applicantCount: 19,
    createdAt: "2026-05-17T10:00:00Z",
    updatedAt: "2026-05-20T09:00:00Z",
  },
  {
    id: "job-005",
    title: "Regional Logistics Director — Southern Africa",
    slug: "regional-logistics-director-johannesburg",
    summary:
      "Lead AGL's Southern Africa logistics division, managing warehousing, freight forwarding, and last-mile distribution from Johannesburg.",
    description: `<p>AGL is recruiting an experienced <strong>Regional Logistics Director</strong> to lead our Southern Africa business unit, encompassing South Africa, Mozambique, Zambia, and Zimbabwe. This is an executive leadership role with full P&L responsibility.</p>`,
    requirements: [
      {
        category: "Essential Requirements",
        items: [
          "15+ years in logistics and supply chain",
          "P&L management experience",
          "Senior leadership of multi-country teams",
          "SADC trade corridor knowledge",
          "APICS / CILT qualification preferred",
        ],
      },
    ],
    division: "Logistics",
    region: "Southern Africa",
    location: "Johannesburg",
    country: "South Africa",
    employmentType: "full_time",
    experienceLevel: "Executive",
    status: "published",
    publishedAt: "2026-05-05T09:00:00Z",
    closingDate: "2026-06-15T23:59:59Z",
    createdBy: "user-001",
    applicantCount: 23,
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-05T09:00:00Z",
  },
  {
    id: "job-006",
    title: "Supply Chain Analyst",
    slug: "supply-chain-analyst-accra",
    summary:
      "Analyse supply chain performance data, identify optimisation opportunities, and drive continuous improvement across AGL's West Africa network.",
    description: `<p>We are looking for a data-driven <strong>Supply Chain Analyst</strong> to join our West Africa team in Accra. You will use analytics to improve our freight, warehousing, and distribution operations.</p>`,
    requirements: [
      {
        category: "Essential Requirements",
        items: [
          "Bachelor's degree in Supply Chain, Logistics, or Data Analytics",
          "3+ years supply chain analytics",
          "Advanced Excel / SQL",
          "Power BI or Tableau",
          "Python or R a strong plus",
        ],
      },
    ],
    division: "Logistics",
    region: "West Africa",
    location: "Accra",
    country: "Ghana",
    employmentType: "full_time",
    experienceLevel: "Mid",
    status: "draft",
    createdBy: "user-003",
    applicantCount: 0,
    createdAt: "2026-05-28T10:00:00Z",
    updatedAt: "2026-05-28T10:00:00Z",
  },
];

// ─── Candidates ───────────────────────────────────────────────────────────────

export const MOCK_CANDIDATES: Candidate[] = [
  { id: "cand-001", firstName: "Kwame", lastName: "Asante", email: "k.asante@email.com", phone: "+233 24 123 4567", location: "Accra, Ghana", createdAt: "2026-05-11T08:30:00Z" },
  { id: "cand-002", firstName: "Amina", lastName: "Diallo", email: "a.diallo@email.com", phone: "+225 07 987 6543", location: "Abidjan, Côte d'Ivoire", linkedinUrl: "https://linkedin.com/in/aminadiallo", createdAt: "2026-05-12T10:15:00Z" },
  { id: "cand-003", firstName: "Chidi", lastName: "Okafor", email: "c.okafor@email.com", phone: "+234 80 555 7890", location: "Lagos, Nigeria", createdAt: "2026-05-13T14:20:00Z" },
  { id: "cand-004", firstName: "Fatima", lastName: "Al-Hassan", email: "f.alhassan@email.com", phone: "+27 82 345 6789", location: "Johannesburg, South Africa", linkedinUrl: "https://linkedin.com/in/fatimaalhassan", createdAt: "2026-05-14T09:45:00Z" },
  { id: "cand-005", firstName: "Emmanuel", lastName: "Mutua", email: "e.mutua@email.com", phone: "+254 72 234 5678", location: "Nairobi, Kenya", createdAt: "2026-05-15T11:30:00Z" },
  { id: "cand-006", firstName: "Ngozi", lastName: "Eze", email: "n.eze@email.com", phone: "+234 81 678 9012", location: "Port Harcourt, Nigeria", createdAt: "2026-05-16T16:00:00Z" },
  { id: "cand-007", firstName: "Tariq", lastName: "Ben-Salah", email: "t.bensalah@email.com", phone: "+212 61 234 5678", location: "Casablanca, Morocco", createdAt: "2026-05-17T08:15:00Z" },
  { id: "cand-008", firstName: "Aisha", lastName: "Kamara", email: "a.kamara@email.com", phone: "+232 76 123 4567", location: "Freetown, Sierra Leone", createdAt: "2026-05-18T12:45:00Z" },
  { id: "cand-009", firstName: "Jean-Pierre", lastName: "Mbeki", email: "jp.mbeki@email.com", phone: "+242 06 789 0123", location: "Brazzaville, Congo", createdAt: "2026-05-19T09:30:00Z" },
  { id: "cand-010", firstName: "Grace", lastName: "Wanjiku", email: "g.wanjiku@email.com", phone: "+254 71 345 6789", location: "Mombasa, Kenya", createdAt: "2026-05-20T14:00:00Z" },
];

// ─── Scoring Results ──────────────────────────────────────────────────────────

const buildScore = (
  skillsScore: number, expScore: number, eduScore: number,
  certsScore: number, semanticScore: number, qualityScore: number,
  matchedSkills: string[], missingSkills: string[], certifications: string[],
  relevantYears: number, degrees: string[], summary: string,
  redFlags: string[] = []
): Omit<ScoringResult, "id" | "applicationId" | "createdAt"> => {
  const overall = +(
    skillsScore * 0.35 + expScore * 0.25 + eduScore * 0.15 +
    certsScore * 0.10 + semanticScore * 0.10 + qualityScore * 0.05
  ).toFixed(1);

  const getCategory = (s: number) =>
    s >= 90 ? "fast_track" : s >= 80 ? "auto_invite" : s >= 70 ? "hr_review" : s >= 60 ? "feedback" : "auto_reject";

  return {
    skillsMatch: { score: skillsScore, weight: 0.35, weighted: +(skillsScore * 0.35).toFixed(1), matchedSkills, missingSkills },
    experienceMatch: { score: expScore, weight: 0.25, weighted: +(expScore * 0.25).toFixed(1), relevantYears },
    education: { score: eduScore, weight: 0.15, weighted: +(eduScore * 0.15).toFixed(1), degrees },
    certifications: { score: certsScore, weight: 0.10, weighted: +(certsScore * 0.10).toFixed(1), found: certifications },
    semanticAi: { score: semanticScore, weight: 0.10, weighted: +(semanticScore * 0.10).toFixed(1), assessment: "Strong contextual alignment with AGL's operational requirements and African logistics market." },
    resumeQuality: { score: qualityScore, weight: 0.05, weighted: +(qualityScore * 0.05).toFixed(1), strengths: "Well-structured, quantified achievements", weaknesses: missingSkills.length > 2 ? "Some key competencies not evidenced" : "Minor formatting inconsistencies" },
    overallScore: overall,
    aiSummary: summary,
    redFlags,
    recommendation: getCategory(overall),
  };
};

export const MOCK_SCORING: Record<string, Omit<ScoringResult, "id" | "applicationId" | "createdAt">> = {
  "app-001": buildScore(92, 88, 85, 90, 91, 88,
    ["Port Operations", "TOS Management", "IMDG", "Team Leadership", "Vessel Scheduling"],
    ["Bilingual French"],
    ["IMDG", "ISPS Code", "ISO 45001"],
    12, ["BSc Maritime Studies", "Port Management Diploma"],
    "Highly experienced port operations leader with 12 years managing high-volume container terminals across West Africa. Strong safety record and IMDG certification. Has led teams of 200+ staff. Minor gap: lacks French proficiency for Abidjan role.",
  ),
  "app-002": buildScore(78, 82, 80, 75, 79, 85,
    ["Port Safety", "ISPS Code", "SOLAS", "Incident Investigation"],
    ["NIMASA Regulations", "Digital Safety Systems"],
    ["ISPS Code", "NEBOSH"],
    7, ["BSc Occupational Health & Safety"],
    "Competent safety professional with solid international maritime certification. Experience across 3 West African ports. Lacks specific NIMASA regulatory depth and digital HSE system experience.",
  ),
  "app-003": buildScore(95, 91, 90, 95, 93, 90,
    ["Port Operations", "TOS", "IMDG", "French", "English", "Team Leadership", "Vessel Scheduling", "Customs"],
    [],
    ["IMDG", "ISPS Code", "ISO 45001", "LEAN Six Sigma"],
    14, ["MSc Port Management", "BSc Maritime Transport"],
    "Exceptional candidate with 14 years of West African port experience, bilingual (French/English), and all required certifications. Strong track record of operational improvements at comparable terminals. Highly recommended for fast-track.",
  ),
  "app-004": buildScore(55, 58, 70, 40, 52, 75,
    ["Safety", "HSE"],
    ["ISPS Code", "SOLAS", "Maritime Experience", "Incident Investigation", "NIMASA"],
    ["NEBOSH"],
    3, ["BSc Safety Management"],
    "Candidate has limited maritime industry experience and lacks core port safety certifications. Background is primarily in construction safety rather than maritime. Not suitable for this port safety role.",
    ["No maritime industry experience", "ISPS and SOLAS certifications absent"]
  ),
  "app-005": buildScore(88, 85, 82, 80, 87, 88,
    ["Rail Operations", "SGR", "Freight Scheduling", "Stakeholder Management", "Analytics"],
    ["Swahili"],
    ["PMP", "CILT"],
    8, ["BSc Transport Engineering", "MBA Logistics"],
    "Strong rail operations professional with 8 years on East African SGR corridor. Excellent stakeholder management record. Minor language gap (Swahili). Recommended for auto-invite.",
  ),
  "app-006": buildScore(72, 74, 75, 60, 71, 80,
    ["Rail Operations", "Freight", "Scheduling"],
    ["SGR Experience", "Heavy Rail", "Technical Systems"],
    ["CILT"],
    5, ["BSc Civil Engineering"],
    "Candidate shows promise but has limited specific SGR experience. Background in road freight may be transferable. Recommend HR review to assess adaptability.",
  ),
  "app-007": buildScore(91, 95, 88, 85, 90, 92,
    ["Supply Chain", "P&L Management", "Leadership", "SADC", "Multi-Country", "Logistics"],
    [],
    ["APICS CSCP", "CILT Fellow", "PMP"],
    16, ["MBA Supply Chain", "BSc Industrial Engineering"],
    "Outstanding executive candidate with 16 years of African logistics leadership. Has managed multi-country P&L across Southern Africa with AGL's key competitors. All requirements met. Strongly recommend fast-track.",
  ),
  "app-008": buildScore(65, 68, 70, 50, 63, 72,
    ["Logistics", "Warehousing", "Distribution"],
    ["P&L Management", "SADC Experience", "Senior Leadership", "Multi-Country"],
    ["CILT"],
    8, ["BSc Logistics"],
    "Mid-level logistics professional without the executive leadership experience required. Good operational background but insufficient strategic and financial management experience for this director role.",
    ["P&L experience not evidenced", "Maximum 50-person team managed vs. requirement of 500+"]
  ),
};

// ─── Applications ─────────────────────────────────────────────────────────────

const makeApp = (
  id: string, jobId: string, candidateId: string,
  status: Application["status"], score: number | undefined,
  scoreKey?: string, daysAgo: number = 5
): Application => {
  const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
  const scoring = scoreKey ? MOCK_SCORING[scoreKey] : undefined;
  const category = score
    ? score >= 90 ? "fast_track" : score >= 80 ? "auto_invite" : score >= 70 ? "hr_review" : score >= 60 ? "feedback" : "auto_reject"
    : undefined;

  return {
    id, jobId, candidateId,
    candidate: MOCK_CANDIDATES.find(c => c.id === candidateId)!,
    status,
    atsScore: score,
    decisionCategory: category as Application["decisionCategory"],
    scoringResult: scoring ? { id: `sr-${id}`, applicationId: id, ...scoring, createdAt } as ScoringResult : undefined,
    consentGiven: true,
    resumeFileName: "resume.pdf",
    createdAt, updatedAt: createdAt,
  };
};

export const MOCK_APPLICATIONS: Application[] = [
  makeApp("app-001", "job-001", "cand-001", "scored", 90.7, "app-001", 12),
  makeApp("app-002", "job-001", "cand-002", "hr_review", 78.8, "app-002", 10),
  makeApp("app-003", "job-001", "cand-003", "interview_invited", 93.9, "app-003", 8),
  makeApp("app-004", "job-002", "cand-004", "rejected", 55.2, "app-004", 7),
  makeApp("app-005", "job-003", "cand-005", "scored", 85.8, "app-005", 5),
  makeApp("app-006", "job-003", "cand-006", "hr_review", 72.4, "app-006", 4),
  makeApp("app-007", "job-005", "cand-007", "interview_invited", 91.0, "app-007", 6),
  makeApp("app-008", "job-005", "cand-008", "scored", 65.1, "app-008", 3),
  makeApp("app-009", "job-001", "cand-009", "pending", undefined, undefined, 1),
  makeApp("app-010", "job-002", "cand-010", "scoring", undefined, undefined, 2),
];

// ─── Users ────────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  { id: "user-001", email: "jane.doe@agl.com", firstName: "Jane", lastName: "Doe", role: "admin", isActive: true, avatarInitials: "JD", createdAt: "2026-01-15T00:00:00Z" },
  { id: "user-002", email: "kwesi.mensah@agl.com", firstName: "Kwesi", lastName: "Mensah", role: "hr_manager", division: "Rail", region: "East Africa", isActive: true, avatarInitials: "KM", createdAt: "2026-02-01T00:00:00Z" },
  { id: "user-003", email: "nina.petrov@agl.com", firstName: "Nina", lastName: "Petrov", role: "recruiter", division: "Logistics", region: "Southern Africa", isActive: true, avatarInitials: "NP", createdAt: "2026-03-10T00:00:00Z" },
];

// ─── Demo Auth User ───────────────────────────────────────────────────────────

export const DEMO_CREDENTIALS = { email: "jane.doe@agl.com", password: "Admin@123456" };
export const DEMO_USER = MOCK_USERS[0];

// ─── Analytics ────────────────────────────────────────────────────────────────

export const MOCK_ANALYTICS: AnalyticsSummary = {
  totalApplications: 149,
  openPositions: 5,
  avgTimeToHire: 23,
  avgAtsScore: 74.2,
  hiresThisMonth: 3,
  offersAccepted: 82,
  complianceScore: 100,
  cvScreenedToday: 47,
  timeToHireTrend: [
    { month: "Nov", avgDays: 38, target: 21 },
    { month: "Dec", avgDays: 35, target: 21 },
    { month: "Jan", avgDays: 32, target: 21 },
    { month: "Feb", avgDays: 29, target: 21 },
    { month: "Mar", avgDays: 27, target: 21 },
    { month: "Apr", avgDays: 25, target: 21 },
    { month: "May", avgDays: 23, target: 21 },
  ],
  pipelineFunnel: [
    { stage: "Applied", count: 149, pct: 100, color: "#1C355E" },
    { stage: "Scored", count: 134, pct: 89.9, color: "#2A4A7F" },
    { stage: "HR Review", count: 48, pct: 32.2, color: "#F58220" },
    { stage: "Interview", count: 22, pct: 14.8, color: "#F7A050" },
    { stage: "Offer", count: 7, pct: 4.7, color: "#22C55E" },
    { stage: "Hired", count: 3, pct: 2.0, color: "#16A34A" },
  ],
  scoreDistribution: [
    { range: "90-100", count: 18, category: "Fast Track", fill: "#22C55E" },
    { range: "80-89", count: 31, category: "Auto Invite", fill: "#86EFAC" },
    { range: "70-79", count: 44, category: "HR Review", fill: "#FCD34D" },
    { range: "60-69", count: 27, category: "Feedback", fill: "#FB923C" },
    { range: "<60", count: 14, category: "Auto Reject", fill: "#EF4444" },
  ],
  recruiterStats: [
    { name: "Jane Doe", screenings: 67, interviews: 12, hires: 2, avgScore: 76.4 },
    { name: "Kwesi Mensah", screenings: 51, interviews: 7, hires: 1, avgScore: 74.8 },
    { name: "Nina Petrov", screenings: 31, interviews: 3, hires: 0, avgScore: 71.2 },
  ],
};
