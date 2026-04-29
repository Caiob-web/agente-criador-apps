import { generateText } from "ai";
import {
  createRepository,
  sanitizeRepoName,
  uploadFilesToRepo,
} from "@/lib/github";
import { fallbackSpec, normalizeSpec } from "@/lib/app-spec";
import { generateProfessionalFiles } from "@/lib/professional-generator";

export const maxDuration = 120;

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

async function generateSpec(prompt: string) {
  try {
    const result = await withTimeout(
      generateText({
        model: process.env.AI_MODEL || "openai/gpt-5.4",
        prompt: `
Você é um arquiteto de produto digital.

Com base no pedido abaixo, crie uma especificação profissional para um app estático em Next.js.

Pedido:
"${prompt}"

Responda SOMENTE JSON válido, sem markdown e sem explicações.

Formato obrigatório:
{
  "appName": "Nome profissional do app",
  "appType": "portal | dashboard | landing | admin | saas | mapa | crud",
  "tagline": "Frase curta de impacto",
  "description": "Descrição profissional do produto",
  "primaryColor": "#22c55e",
  "secondaryColor": "#38bdf8",
  "pages": ["Início", "Login", "Dashboard", "Notificações"],
  "features": ["Recurso 1", "Recurso 2", "Recurso 3"],
  "metrics": [
    {
      "label": "Usuários",
      "value": "128",
      "description": "Descrição curta"
    }
  ]
}

Regras:
- App em português.
- Visual profissional.
- Nada genérico demais.
- Foque no domínio do pedido.
- Máximo 8 páginas.
- Máximo 10 recursos.
- Máximo 4 métricas.
`,
      }),
      16000
    );

    const raw = extractJson(result.text);

    return {
      spec: normalizeSpec(raw, prompt),
      usedSpecFallback: false,
    };
  } catch (error) {
    console.error("Erro ao gerar especificação. Usando fallback:", error);

    return {
      spec: fallbackSpec(prompt),
      usedSpecFallback: true,
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

    console.log("Gerando especificação profissional...");
    const { spec, usedSpecFallback } = await generateSpec(prompt);

    console.log("Montando arquivos profissionais...");
    const files = generateProfessionalFiles({
      prompt,
      spec,
    });

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
      usedFallback: usedSpecFallback,
      appName: spec.appName,
      appType: spec.appType,
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
