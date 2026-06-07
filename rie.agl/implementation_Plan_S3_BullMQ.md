Implementation Plan

File Storage (S3) and Queue System (Redis + BullMQ) Setup
Overview: We will configure a secure, scalable document storage and background job processing system for AGL Careers. Candidate CV uploads will be securely stored in AWS S3 with AES-256 encryption, and their background evaluation (AI screening & email notifications) will be dispatched to a BullMQ queue backed by Redis.
User Review Required
IMPORTANT
Environment Variables Required: To connect to AWS S3 and Redis, the following environment variables will need to be added to .env.local:
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=your-aws-region (e.g. us-east-1)
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# Redis Configuration (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD= (optional)
Open Questions
IMPORTANT
•	AI Processing Logic Mocking: Since we are setting up background AI processing, should the worker perform a realistic deterministic mock score evaluation based on candidate requirements (e.g. parsing skills, matching keyword criteria to output score ranges), or do you have a specific AI API (like Gemini/OpenAI) that we should connect to?
•	Worker Execution Process: Would you prefer the BullMQ queue worker to run as a separate continuous process via node scripts/worker.js, or would you like us to automatically hook its initialization into the Next.js development server startup via instrumentation.ts?
Proposed Changes
[Dependencies]
[MODIFY] package.json
Install @aws-sdk/client-s3, bullmq, and ioredis.
[Storage Services]
[NEW] s3.ts

•	Initialize the AWS S3 client using credentials from environment variables.
•	Provide an uploadCV utility to upload buffer payloads with ServerSideEncryption: 'AES256' parameter.
[Queue Services]
[NEW] redis.ts

•	Configure the ioredis client with standard configurations.
[NEW] queue.ts

•	Initialize the BullMQ Queue object named application-queue.
•	Add helper function addApplicationJob(applicationId: string) to queue jobs.
[Worker Logic]
[NEW] worker.js
Long-running BullMQ Worker script that listens to application-queue.
When a job is received:
•	Updates application status in Applications database table to 'scoring'.
•	Simulates/runs AI assessment: grades CV across 6 dimensions (Skills, Experience, Education, Certifications, Semantic, ResumeQuality).
•	Writes scores to ATS_Scores and assessment summaries to AI_Evaluations.
•	Determines matching status (e.g. fast_track, hr_review, rejected based on score threshold) and updates Applications.ApplicationStatus.
•	Simulates dispatching email confirmation alert (log file or stdout mock).
[Application Endpoints]
[MODIFY] route.ts
Modify the POST handler to replace the mock response with real operations:
•	Look up or insert candidate details into the Applicants table.
•	Upload resume file buffer to AWS S3 (AES-256).
•	Write S3 location to the Resumes database table.
•	Create a new Applications database record with state 'pending'.
•	Dispatch the job to application-queue via addApplicationJob.
Verification Plan
Automated Verification
•	Run TypeScript compiler: npx tsc --noEmit
•	Validate Next.js production build: npm run build
•	Set up a test script scripts/test_queue.js that triggers a mock job and executes the worker logic to verify DB updates, S3 mock upload, and Redis connection.
Manual Verification
Trigger an application submission from the public interface and check console logs of the running worker to confirm:
•	Uploading to AWS S3 with AES-256 success.
•	Enqueuing to BullMQ success.
•	AI Scoring worker job picking up, scoring, database updates (in Applicants, Applications, Resumes, ATS_Scores, AI_Evaluations), and mock email notification output.
