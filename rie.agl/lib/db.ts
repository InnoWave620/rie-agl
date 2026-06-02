import sql from 'mssql';

// Windows Authentication uses the msnodesqlv8 native driver.
// No username or password needed — it uses the currently logged-in Windows user.
const config: sql.config = {
  server: process.env.DB_SERVER!,   // e.g. "localhost\\SQLEXPRESS" or just "localhost"
  database: process.env.DB_NAME!,   // e.g. "rie_agl"
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true,             // Windows Auth — no SQL login needed
    trustServerCertificate: true,        // OK for local/dev; set false in production
    encrypt: false,                      // Set true only for Azure SQL
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Singleton pool — reused across hot-reloads in dev
let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;

  pool = await sql.connect(config);
  return pool;
}

/** Convenience helper to run a parameterised query */
export async function query<T = sql.IRecordSet<Record<string, unknown>>>(
  queryString: string,
  params?: (req: sql.Request) => void
): Promise<T> {
  const p = await getPool();
  const request = p.request();
  if (params) params(request);
  const result = await request.query(queryString);
  return result.recordset as T;
}
