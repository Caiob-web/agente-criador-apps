cd /workspaces/agente-criador-apps

cat > lib/vercel.ts <<'EOF'
type VercelProjectInput = {
  projectName: string;
  githubOwner: string;
  repoName: string;
};

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }

  return value;
}

function sanitizeProjectName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-_\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/_/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function vercelRequest(path: string, options: RequestInit = {}) {
  const token = getEnv("VERCEL_TOKEN");

  const response = await fetch(`https://api.vercel.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);

    throw new Error(`Erro Vercel ${response.status}: ${message}`);
  }

  return data;
}

async function vercelRequestSafe(path: string, options: RequestInit = {}) {
  const token = getEnv("VERCEL_TOKEN");

  const response = await fetch(`https://api.vercel.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function getVercelUser() {
  return vercelRequest("/v2/user", {
    method: "GET",
  });
}

export async function createVercelProjectFromGit({
  projectName,
  githubOwner,
  repoName,
}: VercelProjectInput) {
  const safeProjectName = sanitizeProjectName(projectName);
  const repoFullName = `${githubOwner}/${repoName}`;

  const createResult = await vercelRequestSafe("/v10/projects", {
    method: "POST",
    body: JSON.stringify({
      name: safeProjectName,
      framework: "nextjs",
      gitRepository: {
        type: "github",
        repo: repoFullName,
      },
    }),
  });

  if (createResult.ok) {
    return {
      project: createResult.data,
      created: true,
      projectName: safeProjectName,
      projectUrl: `https://${safeProjectName}.vercel.app`,
    };
  }

  const errorText =
    typeof createResult.data === "string"
      ? createResult.data
      : JSON.stringify(createResult.data).toLowerCase();

  const alreadyExists =
    createResult.status === 409 ||
    errorText.includes("already exists") ||
    errorText.includes("project_already_exists");

  if (alreadyExists) {
    const existingProject = await getVercelProject(safeProjectName);

    return {
      project: existingProject,
      created: false,
      projectName: safeProjectName,
      projectUrl: `https://${safeProjectName}.vercel.app`,
    };
  }

  const message =
    typeof createResult.data === "string"
      ? createResult.data
      : JSON.stringify(createResult.data, null, 2);

  throw new Error(`Erro Vercel ${createResult.status}: ${message}`);
}

export async function getVercelProject(projectName: string) {
  const safeProjectName = sanitizeProjectName(projectName);

  return vercelRequest(`/v9/projects/${safeProjectName}`, {
    method: "GET",
  });
}
EOF
