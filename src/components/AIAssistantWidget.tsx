import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useVoiceChat } from '../hooks/useVoiceChat';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  X,
  Maximize2,
  Volume2,
  VolumeX,
  Bot,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const AIAssistantWidget: React.FC = () => {
  const {
    chatMessages,
    sendAssistantMessage,
    isAiLoading,
    activeTab,
    setActiveTab,
    isAssistantOpen,
    setIsAssistantOpen,
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isListening,
    isSupported,
    isSpeaking,
    transcript,
    interimTranscript,
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
      console.error('Error in floating assistant voice message:', e);
    }
  });

  // Auto-scroll inside widget
  useEffect(() => {
    if (isAssistantOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAssistantOpen, interimTranscript]);

  // Don't render floating widget if user is already on the dedicated Assistant view tab
  if (activeTab === 'assistant') {
    return null;
  }

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
      console.error('Error sending message:', e);
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
      if (!isAssistantOpen) setIsAssistantOpen(true);
      startListening();
    }
  };

  return (
    <>
      {/* Floating Trigger Button (when drawer is closed) */}
      {!isAssistantOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          {/* Quick Voice Prompt Tooltip Pill */}
          <button
            onClick={() => {
              setIsAssistantOpen(true);
              startListening();
            }}
            className="group hidden sm:flex items-center gap-2 rounded-full border border-indigo-200 bg-white/95 px-3.5 py-2 text-xs font-medium text-indigo-900 shadow-lg shadow-indigo-600/10 backdrop-blur-md transition-all hover:border-indigo-400 hover:scale-105 dark:border-indigo-900 dark:bg-neutral-900/95 dark:text-indigo-200"
            title="Falar comando de voz agora"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
            </span>
            <span>Falar com Assistente</span>
            <Mic className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
          </button>

          {/* Main Floating Orb Button */}
          <button
            id="floating-ai-assistant-btn"
            onClick={() => setIsAssistantOpen(true)}
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-110 active:scale-95"
            title="Abrir Assistente de Produtividade Gemini"
          >
            <Sparkles className="h-6 w-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white text-[9px] font-bold dark:ring-neutral-900">
              AI
            </span>
          </button>
        </div>
      )}

      {/* Floating Assistant Drawer / Modal */}
      {isAssistantOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[560px] w-[92vw] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-5 dark:border-neutral-800 dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Assistente IA
                </h3>
                <span className="text-[11px] text-indigo-600 font-medium dark:text-indigo-400">
                  Gemini Copilot
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* TTS Audio toggle */}
              <button
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setVoiceAutoPlay(!voiceAutoPlay);
                }}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                title={voiceAutoPlay ? 'Voz ativa (clique para silenciar)' : 'Voz inativa'}
              >
                {voiceAutoPlay ? <Volume2 className="h-4 w-4 text-indigo-600" /> : <VolumeX className="h-4 w-4" />}
              </button>

              {/* Full screen expand */}
              <button
                onClick={() => {
                  setIsAssistantOpen(false);
                  setActiveTab('assistant');
                }}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                title="Expandir para tela cheia"
              >
                <Maximize2 className="h-4 w-4" />
              </button>

              {/* Close button */}
              <button
                onClick={() => setIsAssistantOpen(false)}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                title="Fechar assistente"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-xs ${
                      isUser
                        ? 'bg-neutral-800 dark:bg-neutral-700'
                        : 'bg-gradient-to-tr from-indigo-600 to-violet-600'
                    }`}
                  >
                    {isUser ? <span className="text-[11px] font-bold">VC</span> : <Bot className="h-3.5 w-3.5" />}
                  </div>

                  <div className="max-w-[85%] space-y-1.5">
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                        isUser
                          ? 'rounded-tr-sm bg-indigo-600 text-white'
                          : 'rounded-tl-sm border border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800/80 dark:text-neutral-100'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {/* Action pill */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="space-y-1">
                        {msg.actions.map((act) => (
                          <div
                            key={act.id}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2 py-1 text-[11px] font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                            <span className="truncate">{act.summary}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isAiLoading && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800">
                  <span className="animate-pulse">Processando com Gemini...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex gap-1.5 overflow-x-auto border-t border-neutral-100 bg-neutral-50/70 p-2 dark:border-neutral-800 dark:bg-neutral-800/40 no-scrollbar">
            {['O que tenho hoje?', 'Nova tarefa urgente', 'Agendar reunião'].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Live speech transcription bar */}
          {(isListening || interimTranscript || transcript) && (
            <div className="border-t border-rose-100 bg-rose-50/80 px-3 py-1.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  Ouvindo...
                </span>
                <button
                  onClick={stopListening}
                  className="text-[10px] underline font-bold"
                >
                  Concluir
                </button>
              </div>
              <p className="italic text-[11px] mt-0.5 truncate">
                {transcript || interimTranscript || 'Fale agora...'}
              </p>
            </div>
          )}

          {/* Input Dock */}
          <div className="border-t border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-2">
              <button
                id="widget-mic-btn"
                onClick={toggleMic}
                disabled={!isSupported}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                title={isListening ? 'Parar escuta' : 'Falar por voz'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Ouvindo você...' : 'Digite ou fale...'}
                className="flex-1 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputVal.trim() || isAiLoading}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  inputVal.trim() && !isAiLoading
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'text-neutral-400 dark:text-neutral-600'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
