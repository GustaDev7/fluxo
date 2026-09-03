import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const FocusView: React.FC = () => {
  const {
    tasks,
    activeTimer,
    startFocusTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    stopFocusTimer,
    updateTask,
  } = useApp();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [ambientSound, setAmbientSound] = useState<'none' | 'whitenoise' | 'rain' | 'binaural'>('none');
  const [ambientVolume, setAmbientVolume] = useState(0.2);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const pendingTasks = tasks.filter((t) => t.status !== 'done' && !t.isInbox);

  // Set default task if none selected and activeTimer exists
  useEffect(() => {
    if (activeTimer?.taskId && !selectedTaskId) {
      setSelectedTaskId(activeTimer.taskId);
    }
  }, [activeTimer, selectedTaskId]);

  // Clean Web Audio synthesizer for ambient sound (no external mp3 files required)
  useEffect(() => {
    if (ambientSound === 'none') {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.value = ambientVolume;
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;

      if (ambientSound === 'whitenoise') {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        whiteNoise.connect(gain);
        whiteNoise.start();
        audioNodeRef.current = whiteNoise;
      } else if (ambientSound === 'rain') {
        // Filtered pinkish noise simulating rain
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99765 * b0 + white * 0.0990460;
          b1 = 0.96300 * b1 + white * 0.1600000;
          b2 = 0.57000 * b2 + white * 0.4000000;
          output[i] = (b0 + b1 + b2) * 0.15;
        }
        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        rainSource.connect(filter);
        filter.connect(gain);
        rainSource.start();
        audioNodeRef.current = rainSource;
      } else if (ambientSound === 'binaural') {
        // 432Hz calming binaural wave
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, ctx.currentTime);
        osc.connect(gain);
        osc.start();
        audioNodeRef.current = osc;
      }
    } catch (e) {
      console.warn('AudioContext not allowed yet:', e);
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [ambientSound]);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = ambientVolume;
    }
  }, [ambientVolume]);

  const handleStartPreset = (minutes: number, title?: string) => {
    const task = tasks.find((t) => t.id === selectedTaskId);
    const sessionTitle = title || (task ? task.title : 'Sessão de Foco');
    startFocusTimer(selectedTaskId || undefined, sessionTitle, minutes);
  };

  const handleCompleteTask = () => {
    if (selectedTaskId) {
      updateTask(selectedTaskId, { status: 'done' });
      stopFocusTimer();
    }
  };

  const seconds = activeTimer ? activeTimer.secondsRemaining : 25 * 60;
  const total = activeTimer ? activeTimer.totalSeconds : 25 * 60;
  const progressPercent = total > 0 ? ((total - seconds) / total) * 100 : 0;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div
      className={`flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-neutral-950 p-8' : ''
      }`}
    >
      {/* Top Toggle Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
          title={isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      <div className="w-full max-w-lg space-y-8 text-center">
        {/* Title */}
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Timer className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            Modo Foco & Pomodoro
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Elimine distrações, entre em estado de fluxo e registre automaticamente seu tempo.
          </p>
        </div>

        {/* Task Selection */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Focar na Tarefa:
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-semibold text-neutral-800 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <option value="">Foco Livre (Sem tarefa vinculada)</option>
            {pendingTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Circular Countdown Progress */}
        <div className="relative mx-auto flex h-64 w-64 items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-neutral-100 dark:text-neutral-800"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Progress */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-indigo-600 transition-all duration-1000 dark:text-indigo-500"
              strokeWidth="6"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Center Digital Clock */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-mono text-5xl font-extrabold tracking-tighter text-neutral-900 dark:text-neutral-100">
              {formattedTime}
            </span>
            <span className="mt-1 text-xs font-semibold text-neutral-400 uppercase tracking-widest">
              {activeTimer?.isRunning ? 'Em foco' : 'Pausado'}
            </span>
          </div>
        </div>

        {/* Playback Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          {activeTimer?.isRunning ? (
            <button
              onClick={pauseFocusTimer}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/25 transition-transform hover:scale-105 active:scale-95"
              title="Pausar"
            >
              <Pause className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => (activeTimer ? resumeFocusTimer() : handleStartPreset(25))}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 transition-transform hover:scale-105 active:scale-95"
              title="Iniciar foco"
            >
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={stopFocusTimer}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
            title="Reiniciar timer"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          {selectedTaskId && (
            <button
              onClick={handleCompleteTask}
              className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Concluir Tarefa</span>
            </button>
          )}
        </div>

        {/* Presets Row */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => handleStartPreset(25, 'Pomodoro 25m')}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-indigo-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            25m Pomodoro
          </button>
          <button
            onClick={() => handleStartPreset(50, 'Deep Work 50m')}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-indigo-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            50m Deep Work
          </button>
          <button
            onClick={() => handleStartPreset(5, 'Pausa Curta 5m')}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-indigo-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            5m Pausa Curta
          </button>
          <button
            onClick={() => handleStartPreset(15, 'Pausa Longa 15m')}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-indigo-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          >
            15m Pausa Longa
          </button>
        </div>

        {/* Ambient Sound Generator */}
        <div className="rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4 text-xs dark:border-neutral-800 dark:bg-neutral-900/60">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
              <Volume2 className="h-3.5 w-3.5 text-indigo-600" />
              Som Ambiente de Concentração:
            </span>

            <select
              value={ambientSound}
              onChange={(e) => setAmbientSound(e.target.value as any)}
              className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              <option value="none">Silencioso (Desligado)</option>
              <option value="whitenoise">Ruído Branco Puro</option>
              <option value="rain">Chuva Suave</option>
              <option value="binaural">Onda Binaural 432Hz</option>
            </select>
          </div>

          {ambientSound !== 'none' && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-neutral-400">Volume:</span>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
