import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  MapPin,
  CheckCircle2,
  Sparkles,
  Timer,
  Repeat,
  FolderKanban,
  Check,
} from 'lucide-react';
import { getTodayDateString, formatDatePT } from '../../utils/date';
import { CalendarEvent } from '../../types';
import { isRoutineScheduledForDate, isRoutineCompletedOnDate } from '../../utils/routineUtils';

export const AgendaView: React.FC = () => {
  const {
    events,
    tasks,
    addEvent,
    setSelectedTaskId,
    startFocusTimer,
    allProjectRoutines,
    toggleProjectRoutine,
    setSelectedProjectId,
    setActiveTab,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [slotToCreateTime, setSlotToCreateTime] = useState('09:00');
  const [newTitle, setNewTitle] = useState('');
  const [isFocusBlock, setIsFocusBlock] = useState(false);

  // Navigate date
  const changeDateBy = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Hours to show from 07:00 to 21:00
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);

  // Events on selected day
  const dayEvents = events.filter((e) => e.startDate === selectedDate);
  // Tasks scheduled on selected day with dueTime
  const dayTasks = tasks.filter((t) => t.dueDate === selectedDate && !t.isInbox);
  // Project routines scheduled on selected day
  const dayProjectRoutines = allProjectRoutines.filter(
    (r) => r.syncToCalendar !== false && isRoutineScheduledForDate(r, selectedDate)
  );

  const handleSlotClick = (hour: number) => {
    const timeString = `${String(hour).padStart(2, '0')}:00`;
    setSlotToCreateTime(timeString);
    setIsEventModalOpen(true);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const startH = parseInt(slotToCreateTime.split(':')[0], 10);
    const endH = Math.min(23, startH + 1);
    const endTime = `${String(endH).padStart(2, '0')}:00`;

    addEvent({
      title: newTitle.trim(),
      startDate: selectedDate,
      startTime: slotToCreateTime,
      endDate: selectedDate,
      endTime,
      isFocusBlock,
      color: isFocusBlock ? '#8b5cf6' : '#3b82f6',
    });

    setNewTitle('');
    setIsFocusBlock(false);
    setIsEventModalOpen(false);
  };

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              Agenda & Time Blocking
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Planeje seu dia em blocos horários visuais para garantir foco e proteger seu tempo.
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDateBy(-1)}
            className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
            title="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => setSelectedDate(getTodayDateString())}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
          >
            Hoje
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
          />

          <button
            onClick={() => changeDateBy(1)}
            className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
            title="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Date Banner & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-950 dark:bg-indigo-950/20">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {formatDatePT(selectedDate, 'long')}
          </span>
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            {dayEvents.length} compromissos • {dayTasks.length} tarefas com prazo • {dayProjectRoutines.length} rotinas de projetos
          </p>
        </div>

        <button
          onClick={() => {
            setSlotToCreateTime('09:00');
            setIsEventModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Agendar Bloco</span>
        </button>
      </div>

      {/* Project Routines Card for Selected Day */}
      {dayProjectRoutines.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                Rotinas dos Projetos para este Dia ({dayProjectRoutines.length})
              </h3>
            </div>
            <span className="text-[11px] text-neutral-400">Sincronizadas com a tag do projeto</span>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {dayProjectRoutines.map((routine) => {
              const isCompleted = isRoutineCompletedOnDate(routine, selectedDate);
              return (
                <div
                  key={routine.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-neutral-50/70 border-neutral-200/70 text-neutral-400 dark:bg-neutral-800/30 dark:border-neutral-800'
                      : 'bg-white border-neutral-200 hover:shadow-xs dark:bg-neutral-900 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => toggleProjectRoutine(routine.projectId, routine.id, selectedDate)}
                      className="text-neutral-400 hover:text-emerald-500 transition-colors shrink-0"
                      title={isCompleted ? 'Marcar como pendente hoje' : 'Marcar como concluído hoje'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 transition-colors" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProjectId(routine.projectId);
                            setActiveTab('projects');
                          }}
                          className="cursor-pointer rounded-md px-1.5 py-0.5 text-[10px] font-bold border hover:opacity-80 transition-opacity shrink-0"
                          style={{
                            backgroundColor: `${routine.projectColor}15`,
                            borderColor: `${routine.projectColor}40`,
                            color: routine.projectColor,
                          }}
                          title={`Abrir projeto ${routine.projectName}`}
                        >
                          {routine.projectName}
                        </button>
                        <span
                          className={`text-xs font-semibold truncate ${
                            isCompleted ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {routine.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                        {routine.preferredTime && (
                          <span className="flex items-center gap-0.5 font-mono">
                            <Clock className="h-2.5 w-2.5" />
                            {routine.preferredTime}
                          </span>
                        )}
                        <span>
                          {routine.frequency === 'daily'
                            ? 'Diária'
                            : routine.frequency === 'weekly'
                            ? 'Semanal'
                            : routine.frequency === 'biweekly'
                            ? 'Quinzenal'
                            : 'Mensal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProjectId(routine.projectId);
                      setActiveTab('projects');
                    }}
                    className="p-1.5 text-neutral-400 hover:text-indigo-600 rounded-lg shrink-0"
                    title="Ver no projeto"
                  >
                    <FolderKanban className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Blocking Hourly Timeline */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {hours.map((hour) => {
            const timePrefix = String(hour).padStart(2, '0');
            const matchingEvents = dayEvents.filter((e) => e.startTime.startsWith(timePrefix));
            const matchingTasks = dayTasks.filter(
              (t) => t.dueTime && t.dueTime.startsWith(timePrefix)
            );
            const matchingRoutines = dayProjectRoutines.filter((r) => {
              const prefTime = r.preferredTime || '09:00';
              return prefTime.startsWith(timePrefix);
            });

            return (
              <div
                key={hour}
                className="group flex min-h-[72px] transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
              >
                {/* Time Label */}
                <div className="w-16 sm:w-20 p-3 text-right text-xs font-mono font-semibold text-neutral-400 dark:text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 select-none">
                  {timePrefix}:00
                </div>

                {/* Slot Content */}
                <div
                  className="flex-1 p-2 flex flex-wrap gap-2 cursor-pointer"
                  onClick={(e) => {
                    // Only open if clicked empty space
                    if (e.target === e.currentTarget) {
                      handleSlotClick(hour);
                    }
                  }}
                >
                  {/* Scheduled Events */}
                  {matchingEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium shadow-xs ${
                        evt.isFocusBlock
                          ? 'border-purple-200 bg-purple-50/90 text-purple-900 dark:border-purple-900 dark:bg-purple-950/50 dark:text-purple-200'
                          : 'border-blue-200 bg-blue-50/90 text-blue-900 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200'
                      } max-w-md flex-1`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {evt.isFocusBlock ? (
                          <Timer className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <Calendar className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        )}
                        <div className="truncate">
                          <p className="truncate font-bold">{evt.title}</p>
                          <p className="text-[10px] opacity-75 font-mono">
                            {evt.startTime} - {evt.endTime} {evt.location ? `• ${evt.location}` : ''}
                          </p>
                        </div>
                      </div>

                      {evt.isFocusBlock && (
                        <button
                          onClick={() => startFocusTimer(undefined, evt.title, 50)}
                          className="flex items-center gap-1 rounded-lg bg-purple-200/70 px-2 py-1 text-[10px] font-bold text-purple-900 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100"
                        >
                          <Play className="h-2.5 w-2.5 fill-current" />
                          <span>Iniciar</span>
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Tasks with dueTime in this slot */}
                  {matchingTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 max-w-sm flex-1 cursor-pointer hover:border-indigo-400`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />
                        <span className="truncate font-semibold">{task.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                        {task.dueTime}
                      </span>
                    </div>
                  ))}

                  {/* Project Routines with Project Tag */}
                  {matchingRoutines.map((routine) => {
                    const isDone = isRoutineCompletedOnDate(routine, selectedDate);
                    return (
                      <div
                        key={routine.id}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium shadow-xs max-w-sm flex-1 transition-all ${
                          isDone
                            ? 'bg-neutral-50 text-neutral-400 line-through border-neutral-200 dark:bg-neutral-800/40 dark:border-neutral-800'
                            : 'hover:shadow-xs'
                        }`}
                        style={
                          !isDone
                            ? {
                                backgroundColor: `${routine.projectColor}12`,
                                borderColor: `${routine.projectColor}45`,
                                color: routine.projectColor,
                              }
                            : {}
                        }
                      >
                        <div className="flex items-center gap-2 truncate">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProjectRoutine(routine.projectId, routine.id, selectedDate);
                            }}
                            className="shrink-0 transition-colors"
                            title={isDone ? 'Concluída hoje' : 'Marcar concluída'}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Repeat className="h-4 w-4" />
                            )}
                          </button>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className="rounded-md px-1.5 py-0.2 text-[9px] font-extrabold uppercase shrink-0 border"
                                style={{
                                  backgroundColor: `${routine.projectColor}25`,
                                  borderColor: `${routine.projectColor}60`,
                                  color: routine.projectColor,
                                }}
                              >
                                {routine.projectName}
                              </span>
                              <span className="font-bold truncate text-neutral-900 dark:text-neutral-100">
                                {routine.title}
                              </span>
                            </div>
                            <p className="text-[10px] opacity-75 font-mono">
                              {routine.preferredTime || '09:00'} • Rotina {routine.frequency === 'daily' ? 'Diária' : 'Periódica'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProjectId(routine.projectId);
                            setActiveTab('projects');
                          }}
                          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 shrink-0 opacity-80"
                          title="Abrir no Projeto"
                        >
                          <FolderKanban className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Empty Slot Placeholder helper on hover */}
                  {matchingEvents.length === 0 && matchingTasks.length === 0 && matchingRoutines.length === 0 && (
                    <button
                      onClick={() => handleSlotClick(hour)}
                      className="hidden group-hover:flex items-center gap-1 rounded-lg border border-dashed border-neutral-200 px-3 py-1 text-[11px] text-neutral-400 hover:border-indigo-400 hover:text-indigo-600 dark:border-neutral-800"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Agendar bloco às {timePrefix}:00</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Event / Focus Block Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Agendar no Time Blocking
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Data: {formatDatePT(selectedDate)}
            </p>

            <form onSubmit={handleCreateEvent} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Título do Bloco / Compromisso
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Reunião de Alinhamento, Deep Work em Código..."
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Horário de Início
                  </label>
                  <input
                    type="time"
                    value={slotToCreateTime}
                    onChange={(e) => setSlotToCreateTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Tipo de Bloco
                  </label>
                  <label className="mt-2 flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={isFocusBlock}
                      onChange={(e) => setIsFocusBlock(e.target.checked)}
                      className="h-4 w-4 rounded text-purple-600"
                    />
                    <span>Bloco de Foco / Deep Work</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Salvar na Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
