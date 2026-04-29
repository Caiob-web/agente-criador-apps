type GitHubFile = {
  path: string;
  content: string;
};

function cleanTitle(prompt: string) {
  const title = prompt
    .replace(/crie|criar|app|aplicativo|sistema/gi, "")
    .trim()
    .slice(0, 60);

  return title || "App Gerado por IA";
}

export function fallbackFiles(prompt: string): GitHubFile[] {
  const title = cleanTitle(prompt);

  return [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
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
  description: "Aplicação criada por agente IA",
};

export default function RootLayout({
  children,
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
      content: `export default function Home() {
  return (
    <main className="container">
      <section className="card">
        <p className="badge">Criado por IA</p>
        <h1>${title}</h1>
        <p>
          Este aplicativo foi gerado automaticamente a partir da seguinte ideia:
        </p>
        <blockquote>
          ${prompt.replace(/`/g, "'")}
        </blockquote>

        <div className="grid">
          <div>
            <h2>Dashboard</h2>
            <p>Estrutura inicial para indicadores, cards e gestão.</p>
          </div>

          <div>
            <h2>Cadastros</h2>
            <p>Base pronta para evoluir com formulários e banco de dados.</p>
          </div>

          <div>
            <h2>Relatórios</h2>
            <p>Área preparada para relatórios e exportações futuras.</p>
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

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #0f172a;
  color: #e5e7eb;
}

.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.card {
  width: 100%;
  max-width: 1000px;
  background: linear-gradient(135deg, #111827, #1e293b);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 28px;
  padding: 40px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.35);
}

.badge {
  display: inline-block;
  background: #22c55e;
  color: #052e16;
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 700;
}

h1 {
  font-size: 48px;
  margin: 20px 0;
}

p {
  font-size: 18px;
  line-height: 1.6;
  color: #cbd5e1;
}

blockquote {
  margin: 30px 0;
  padding: 24px;
  border-left: 4px solid #22c55e;
  background: rgba(255,255,255,0.06);
  border-radius: 16px;
  color: #fff;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 30px;
}

.grid div {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 22px;
  border-radius: 20px;
}

.grid h2 {
  margin-top: 0;
}

@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 34px;
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
`,
    },
    {
      path: ".gitignore",
      content: `node_modules
.next
.env
.env.local
.vercel
`,
    },
  ];
}
