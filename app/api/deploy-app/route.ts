import { saveAppEvent, updateGeneratedAppDeploy } from "@/lib/app-history";
import { createVercelProjectFromGit } from "@/lib/vercel";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const repoName = String(body.repoName || "").trim();
    const projectName = String(body.projectName || repoName).trim();
    const githubOwner = String(
      body.githubOwner || process.env.GITHUB_OWNER || ""
    ).trim();

    if (!repoName) {
      return Response.json(
        { ok: false, error: "repoName não informado." },
        { status: 400 }
      );
    }

    if (!githubOwner) {
      return Response.json(
        { ok: false, error: "GITHUB_OWNER não configurado." },
        { status: 500 }
      );
    }

    await saveAppEvent({
      repoName,
      eventType: "vercel_deploy_start",
      message: "Iniciando criação/importação do projeto na Vercel.",
      metadata: {
        projectName,
        githubOwner,
      },
    });

    const result = await createVercelProjectFromGit({
      projectName,
      githubOwner,
      repoName,
    });

    const vercelProjectId = result.project?.id || result.project?.projectId || null;
    const vercelUrl = result.projectUrl;

    await updateGeneratedAppDeploy({
      repoName,
      vercelProjectId,
      vercelUrl,
      status: "deployed",
    });

    await saveAppEvent({
      repoName,
      eventType: "vercel_project_created",
      message: result.created
        ? "Projeto criado na Vercel com sucesso."
        : "Projeto já existia na Vercel e foi reutilizado.",
      metadata: {
        vercelProjectId,
        vercelUrl,
        projectName: result.projectName,
        created: result.created,
      },
    });

    return Response.json({
      ok: true,
      repoName,
      projectName: result.projectName,
      vercelProjectId,
      vercelUrl,
      created: result.created,
    });
  } catch (error: any) {
    console.error("Erro ao criar deploy na Vercel:", error);

    return Response.json(
      {
        ok: false,
        error: error?.message || "Erro ao criar deploy na Vercel.",
      },
      { status: 500 }
    );
  }
}
