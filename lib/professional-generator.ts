import type { AppSpec } from "./app-spec";

type GitHubFile = {
  path: string;
  content: string;
};

function safePackageName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "app-gerado-por-ia";
}

function json(value: unknown) {
  return JSON.stringify(value);
}

export function generateProfessionalFiles({
  prompt,
  spec,
}: {
  prompt: string;
  spec: AppSpec;
}): GitHubFile[] {
  const packageName = safePackageName(spec.appName);

  return [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: packageName,
          version: "1.0.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
          },
          dependencies: {
            next: "latest",
            react: "latest",
            "react-dom": "latest",
          },
          devDependencies: {
            typescript: "latest",
            "@types/node": "latest",
            "@types/react": "latest",
            "@types/react-dom": "latest",
          },
        },
        null,
        2
      ),
    },
    {
      path: "app/layout.tsx",
      content: `import "./globals.css";

export const metadata = {
  title: ${json(spec.appName)},
  description: ${json(spec.description)}
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
`,
    },
    {
      path: "app/page.tsx",
      content: `const appName = ${json(spec.appName)};
const tagline = ${json(spec.tagline)};
const description = ${json(spec.description)};
const pages = ${json(spec.pages)};
const features = ${json(spec.features)};
const metrics = ${json(spec.metrics)};

export default function Home() {
  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brandMark"></span>
          <strong>{appName}</strong>
        </div>

        <nav>
          {pages.slice(0, 4).map((page) => (
            <a key={page} href={"#" + page.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/\\s+/g, "-")}>
              {page}
            </a>
          ))}
        </nav>

        <a className="topAction" href="/login">
          Entrar
        </a>
      </header>

      <section className="hero">
        <div className="heroGrid">
          <div className="heroContent">
            <p className="eyebrow">Plataforma criada por IA</p>

            <h1>{appName}</h1>

            <p className="tagline">{tagline}</p>

            <p className="description">{description}</p>

            <div className="actions">
              <a className="primaryButton" href="/dashboard">
                Acessar dashboard
              </a>

              <a className="secondaryButton" href="#recursos">
                Ver recursos
              </a>
            </div>
          </div>

          <div className="heroPanel">
            <div className="panelHeader">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="panelCard mainMetric">
              <small>Status da operação</small>
              <strong>Online</strong>
              <p>Ambiente visual preparado para acompanhar dados importantes.</p>
            </div>

            <div className="miniGrid">
              {metrics.slice(0, 3).map((metric) => (
                <div className="panelCard" key={metric.label}>
                  <small>{metric.label}</small>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="dashboard" className="section">
        <div className="sectionHeader">
          <p>Visão geral</p>
          <h2>Dashboard preparado para evolução</h2>
        </div>

        <div className="cards">
          {metrics.map((metric) => (
            <article className="card" key={metric.label}>
              <span>{metric.label}</span>
              <h3>{metric.value}</h3>
              <p>{metric.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="recursos" className="section">
        <div className="sectionHeader">
          <p>Recursos</p>
          <h2>Base profissional para o seu produto</h2>
        </div>

        <div className="features">
          {features.map((feature, index) => (
            <article className="feature" key={feature}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{feature}</h3>
              <p>
                Estrutura pensada para ser expandida com segurança, mantendo uma
                experiência visual consistente.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="notificacoes" className="section highlight">
        <div>
          <p className="eyebrow">Integrações</p>
          <h2>Pronto para APIs, notificações e dados externos</h2>
          <p>
            O projeto foi criado com uma base estática profissional, mas
            preparado para evoluir com autenticação, banco de dados, integrações
            e automações.
          </p>
        </div>

        <div className="notificationList">
          <div>
            <strong>Nova integração</strong>
            <span>API externa preparada para conexão futura.</span>
          </div>

          <div>
            <strong>Área do usuário</strong>
            <span>Estrutura visual pronta para login e perfis.</span>
          </div>

          <div>
            <strong>Dashboard</strong>
            <span>Indicadores iniciais organizados para análise.</span>
          </div>
        </div>
      </section>

      <footer>
        <strong>{appName}</strong>
        <span>Aplicação gerada automaticamente e pronta para evolução.</span>
      </footer>
    </main>
  );
}
`,
    },
    {
      path: "app/login/page.tsx",
      content: `export default function LoginPage() {
  return (
    <main className="authPage">
      <section className="authCard">
        <p className="eyebrow">Acesso seguro</p>
        <h1>Entrar na plataforma</h1>
        <p>
          Esta é uma tela visual preparada para receber autenticação real em uma
          próxima etapa.
        </p>

        <form>
          <label>
            E-mail
            <input placeholder="usuario@empresa.com" type="email" />
          </label>

          <label>
            Senha
            <input placeholder="Digite sua senha" type="password" />
          </label>

          <button type="button">Acessar dashboard</button>
        </form>
      </section>
    </main>
  );
}
`,
    },
    {
      path: "app/dashboard/page.tsx",
      content: `const metrics = ${json(spec.metrics)};

export default function DashboardPage() {
  return (
    <main className="dashboardPage">
      <aside className="sidebar">
        <strong>${spec.appName}</strong>
        <a>Dashboard</a>
        <a>Usuários</a>
        <a>Notificações</a>
        <a>Configurações</a>
      </aside>

      <section className="dashboardContent">
        <div className="dashboardHeader">
          <div>
            <p className="eyebrow">Painel</p>
            <h1>Dashboard operacional</h1>
          </div>

          <button>Nova ação</button>
        </div>

        <div className="cards">
          {metrics.map((metric) => (
            <article className="card" key={metric.label}>
              <span>{metric.label}</span>
              <h3>{metric.value}</h3>
              <p>{metric.description}</p>
            </article>
          ))}
        </div>

        <div className="tableCard">
          <h2>Últimas notificações</h2>

          <div className="tableRow">
            <span>API externa</span>
            <strong>Integração planejada</strong>
            <em>Hoje</em>
          </div>

          <div className="tableRow">
            <span>Usuário</span>
            <strong>Área individual preparada</strong>
            <em>Hoje</em>
          </div>

          <div className="tableRow">
            <span>Sistema</span>
            <strong>Layout profissional gerado</strong>
            <em>Agora</em>
          </div>
        </div>
      </section>
    </main>
  );
}
`,
    },
    {
      path: "app/globals.css",
      content: `* {
  box-sizing: border-box;
}

:root {
  --primary: ${spec.primaryColor};
  --secondary: ${spec.secondaryColor};
  --background: #020617;
  --surface: rgba(15, 23, 42, 0.86);
  --surface-strong: #0f172a;
  --border: rgba(148, 163, 184, 0.18);
  --text: #f8fafc;
  --muted: #cbd5e1;
  --soft: #94a3b8;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 24%, transparent), transparent 34%),
    radial-gradient(circle at bottom right, color-mix(in srgb, var(--secondary) 22%, transparent), transparent 34%),
    var(--background);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input {
  font: inherit;
}

.page {
  min-height: 100vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  width: min(1180px, calc(100% - 32px));
  margin: 18px auto 0;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(2, 6, 23, 0.74);
  border: 1px solid var(--border);
  border-radius: 22px;
  backdrop-filter: blur(18px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brandMark {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  box-shadow: 0 0 24px var(--primary);
}

nav {
  display: flex;
  gap: 18px;
  color: var(--muted);
  font-size: 14px;
}

.topAction,
.primaryButton,
.secondaryButton,
.dashboardHeader button,
.authCard button {
  border: none;
  border-radius: 16px;
  font-weight: 900;
  cursor: pointer;
}

.topAction {
  background: rgba(255,255,255,0.07);
  border: 1px solid var(--border);
  padding: 11px 16px;
}

.hero {
  padding: 80px 24px 54px;
}

.heroGrid {
  width: min(1180px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  gap: 28px;
  align-items: center;
}

.heroContent,
.heroPanel,
.card,
.feature,
.highlight,
.authCard,
.tableCard,
.sidebar {
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: 0 30px 90px rgba(0,0,0,0.36);
  backdrop-filter: blur(18px);
}

.heroContent {
  border-radius: 34px;
  padding: 46px;
}

.eyebrow {
  width: fit-content;
  margin: 0 0 16px;
  color: #86efac;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.22);
  padding: 8px 13px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 13px;
}

h1,
h2,
h3,
p {
  margin-top: 0;
}

.hero h1 {
  font-size: clamp(44px, 7vw, 84px);
  line-height: 0.92;
  letter-spacing: -3px;
  margin-bottom: 22px;
}

.tagline {
  color: var(--text);
  font-size: 24px;
  line-height: 1.35;
  font-weight: 800;
}

.description {
  color: var(--muted);
  font-size: 18px;
  line-height: 1.75;
  max-width: 760px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 30px;
}

.primaryButton {
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  color: #020617;
  padding: 15px 22px;
}

.secondaryButton {
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.06);
  padding: 15px 22px;
}

.heroPanel {
  border-radius: 34px;
  padding: 26px;
}

.panelHeader {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 22px;
}

.panelHeader span {
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: #334155;
}

.panelCard {
  background: rgba(2, 6, 23, 0.72);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 20px;
}

.panelCard small,
.card span {
  color: var(--soft);
}

.panelCard strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
}

.panelCard p {
  color: var(--muted);
  line-height: 1.6;
  margin-bottom: 0;
}

.mainMetric {
  margin-bottom: 16px;
}

.miniGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.section {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto 44px;
}

.sectionHeader p {
  color: #86efac;
  font-weight: 900;
  margin-bottom: 8px;
}

.sectionHeader h2 {
  font-size: clamp(32px, 4vw, 52px);
  letter-spacing: -1.6px;
}

.cards,
.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.card,
.feature {
  border-radius: 26px;
  padding: 26px;
}

.card h3 {
  font-size: 42px;
  margin: 12px 0;
}

.card p,
.feature p,
.highlight p {
  color: var(--muted);
  line-height: 1.7;
  margin-bottom: 0;
}

.feature span {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  background: rgba(34,197,94,0.12);
  color: #86efac;
  font-weight: 900;
}

.feature h3 {
  margin: 20px 0 10px;
}

.highlight {
  border-radius: 30px;
  padding: 34px;
  display: grid;
  grid-template-columns: 1fr 0.9fr;
  gap: 28px;
  align-items: start;
}

.highlight h2 {
  font-size: 40px;
  letter-spacing: -1px;
}

.notificationList {
  display: grid;
  gap: 12px;
}

.notificationList div,
.tableRow {
  display: grid;
  gap: 4px;
  background: rgba(2, 6, 23, 0.58);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 16px;
}

.notificationList span,
.tableRow span,
.tableRow em {
  color: var(--soft);
  font-style: normal;
}

footer {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
  padding: 34px 0 54px;
  color: var(--soft);
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.authPage {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
}

.authCard {
  width: min(480px, 100%);
  border-radius: 30px;
  padding: 34px;
}

.authCard h1 {
  font-size: 42px;
  letter-spacing: -1.4px;
}

.authCard p {
  color: var(--muted);
  line-height: 1.7;
}

.authCard form {
  display: grid;
  gap: 16px;
  margin-top: 26px;
}

.authCard label {
  display: grid;
  gap: 8px;
  color: var(--muted);
  font-weight: 800;
}

.authCard input {
  border: 1px solid var(--border);
  background: rgba(2, 6, 23, 0.78);
  color: var(--text);
  border-radius: 16px;
  padding: 15px;
  outline: none;
}

.authCard button,
.dashboardHeader button {
  background: linear-gradient(90deg, var(--primary), var(--secondary));
  color: #020617;
  padding: 15px 18px;
}

.dashboardPage {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  padding: 20px;
}

.sidebar {
  border-radius: 26px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sidebar strong {
  margin-bottom: 18px;
}

.sidebar a {
  color: var(--muted);
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
}

.dashboardContent {
  min-width: 0;
}

.dashboardHeader {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 22px;
}

.dashboardHeader h1 {
  font-size: 46px;
  letter-spacing: -1.5px;
}

.tableCard {
  border-radius: 26px;
  padding: 26px;
  margin-top: 20px;
}

.tableRow {
  grid-template-columns: 1fr 1.4fr 0.6fr;
  margin-top: 12px;
}

@media (max-width: 920px) {
  .heroGrid,
  .highlight,
  .dashboardPage {
    grid-template-columns: 1fr;
  }

  nav {
    display: none;
  }

  .cards,
  .features,
  .miniGrid {
    grid-template-columns: 1fr;
  }

  .heroContent {
    padding: 32px;
  }

  .hero h1 {
    letter-spacing: -1.8px;
  }

  footer {
    flex-direction: column;
  }
}
`,
    },
    {
      path: "README.md",
      content: `# ${spec.appName}

${spec.description}

## Ideia original

${prompt}

## Tipo de aplicação

${spec.appType}

## Páginas geradas

${spec.pages.map((page) => `- ${page}`).join("\n")}

## Recursos previstos

${spec.features.map((feature) => `- ${feature}`).join("\n")}

## Rodar localmente

\`\`\`bash
npm install
npm run dev
\`\`\`

## Estrutura

- Next.js App Router
- Página inicial profissional
- Tela de login visual
- Dashboard inicial
- CSS responsivo
- Base pronta para evolução com API, banco e autenticação
`,
    },
    {
      path: ".gitignore",
      content: `node_modules
.next
.env
.env.local
.env.*
.vercel
`,
    },
  ];
}
