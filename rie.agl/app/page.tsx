import { query } from '@/lib/db';

/* ── Types ── */
interface Stat {
  OpenJobs: number;
  TotalApplicants: number;
  TotalApplications: number;
  AvgATSScore: number | string;
}

interface RecentApp {
  FullName: string;
  Email: string;
  JobTitle: string;
  Department: string;
  ApplicationStatus: string;
  CreatedDate: Date | string;
  FinalScore: number | string | null;
  Recommendation: string | null;
}

interface ActiveJob {
  Title: string;
  Department: string;
  Location: string;
  EmploymentType: string;
  ApplicationCount: number | string;
}

interface StatusCount {
  ApplicationStatus: string;
  Count: number | string;
}

/* ── Helpers ── */
function fmt(score: number | string | null | undefined): number {
  const n = parseFloat(String(score ?? 0));
  return isNaN(n) ? 0 : Math.round(n * 10) / 10;
}

function fmtDate(d: Date | string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-ZA', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
}

function badgeClass(val: string): string {
  const s = (val ?? '').toLowerCase();
  if (s.includes('review'))                       return 'badge badge-reviewing';
  if (s.includes('interview'))                    return 'badge badge-interview';
  if (s.includes('hired') || s.includes('accept')) return 'badge badge-hired';
  if (s.includes('reject'))                       return 'badge badge-rejected';
  if (s.includes('short'))                        return 'badge badge-shortlisted';
  if (s.includes('strong'))                       return 'badge badge-strong';
  if (s.includes('moderate'))                     return 'badge badge-moderate';
  if (s.includes('weak'))                         return 'badge badge-weak';
  return 'badge badge-pending';
}

function statusColor(status: string): string {
  const s = (status ?? '').toLowerCase();
  if (s.includes('review'))                         return '#fbbf24';
  if (s.includes('interview'))                      return '#818cf8';
  if (s.includes('hired') || s.includes('accept'))  return '#34d399';
  if (s.includes('reject'))                         return '#fb7185';
  if (s.includes('short'))                          return '#22d3ee';
  return '#94a3b8';
}

/* ── Page ── */
export default async function Dashboard() {
  const [statsRows, recentApps, activeJobs, statusCounts] = await Promise.all([
    query<Stat>(`
      SELECT
        (SELECT COUNT(*) FROM Jobs        WHERE Status = 'Open') AS OpenJobs,
        (SELECT COUNT(*) FROM Applicants)                        AS TotalApplicants,
        (SELECT COUNT(*) FROM Applications)                      AS TotalApplications,
        CAST(ISNULL((SELECT AVG(CAST(FinalScore AS FLOAT)) FROM ATS_Scores), 0)
             AS DECIMAL(5,1))                                    AS AvgATSScore
    `).catch(() => [] as Stat[]),

    query<RecentApp>(`
      SELECT TOP 10
        ap.FullName, ap.Email,
        j.Title      AS JobTitle,
        j.Department,
        a.ApplicationStatus,
        a.CreatedDate,
        ats.FinalScore,
        ats.Recommendation
      FROM  Applications  a
      JOIN  Applicants    ap  ON ap.ApplicantID  = a.ApplicantID
      JOIN  Jobs          j   ON j.JobID         = a.JobID
      LEFT JOIN ATS_Scores ats ON ats.ApplicationID = a.ApplicationID
      ORDER BY a.CreatedDate DESC
    `).catch(() => [] as RecentApp[]),

    query<ActiveJob>(`
      SELECT TOP 6
        j.Title, j.Department, j.Location, j.EmploymentType,
        COUNT(a.ApplicationID) AS ApplicationCount
      FROM  Jobs         j
      LEFT JOIN Applications a ON a.JobID = j.JobID
      WHERE j.Status = 'Open'
      GROUP BY j.JobID, j.Title, j.Department, j.Location, j.EmploymentType
      ORDER BY ApplicationCount DESC
    `).catch(() => [] as ActiveJob[]),

    query<StatusCount>(`
      SELECT ApplicationStatus, COUNT(*) AS Count
      FROM Applications
      GROUP BY ApplicationStatus
      ORDER BY Count DESC
    `).catch(() => [] as StatusCount[]),
  ]);

  const stats = statsRows[0] ?? { OpenJobs: 0, TotalApplicants: 0, TotalApplications: 0, AvgATSScore: 0 };
  const total = Number(stats.TotalApplications) || 1; // avoid div/0
  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav className="nav">
        <div className="nav-logo">RIE</div>
        <span className="nav-title">RIE AGL</span>
        <span className="nav-pill">ATS</span>
        <span className="nav-date">{today}</span>
      </nav>

      <main className="main">
        {/* ── HEADER ── */}
        <div>
          <h1 className="page-title">Recruitment <span>Dashboard</span></h1>
          <p className="page-sub">AI-powered applicant tracking &amp; recruitment intelligence</p>
        </div>

        {/* ── STATS ── */}
        <div className="stats-grid">
          {[
            { icon: '💼', label: 'Open Positions',      value: Number(stats.OpenJobs),           cls: 'indigo'  },
            { icon: '👥', label: 'Total Applicants',    value: Number(stats.TotalApplicants),     cls: 'emerald' },
            { icon: '📋', label: 'Total Applications',  value: Number(stats.TotalApplications),   cls: 'purple'  },
            { icon: '📊', label: 'Avg ATS Score',       value: fmt(stats.AvgATSScore),            cls: 'amber'   },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className={`stat-value ${s.cls}`}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── RECENT APPLICATIONS ── */}
        <div>
          <div className="section-title">
            Recent Applications
            <span className="section-badge">{recentApps.length}</span>
          </div>
          <div className="table-card">
            {recentApps.length === 0 ? (
              <div className="empty-state">No applications yet.</div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Position</th>
                      <th>Status</th>
                      <th>ATS Score</th>
                      <th>AI Recommendation</th>
                      <th>Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApps.map((app, i) => {
                      const score = fmt(app.FinalScore);
                      return (
                        <tr key={i}>
                          <td>
                            <div className="applicant-name">{app.FullName}</div>
                            <div className="applicant-email">{app.Email}</div>
                          </td>
                          <td>
                            <div className="job-title-cell">{app.JobTitle}</div>
                            <div className="job-dept-cell">{app.Department}</div>
                          </td>
                          <td>
                            <span className={badgeClass(app.ApplicationStatus)}>
                              {app.ApplicationStatus}
                            </span>
                          </td>
                          <td>
                            <div className="score-wrap">
                              <div className="score-bar">
                                <div className="score-fill" style={{ width: `${Math.min(score, 100)}%` }} />
                              </div>
                              <span className="score-text" style={{ color: score >= 70 ? '#34d399' : score >= 40 ? '#fbbf24' : score > 0 ? '#fb7185' : 'var(--text-3)' }}>
                                {score > 0 ? score : '—'}
                              </span>
                            </div>
                          </td>
                          <td>
                            {app.Recommendation
                              ? <span className={badgeClass(app.Recommendation)}>{app.Recommendation}</span>
                              : <span style={{ color: 'var(--text-3)' }}>—</span>}
                          </td>
                          <td style={{ color: 'var(--text-2)', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {fmtDate(app.CreatedDate)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM: JOBS + STATUS ── */}
        <div className="bottom-grid">
          {/* Open Positions */}
          <div>
            <div className="section-title">
              Open Positions
              <span className="section-badge">{activeJobs.length}</span>
            </div>
            {activeJobs.length === 0 ? (
              <div className="table-card"><div className="empty-state">No open positions.</div></div>
            ) : (
              <div className="jobs-grid">
                {activeJobs.map((job, i) => (
                  <div key={i} className="job-card">
                    <div className="job-card-title">{job.Title}</div>
                    <div className="job-card-meta">
                      <span className="job-tag">🏢 {job.Department}</span>
                      <span className="job-tag">📍 {job.Location}</span>
                      <span className="job-tag">⏱ {job.EmploymentType}</span>
                    </div>
                    <div className="job-apps">
                      <strong>{Number(job.ApplicationCount)}</strong>
                      &nbsp;applicant{Number(job.ApplicationCount) !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          <div>
            <div className="section-title">By Status</div>
            <div className="status-card">
              {statusCounts.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No data yet.</div>
              ) : statusCounts.map((s, i) => {
                const count = Number(s.Count);
                const pct   = Math.round((count / total) * 100);
                const color = statusColor(s.ApplicationStatus);
                return (
                  <div key={i} className="status-item">
                    <div className="status-label">
                      <div className="status-dot" style={{ background: color }} />
                      {s.ApplicationStatus}
                    </div>
                    <div className="status-right">
                      <div className="status-mini-bar">
                        <div className="status-mini-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="status-count">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
