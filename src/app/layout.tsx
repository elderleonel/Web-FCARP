import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import packageJson from "../../package.json";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FCARP DOC",
  description:
    "Calendario academico modular com consulta publica e painel administrativo integrado ao Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA;
  const versionLabel = commitSha
    ? `v${packageJson.version} · ${commitSha.slice(0, 7)}`
    : `v${packageJson.version} · local`;

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex min-h-full flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-[#e7edf2] bg-[#fbfcfd] px-4 py-2 text-center text-[11px] tracking-[0.08em] text-[#7b8896] sm:px-6">
            {versionLabel}
          </footer>
        </div>
      </body>
    </html>
  );
}
