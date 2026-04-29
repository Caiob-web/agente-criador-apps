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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function encodeGitHubPath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function getErrorText(data: any) {
  if (typeof data === "string") {
    return data;
  }

  return JSON.stringify(data, null, 2);
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
    throw new Error(`Erro GitHub ${response.status}: ${getErrorText(data)}`);
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
    console.log("Repositório criado:", repoName);
    return createResult.data;
  }

  const responseText = getErrorText(createResult.data).toLowerCase();

  const alreadyExists =
    createResult.status === 422 && responseText.includes("already exists");

  if (alreadyExists && owner) {
    console.log("Repositório já existe. Reutilizando:", repoName);

    return githubRequest(`/repos/${owner}/${repoName}`, {
      method: "GET",
    });
  }

  throw new Error(
    `Erro GitHub ${createResult.status}: ${getErrorText(createResult.data)}`
  );
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
  const safePath = encodeGitHubPath(path);

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

function buildFileBody({
  file,
  sha,
}: {
  file: GitHubFile;
  sha?: string | null;
}) {
  const body: any = {
    message: sha ? `Atualiza ${file.path}` : `Cria ${file.path}`,
    content: Buffer.from(file.content, "utf8").toString("base64"),
    branch: "main",
  };

  if (sha) {
    body.sha = sha;
  }

  return body;
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
  const safePath = encodeGitHubPath(file.path);

  let existingSha = await getExistingFileSha({
    owner,
    repo,
    path: file.path,
  });

  let result = await githubRequestSafe(
    `/repos/${owner}/${repo}/contents/${safePath}`,
    {
      method: "PUT",
      body: JSON.stringify(
        buildFileBody({
          file,
          sha: existingSha,
        })
      ),
    }
  );

  if (result.ok) {
    return result.data;
  }

  const responseText = getErrorText(result.data).toLowerCase();

  const needsSha =
    result.status === 422 &&
    (responseText.includes("sha") ||
      responseText.includes("already exists") ||
      responseText.includes("invalid request"));

  if (needsSha) {
    console.log(`GitHub pediu SHA para ${file.path}. Buscando SHA e tentando novamente...`);

    await sleep(1200);

    existingSha = await getExistingFileSha({
      owner,
      repo,
      path: file.path,
    });

    if (existingSha) {
      result = await githubRequestSafe(
        `/repos/${owner}/${repo}/contents/${safePath}`,
        {
          method: "PUT",
          body: JSON.stringify(
            buildFileBody({
              file,
              sha: existingSha,
            })
          ),
        }
      );

      if (result.ok) {
        return result.data;
      }
    }
  }

  throw new Error(`Erro GitHub ${result.status}: ${getErrorText(result.data)}`);
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
