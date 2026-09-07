import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useFinance } from '../../context/FinanceContext';
import { FluxoLogo, FluxoEmblemImage } from '../FluxoLogo';
import {
  Settings,
  Moon,
  Sun,
  Bell,
  Download,
  Upload,
  RotateCcw,
  User,
  Shield,
  Clock,
  Check,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Keyboard,
  Sparkles,
  Smartphone,
  Trash2,
  BookOpen,
  Database,
  RefreshCw,
  Server,
} from 'lucide-react';
import { downloadICS, downloadCSV } from '../../utils/exportUtils';

export const SettingsView: React.FC = () => {
  const {
    user,
    updateUserProfile,
    isDarkMode,
    setIsDarkMode,
    clearToCleanSlate,
    exportBackupJson,
    importBackupJson,
    tasks,
    projects,
    events,
    goals,
    habits,
    notes,
    monthlyPlan,
    timeEntries,
    isDbConnected,
    isDbSaving,
    lastDbSyncedAt,
    forceDbSync,
    setIsShortcutsOpen,
    setActiveTab,
  } = useApp();

  const {
    accounts,
    creditCards,
    transactions,
    bills,
    debts,
    investments,
    isFinanceDbConnected,
    isFinanceDbSaving,
    lastFinanceDbSyncedAt,
    forceFinanceDbSync,
  } = useFinance();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dbSyncSuccess, setDbSyncSuccess] = useState(false);
  const [nameInput, setNameInput] = useState(user.name);
  const [roleInput, setRoleInput] = useState(user.role || '');
  const [avatarInput, setAvatarInput] = useState(user.avatar || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAnyDbSaving = isDbSaving || isFinanceDbSaving;
  const isAllDbConnected = isDbConnected && isFinanceDbConnected;

  const handleManualSync = async () => {
    const okProd = await forceDbSync();
    const okFin = await forceFinanceDbSync();
    if (okProd && okFin) {
      setDbSyncSuccess(true);
      setTimeout(() => setDbSyncSuccess(false), 2500);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: nameInput.trim() || 'Usuário',
      role: roleInput.trim(),
      avatar: avatarInput.trim() || user.avatar,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const jsonString = exportBackupJson();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `produtividade_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup from file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importBackupJson(content);
        if (success) {
          alert('Backup importado com sucesso!');
          window.location.reload();
        } else {
          alert('Arquivo de backup inválido.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Start with clean slate
  const handleStartClean = () => {
    if (
      window.confirm(
        'Deseja apagar seus dados e iniciar o espaço pessoal do zero? Seu perfil será mantido.'
      )
    ) {
      clearToCleanSlate();
      alert('Espaço limpo ativado! Pronto para seu uso diário.');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Configurações & Prontidão de Uso
          </h1>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Personalize seu perfil, ative seu espaço de trabalho limpo, configure exportações e atalhos rápidos.
        </p>
      </div>

      <div className="space-y-6">
        {/* User Profile Form */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Perfil do Usuário
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Cargo / Especialidade
                </label>
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  placeholder="Ex: Empreendedor, Designer, Engenheiro..."
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                URL da Foto de Perfil (Avatar)
              </label>
              <input
                type="url"
                value={avatarInput}
                onChange={(e) => setAvatarInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-indigo-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {savedSuccess && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 inline" />
                    <span>Perfil atualizado com sucesso!</span>
                  </span>
                )}
              </span>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>

        {/* Clean workspace */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6 shadow-sm dark:border-indigo-950 dark:bg-indigo-950/20 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Prontidão para Uso Diário: Meu Espaço Pessoal
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Use apenas seus dados reais, armazenados com segurança no Supabase.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleStartClean}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Iniciar Meu Espaço Limpo (Começar do Zero)</span>
            </button>

          </div>
        </div>

        {/* Appearance & Theme */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Aparência & Tema
          </h2>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Modo Escuro (Dark Mode)
              </p>
              <p className="text-[11px] text-neutral-500">
                Alterne entre paleta clara diurna e interface escura para descanso visual.
              </p>
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-indigo-600' : 'bg-neutral-200 dark:bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notifications & Reminders */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações & Avisos
          </h2>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Lembretes de Prazos Próximos
                </p>
                <p className="text-[11px] text-neutral-500">
                  Avisar sobre tarefas vencendo no dia ou no dia anterior.
                </p>
              </div>
              <input
                type="checkbox"
                checked={deadlineAlerts}
                onChange={(e) => setDeadlineAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Check-in Diário de Hábitos
                </p>
                <p className="text-[11px] text-neutral-500">
                  Lembrete para manter ofensivas (streaks) ativas todas as manhãs.
                </p>
              </div>
              <input
                type="checkbox"
                checked={dailyReminders}
                onChange={(e) => setDailyReminders(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Sons do Timer de Foco
                </p>
                <p className="text-[11px] text-neutral-500">
                  Tocar som sintetizado ao concluir ciclos de Pomodoro.
                </p>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Shortcuts & Navigation */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Produtividade & Atalhos Globais
          </h2>

          <p className="text-xs text-neutral-500">
            Você pode navegar por todo o sistema sem tirar as mãos do teclado:
            use <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-neutral-800">⌘K</kbd> para buscar,{' '}
            <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-neutral-800">Q</kbd> para captura rápida e{' '}
            <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-neutral-800">?</kbd> para ver o mapa de atalhos.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('guide')}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Acessar Guia Completo do Sistema</span>
            </button>

            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <Keyboard className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Ver Mapa de Atalhos (?)</span>
            </button>
          </div>
        </div>

        {/* Database Connection & Persistence Status */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Banco de Dados & Persistência Contínua
            </h2>

            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {isAllDbConnected && !isAnyDbSaving && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    isAnyDbSaving
                      ? 'bg-amber-400 animate-pulse'
                      : isAllDbConnected
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {isAnyDbSaving
                  ? 'Gravando no banco...'
                  : isAllDbConnected
                  ? 'Banco Conectado e Ativo (100% Sincronizado)'
                  : 'Modo Offline (Gravando local)'}
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            100% dos dados do aplicativo — incluindo Tarefas, Projetos, Eventos, Hábitos, Metas, Notas, e todo o módulo financeiro (Contas bancárias, Cartões, Transações, Contas a Pagar, Dívidas e Investimentos) — estão agora conectados e persistidos diretamente no banco de dados do servidor com salvamento atômico contínuo.
          </p>

          {/* Database Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800/80 dark:bg-neutral-800/40">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Tarefas no Banco</span>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{tasks.length}</p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800/80 dark:bg-neutral-800/40">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Projetos & Eventos</span>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{projects.length + events.length}</p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800/80 dark:bg-neutral-800/40">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Metas & Hábitos</span>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{(goals?.length || 0) + (habits?.length || 0)}</p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800/80 dark:bg-neutral-800/40">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Notas & Cadernos</span>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{notes?.length || 0}</p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800/80 dark:bg-neutral-800/40">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Contas & Cartões</span>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{(accounts?.length || 0) + (creditCards?.length || 0)}</p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800/80 dark:bg-neutral-800/40">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Transações no Banco</span>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{transactions?.length || 0}</p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800/80 dark:bg-neutral-800/40">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Contas & Dívidas</span>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{(bills?.length || 0) + (debts?.length || 0)}</p>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800/80 dark:bg-neutral-800/40">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Último Sync</span>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{lastDbSyncedAt || lastFinanceDbSyncedAt || 'Ao vivo'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleManualSync}
              disabled={isAnyDbSaving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAnyDbSaving ? 'animate-spin' : ''}`} />
              <span>{isAnyDbSaving ? 'Gravando...' : 'Sincronizar Tudo com Banco Agora'}</span>
            </button>

            {dbSyncSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                Gravado no banco com sucesso!
              </span>
            )}

            <button
              onClick={() => {
                if (confirm('Tem certeza de que deseja limpar todos os dados do banco de dados e iniciar com ambiente 100% zerado?')) {
                  clearToCleanSlate();
                }
              }}
              className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Limpar Todos os Dados (Zerar Banco)</span>
            </button>

          </div>
        </div>

        {/* Data, Exports & Backup */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Exportação, Integração & Backups
          </h2>

          <p className="text-xs text-neutral-500">
            Seus dados possuem persistência dupla: salvos localmente e sincronizados no servidor.
            Você é 100% dono de suas informações e pode exportá-las em múltiplos formatos a qualquer momento.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Export ICS */}
            <button
              onClick={() => downloadICS(events, tasks)}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Exportar Agenda (.ics / Google Calendar)</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={() => downloadCSV(tasks, projects)}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar Tarefas para Planilha (CSV)</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Exportar Backup Completo (JSON)</span>
            </button>

            {/* Import JSON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <Upload className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Restaurar Backup a partir de Arquivo</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* How to use as PWA app */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-3">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Como Usar como Aplicativo no Celular ou Computador (PWA)
          </h2>

          <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2">
            <p>
              • <strong>No Google Chrome / Microsoft Edge (PC ou Mac):</strong> Clique no ícone de instalação na barra de endereço (ou menu ⋮ &gt; "Instalar Fluxo"). Ele abrirá em janela dedicada como software nativo.
            </p>
            <p>
              • <strong>No iPhone (Safari):</strong> Toque no botão Compartilhar (quadrado com seta para cima) e selecione <em>"Adicionar à Tela de Início"</em>.
            </p>
            <p>
              • <strong>No Android (Chrome):</strong> Toque nos 3 pontos no topo e selecione <em>"Instalar aplicativo"</em> ou <em>"Adicionar à tela inicial"</em>.
            </p>
          </div>
        </div>

        {/* Brand Identity & Logo Card */}
        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 text-white shadow-md dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <img
                src="/fluxo-logo.jpg"
                alt="Logo Oficial Fluxo"
                className="h-28 w-28 rounded-2xl object-cover shadow-xl ring-2 ring-indigo-500/30"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xl font-black tracking-tight text-white">Fluxo</span>
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/30">
                  Identidade Oficial
                </span>
              </div>
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">
                PLANEJE <span className="text-blue-400">•</span> ORGANIZE <span className="text-purple-400">•</span> CONQUISTE
              </p>
              <p className="text-xs text-neutral-300 leading-relaxed pt-1 max-w-xl">
                Esta é a logo e marca oficial configurada para o aplicativo, incorporada na barra de navegação, cabeçalho, tela de início e ícone do sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
