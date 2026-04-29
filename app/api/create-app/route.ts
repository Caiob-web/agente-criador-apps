import { generateText } from "ai";
import {
  createRepository,
  sanitizeRepoName,
  uploadFilesToRepo,
} from "@/lib/github";
import { fallbackFiles } from "@/lib/templates";

export const maxDuration = 120;

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
        !file.path.startsWith("/") &&
        file.path.trim().length > 0 &&
        file.content.trim().length > 0
      );
    })
    .map((file: any) => ({
      path: file.path.trim(),
      content: file.content,
    }))
    .slice(0, 10);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Tempo limite excedido após ${ms / 1000} segundos.`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function generateAppFiles(prompt: string): Promise<{
  files: GitHubFile[];
  usedFallback: boolean;
}> {
  try {
    const result = await withTimeout(
      generateText({
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

Regras técnicas:
- Use Next.js App Router.
- Não use banco de dados ainda.
- Não use bibliotecas externas além de next, react e react-dom.
- Crie uma interface moderna em português.
- Gere arquivos pequenos para evitar timeout.
- Não crie mais de 10 arquivos.
- Não use Tailwind.
- Não use imagens externas.
`,
      }),
      20000
    );

    const data = extractJson(result.text);
    const files = normalizeFiles(data);

    const hasPackage = files.some((file) => file.path === "package.json");
    const hasLayout = files.some((file) => file.path === "app/layout.tsx");
    const hasPage = files.some((file) => file.path === "app/page.tsx");
    const hasCss = files.some((file) => file.path === "app/globals.css");

    if (!hasPackage || !hasLayout || !hasPage || !hasCss || files.length < 4) {
      console.log("IA retornou arquivos incompletos. Usando fallback.");
      return {
        files: fallbackFiles(prompt),
        usedFallback: true,
      };
    }

    return {
      files,
      usedFallback: false,
    };
  } catch (error) {
    console.error("Erro ou demora ao gerar arquivos com IA. Usando fallback:", error);

    return {
      files: fallbackFiles(prompt),
      usedFallback: true,
    };
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

    const repoName = sanitizeRepoName(
      rawRepoName || `app-${Date.now().toString()}`
    );

    if (!repoName) {
      return Response.json(
        { ok: false, error: "Nome do repositório inválido." },
        { status: 400 }
      );
    }

    console.log("Gerando arquivos...");
    const { files, usedFallback } = await generateAppFiles(prompt);

    console.log("Criando repositório no GitHub...");
    const repo = await createRepository(
      repoName,
      `Aplicação criada por agente IA: ${prompt.slice(0, 120)}`
    );

    const owner = repo?.owner?.login || process.env.GITHUB_OWNER;

    if (!owner) {
      return Response.json(
        {
          ok: false,
          error: "Não foi possível identificar o dono do repositório criado.",
        },
        { status: 500 }
      );
    }

    console.log("Enviando arquivos para o GitHub...");
    await uploadFilesToRepo({
      owner,
      repo: repoName,
      files,
    });

    console.log("Finalizado com sucesso.");

    return Response.json({
      ok: true,
      repoName,
      repoUrl: repo.html_url,
      filesCount: files.length,
      usedFallback,
    });
  } catch (error: any) {
    console.error("Erro geral na API:", error);

    return Response.json(
      {
        ok: false,
        error: error?.message || "Erro inesperado ao criar o app.",
      },
      { status: 500 }
    );
  }
}
