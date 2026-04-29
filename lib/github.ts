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
  const token = getEnv("GITHUB_TOKEN");

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
    throw new Error(
      `Erro GitHub ${response.status}: ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`
    );
  }

  return data;
}

export async function createRepository(repoName: string, description: string) {
  return githubRequest("/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name: repoName,
      description,
      private: false,
      auto_init: true,
    }),
  });
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

  return githubRequest(`/repos/${owner}/${repo}/contents/${safePath}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `cria ${file.path}`,
      content: contentBase64,
      branch: "main",
    }),
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
    const result = await uploadFileToRepo({
      owner,
      repo,
      file,
    });

    results.push(result);
  }

  return results;
}
