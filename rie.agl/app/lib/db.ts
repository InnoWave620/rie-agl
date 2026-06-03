// eslint-disable-next-line @typescript-eslint/no-require-imports
const driver = require('msnodesqlv8');

const connectionString =
  `Driver={ODBC Driver 17 for SQL Server};` +
  `Server=localhost,${process.env.DB_PORT || '51091'};` +
  `Database=${process.env.DB_NAME || 'RIE_AGL'};` +
  `Trusted_Connection=yes;` +
  `TrustServerCertificate=yes;`;

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

export async function query<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conn.query(sql, (err: Error, rows: any[]) => {
      if (err) return reject(err);
      resolve(rows as T[]);
    });
  });
}

/**
 * Parameterized query using msnodesqlv8 native param binding.
 * Use ? placeholders in sql, pass values in the params array.
 */
export async function execute<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const conn = await getConnection();
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conn.query(sql, params, (err: Error, rows: any[]) => {
      if (err) return reject(err);
      resolve((rows ?? []) as T[]);
    });
  });
}

/** Escape a string for safe embedding in SQL when params aren't available */
export function esc(val: string | null | undefined): string {
  if (val == null) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

