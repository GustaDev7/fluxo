// Portuguese date & time helpers

export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MONTHS_SHORT_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const DAYS_PT = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

export const DAYS_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function getMonthNamePT(monthIndex: number): string {
  return MONTHS_PT[monthIndex] || '';
}

/**
 * Returns tomorrow's date formatted as YYYY-MM-DD
 */
export function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateToYYYYMMDD(d);
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD string into "DD de Mês" or "DD/MM/YYYY"
 */
export function formatDatePT(dateStr?: string, format: 'short' | 'long' | 'relative' = 'short'): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dateObj = new Date(year, month, day);
  const todayStr = getTodayDateString();

  if (format === 'relative') {
    if (dateStr === todayStr) return 'Hoje';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDateToYYYYMMDD(tomorrow);
    if (dateStr === tomorrowStr) return 'Amanhã';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDateToYYYYMMDD(yesterday);
    if (dateStr === yesterdayStr) return 'Ontem';
  }

  if (format === 'long') {
    return `${day} de ${MONTHS_PT[month]} de ${year}`;
  }

  return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`;
}

export function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isPastDate(dateStr?: string, timeStr?: string): boolean {
  if (!dateStr) return false;
  const today = getTodayDateString();
  if (dateStr < today) return true;
  if (dateStr === today && timeStr) {
    const now = new Date();
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return timeStr < currentHourMin;
  }
  return false;
}

export function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  return dateStr === getTodayDateString();
}

/**
 * Returns greeting in Portuguese based on current hour
 */
export function getGreetingPT(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Get days of a given month for calendar grid
 */
export function getCalendarMonthDays(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Previous month overflow
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({ dateStr, dayNumber: day, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ dateStr, dayNumber: i, isCurrentMonth: true });
  }

  // Next month overflow to complete 35 or 42 grid cells
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({ dateStr, dayNumber: i, isCurrentMonth: false });
  }

  return days;
}

/**
 * Returns the 7 days of the week containing a target date
 */
export function getWeekDays(targetDate: Date) {
  const curr = new Date(targetDate);
  const first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
  const week = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(curr.setDate(first + i));
    week.push({
      date: day,
      dateStr: formatDateToYYYYMMDD(day),
      dayName: DAYS_SHORT_PT[day.getDay()],
      dayNumber: day.getDate(),
      isToday: formatDateToYYYYMMDD(day) === getTodayDateString(),
    });
  }
  return week;
}

/**
 * Calculates the next due date based on recurrence type and current due date (or today).
 */
export function calculateNextRecurrenceDate(
  currentDueDate: string | undefined,
  recurrenceType: 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'yearly',
  interval = 1
): string {
  const base = currentDueDate ? new Date(`${currentDueDate}T12:00:00`) : new Date();
  const next = new Date(base);

  switch (recurrenceType) {
    case 'daily':
      next.setDate(next.getDate() + (interval || 1));
      break;
    case 'weekdays': {
      // Advance to next Monday - Friday
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() === 0 || next.getDay() === 6);
      break;
    }
    case 'weekly':
      next.setDate(next.getDate() + 7 * (interval || 1));
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14 * (interval || 1));
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + (interval || 1));
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + (interval || 1));
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  return formatDateToYYYYMMDD(next);
}
