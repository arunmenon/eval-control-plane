import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Evaluator",
  description: "Evaluation platform on top of LightEval",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <div className="brand">
              <div className="logo-mark" />
              <div>
                <h1 className="logo">Evaluator</h1>
                <p className="logo-subtitle">LightEval-powered evaluation control plane</p>
              </div>
            </div>
            <nav className="nav">
              <a href="/benchmarks">Benchmarks</a>
              <a href="/packs">Packs</a>
              <a href="/runs">Runs</a>
              <a href="/packs">Leaderboards</a>
            </nav>
          </div>
        </header>
        <main className="container main-content">{children}</main>
      </body>
    </html>
  );
}
