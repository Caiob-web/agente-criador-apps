cat > lib/db.ts <<'EOF'
import { Pool } from "pg";

const globalForPg = globalThis as unknown as {
  pgPool?: Pool;
};

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurado.");
  }

  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 5,
    });
  }

  return globalForPg.pgPool;
}

export async function dbQuery<T = any>(sql: string, params: any[] = []) {
  const pool = getPool();
  const result = await pool.query<T>(sql, params);
  return result;
}
EOF
