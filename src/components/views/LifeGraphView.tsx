import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useFinance } from '../../context/FinanceContext';
import { buildLifeGraph } from '../../utils/lifeOSUtils';
import {
  Share2,
  Target,
  FolderKanban,
  DollarSign,
  CheckSquare,
  Calendar,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Layers,
  Info,
} from 'lucide-react';
import { ActiveNavTab } from '../../types';

export const LifeGraphView: React.FC = () => {
  const {
    goals,
    projects,
    tasks,
    events,
    setActiveTab,
  } = useApp();

  const {
    bills,
    accounts,
    investments,
  } = useFinance();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { nodes, edges } = buildLifeGraph(
    goals,
    projects,
    tasks,
    events,
    bills,
    accounts,
    investments
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const nodeIcons: Record<string, any> = {
    goal: Target,
    project: FolderKanban,
    budget: DollarSign,
    task: CheckSquare,
    calendar: Calendar,
    finance: DollarSign,
    networth: TrendingUp,
  };

  const handleNavigateToNode = (tab: ActiveNavTab) => {
    setActiveTab(tab);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
              <Share2 className="h-4 w-4" />
            </span>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
              Grafo de Relacionamentos da Vida
            </h1>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Life Graph
            </span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Princípio fundamental: Nenhuma informação existe isolada. Veja como suas metas se transformam em ações diárias e patrimônio real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('assistant')}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Sparkles className="h-3.5 w-3.5" /> Otimizar com Fluxo AI
          </button>
        </div>
      </div>

      {/* Main Graph Playground */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Visual Graph Pipeline */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl space-y-3">
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 p-4 text-xs text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/20 dark:text-indigo-300">
              🔗 <strong>Fluxo de Causalidade Integrado:</strong> Cada etapa do grafo alimenta a seguinte. Clique em um nó para inspecionar as conexões e navegar até o módulo correspondente.
            </div>

            {nodes.map((node, index) => {
              const Icon = nodeIcons[node.type] || Target;
              const isSelected = selectedNode?.id === node.id;
              const edge = edges.find((e) => e.fromId === node.id);

              return (
                <div key={node.id} className="flex flex-col items-center">
                  {/* Node Card */}
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                      isSelected
                        ? 'border-indigo-500 bg-white shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-neutral-900'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
                          style={{ backgroundColor: node.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                              Passo 0{index + 1} • {node.type.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                            {node.label}
                          </h3>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {node.detail}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {node.value && (
                          <span className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                            {node.value}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigateToNode(node.linkTab);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-indigo-600 dark:hover:bg-neutral-800"
                          title="Abrir no módulo correspondente"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Connecting Edge Arrow */}
                  {edge && (
                    <div className="flex flex-col items-center py-2">
                      <div className="h-3 w-0.5 bg-neutral-300 dark:bg-neutral-700" />
                      <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-0.5 text-[11px] font-semibold text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">
                        <span>{edge.relationship}</span>
                        <ArrowRight className="h-3 w-3 rotate-90 text-indigo-500" />
                      </div>
                      <div className="h-3 w-0.5 bg-neutral-300 dark:bg-neutral-700" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Detail Side Inspector */}
        <div className="w-full border-t border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 lg:w-80 lg:border-t-0 lg:border-l">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Inspeção do Grafo
              </h2>
            </div>

            {selectedNode && (
              <div className="space-y-4">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Módulo de Origem
                  </span>
                  <h3 className="mt-1 text-base font-bold text-neutral-900 dark:text-white">
                    {selectedNode.label}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                    {selectedNode.detail}
                  </p>

                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center text-xs">
                    <span className="text-neutral-500">Ação no Sistema:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      Sincronizado
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase text-neutral-500">
                    Como este elemento se conecta:
                  </h3>
                  <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600 dark:bg-neutral-800/40 dark:text-neutral-300">
                    Toda alteração de valor ou status neste ponto do Grafo recalcula os prazos das tarefas, o orçamento AUVP e a projeção patrimonial da meta.
                  </div>
                </div>

                <button
                  onClick={() => handleNavigateToNode(selectedNode.linkTab)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir Módulo ({selectedNode.linkTab.toUpperCase()})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
