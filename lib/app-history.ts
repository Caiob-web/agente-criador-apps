cat > lib/app-history.ts <<'EOF'
import { dbQuery } from "./db";

export type GeneratedAppInput = {
  repoName: string;
  repoUrl: string;
  prompt: string;
  appName?: string;
  appType?: string;
  filesCount?: number;
  usedFallback?: boolean;
  status?: string;
  vercelProjectId?: string | null;
  vercelUrl?: string | null;
};

export async function ensureHistoryTables() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS generated_apps (
      id SERIAL PRIMARY KEY,
      repo_name TEXT NOT NULL UNIQUE,
      repo_url TEXT NOT NULL,
      prompt TEXT NOT NULL,
      app_name TEXT,
      app_type TEXT,
      files_count INTEGER DEFAULT 0,
      used_fallback BOOLEAN DEFAULT FALSE,
      status TEXT DEFAULT 'created',
      vercel_project_id TEXT,
      vercel_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS app_events (
      id SERIAL PRIMARY KEY,
      repo_name TEXT NOT NULL,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

export async function saveGeneratedApp(input: GeneratedAppInput) {
  await ensureHistoryTables();

  const result = await dbQuery(
    `
    INSERT INTO generated_apps (
      repo_name,
      repo_url,
      prompt,
      app_name,
      app_type,
      files_count,
      used_fallback,
      status,
      vercel_project_id,
      vercel_url,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
    ON CONFLICT (repo_name)
    DO UPDATE SET
      repo_url = EXCLUDED.repo_url,
      prompt = EXCLUDED.prompt,
      app_name = EXCLUDED.app_name,
      app_type = EXCLUDED.app_type,
      files_count = EXCLUDED.files_count,
      used_fallback = EXCLUDED.used_fallback,
      status = EXCLUDED.status,
      vercel_project_id = EXCLUDED.vercel_project_id,
      vercel_url = EXCLUDED.vercel_url,
      updated_at = NOW()
    RETURNING *;
    `,
    [
      input.repoName,
      input.repoUrl,
      input.prompt,
      input.appName || null,
      input.appType || null,
      input.filesCount || 0,
      Boolean(input.usedFallback),
      input.status || "created",
      input.vercelProjectId || null,
      input.vercelUrl || null,
    ]
  );

  return result.rows[0];
}

export async function saveAppEvent({
  repoName,
  eventType,
  message,
  metadata = {},
}: {
  repoName: string;
  eventType: string;
  message: string;
  metadata?: Record<string, any>;
}) {
  await ensureHistoryTables();

  const result = await dbQuery(
    `
    INSERT INTO app_events (
      repo_name,
      event_type,
      message,
      metadata
    )
    VALUES ($1,$2,$3,$4)
    RETURNING *;
    `,
    [repoName, eventType, message, JSON.stringify(metadata)]
  );

  return result.rows[0];
}

export async function listGeneratedApps() {
  await ensureHistoryTables();

  const result = await dbQuery(`
    SELECT
      id,
      repo_name,
      repo_url,
      prompt,
      app_name,
      app_type,
      files_count,
      used_fallback,
      status,
      vercel_project_id,
      vercel_url,
      created_at,
      updated_at
    FROM generated_apps
    ORDER BY updated_at DESC
    LIMIT 50;
  `);

  return result.rows;
}

export async function listAppEvents(repoName: string) {
  await ensureHistoryTables();

  const result = await dbQuery(
    `
    SELECT
      id,
      repo_name,
      event_type,
      message,
      metadata,
      created_at
    FROM app_events
    WHERE repo_name = $1
    ORDER BY created_at DESC
    LIMIT 100;
    `,
    [repoName]
  );

  return result.rows;
}
EOF
