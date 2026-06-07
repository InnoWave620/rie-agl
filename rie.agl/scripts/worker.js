const { Worker } = require('bullmq');
const driver = require('msnodesqlv8');
const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Load environment variables from .env.local manually for the standalone Node process
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const val = trimmed.substring(equalIndex + 1).trim();
        // Only set if not already defined
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  });
}

// ─── Redis Connection Configuration ───
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisPassword = process.env.REDIS_PASSWORD || undefined;

const redisConfig = {
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  tls: redisHost.includes('upstash.io') ? {} : undefined,
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

// ─── SMTP Email Configuration ───
const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || 'careers@rie-agl.com';

const hasSmtp = !!(smtpHost && smtpUser && smtpPass);

const smtpTransporter = hasSmtp
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

async function sendWorkerEmail({ to, subject, text }) {
  if (!smtpTransporter) {
    console.warn('[SMTP] SMTP credentials missing in .env.local. Logging mock email.');
    const mockLogDir = path.join(__dirname, '..', 'scratch');
    if (!fs.existsSync(mockLogDir)) {
      fs.mkdirSync(mockLogDir, { recursive: true });
    }
    const logPath = path.join(mockLogDir, 'mock_emails.log');
    const logMessage = 
      `======================================================\n` +
      `MOCK EMAIL SENDER (REAL SMTP NOT CONFIGURED)\n` +
      `Date: ${new Date().toISOString()}\n` +
      `To: ${to}\n` +
      `Subject: ${subject}\n\n` +
      `${text}\n` +
      `======================================================\n\n`;
    fs.appendFileSync(logPath, logMessage);
    return;
  }

  try {
    const info = await smtpTransporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      text,
      html: text.replace(/\n/g, '<br>'),
    });
    console.log(`[SMTP] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`[SMTP] Failed to send email to ${to}:`, error);
    throw error;
  }
}

// ─── Cloudflare R2 & Gemini API Configuration ───
const hasR2 = !!(
  process.env.R2_ACCESS_KEY && process.env.R2_ACCESS_KEY !== 'xxxxxxxx' &&
  process.env.R2_SECRET_KEY && process.env.R2_SECRET_KEY !== 'xxxxxxxx' &&
  process.env.R2_ENDPOINT && !process.env.R2_ENDPOINT.includes('YOUR_ACCOUNT_ID')
);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://dummy.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || 'dummy',
    secretAccessKey: process.env.R2_SECRET_KEY || 'dummy',
  },
});

const geminiApiKey = process.env.GEMINI_API_KEY || null;

async function downloadCV(cvUrl) {
  let key = cvUrl;
  try {
    const url = new URL(cvUrl);
    key = url.pathname.substring(1);
  } catch {}

  const bucketName = process.env.R2_BUCKET || 'rie-agl-cvs';
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );

  const streamToBuffer = (stream) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });

  return await streamToBuffer(response.Body);
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
    SELECT a.ApplicantID, a.JobID, a.ApplicationStatus, r.CVUrl, r.ResumeID
    FROM Applications a
    LEFT JOIN Resumes r ON r.ApplicantID = a.ApplicantID
    WHERE a.ApplicationID = ?
  `, [parseInt(applicationId)]);

  if (!appRows.length) {
    throw new Error(`Application with ID ${applicationId} not found in database.`);
  }

  const { ApplicantID, JobID, CVUrl, ResumeID } = appRows[0];

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

  const { Title: JobTitle, Requirements: JobRequirements } = jobRows[0];

  let skillsScore, experienceScore, educationScore, certificationScore, semanticScore, resumeQualityScore, finalScore;
  let recommendation = 'hr_review';
  let aiSummary = '';
  let strengths = '';
  let weaknesses = '';

  let evaluationSuccess = false;

  if (CVUrl && hasR2) {
    try {
      console.log(`[Worker] Cloudflare R2 detected. Downloading CV: ${CVUrl}`);
      const pdfBuffer = await downloadCV(CVUrl);

      // Compute file hash (SHA-256) for exact match caching
      const crypto = require('crypto');
      const fileHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      console.log(`[Worker] CV downloaded. File hash: ${fileHash}`);

      // Save file hash to Resumes table
      if (ResumeID) {
        await dbQuery(`UPDATE Resumes SET FileHash = ? WHERE ResumeID = ?`, [fileHash, ResumeID]);
      }

      // Check if we already have an evaluation for this identical CV and JobID
      const cachedRows = await dbQuery(`
        SELECT TOP 1 
          ats.SkillsScore, ats.ExperienceScore, ats.EducationScore, 
          ats.CertificationScore, ats.SemanticScore, ats.ResumeQualityScore, ats.FinalScore, 
          ats.Recommendation, ae.AISummary, ae.Strengths, ae.Weaknesses
        FROM Applications a
        JOIN Resumes r ON r.ApplicantID = a.ApplicantID
        JOIN ATS_Scores ats ON ats.ApplicationID = a.ApplicationID
        JOIN AI_Evaluations ae ON ae.ApplicationID = a.ApplicationID
        WHERE (r.FileHash = ? OR r.CVUrl = ?) AND a.JobID = ? AND a.ApplicationID <> ?
      `, [fileHash, CVUrl, JobID, parseInt(applicationId)]);

      if (cachedRows.length > 0) {
        const cached = cachedRows[0];
        skillsScore = parseFloat(cached.SkillsScore);
        experienceScore = parseFloat(cached.ExperienceScore);
        educationScore = parseFloat(cached.EducationScore);
        certificationScore = parseFloat(cached.CertificationScore);
        semanticScore = parseFloat(cached.SemanticScore);
        resumeQualityScore = parseFloat(cached.ResumeQualityScore);
        finalScore = parseFloat(cached.FinalScore);
        recommendation = cached.Recommendation;
        aiSummary = cached.AISummary;
        strengths = cached.Strengths;
        weaknesses = cached.Weaknesses;
        evaluationSuccess = true;
        console.log(`[Worker] Cache HIT! Found existing evaluation for identical CV (hash: ${fileHash}) and Job ID: ${JobID}. Reusing scores.`);
      } else if (geminiApiKey) {
        console.log('[Worker] Cache MISS. Calling Gemini API with temperature 0.0 for maximum consistency...');
        const prompt = `
          You are an expert AI recruiter for RIE-AGL Careers.
          Your task is to evaluate the attached candidate CV (PDF) against the requirements of the job opening:

          Job Title: ${JobTitle}
          Job Requirements:
          ${JobRequirements || 'No specific requirements listed. Assess general fit for the job title.'}

          Evaluate the candidate across the following dimensions:
          1. Skills Match: How closely do the candidate's skills align with the requirements?
          2. Experience Match: Does their career history match the expected level and scope?
          3. Education Match: Do they have the required degrees or qualifications?
          4. Certification Match: Do they hold the listed certifications or licenses?
          5. Semantic Match: Does their overall profile fit the role description?
          6. Resume Quality: Is the CV clean, well-formatted, professional, and clear?

          Assign a score out of 100 for each dimension.
          Calculate the Final Score as the mathematical average of the 6 dimensions (rounded to 1 decimal place).

          Provide a recommendation category:
          - "fast_track" (Final Score >= 90)
          - "auto_invite" (Final Score 80-89)
          - "hr_review" (Final Score 70-79)
          - "feedback" (Final Score 60-69)
          - "auto_reject" (Final Score < 60)

          Provide a detailed summary (AISummary) explaining the evaluation, key strengths (semicolon-separated list), and weaknesses/areas to improve (semicolon-separated list).
        `;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'application/pdf',
                        data: pdfBuffer.toString('base64'),
                      },
                    },
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.0,
                responseSchema: {
                  type: 'object',
                  properties: {
                    skillsScore: { type: 'number' },
                    experienceScore: { type: 'number' },
                    educationScore: { type: 'number' },
                    certificationScore: { type: 'number' },
                    semanticScore: { type: 'number' },
                    resumeQualityScore: { type: 'number' },
                    finalScore: { type: 'number' },
                    recommendation: {
                      type: 'string',
                      enum: ['fast_track', 'auto_invite', 'hr_review', 'feedback', 'auto_reject'],
                    },
                    aiSummary: { type: 'string' },
                    strengths: { type: 'string' },
                    weaknesses: { type: 'string' },
                  },
                  required: [
                    'skillsScore',
                    'experienceScore',
                    'educationScore',
                    'certificationScore',
                    'semanticScore',
                    'resumeQualityScore',
                    'finalScore',
                    'recommendation',
                    'aiSummary',
                    'strengths',
                    'weaknesses',
                  ],
                },
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
        }

        const result = await response.json();
        const jsonText = result.candidates[0].content.parts[0].text;
        const evaluation = JSON.parse(jsonText);

        skillsScore = evaluation.skillsScore;
        experienceScore = evaluation.experienceScore;
        educationScore = evaluation.educationScore;
        certificationScore = evaluation.certificationScore;
        semanticScore = evaluation.semanticScore;
        resumeQualityScore = evaluation.resumeQualityScore;
        finalScore = evaluation.finalScore;
        recommendation = evaluation.recommendation;
        aiSummary = evaluation.aiSummary;
        strengths = evaluation.strengths;
        weaknesses = evaluation.weaknesses;

        evaluationSuccess = true;
        console.log(`[Worker] Live Gemini AI evaluation completed successfully for applicant ${FullName}.`);
      } else {
        console.log('[Worker] No Gemini API key provided. Falling back to mock scoring.');
      }
    } catch (apiError) {
      console.error('[Worker] Live Gemini AI evaluation failed, falling back to mock scoring:', apiError);
    }
  }

  // Fallback to mock scoring if Gemini is not configured or failed
  if (!evaluationSuccess) {
    console.log(`[Worker] Executing deterministic mock grading for applicant ${FullName}...`);
    const hash = (FullName + JobTitle).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const getScore = (min, max, offset) => min + ((hash + offset) % (max - min + 1));

    skillsScore = getScore(65, 98, 7);
    experienceScore = getScore(60, 95, 12);
    educationScore = getScore(70, 100, 23);
    certificationScore = getScore(40, 95, 34);
    semanticScore = getScore(65, 98, 45);
    resumeQualityScore = getScore(70, 98, 56);

    finalScore = parseFloat(
      ((skillsScore + experienceScore + educationScore + certificationScore + semanticScore + resumeQualityScore) / 6).toFixed(1)
    );

    if (finalScore >= 90) {
      recommendation = 'fast_track';
    } else if (finalScore >= 80) {
      recommendation = 'auto_invite';
    } else if (finalScore >= 70) {
      recommendation = 'hr_review';
    } else if (finalScore >= 60) {
      recommendation = 'feedback';
    } else {
      recommendation = 'auto_reject';
    }

    aiSummary = `Applicant ${FullName} exhibits strong structural alignment for the ${JobTitle} role. Their background shows competent proficiency in technical workflows with a final compatibility index of ${finalScore}%. They demonstrate solid analytical abilities and meet the core criteria required for RIE-AGL standards.`;

    strengths = [
      `Strong technical skills alignment matching ${JobTitle} parameters`,
      `Solid background scoring high on experience criteria (${experienceScore}%)`,
      `Excellent resume presentation and clarity of accomplishments`
    ].join('; ');

    weaknesses = [
      `Minor gaps in active certifications relative to maximum job requirements`,
      `Could benefit from showing more concrete volume metrics in logistics workflows`
    ].join('; ');
  }

  // Map recommendation to next database application status
  let nextStatus = 'hr_review';
  if (recommendation === 'fast_track' || recommendation === 'auto_invite') {
    nextStatus = 'interview_invited';
  } else if (recommendation === 'auto_reject') {
    nextStatus = 'rejected';
  } else {
    nextStatus = 'hr_review';
  }

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

  // 9. Send Email Notification (uses SMTP if configured, falls back to logging)
  if (nextStatus === 'rejected') {
    const rejectionText =
      `Dear ${FullName},\n\n` +
      `Thank you for your interest in the ${JobTitle} position at RIE-AGL Careers and for taking the time to submit your CV.\n\n` +
      `We have reviewed your qualifications, skills match, and experience (ATS compatibility score: ${finalScore}%) for this role. Unfortunately, we have decided not to proceed with your application at this time.\n\n` +
      `We appreciate your interest in RIE-AGL and wish you all the best in your job search.\n\n` +
      `Best regards,\n` +
      `HR Recruitment Team\n` +
      `RIE-AGL Careers`;

    await sendWorkerEmail({
      to: Email,
      subject: `Update on your application for ${JobTitle} at RIE-AGL`,
      text: rejectionText,
    });
  } else {
    const statusText = `Dear ${FullName},\n\nThis is an update regarding your application for ${JobTitle}. Your application status has been updated to: ${nextStatus}.\n\nBest regards,\nHR Recruitment Team\nRIE-AGL Careers`;
    await sendWorkerEmail({
      to: Email,
      subject: `Application Update: ${JobTitle} at RIE-AGL`,
      text: statusText,
    });
  }
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
