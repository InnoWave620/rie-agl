/**
 * Run this once to:
 * 1. Add PasswordHash column to Users table
 * 2. Seed default passwords for existing users
 *
 * Default password for all existing users: AGL@2026
 * Users can change it after first login.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const driver = require('msnodesqlv8');
const bcrypt = require('bcryptjs');

const connectionString =
  `Driver={ODBC Driver 17 for SQL Server};` +
  `Server=localhost,51091;` +
  `Database=RIE_AGL;` +
  `Trusted_Connection=yes;` +
  `TrustServerCertificate=yes;`;

function runQuery(conn, sql) {
  return new Promise((resolve, reject) => {
    conn.query(sql, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function migrate() {
  const conn = await new Promise((resolve, reject) => {
    driver.open(connectionString, (err, c) => err ? reject(err) : resolve(c));
  });

  console.log('Connected to database.\n');

  // 1. Check if PasswordHash column already exists
  const cols = await runQuery(conn,
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'PasswordHash'`
  );

  if (cols.length === 0) {
    console.log('Adding PasswordHash column...');
    await runQuery(conn, `ALTER TABLE Users ADD PasswordHash varchar(255) NULL`);
    console.log('✓ PasswordHash column added.\n');
  } else {
    console.log('✓ PasswordHash column already exists.\n');
  }

  // 2. Seed default password for users without a hash
  const users = await runQuery(conn,
    `SELECT UserID, Email, FullName FROM Users WHERE PasswordHash IS NULL`
  );

  if (users.length === 0) {
    console.log('All users already have passwords set.\n');
  } else {
    const defaultPassword = 'AGL@2026';
    const hash = await bcrypt.hash(defaultPassword, 12);
    console.log(`Seeding password "${defaultPassword}" for ${users.length} user(s)...`);

    for (const user of users) {
      await runQuery(conn,
        `UPDATE Users SET PasswordHash = '${hash.replace(/'/g, "''")}' WHERE UserID = ${user.UserID}`
      );
      console.log(`  ✓ ${user.FullName} (${user.Email})`);
    }
    console.log('\nDefault password for all users: AGL@2026');
    console.log('Users should change their password after first login.\n');
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
