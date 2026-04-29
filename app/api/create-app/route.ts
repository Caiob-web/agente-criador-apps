import { generateText } from "ai";
import {
  createRepository,
  sanitizeRepoName,
  uploadFilesToRepo,
} from "@/lib/github";
import { fallbackFiles } from "@/lib/templates";

export const maxDuration = 60;

type GitHubFile = {
  path: string;
  content: string;
};

function extractJson(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("JSON não encontrado na resposta da IA.");
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

function normalizeFiles(data: any): GitHubFile[] {
  const files = Array.isArray(data?.files) ? data.files : [];

  return files
    .filter((file: any) => {
      return (
        typeof file?.path === "string" &&
        typeof file?.content === "string" &&
        !file.path.includes("..") &&
        !file.path.startsWith("/")
      );
    })
    .map((file: any) => ({
      path: file.path,
      content: file.content,
    }));
}

async function generateAppFiles(prompt: string): Promise<GitHubFile[]> {
  try {
    const result = await generateText({
      model: process.env.AI_MODEL || "openai/gpt-5.4",
      prompt: `
Você é um gerador de aplicações Next.js.

Crie um app simples, bonito e funcional com base neste pedido:

"${prompt}"

Regras obrigatórias:
- Responda somente JSON válido.
- Não use markdown.
- Não explique nada.
- O JSON deve ter este formato:
{
  "files": [
    {
      "path": "package.json",
      "content": "conteúdo do arquivo"
    }
  ]
}

Arquivos obrigatórios:
- package.json
- app/layout.tsx
- app/page.tsx
- app/globals.css
- README.md
- .gitignore

Use Next.js App Router.
Não use banco de dados ainda.
Não use bibliotecas externas além de next, react e react-dom.
Crie uma interface moderna em português.
`,
    });

    const data = extractJson(result.text);
    const files = normalizeFiles(data);

    const hasPackage = files.some((file) => file.path === "package.json");
    const hasPage = files.some((file) => file.path === "app/page.tsx");

    if (!hasPackage || !hasPage || files.length < 4) {
      return fallbackFiles(prompt);
    }

    return files;
  } catch (error) {
    console.error("Erro ao gerar arquivos com IA:", error);
    return fallbackFiles(prompt);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prompt = String(body.prompt || "").trim();
    const rawRepoName = String(body.repoName || "").trim();

    if (!prompt) {
      return Response.json(
        { ok: false, error: "Informe a descrição do app." },
        { status: 400 }
      );
    }

    const owner = process.env.GITHUB_OWNER;

    if (!owner) {
      return Response.json(
        { ok: false, error: "GITHUB_OWNER não configurado." },
        { status: 500 }
      );
    }

    const repoName = sanitizeRepoName(
      rawRepoName || `app-${Date.now().toString()}`
    );

    if (!repoName) {
      return Response.json(
        { ok: false, error: "Nome do repositório inválido." },
        { status: 400 }
      );
    }

    const files = await generateAppFiles(prompt);

    const repo = await createRepository(
      repoName,
      `Aplicação criada por agente IA: ${prompt.slice(0, 120)}`
    );

    await uploadFilesToRepo({
      owner,
      repo: repoName,
      files,
    });

    return Response.json({
      ok: true,
      repoName,
      repoUrl: repo.html_url,
      filesCount: files.length,
    });
  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        ok: false,
        error: error?.message || "Erro inesperado ao criar o app.",
      },
      { status: 500 }
    );
  }
}
