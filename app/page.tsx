"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [repoName, setRepoName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleCreateApp() {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("/api/create-app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          repoName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Erro ao criar app.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="shell">
        <section className="hero">
          <div className="badge">
            <span className="badge-dot"></span>
            Agente IA + GitHub + Vercel
          </div>

          <h1>
            Criador de apps <br />
            <span className="gradient">automático</span>
          </h1>

          <p className="subtitle">
            Descreva o aplicativo que você quer criar. O agente gera a estrutura
            inicial, cria um repositório no GitHub e prepara tudo para evoluir o
            projeto.
          </p>

          <div className="form">
            <div className="field">
              <label>Nome do repositório</label>
              <input
                value={repoName}
                onChange={(event) => setRepoName(event.target.value)}
                placeholder="ex: app-brigada-inteligente"
              />
            </div>

            <div className="field">
              <label>O que o app deve fazer?</label>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ex: Crie um app de controle de brigadistas com dashboard, status de presença, cadastro de equipe e tela inicial moderna."
              />
            </div>

            <button
              className="action"
              onClick={handleCreateApp}
              disabled={loading || !prompt.trim()}
            >
              {loading ? "Criando app e repositório..." : "Criar app no GitHub"}
            </button>
          </div>

          {error && <div className="status error">{error}</div>}

          {result && (
            <div className="status success">
              <h2>App criado com sucesso 🚀</h2>
              <p>Arquivos criados: {result.filesCount}</p>
              <a href={result.repoUrl} target="_blank">
                Abrir repositório no GitHub
              </a>
            </div>
          )}
        </section>

        <aside className="preview">
          <div className="preview-header">
            <h2 className="preview-title">Prévia do fluxo</h2>

            <div className="window-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <div className="mock-card">
            <div className="mock-line big"></div>
            <div className="mock-line medium"></div>
            <div className="mock-line small"></div>

            <div className="mock-grid">
              <div className="mock-box">
                <strong>1. Ideia</strong>
                <p>Você descreve o app que quer criar em linguagem simples.</p>
              </div>

              <div className="mock-box">
                <strong>2. IA</strong>
                <p>O agente monta os arquivos iniciais do projeto.</p>
              </div>

              <div className="mock-box">
                <strong>3. GitHub</strong>
                <p>O sistema cria o repositório e envia o código.</p>
              </div>

              <div className="mock-box">
                <strong>4. Evolução</strong>
                <p>Depois o app pode ganhar login, banco, dashboard e deploy.</p>
              </div>
            </div>
          </div>

          <div className="steps">
            <div className="step">
              <span className="step-number">01</span>
              <span>Digite o nome do repositório.</span>
            </div>

            <div className="step">
              <span className="step-number">02</span>
              <span>Explique o aplicativo que deseja criar.</span>
            </div>

            <div className="step">
              <span className="step-number">03</span>
              <span>Clique para gerar e aguarde o GitHub receber os arquivos.</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
