// Using msnodesqlv8 directly (not wrapped by mssql) for reliable Windows Auth via ODBC
// eslint-disable-next-line @typescript-eslint/no-require-imports
const driver = require('msnodesqlv8');

const connectionString =
  `Driver={ODBC Driver 17 for SQL Server};` +
  `Server=localhost,${process.env.DB_PORT || '51091'};` +
  `Database=${process.env.DB_NAME};` +
  `Trusted_Connection=yes;` +
  `TrustServerCertificate=yes;`;

// Singleton connection — reused across requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getConnection(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (connection) return resolve(connection);
    driver.open(connectionString, (err: Error, conn: unknown) => {
      if (err) return reject(err);
      connection = conn;
      resolve(conn);
    });
  });
}

/** Run a SQL query and return the result rows */
export async function query<T = Record<string, unknown>>(
  queryString: string
): Promise<T[]> {
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conn.query(queryString, (err: Error, rows: any[]) => {
      if (err) return reject(err);
      resolve(rows as T[]);
    });
  });
}
