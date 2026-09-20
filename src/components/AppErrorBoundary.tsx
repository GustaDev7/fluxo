import React from 'react';

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  declare readonly props: Readonly<{ children: React.ReactNode }>;
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('Fluxo rendering failed:', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="flex min-h-[100dvh] items-center justify-center bg-neutral-50 p-6 text-neutral-900">
        <div className="w-full max-w-sm rounded-2xl border bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold">Não foi possível abrir esta tela</h1>
          <p className="my-4 text-sm">O Fluxo encontrou um erro. Nenhum dado será apagado ao recarregar.</p>
          <button className="rounded-xl bg-indigo-600 px-4 py-3 text-white" onClick={() => window.location.reload()}>Recarregar o Fluxo</button>
        </div>
      </div>
    );
  }
}
