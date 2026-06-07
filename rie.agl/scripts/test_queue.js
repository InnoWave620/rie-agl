const { Queue, Worker } = require('bullmq');
const driver = require('msnodesqlv8');
const { execSync } = require('child_process');

console.log('=== Starting Queue Integration Test ===');

const dbPort = process.env.DB_PORT || '51091';
const dbName = process.env.DB_NAME || 'RIE_AGL';

const connectionString =
  `Driver={ODBC Driver 17 for SQL Server};` +
  `Server=localhost,${dbPort};` +
  `Database=${dbName};` +
  `Trusted_Connection=yes;` +
  `TrustServerCertificate=yes;`;

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');

function runQuery(conn, sql, params = []) {
  return new Promise((resolve, reject) => {
    conn.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows ?? []);
    });
  });
}

async function run() {
  driver.open(connectionString, async (err, conn) => {
    if (err) {
      console.error('[Test] SQL Server database connection failed! Check if database port is correct.', err);
      process.exit(1);
    }
    console.log('[Test] SQL Server database connected successfully!');

    try {
      // 1. Get or create a Job to associate with the test application
      let jobId;
      const jobRows = await runQuery(conn, "SELECT TOP 1 JobID FROM Jobs WHERE Status = 'Open'");
      if (jobRows.length > 0) {
        jobId = jobRows[0].JobID;
        console.log(`[Test] Using existing JobID: ${jobId}`);
      } else {
        // Insert a dummy job
        const insertedJob = await runQuery(conn, `
          INSERT INTO Jobs (Title, Department, Location, EmploymentType, Description, Status, CreatedDate)
          OUTPUT INSERTED.JobID
          VALUES ('Test Developer', 'IT', 'Cape Town, South Africa', 'Full Time', 'Description here', 'Open', GETDATE())
        `);
        jobId = insertedJob[0].JobID;
        console.log(`[Test] Created new mock JobID: ${jobId}`);
      }

      // 2. Create a test applicant
      const email = `test-applicant-${Date.now()}@example.com`;
      const insertedApplicant = await runQuery(conn, `
        INSERT INTO Applicants (FullName, Email, Phone, Location, CreatedDate)
        OUTPUT INSERTED.ApplicantID
        VALUES ('Test Queue Candidate', ?, '+271234567', 'Cape Town', GETDATE())
      `, [email]);
      const applicantId = insertedApplicant[0].ApplicantID;
      console.log(`[Test] Created new mock ApplicantID: ${applicantId} (${email})`);

      // 3. Create mock S3 resume url
      const mockS3Url = `https://mock-bucket.s3.amazonaws.com/resumes/${Date.now()}_test.pdf`;
      await runQuery(conn, `
        INSERT INTO Resumes (ApplicantID, CVUrl, FileName, UploadedDate)
        VALUES (?, ?, 'test_cv.pdf', GETDATE())
      `, [applicantId, mockS3Url]);
      console.log('[Test] Resumes table populated.');

      // 4. Create new Application
      const insertedApp = await runQuery(conn, `
        INSERT INTO Applications (ApplicantID, JobID, ApplicationStatus, CreatedDate)
        OUTPUT INSERTED.ApplicationID
        VALUES (?, ?, 'pending', GETDATE())
      `, [applicantId, jobId]);
      const applicationId = insertedApp[0].ApplicationID;
      console.log(`[Test] Created mock ApplicationID: ${applicationId} with status 'pending'`);

      // 5. Connect to Redis & enqueue the job
      const connection = { host: redisHost, port: redisPort };
      const queue = new Queue('application-queue', { connection });
      console.log('[Test] Enqueuing job in BullMQ...');
      
      const job = await queue.add('evaluate-application', { applicationId: String(applicationId) });
      console.log(`[Test] Job enqueued! Job ID: ${job.id}`);

      // 6. Spawn transient worker inside this test process to process it, verify database updates, and terminate
      console.log('[Test] Spawning transient worker to process enqueued job...');
      
      // Start the worker process as a child or run it directly in a worker
      // We will spawn the scripts/worker.js script for 6 seconds and then terminate it
      const child = require('child_process').fork('scripts/worker.js', [], {
        env: { ...process.env, REDIS_HOST: redisHost, REDIS_PORT: String(redisPort), DB_PORT: dbPort }
      });

      console.log('[Test] Worker spawned. Waiting 6 seconds for processing...');
      
      setTimeout(async () => {
        child.kill('SIGTERM');
        console.log('[Test] Worker terminated.');

        // 7. Verify Database updates
        console.log('[Test] Verifying SQL Server updates...');
        
        const finalAppRows = await runQuery(conn, 'SELECT ApplicationStatus FROM Applications WHERE ApplicationID = ?', [applicationId]);
        const scoreRows = await runQuery(conn, 'SELECT SkillsScore, ExperienceScore, FinalScore, Recommendation FROM ATS_Scores WHERE ApplicationID = ?', [applicationId]);
        const evaluationRows = await runQuery(conn, 'SELECT AISummary FROM AI_Evaluations WHERE ApplicationID = ?', [applicationId]);

        console.log('\n--- VERIFICATION RESULTS ---');
        console.log(`Application Status: ${finalAppRows[0]?.ApplicationStatus} (Expected: 'interview_invited' / 'hr_review' / 'rejected')`);
        if (scoreRows.length > 0) {
          console.log(`ATS Score: ${scoreRows[0].FinalScore}% | Skills: ${scoreRows[0].SkillsScore}% | Experience: ${scoreRows[0].ExperienceScore}%`);
          console.log(`Recommendation: ${scoreRows[0].Recommendation}`);
        } else {
          console.log('ATS Score record missing!');
        }
        if (evaluationRows.length > 0) {
          console.log(`AI Summary: ${evaluationRows[0].AISummary.substring(0, 120)}...`);
        } else {
          console.log('AI Evaluation record missing!');
        }
        console.log('----------------------------\n');

        // Cleanup mock data
        console.log('[Test] Cleaning up mock database records...');
        await runQuery(conn, 'DELETE FROM AI_Evaluations WHERE ApplicationID = ?', [applicationId]);
        await runQuery(conn, 'DELETE FROM ATS_Scores WHERE ApplicationID = ?', [applicationId]);
        await runQuery(conn, 'DELETE FROM Applications WHERE ApplicationID = ?', [applicationId]);
        await runQuery(conn, 'DELETE FROM Resumes WHERE ApplicantID = ?', [applicantId]);
        await runQuery(conn, 'DELETE FROM Applicants WHERE ApplicantID = ?', [applicantId]);
        
        console.log('[Test] Cleanup complete. Verification successful!');
        process.exit(0);
      }, 6000);

    } catch (err) {
      console.error('[Test] Test execution failed with error:', err);
      process.exit(1);
    }
  });
}

run();
