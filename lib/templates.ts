type GitHubFile = {
  path: string;
  content: string;
};

function cleanTitle(prompt: string) {
  const title = prompt
    .replace(/crie|criar|app|aplicativo|sistema|portal/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 70);

  return title || "App Gerado por IA";
}

export function fallbackFiles(prompt: string): GitHubFile[] {
  const title = cleanTitle(prompt);

  return [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name: "app-gerado-por-ia",
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
  title: ${JSON.stringify(title)},
  description: "Aplicação criada automaticamente por agente IA"
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
      content: `const appTitle = ${JSON.stringify(title)};
const originalPrompt = ${JSON.stringify(prompt)};

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <div className="badge">Criado por Agente IA</div>

        <div className="heroContent">
          <h1>{appTitle}</h1>

          <p>
            Aplicação inicial criada automaticamente com estrutura moderna,
            responsiva e pronta para evolução.
          </p>

          <div className="actions">
            <a href="#dashboard" className="primaryButton">
              Acessar dashboard
            </a>

            <a href="#sobre" className="secondaryButton">
              Ver detalhes
            </a>
          </div>
        </div>
      </section>

      <section id="dashboard" className="dashboard">
        <div className="sectionTitle">
          <span>Visão geral</span>
          <h2>Dashboard inicial</h2>
        </div>

        <div className="cards">
          <article className="card">
            <strong>Usuários</strong>
            <h3>128</h3>
            <p>Base inicial preparada para cadastro e gestão de acessos.</p>
          </article>

          <article className="card">
            <strong>Notificações</strong>
            <h3>42</h3>
            <p>Estrutura pronta para integração com APIs externas.</p>
          </article>

          <article className="card">
            <strong>Status</strong>
            <h3>Online</h3>
            <p>Painel preparado para acompanhar informações importantes.</p>
          </article>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <span>01</span>
          <h3>Login e acesso</h3>
          <p>
            Área preparada para receber autenticação, perfis de usuário e
            permissões.
          </p>
        </div>

        <div className="feature">
          <span>02</span>
          <h3>Área do usuário</h3>
          <p>
            Cada usuário poderá ter sua própria página, informações e histórico.
          </p>
        </div>

        <div className="feature">
          <span>03</span>
          <h3>Integrações</h3>
          <p>
            O projeto pode evoluir para consumir dados de APIs, bancos e outros
            sistemas.
          </p>
        </div>
      </section>

      <section id="sobre" className="about">
        <h2>Ideia original</h2>
        <p>{originalPrompt}</p>
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

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.22), transparent 34%),
    radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.18), transparent 34%),
    #020617;
  color: #f8fafc;
  font-family: Arial, Helvetica, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

.page {
  min-height: 100vh;
}

.hero {
  min-height: 72vh;
  display: flex;
  align-items: center;
  padding: 64px 24px;
}

.heroContent {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 34px;
  padding: 48px;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.42);
}

.badge {
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  width: fit-content;
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #86efac;
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 800;
}

h1 {
  margin: 0;
  max-width: 900px;
  font-size: clamp(42px, 7vw, 84px);
  line-height: 0.95;
  letter-spacing: -3px;
}

.hero p {
  max-width: 720px;
  color: #cbd5e1;
  font-size: 20px;
  line-height: 1.7;
  margin: 26px 0 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 34px;
}

.primaryButton,
.secondaryButton {
  padding: 15px 22px;
  border-radius: 16px;
  font-weight: 900;
}

.primaryButton {
  background: linear-gradient(90deg, #22c55e, #38bdf8);
  color: #020617;
}

.secondaryButton {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
}

.dashboard,
.features,
.about {
  width: min(1120px, calc(100% - 48px));
  margin: 0 auto 36px;
}

.sectionTitle span {
  color: #86efac;
  font-weight: 800;
}

.sectionTitle h2,
.about h2 {
  font-size: 36px;
  margin: 8px 0 22px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.card,
.feature,
.about {
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 26px;
  padding: 26px;
}

.card strong {
  color: #86efac;
}

.card h3 {
  font-size: 38px;
  margin: 12px 0;
}

.card p,
.feature p,
.about p {
  color: #cbd5e1;
  line-height: 1.7;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.feature span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.14);
  color: #86efac;
  font-weight: 900;
}

.feature h3 {
  margin: 18px 0 10px;
}

.about {
  margin-bottom: 64px;
}

@media (max-width: 820px) {
  .heroContent {
    padding: 32px;
  }

  .cards,
  .features {
    grid-template-columns: 1fr;
  }

  h1 {
    letter-spacing: -1.5px;
  }
}
`,
    },
    {
      path: "README.md",
      content: `# ${title}

Aplicação criada automaticamente por um agente IA.

## Ideia original

${prompt}

## Rodar localmente

\`\`\`bash
npm install
npm run dev
\`\`\`

## Estrutura inicial

- Next.js App Router
- Página inicial moderna
- Dashboard base
- Área preparada para login, usuários e integrações futuras
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
