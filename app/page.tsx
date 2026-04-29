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
    <main className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
      <section className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-emerald-400 font-semibold mb-2">
            Agente IA + GitHub
          </p>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Criador de Apps Automático
          </h1>

          <p className="text-slate-300 text-lg">
            Descreva o aplicativo que você quer criar. O agente gera os arquivos
            e cria um repositório no seu GitHub.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block mb-2 text-sm text-slate-300">
              Nome do repositório
            </label>

            <input
              value={repoName}
              onChange={(event) => setRepoName(event.target.value)}
              placeholder="ex: app-brigada-inteligente"
              className="w-full rounded-2xl bg-slate-900 border border-white/10 p-4 outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-slate-300">
              O que o app deve fazer?
            </label>

            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ex: Crie um app de controle de brigadistas com dashboard, status de presença, cadastro de equipe e tela inicial moderna."
              rows={7}
              className="w-full rounded-2xl bg-slate-900 border border-white/10 p-4 outline-none focus:border-emerald-400"
            />
          </div>

          <button
            onClick={handleCreateApp}
            disabled={loading || !prompt.trim()}
            className="w-full rounded-2xl bg-emerald-500 text-slate-950 font-bold p-4 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Criando app..." : "Criar app no GitHub"}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4">
            <h2 className="text-xl font-bold mb-2">App criado com sucesso 🚀</h2>

            <p className="text-slate-300 mb-3">
              Arquivos criados: {result.filesCount}
            </p>

            <a
              href={result.repoUrl}
              target="_blank"
              className="text-emerald-300 underline"
            >
              Abrir repositório no GitHub
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
