mkdir -p app/api/history

cat > app/api/history/route.ts <<'EOF'
import { listAppEvents, listGeneratedApps } from "@/lib/app-history";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const repoName = url.searchParams.get("repoName");

    if (repoName) {
      const events = await listAppEvents(repoName);

      return Response.json({
        ok: true,
        repoName,
        events,
      });
    }

    const apps = await listGeneratedApps();

    return Response.json({
      ok: true,
      apps,
    });
  } catch (error: any) {
    return Response.json(
      {
        ok: false,
        error: error?.message || "Erro ao buscar histórico.",
      },
      { status: 500 }
    );
  }
}
EOF
