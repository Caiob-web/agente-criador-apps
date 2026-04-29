export type AppType =
  | "portal"
  | "dashboard"
  | "landing"
  | "admin"
  | "saas"
  | "mapa"
  | "crud";

export type AppSpec = {
  appName: string;
  appType: AppType;
  tagline: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  pages: string[];
  features: string[];
  metrics: {
    label: string;
    value: string;
    description: string;
  }[];
};

function limitText(value: unknown, fallback: string, max = 120) {
  const text = String(value || "").trim();

  if (!text) {
    return fallback;
  }

  return text.slice(0, max);
}

function normalizeList(value: unknown, fallback: string[], max = 8) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, max);

  return items.length ? items : fallback;
}

function normalizeMetrics(value: unknown) {
  const fallback = [
    {
      label: "Usuários",
      value: "128",
      description: "Perfis preparados para acesso e gestão.",
    },
    {
      label: "Notificações",
      value: "42",
      description: "Base pronta para integração com APIs externas.",
    },
    {
      label: "Status",
      value: "Online",
      description: "Aplicação inicial pronta para evolução.",
    },
  ];

  if (!Array.isArray(value)) {
    return fallback;
  }

  const metrics = value
    .map((item: any) => ({
      label: limitText(item?.label, "Indicador", 35),
      value: limitText(item?.value, "0", 20),
      description: limitText(item?.description, "Indicador do sistema.", 90),
    }))
    .slice(0, 4);

  return metrics.length ? metrics : fallback;
}

export function inferAppType(prompt: string): AppType {
  const text = prompt.toLowerCase();

  if (text.includes("mapa") || text.includes("poste") || text.includes("coordenada")) {
    return "mapa";
  }

  if (text.includes("login") || text.includes("usuário") || text.includes("usuario") || text.includes("portal")) {
    return "portal";
  }

  if (text.includes("dashboard") || text.includes("indicador") || text.includes("relatório") || text.includes("relatorio")) {
    return "dashboard";
  }

  if (text.includes("admin") || text.includes("gestão") || text.includes("gestao")) {
    return "admin";
  }

  if (text.includes("crud") || text.includes("cadastro")) {
    return "crud";
  }

  if (text.includes("saas") || text.includes("assinatura")) {
    return "saas";
  }

  return "landing";
}

export function fallbackSpec(prompt: string): AppSpec {
  const appType = inferAppType(prompt);

  let appName = "App Profissional";
  let tagline = "Uma experiência digital moderna, rápida e pronta para evoluir.";
  let description =
    "Aplicação criada automaticamente com estrutura profissional, visual moderno e base preparada para novas funcionalidades.";

  if (appType === "portal") {
    appName = "Portal Inteligente";
    tagline = "Um portal moderno para acesso, gestão e acompanhamento de informações.";
    description =
      "Portal com aparência profissional, área de usuário, dashboard inicial e estrutura preparada para autenticação e integrações externas.";
  }

  if (appType === "dashboard") {
    appName = "Dashboard Executivo";
    tagline = "Indicadores claros para decisões rápidas.";
    description =
      "Painel visual com cards, métricas, visão geral e estrutura preparada para relatórios e dados em tempo real.";
  }

  if (appType === "mapa") {
    appName = "Mapa Operacional";
    tagline = "Visualização geográfica inteligente para análise de campo.";
    description =
      "Aplicação com estrutura visual para mapas, pontos, indicadores e análise territorial.";
  }

  return {
    appName,
    appType,
    tagline,
    description,
    primaryColor: "#22c55e",
    secondaryColor: "#38bdf8",
    pages: ["Início", "Login", "Dashboard", "Notificações"],
    features: [
      "Interface responsiva",
      "Layout profissional",
      "Estrutura pronta para login",
      "Dashboard inicial",
      "Área preparada para integração com API externa",
      "Componentes reutilizáveis",
    ],
    metrics: [
      {
        label: "Usuários",
        value: "128",
        description: "Perfis preparados para acesso e gestão.",
      },
      {
        label: "Notificações",
        value: "42",
        description: "Base pronta para integração com APIs externas.",
      },
      {
        label: "Disponibilidade",
        value: "99%",
        description: "Estrutura pensada para operação estável.",
      },
    ],
  };
}

export function normalizeSpec(raw: any, prompt: string): AppSpec {
  const fallback = fallbackSpec(prompt);

  const allowedTypes: AppType[] = [
    "portal",
    "dashboard",
    "landing",
    "admin",
    "saas",
    "mapa",
    "crud",
  ];

  const appType = allowedTypes.includes(raw?.appType)
    ? raw.appType
    : fallback.appType;

  return {
    appName: limitText(raw?.appName, fallback.appName, 70),
    appType,
    tagline: limitText(raw?.tagline, fallback.tagline, 140),
    description: limitText(raw?.description, fallback.description, 280),
    primaryColor: limitText(raw?.primaryColor, fallback.primaryColor, 20),
    secondaryColor: limitText(raw?.secondaryColor, fallback.secondaryColor, 20),
    pages: normalizeList(raw?.pages, fallback.pages, 8),
    features: normalizeList(raw?.features, fallback.features, 10),
    metrics: normalizeMetrics(raw?.metrics),
  };
}
