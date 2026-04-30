import { generateText } from "ai";
import {
  createRepository,
  sanitizeRepoName,
  uploadFilesToRepo,
} from "@/lib/github";
import { fallbackSpec, normalizeSpec } from "@/lib/app-spec";
import { generateProfessionalFiles } from "@/lib/professional-generator";
import { saveAppEvent, saveGeneratedApp } from "@/lib/app-history";

export const runtime = "nodejs";
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

async function safeSaveAppEvent({
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
  try {
    await saveAppEvent({
      repoName,
      eventType,
      message,
      metadata,
    });
  } catch (error) {
    console.error("Erro ao salvar evento no Neon:", error);
  }
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
- Escolha cores coerentes com o tema do app.
- Evite repetir sempre verde e azul.
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
  let repoName = "";

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

    repoName = sanitizeRepoName(
      rawRepoName || `app-${Date.now().toString()}`
    );

    if (!repoName) {
      return Response.json(
        { ok: false, error: "Nome do repositório inválido." },
        { status: 400 }
      );
    }

    await safeSaveAppEvent({
      repoName,
      eventType: "start",
      message: "Criação do app iniciada.",
      metadata: {
        prompt,
      },
    });

    console.log("Gerando especificação profissional...");
    const { spec, usedSpecFallback } = await generateSpec(prompt);

    await safeSaveAppEvent({
      repoName,
      eventType: "spec_generated",
      message: "Especificação profissional gerada.",
      metadata: {
        appName: spec.appName,
        appType: spec.appType,
        primaryColor: spec.primaryColor,
        secondaryColor: spec.secondaryColor,
        usedSpecFallback,
      },
    });

    console.log("Montando arquivos profissionais...");
    const files = generateProfessionalFiles({
      prompt,
      spec,
    });

    await safeSaveAppEvent({
      repoName,
      eventType: "files_generated",
      message: "Arquivos profissionais montados.",
      metadata: {
        filesCount: files.length,
        files: files.map((file) => file.path),
      },
    });

    console.log("Criando repositório no GitHub...");
    const repo = await createRepository(
      repoName,
      `Aplicação criada por agente IA: ${prompt.slice(0, 120)}`
    );

    const owner = repo?.owner?.login || process.env.GITHUB_OWNER;

    if (!owner) {
      throw new Error("Não foi possível identificar o dono do repositório criado.");
    }

    await safeSaveAppEvent({
      repoName,
      eventType: "github_repo_created",
      message: "Repositório criado ou reutilizado no GitHub.",
      metadata: {
        owner,
        repoUrl: repo.html_url,
      },
    });

    console.log("Enviando arquivos para o GitHub...");
    await uploadFilesToRepo({
      owner,
      repo: repoName,
      files,
    });

    await safeSaveAppEvent({
      repoName,
      eventType: "github_uploaded",
      message: "Arquivos enviados para o GitHub com sucesso.",
      metadata: {
        repoUrl: repo.html_url,
        filesCount: files.length,
      },
    });

    let historySaved = false;

    try {
      await saveGeneratedApp({
        repoName,
        repoUrl: repo.html_url,
        prompt,
        appName: spec.appName,
        appType: spec.appType,
        filesCount: files.length,
        usedFallback: usedSpecFallback,
        status: "created",
        vercelProjectId: null,
        vercelUrl: null,
      });

      historySaved = true;

      await safeSaveAppEvent({
        repoName,
        eventType: "history_saved",
        message: "Histórico principal salvo no Neon.",
        metadata: {
          repoName,
          appName: spec.appName,
          appType: spec.appType,
        },
      });
    } catch (error) {
      console.error("Erro ao salvar histórico principal no Neon:", error);

      await safeSaveAppEvent({
        repoName,
        eventType: "history_error",
        message: "Erro ao salvar histórico principal no Neon.",
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    console.log("Finalizado com sucesso.");

    return Response.json({
      ok: true,
      repoName,
      repoUrl: repo.html_url,
      filesCount: files.length,
      usedFallback: usedSpecFallback,
      appName: spec.appName,
      appType: spec.appType,
      historySaved,
    });
  } catch (error: any) {
    console.error("Erro geral na API:", error);

    if (repoName) {
      await safeSaveAppEvent({
        repoName,
        eventType: "error",
        message: error?.message || "Erro inesperado ao criar o app.",
        metadata: {
          stack: error?.stack || null,
        },
      });
    }

    return Response.json(
      {
        ok: false,
        error: error?.message || "Erro inesperado ao criar o app.",
      },
      { status: 500 }
    );
  }
}
