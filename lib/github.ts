type GitHubFile = {
  path: string;
  content: string;
};

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }

  return value;
}

export function sanitizeRepoName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function githubRequest(path: string, options: RequestInit = {}) {
  const token = getEnv("APP_GITHUB_TOKEN");

  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
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

    throw new Error(`Erro GitHub ${response.status}: ${message}`);
  }

  return data;
}

async function githubRequestSafe(path: string, options: RequestInit = {}) {
  const token = getEnv("APP_GITHUB_TOKEN");

  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
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

export async function createRepository(repoName: string, description: string) {
  const owner = process.env.GITHUB_OWNER;

  const createResult = await githubRequestSafe("/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name: repoName,
      description,
      private: false,
      auto_init: true,
    }),
  });

  if (createResult.ok) {
    return createResult.data;
  }

  const alreadyExists =
    createResult.status === 422 &&
    JSON.stringify(createResult.data).toLowerCase().includes("already exists");

  if (alreadyExists && owner) {
    console.log("Repositório já existe. Reutilizando:", repoName);

    return githubRequest(`/repos/${owner}/${repoName}`, {
      method: "GET",
    });
  }

  const message =
    typeof createResult.data === "string"
      ? createResult.data
      : JSON.stringify(createResult.data, null, 2);

  throw new Error(`Erro GitHub ${createResult.status}: ${message}`);
}

async function getExistingFileSha({
  owner,
  repo,
  path,
}: {
  owner: string;
  repo: string;
  path: string;
}) {
  const safePath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const result = await githubRequestSafe(
    `/repos/${owner}/${repo}/contents/${safePath}`,
    {
      method: "GET",
    }
  );

  if (!result.ok) {
    return null;
  }

  if (result.data && typeof result.data.sha === "string") {
    return result.data.sha;
  }

  return null;
}

export async function uploadFileToRepo({
  owner,
  repo,
  file,
}: {
  owner: string;
  repo: string;
  file: GitHubFile;
}) {
  const safePath = file.path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  const contentBase64 = Buffer.from(file.content, "utf8").toString("base64");

  const existingSha = await getExistingFileSha({
    owner,
    repo,
    path: file.path,
  });

  const body: any = {
    message: existingSha ? `Atualiza ${file.path}` : `Cria ${file.path}`,
    content: contentBase64,
    branch: "main",
  };

  if (existingSha) {
    body.sha = existingSha;
  }

  return githubRequest(`/repos/${owner}/${repo}/contents/${safePath}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function uploadFilesToRepo({
  owner,
  repo,
  files,
}: {
  owner: string;
  repo: string;
  files: GitHubFile[];
}) {
  const results = [];

  for (const file of files) {
    console.log(`Enviando arquivo: ${file.path}`);

    const result = await uploadFileToRepo({
      owner,
      repo,
      file,
    });

    results.push(result);
  }

  return results;
}
