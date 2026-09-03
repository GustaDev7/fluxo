import { CalendarEvent, Task, Project, Habit, Goal } from '../types';
import { getTodayDateString } from './date';

/**
 * Generates and triggers download of an iCalendar (.ics) file
 * Compatible with Google Calendar, Apple Calendar, Outlook, etc.
 */
export function downloadICS(events: CalendarEvent[], tasks: Task[]) {
  const pad = (n: number) => String(n).padStart(2, '0');

  const formatICSDate = (dateStr: string, timeStr?: string) => {
    const cleanDate = dateStr.replace(/-/g, '');
    if (!timeStr) {
      return `VALUE=DATE:${cleanDate}`;
    }
    const cleanTime = timeStr.replace(/:/g, '') + '00';
    return `${cleanDate}T${cleanTime}`;
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Central de Produtividade//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Central de Produtividade',
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ];

  // Add Calendar Events
  events.forEach((ev) => {
    const startStr = formatICSDate(ev.startDate, ev.startTime);
    const endStr = formatICSDate(ev.endDate || ev.startDate, ev.endTime || ev.startTime);
    const uid = `event_${ev.id}@produtividade.app`;

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${getTodayDateString().replace(/-/g, '')}T000000Z`,
      ev.startTime ? `DTSTART:${startStr}` : `DTSTART;${startStr}`,
      ev.endTime ? `DTEND:${endStr}` : `DTEND;${endStr}`,
      `SUMMARY:${ev.title.replace(/,/g, '\\,')}`,
      ev.description ? `DESCRIPTION:${ev.description.replace(/\n/g, '\\n')}` : '',
      ev.location ? `LOCATION:${ev.location.replace(/,/g, '\\,')}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  // Add Tasks with due dates
  tasks
    .filter((t) => t.dueDate && t.status !== 'done')
    .forEach((t) => {
      const uid = `task_${t.id}@produtividade.app`;
      const dateStr = formatICSDate(t.dueDate!, t.dueTime);

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${getTodayDateString().replace(/-/g, '')}T000000Z`,
        t.dueTime ? `DTSTART:${dateStr}` : `DTSTART;${dateStr}`,
        `SUMMARY:[Prazo] ${t.title.replace(/,/g, '\\,')}`,
        t.description ? `DESCRIPTION:${t.description.replace(/\n/g, '\\n')}` : '',
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

  icsContent.push('END:VCALENDAR');

  const cleanBody = icsContent.filter(Boolean).join('\r\n');
  const blob = new Blob([cleanBody], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `produtividade_agenda_${getTodayDateString()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and triggers download of a CSV spreadsheet of tasks
 */
export function downloadCSV(tasks: Task[], projects: Project[]) {
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  const headers = [
    'ID',
    'Título',
    'Status',
    'Prioridade',
    'Projeto',
    'Data de Vencimento',
    'Horário',
    'Duração Estimada (min)',
    'Tags',
    'Subtarefas Totais',
    'Subtarefas Concluídas',
  ];

  const escapeCSV = (str?: string) => {
    if (!str) return '""';
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = tasks.map((t) => {
    const subtasksTotal = t.subtasks?.length || 0;
    const subtasksDone = t.subtasks?.filter((s) => s.completed).length || 0;
    const projectName = t.projectId ? projectMap.get(t.projectId) || '' : '';

    return [
      t.id,
      escapeCSV(t.title),
      t.status,
      t.priority,
      escapeCSV(projectName),
      t.dueDate || '',
      t.dueTime || '',
      t.estimatedDuration || 0,
      escapeCSV(t.tags?.join(', ') || ''),
      subtasksTotal,
      subtasksDone,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tarefas_produtividade_${getTodayDateString()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
