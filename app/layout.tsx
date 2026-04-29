import "./globals.css";

export const metadata = {
  title: "Agente Criador de Apps",
  description: "Agente IA para criar apps automaticamente no GitHub",
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
