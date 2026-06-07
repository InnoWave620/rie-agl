const { Worker } = require('bullmq');
const driver = require('msnodesqlv8');
const fs = require('fs');
const path = require('path');

// ─── Redis Connection Configuration ───
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisPassword = process.env.REDIS_PASSWORD || undefined;

const redisConfig = {
  host: redisHost,
  port: redisPort,
  password: redisPassword,
};

// ─── SQL Server Configuration ───
const dbPort = process.env.DB_PORT || '51091';
const dbName = process.env.DB_NAME || 'RIE_AGL';

const connectionString =
  `Driver={ODBC Driver 17 for SQL Server};` +
  `Server=localhost,${dbPort};` +
  `Database=${dbName};` +
  `Trusted_Connection=yes;` +
  `TrustServerCertificate=yes;`;

let dbConnection = null;

function getDbConnection() {
  return new Promise((resolve, reject) => {
    if (dbConnection) return resolve(dbConnection);
    driver.open(connectionString, (err, conn) => {
      if (err) return reject(err);
      dbConnection = conn;
      resolve(conn);
    });
  });
}

async function dbQuery(sql, params = []) {
  const conn = await getDbConnection();
  return new Promise((resolve, reject) => {
    conn.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows ?? []);
    });
  });
}

// Helper to escape values safely in inline strings if parameterized is not needed
function esc(val) {
  if (val == null) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ─── Process Job Logic ───
async function processApplication(applicationId) {
  console.log(`[Worker] Started processing application ID: ${applicationId}`);

  // 1. Fetch application details
  const appRows = await dbQuery(`
    SELECT ApplicantID, JobID, ApplicationStatus 
    FROM Applications 
    WHERE ApplicationID = ?
  `, [parseInt(applicationId)]);

  if (!appRows.length) {
    throw new Error(`Application with ID ${applicationId} not found in database.`);
  }

  const { ApplicantID, JobID } = appRows[0];

  // 2. Set status to 'scoring' (indicates AI screening in progress)
  await dbQuery(`
    UPDATE Applications 
    SET ApplicationStatus = 'scoring' 
    WHERE ApplicationID = ?
  `, [parseInt(applicationId)]);
  console.log(`[Worker] Application ${applicationId} status updated to 'scoring'.`);

  // 3. Fetch Applicant details
  const applicantRows = await dbQuery(`
    SELECT FullName, Email 
    FROM Applicants 
    WHERE ApplicantID = ?
  `, [ApplicantID]);

  if (!applicantRows.length) {
    throw new Error(`Applicant with ID ${ApplicantID} not found.`);
  }

  const { FullName, Email } = applicantRows[0];

  // 4. Fetch Job details
  const jobRows = await dbQuery(`
    SELECT Title, Requirements 
    FROM Jobs 
    WHERE JobID = ?
  `, [JobID]);

  if (!jobRows.length) {
    throw new Error(`Job with ID ${JobID} not found.`);
  }

  const { Title: JobTitle } = jobRows[0];

  // 5. Simulate AI Analysis & Score Calculation
  // Generate random but realistic dimensions (deterministic mock based on candidate name / job title)
  const hash = (FullName + JobTitle).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const getScore = (min, max, offset) => min + ((hash + offset) % (max - min + 1));

  const skillsScore = getScore(65, 98, 7);
  const experienceScore = getScore(60, 95, 12);
  const educationScore = getScore(70, 100, 23);
  const certificationScore = getScore(40, 95, 34);
  const semanticScore = getScore(65, 98, 45);
  const resumeQualityScore = getScore(70, 98, 56);

  const finalScore = parseFloat(
    ((skillsScore + experienceScore + educationScore + certificationScore + semanticScore + resumeQualityScore) / 6).toFixed(1)
  );

  let recommendation = 'hr_review';
  let nextStatus = 'hr_review';

  if (finalScore >= 90) {
    recommendation = 'fast_track';
    nextStatus = 'interview_invited';
  } else if (finalScore >= 80) {
    recommendation = 'auto_invite';
    nextStatus = 'interview_invited';
  } else if (finalScore >= 70) {
    recommendation = 'hr_review';
    nextStatus = 'hr_review';
  } else if (finalScore >= 60) {
    recommendation = 'feedback';
    nextStatus = 'hr_review';
  } else {
    recommendation = 'auto_reject';
    nextStatus = 'rejected';
  }

  // 6. Generate AI evaluation texts
  const aiSummary = `Applicant ${FullName} exhibits strong structural alignment for the ${JobTitle} role. Their background shows competent proficiency in technical workflows with a final compatibility index of ${finalScore}%. They demonstrate solid analytical abilities and meet the core criteria required for RIE-AGL standards.`;
  
  const strengths = [
    `Strong technical skills alignment matching ${JobTitle} parameters`,
    `Solid background scoring high on experience criteria (${experienceScore}%)`,
    `Excellent resume presentation and clarity of accomplishments`
  ].join('; ');

  const weaknesses = [
    `Minor gaps in active certifications relative to maximum job requirements`,
    `Could benefit from showing more concrete volume metrics in logistics workflows`
  ].join('; ');

  // 7. Write Scores and Evaluations into DB
  // Delete existing scores if any to avoid uniqueness errors
  await dbQuery(`DELETE FROM ATS_Scores WHERE ApplicationID = ?`, [parseInt(applicationId)]);
  await dbQuery(`DELETE FROM AI_Evaluations WHERE ApplicationID = ?`, [parseInt(applicationId)]);

  // Insert ATS Scores
  await dbQuery(`
    INSERT INTO ATS_Scores (
      ApplicationID, SkillsScore, ExperienceScore, EducationScore, 
      CertificationScore, SemanticScore, ResumeQualityScore, FinalScore, 
      Recommendation, CreatedDate
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE())
  `, [
    parseInt(applicationId), skillsScore, experienceScore, educationScore,
    certificationScore, semanticScore, resumeQualityScore, finalScore, recommendation
  ]);

  // Insert AI Evaluations
  await dbQuery(`
    INSERT INTO AI_Evaluations (
      ApplicationID, AISummary, Strengths, Weaknesses, Recommendation, CreatedDate
    ) VALUES (?, ?, ?, ?, ?, GETDATE())
  `, [parseInt(applicationId), aiSummary, strengths, weaknesses, recommendation]);

  // 8. Update Application status to final decision state
  await dbQuery(`
    UPDATE Applications 
    SET ApplicationStatus = ? 
    WHERE ApplicationID = ?
  `, [nextStatus, parseInt(applicationId)]);

  console.log(`[Worker] Evaluation completed. Score: ${finalScore}%, Recommendation: ${recommendation}, Next Status: ${nextStatus}`);

  // 9. Simulate Sending Email Notification (write to mock logs & log to console)
  const mockLogDir = path.join(__dirname, '..', 'scratch');
  if (!fs.existsSync(mockLogDir)) {
    fs.mkdirSync(mockLogDir, { recursive: true });
  }

  const logPath = path.join(mockLogDir, 'mock_emails.log');
  const logMessage = `[${new Date().toISOString()}] To: ${Email} (${FullName}) | Job: ${JobTitle} | Status Update: ${nextStatus} | ATS Score: ${finalScore} | Recommendation: ${recommendation}\n`;
  fs.appendFileSync(logPath, logMessage);

  console.log(`[Worker] Simulated email notification dispatched to ${Email}. Logged in scratch/mock_emails.log.`);
}

// ─── Start BullMQ Worker ───
console.log(`[Worker] Starting application queue worker... connecting to Redis at ${redisHost}:${redisPort}`);

const worker = new Worker('application-queue', async (job) => {
  const { applicationId } = job.data;
  try {
    await processApplication(applicationId);
  } catch (error) {
    console.error(`[Worker] Failed to process application ID ${applicationId}:`, error);
    throw error; // Re-throw to allow BullMQ to handle job failure/retry
  }
}, {
  connection: redisConfig,
  concurrency: 1, // Process sequentially
});

worker.on('ready', () => {
  console.log('[Worker] Worker is active and listening for job events...');
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job ? job.id : 'unknown'} failed:`, err);
});

worker.on('error', (err) => {
  console.error('[Worker] Global worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received. Shutting down worker gracefully...');
  await worker.close();
  process.exit(0);
});
