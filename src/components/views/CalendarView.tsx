import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Check,
  CalendarDays,
  Download,
  Repeat,
  FolderKanban,
} from 'lucide-react';
import { getMonthNamePT, getTodayDateString, formatDateToYYYYMMDD, formatDatePT } from '../../utils/date';
import { downloadICS } from '../../utils/exportUtils';
import { isRoutineScheduledForDate, isRoutineCompletedOnDate } from '../../utils/routineUtils';

export const CalendarView: React.FC = () => {
  const {
    events,
    tasks,
    addEvent,
    setSelectedTaskId,
    setIsQuickCaptureOpen,
    allProjectRoutines,
    toggleProjectRoutine,
    setSelectedProjectId,
    setActiveTab,
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [filterType, setFilterType] = useState<'all' | 'events' | 'tasks' | 'routines'>('all');
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [selectedDayForNewEvent, setSelectedDayForNewEvent] = useState(getTodayDateString());
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00');

  const todayStr = getTodayDateString();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate grid days for current month
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, d);
    calendarDays.push({
      dateStr: formatDateToYYYYMMDD(prevDate),
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const curDate = new Date(year, month, i);
    calendarDays.push({
      dateStr: formatDateToYYYYMMDD(curDate),
      dayNumber: i,
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill complete grid of 35 or 42
  const totalSlots = calendarDays.length <= 35 ? 35 : 42;
  const remaining = totalSlots - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    const nextDate = new Date(year, month + 1, i);
    calendarDays.push({
      dateStr: formatDateToYYYYMMDD(nextDate),
      dayNumber: i,
      isCurrentMonth: false,
    });
  }

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addEvent({
      title: newTitle.trim(),
      startDate: selectedDayForNewEvent,
      startTime: newTime,
      endDate: selectedDayForNewEvent,
      endTime: `${parseInt(newTime.split(':')[0], 10) + 1}:00`,
    });

    setNewTitle('');
    setIsNewEventModalOpen(false);
  };

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-6 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              Calendário Integrado
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Visualização unificada de todos os seus eventos, reuniões e tarefas com prazo em um só lugar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
          >
            <option value="all">Tudo (Eventos, Tarefas & Rotinas)</option>
            <option value="events">Apenas Compromissos</option>
            <option value="tasks">Apenas Tarefas</option>
            <option value="routines">Apenas Rotinas de Projetos</option>
          </select>

          <button
            onClick={() => downloadICS(events, tasks)}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
            title="Exportar para Google Calendar / iCal (.ics)"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Exportar (.ics)</span>
          </button>

          <button
            onClick={() => {
              setSelectedDayForNewEvent(todayStr);
              setIsNewEventModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      {/* Navigation Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 capitalize">
            {getMonthNamePT(month)} {year}
          </h2>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="rounded-lg border border-neutral-200 p-1 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Hoje
            </button>
            <button
              onClick={handleNextMonth}
              className="rounded-lg border border-neutral-200 p-1 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* View Mode */}
        <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-800 text-xs">
          <button
            onClick={() => setViewMode('month')}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              viewMode === 'month'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
              viewMode === 'agenda'
                ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            Lista de Eventos
          </button>
        </div>
      </div>

      {/* Monthly Grid View */}
      {viewMode === 'month' && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 text-center text-xs font-bold text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
            {weekDayNames.map((d) => (
              <div key={d} className="py-2.5">
                {d}
              </div>
            ))}
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-neutral-100 dark:divide-neutral-800">
            {calendarDays.map((day, idx) => {
              const dayEvents =
                filterType === 'all' || filterType === 'events'
                  ? events.filter((e) => e.startDate === day.dateStr)
                  : [];
              const dayTasks =
                filterType === 'all' || filterType === 'tasks'
                  ? tasks.filter((t) => t.dueDate === day.dateStr && !t.isInbox)
                  : [];
              const dayRoutines =
                filterType === 'all' || filterType === 'routines'
                  ? allProjectRoutines.filter(
                      (r) => r.syncToCalendar !== false && isRoutineScheduledForDate(r, day.dateStr)
                    )
                  : [];
              const isCurrentDay = day.dateStr === todayStr;
              const isSelectedDay = day.dateStr === selectedDayForNewEvent;
              const totalItems = dayEvents.length + dayTasks.length + dayRoutines.length;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDayForNewEvent(day.dateStr);
                  }}
                  className={`group min-h-[52px] sm:min-h-[120px] p-1.5 sm:p-2 transition-colors cursor-pointer hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30 ${
                    !day.isCurrentMonth ? 'bg-neutral-50/40 opacity-40 dark:bg-neutral-950/20' : ''
                  } ${isSelectedDay ? 'bg-indigo-50/30 dark:bg-indigo-950/20 ring-1 ring-inset ring-indigo-400' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrentDay
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : isSelectedDay
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayForNewEvent(day.dateStr);
                        setIsNewEventModalOpen(true);
                      }}
                      className="hidden group-hover:flex text-neutral-400 hover:text-indigo-600"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Mobile Dots Indicator (Princípio #39: Mini indicadores visuais no celular) */}
                  <div className="flex sm:hidden items-center justify-center gap-1 mt-1">
                    {dayEvents.length > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    )}
                    {dayTasks.length > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    )}
                    {dayRoutines.length > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    )}
                  </div>

                  {/* Desktop / Tablet Full Badges Container */}
                  <div className="hidden sm:block mt-1.5 space-y-1">
                    {/* Events */}
                    {dayEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => e.stopPropagation()}
                        className="truncate rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-200/60 dark:border-blue-900 flex items-center gap-1"
                        title={`${evt.startTime} - ${evt.title}`}
                      >
                        <Clock className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{evt.startTime} {evt.title}</span>
                      </div>
                    ))}

                    {/* Tasks */}
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskId(t.id);
                        }}
                        className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold border flex items-center gap-1 ${
                          t.status === 'done'
                            ? 'bg-neutral-100 text-neutral-400 line-through dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-900'
                        }`}
                        title={t.title}
                      >
                        <Check className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}

                    {/* Project Routines with Project Tag */}
                    {dayRoutines.slice(0, 2).map((routine) => {
                      const isDone = isRoutineCompletedOnDate(routine, day.dateStr);
                      return (
                        <div
                          key={routine.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProjectRoutine(routine.projectId, routine.id, day.dateStr);
                          }}
                          className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold border cursor-pointer transition-all flex items-center gap-1 ${
                            isDone
                              ? 'bg-neutral-100 text-neutral-400 line-through dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                              : 'hover:opacity-85'
                          }`}
                          style={
                            !isDone
                              ? {
                                  backgroundColor: `${routine.projectColor}15`,
                                  borderColor: `${routine.projectColor}45`,
                                  color: routine.projectColor,
                                }
                              : {}
                          }
                          title={`[${routine.projectName}] ${routine.title} (${routine.frequency === 'daily' ? 'Diária' : 'Periódica'}${routine.preferredTime ? ` às ${routine.preferredTime}` : ''}) - Clique para alternar`}
                        >
                          <span className="shrink-0 font-bold opacity-80 text-[9px]">[{routine.projectName}]</span>
                          <Repeat className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{routine.title}</span>
                        </div>
                      );
                    })}

                    {totalItems > 3 && (
                      <div className="text-[9px] font-semibold text-neutral-400 pl-1">
                        +{totalItems - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile-Only Selected Day Schedule Card (Princípio #39: Em mobile, calendário prioriza lista do dia selecionado abaixo) */}
      {viewMode === 'month' && (
        <div className="block sm:hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Agenda de {formatDatePT(selectedDayForNewEvent)}
            </h4>
            <button
              onClick={() => setIsNewEventModalOpen(true)}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Compromisso</span>
            </button>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
            {/* Day Events */}
            {events.filter((e) => e.startDate === selectedDayForNewEvent).map((evt) => (
              <div key={evt.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100">{evt.title}</p>
                    <p className="text-[10px] text-neutral-400">{evt.startTime} às {evt.endTime}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Day Tasks */}
            {tasks.filter((t) => t.dueDate === selectedDayForNewEvent && !t.isInbox).map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTaskId(t.id)}
                className="flex items-center justify-between py-2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shrink-0">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <p className={`font-medium ${t.status === 'done' ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                    {t.title}
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold text-neutral-400">{t.priority}</span>
              </div>
            ))}

            {/* Day Routines */}
            {allProjectRoutines
              .filter((r) => r.syncToCalendar !== false && isRoutineScheduledForDate(r, selectedDayForNewEvent))
              .map((r) => {
                const isDone = isRoutineCompletedOnDate(r, selectedDayForNewEvent);
                return (
                  <div key={r.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleProjectRoutine(r.projectId, r.id, selectedDayForNewEvent)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                        style={{ backgroundColor: `${r.projectColor}20`, color: r.projectColor }}
                      >
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Repeat className="h-3.5 w-3.5" />}
                      </button>
                      <div>
                        <p className={`font-medium ${isDone ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                          {r.title}
                        </p>
                        <p className="text-[10px] text-neutral-400">Projeto: {r.projectName}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

            {events.filter((e) => e.startDate === selectedDayForNewEvent).length === 0 &&
             tasks.filter((t) => t.dueDate === selectedDayForNewEvent && !t.isInbox).length === 0 &&
             allProjectRoutines.filter((r) => r.syncToCalendar !== false && isRoutineScheduledForDate(r, selectedDayForNewEvent)).length === 0 && (
              <div className="py-4 text-center text-xs text-neutral-400">
                Nenhum compromisso ou tarefa para este dia.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agenda List View */}
      {viewMode === 'agenda' && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Próximos Compromissos, Tarefas e Rotinas de Projetos
          </h3>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {/* Events */}
            {(filterType === 'all' || filterType === 'events') &&
              events.map((evt) => (
                <div key={evt.id} className="flex items-center justify-between py-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 dark:text-neutral-100">{evt.title}</p>
                      <p className="text-[11px] text-neutral-500">
                        {formatDatePT(evt.startDate)} • {evt.startTime} às {evt.endTime}
                      </p>
                    </div>
                  </div>
                  {evt.location && (
                    <span className="text-[11px] text-neutral-400">{evt.location}</span>
                  )}
                </div>
              ))}

            {/* Project Routines */}
            {(filterType === 'all' || filterType === 'routines') &&
              allProjectRoutines.filter((r) => r.syncToCalendar !== false).map((routine) => {
                const isDone = isRoutineCompletedOnDate(routine, todayStr);
                return (
                  <div key={routine.id} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleProjectRoutine(routine.projectId, routine.id, todayStr)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors shrink-0"
                        style={{
                          backgroundColor: `${routine.projectColor}20`,
                          color: routine.projectColor,
                        }}
                        title={isDone ? 'Concluída hoje' : 'Marcar como concluída hoje'}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Repeat className="h-4 w-4" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="rounded-md px-1.5 py-0.2 text-[9px] font-bold border shrink-0"
                            style={{
                              backgroundColor: `${routine.projectColor}15`,
                              borderColor: `${routine.projectColor}40`,
                              color: routine.projectColor,
                            }}
                          >
                            {routine.projectName}
                          </span>
                          <p
                            className={`font-bold ${
                              isDone
                                ? 'line-through text-neutral-400'
                                : 'text-neutral-900 dark:text-neutral-100'
                            }`}
                          >
                            {routine.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Rotina {routine.frequency === 'daily' ? 'Diária' : routine.frequency === 'weekly' ? 'Semanal' : routine.frequency === 'biweekly' ? 'Quinzenal' : 'Mensal'}
                          {routine.preferredTime ? ` • ${routine.preferredTime}` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedProjectId(routine.projectId);
                        setActiveTab('projects');
                      }}
                      className="p-1 text-neutral-400 hover:text-indigo-600 rounded-lg shrink-0"
                      title="Abrir no Projeto"
                    >
                      <FolderKanban className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Novo Compromisso
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Data: {formatDatePT(selectedDayForNewEvent)}
            </p>

            <form onSubmit={handleAddEvent} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Título do Evento
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Reunião com cliente, Treino na academia..."
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs text-neutral-900 outline-none focus:border-indigo-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Horário
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-900 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Criar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
