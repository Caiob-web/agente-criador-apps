import { ensureHistoryTables } from "@/lib/app-history";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get("secret");

    if (!process.env.DB_SETUP_SECRET) {
      return Response.json(
        { ok: false, error: "DB_SETUP_SECRET não configurado." },
        { status: 500 }
      );
    }

    if (secret !== process.env.DB_SETUP_SECRET) {
      return Response.json(
        { ok: false, error: "Acesso negado." },
        { status: 401 }
      );
    }

    await ensureHistoryTables();

    return Response.json({
      ok: true,
      message: "Tabelas criadas/verificadas com sucesso.",
    });
  } catch (error: any) {
    return Response.json(
      {
        ok: false,
        error: error?.message || "Erro ao configurar banco.",
      },
      { status: 500 }
    );
  }
}
