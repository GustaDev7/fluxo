import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useVoiceChat } from '../../hooks/useVoiceChat';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bot,
  User as UserIcon,
  Calendar,
  CheckSquare,
  FolderKanban,
  Zap,
} from 'lucide-react';

export const AssistantView: React.FC = () => {
  const {
    chatMessages,
    sendAssistantMessage,
    clearChatHistory,
    isAiLoading,
    tasks,
    projects,
    events,
    setActiveTab,
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice chat hook
  const {
    isListening,
    isSupported,
    isSpeaking,
    transcript,
    interimTranscript,
    error: voiceError,
    voiceAutoPlay,
    setVoiceAutoPlay,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    clearTranscript,
  } = useVoiceChat(async (finalText) => {
    if (!finalText || !finalText.trim()) return;
    try {
      const response = await sendAssistantMessage(finalText.trim(), true);
      if (voiceAutoPlay && response?.text) {
        speakText(response.text);
      }
    } catch (e) {
      console.error('Error sending voice message:', e);
    }
  });

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading, interimTranscript]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputVal).trim();
    if (!text || isAiLoading) return;

    setInputVal('');
    clearTranscript();
    if (isListening) stopListening();

    try {
      const response = await sendAssistantMessage(text, false);
      if (voiceAutoPlay && response?.text) {
        speakText(response.text);
      }
    } catch (e) {
      console.error('Error sending text message:', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Assistente & Copiloto IA
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Interação fluída por voz ou texto com autonomia para agir diretamente no sistema
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* TTS Audio toggle */}
          <button
            id="toggle-voice-autoplay"
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setVoiceAutoPlay(!voiceAutoPlay);
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              voiceAutoPlay
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300'
                : 'border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
            title={voiceAutoPlay ? 'Voz ativa (clique para silenciar)' : 'Voz desativada (clique para falar respostas)'}
          >
            {voiceAutoPlay ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">
              {voiceAutoPlay ? 'Respostas Faladas: ON' : 'Respostas Faladas: OFF'}
            </span>
          </button>

          {/* System status pills */}
          <div className="hidden items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600 md:flex dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
            <span className="flex items-center gap-1" title="Tarefas cadastradas no sistema">
              <CheckSquare className="h-3.5 w-3.5 text-indigo-500" />
              {tasks.length} tarefas
            </span>
            <span className="h-3 w-[1px] bg-neutral-300 dark:bg-neutral-700" />
            <span className="flex items-center gap-1" title="Projetos no sistema">
              <FolderKanban className="h-3.5 w-3.5 text-blue-500" />
              {projects.length} projetos
            </span>
            <span className="h-3 w-[1px] bg-neutral-300 dark:bg-neutral-700" />
            <span className="flex items-center gap-1" title="Eventos e agenda">
              <Calendar className="h-3.5 w-3.5 text-purple-500" />
              {events.length} eventos
            </span>
          </div>

          {/* Clear history */}
          <button
            id="clear-chat-history-btn"
            onClick={clearChatHistory}
            className="flex items-center gap-1 rounded-lg border border-neutral-200 p-1.5 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            title="Limpar histórico da conversa"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Conversation Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Welcome Voice Hero Banner if only 1 message */}
          {chatMessages.length <= 1 && (
            <div className="relative mb-6 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/70 to-white p-6 shadow-sm dark:border-indigo-950/60 dark:from-indigo-950/20 dark:to-neutral-900">
              <div className="flex flex-col items-center text-center">
                {/* Voice Orb */}
                <div className="relative mb-4 flex items-center justify-center">
                  <div
                    className={`absolute h-24 w-24 rounded-full bg-indigo-500/20 transition-transform duration-700 ${
                      isListening ? 'scale-150 animate-ping opacity-75' : 'scale-100 opacity-40'
                    }`}
                  />
                  <button
                    id="hero-voice-orb-btn"
                    onClick={toggleMic}
                    disabled={!isSupported}
                    className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl transition-all ${
                      isListening
                        ? 'bg-rose-500 scale-110 shadow-rose-500/40 ring-4 ring-rose-400/50'
                        : 'bg-gradient-to-tr from-indigo-600 to-violet-600 hover:scale-105 shadow-indigo-600/30'
                    }`}
                    title={isListening ? 'Clique para parar de falar' : 'Clique para falar agora'}
                  >
                    {isListening ? (
                      <MicOff className="h-8 w-8 animate-bounce" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </button>
                </div>

                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  {isListening ? 'Ouvindo você... Fale naturalmente' : 'Toque no microfone e fale o que precisa'}
                </h2>
                <p className="mt-1 max-w-lg text-sm text-neutral-600 dark:text-neutral-400">
                  {isListening
                    ? 'O Gemini está transcrevendo em tempo real. Pare de falar para enviar automaticamente.'
                    : 'Você pode solicitar tarefas, agendar reuniões, pedir sugestões para seu dia ou gerenciar projetos por voz.'}
                </p>

                {/* Real-time speech transcript banner */}
                {(isListening || interimTranscript || transcript) && (
                  <div className="mt-4 w-full max-w-xl rounded-xl border border-indigo-200 bg-white/90 p-3 shadow-inner dark:border-indigo-900/60 dark:bg-neutral-800/90">
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Transcrição ao vivo:
                    </p>
                    <p className="mt-1 text-sm font-medium text-neutral-800 dark:text-neutral-200 italic">
                      {transcript || interimTranscript || 'Comece a falar...'}
                    </p>
                  </div>
                )}

                {/* Suggestions Grid */}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {[
                    '🎙️ Criar uma tarefa urgente para enviar o relatório hoje às 17h',
                    '📅 Agendar alinhamento de produto amanhã às 10h',
                    '📋 Quais são as tarefas pendentes no sistema hoje?',
                    '🚀 Criar novo projeto chamado Lançamento',
                  ].map((sugg, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(sugg.replace('🎙️ ', '').replace('📅 ', '').replace('📋 ', '').replace('🚀 ', ''))}
                      className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation Messages */}
          {chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                    isUser
                      ? 'bg-neutral-800 dark:bg-neutral-700'
                      : 'bg-gradient-to-tr from-indigo-600 to-violet-600'
                  }`}
                >
                  {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Bubble Content */}
                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      isUser
                        ? 'rounded-tr-sm bg-indigo-600 text-white'
                        : 'rounded-tl-sm border border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[11px] opacity-75 mb-1">
                      <span className="font-semibold">
                        {isUser ? 'Você' : 'Copiloto Gemini'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {msg.isVoice && (
                          <span className="flex items-center gap-0.5 rounded bg-black/15 px-1 py-0.5 text-[10px] font-medium">
                            <Mic className="h-2.5 w-2.5" /> Voz
                          </span>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.text}
                    </p>

                    {/* Audio playback button for assistant message */}
                    {!isUser && (
                      <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                        <button
                          onClick={() => speakText(msg.text)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                          title="Ouvir resposta novamente"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>Ouvir</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Executed System Actions Badge */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="space-y-1.5">
                      {msg.actions.map((act) => (
                        <div
                          key={act.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 text-xs shadow-xs ${
                            act.status === 'executed'
                              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'border-rose-200 bg-rose-50/70 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {act.status === 'executed' ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                            )}
                            <span className="font-medium">{act.summary}</span>
                          </div>

                          {/* Quick navigation link depending on action type */}
                          {act.type === 'create_task' && (
                            <button
                              onClick={() => setActiveTab('tasks')}
                              className="inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400"
                            >
                              Ver Tarefas <ExternalLink className="h-3 w-3" />
                            </button>
                          )}
                          {act.type === 'create_event' && (
                            <button
                              onClick={() => setActiveTab('calendar')}
                              className="inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400"
                            >
                              Ver Agenda <ExternalLink className="h-3 w-3" />
                            </button>
                          )}
                          {act.type === 'create_project' && (
                            <button
                              onClick={() => setActiveTab('projects')}
                              className="inline-flex shrink-0 items-center gap-1 font-semibold text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400"
                            >
                              Ver Projetos <ExternalLink className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested follow-up prompt chips */}
                  {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedPrompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(p)}
                          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-600 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* AI Thinking indicator */}
          {isAiLoading && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce" />
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    O Gemini está raciocinando e verificando o sistema...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Voice error banner if any */}
          {voiceError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
              <p className="font-semibold">{voiceError}</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                Você pode continuar interagindo digitando diretamente na caixa abaixo.
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Persistent Voice & Text Input Dock */}
      <div className="border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-4xl">
          {/* Active speech indicator bar */}
          {isListening && (
            <div className="mb-2 flex items-center justify-between rounded-xl bg-rose-50 px-3.5 py-2 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                </span>
                <span className="font-semibold">Ouvindo...</span>
                <span className="text-neutral-600 dark:text-neutral-300 italic truncate max-w-md">
                  {transcript || interimTranscript || 'Fale agora'}
                </span>
              </div>
              <button
                onClick={stopListening}
                className="rounded-md bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Parar & Enviar
              </button>
            </div>
          )}

          {/* Speaking playback indicator */}
          {isSpeaking && (
            <div className="mb-2 flex items-center justify-between rounded-xl bg-indigo-50 px-3.5 py-1.5 text-xs text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-indigo-600 animate-pulse" />
                <span className="font-medium">O assistente está falando a resposta...</span>
              </div>
              <button
                onClick={stopSpeaking}
                className="text-xs font-semibold text-indigo-600 underline hover:text-indigo-700 dark:text-indigo-400"
              >
                Silenciar
              </button>
            </div>
          )}

          <div className="relative flex items-center gap-2">
            {/* Microphone Button */}
            <button
              id="assistant-mic-toggle-btn"
              onClick={toggleMic}
              disabled={!isSupported}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm transition-all ${
                isListening
                  ? 'bg-rose-500 text-white ring-4 ring-rose-400/40 scale-105 animate-pulse'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
              }`}
              title={
                !isSupported
                  ? 'Reconhecimento de voz não suportado pelo navegador'
                  : isListening
                  ? 'Clique para parar'
                  : 'Falar com a IA (Web Speech API)'
              }
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Input Box */}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                id="assistant-chat-input"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? 'Ouvindo sua voz...'
                    : 'Digite ou fale: "Crie uma tarefa urgente...", "O que tenho hoje?"...'
                }
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 pr-12 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              />

              {/* Send Button */}
              <button
                id="assistant-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputVal.trim() || isAiLoading}
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 transition-all ${
                  inputVal.trim() && !isAiLoading
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-600'
                }`}
                title="Enviar mensagem"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-indigo-500" />
              Dica: Você pode pedir para criar tarefas, concluir itens, agendar eventos ou consultar sua carga de trabalho.
            </span>
            <span>Enter para enviar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
