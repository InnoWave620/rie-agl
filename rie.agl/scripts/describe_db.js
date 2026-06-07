const driver = require('msnodesqlv8');

const connectionString =
  `Driver={ODBC Driver 17 for SQL Server};` +
  `Server=localhost,51091;` +
  `Database=RIE_AGL;` +
  `Trusted_Connection=yes;` +
  `TrustServerCertificate=yes;`;

driver.open(connectionString, (err, conn) => {
  if (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
  
  const tables = ['Resumes', 'AI_Evaluations', 'InterviewInvitations'];
  let index = 0;

  function nextTable() {
    if (index >= tables.length) {
      process.exit(0);
    }
    const table = tables[index++];
    console.log(`\n=== Columns for Table: ${table} ===`);
    conn.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
      ORDER BY ORDINAL_POSITION
    `, (err, rows) => {
      if (err) {
        console.error(err);
      } else {
        rows.forEach(r => {
          console.log(`- ${r.COLUMN_NAME} (${r.DATA_TYPE}${r.CHARACTER_MAXIMUM_LENGTH ? '[' + r.CHARACTER_MAXIMUM_LENGTH + ']' : ''}) nullable=${r.IS_NULLABLE}`);
        });
      }
      nextTable();
    });
  }

  nextTable();
});
