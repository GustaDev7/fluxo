import { getTodayDateString, formatDateToYYYYMMDD } from './date';
import { Priority } from '../types';

export interface ParsedQuickTask {
  title: string;
  dueDate?: string;
  dueTime?: string;
  priority: Priority;
  tags: string[];
}

/**
 * Intelligent natural language parser for quick task creation
 * Example input: "Enviar proposta para João amanhã às 14h prioridade alta #trabalho"
 */
export function parseQuickTask(input: string): ParsedQuickTask {
  let cleaned = input.trim();
  const tags: string[] = [];
  let priority: Priority = 'none';
  let dueDate: string | undefined = undefined;
  let dueTime: string | undefined = undefined;

  // 1. Extract #tags
  const tagRegex = /#([\wÀ-ÿ-]+)/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(cleaned)) !== null) {
    tags.push(tagMatch[1].toLowerCase());
  }
  cleaned = cleaned.replace(tagRegex, '').trim();

  // 2. Extract priority (!urgente, !alta, !media, !baixa, or "prioridade alta")
  if (/\b(!urgente|urgente|urgent)\b/i.test(cleaned)) {
    priority = 'urgent';
    cleaned = cleaned.replace(/\b(!urgente|prioridade urgente)\b/i, '').trim();
  } else if (/\b(!alta|prioridade alta|alta)\b/i.test(cleaned)) {
    priority = 'high';
    cleaned = cleaned.replace(/\b(!alta|prioridade alta)\b/i, '').trim();
  } else if (/\b(!m[ée]dia|prioridade m[ée]dia|m[ée]dia)\b/i.test(cleaned)) {
    priority = 'medium';
    cleaned = cleaned.replace(/\b(!m[ée]dia|prioridade m[ée]dia)\b/i, '').trim();
  } else if (/\b(!baixa|prioridade baixa|baixa)\b/i.test(cleaned)) {
    priority = 'low';
    cleaned = cleaned.replace(/\b(!baixa|prioridade baixa)\b/i, '').trim();
  }

  // 3. Extract time (e.g. "às 14h", "as 14:30", "14h", "14:00", "09h30")
  const timeRegex = /(?:[àa]s\s+)?(\d{1,2})(?:[:hH](\d{2})?|h)\b/i;
  const timeMatch = cleaned.match(timeRegex);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      dueTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      cleaned = cleaned.replace(timeRegex, '').trim();
    }
  }

  // 4. Extract date
  const today = new Date();
  if (/\bhoje\b/i.test(cleaned)) {
    dueDate = getTodayDateString();
    cleaned = cleaned.replace(/\bhoje\b/i, '').trim();
  } else if (/\bamanh[aã]\b/i.test(cleaned)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate = formatDateToYYYYMMDD(tomorrow);
    cleaned = cleaned.replace(/\bamanh[aã]\b/i, '').trim();
  } else if (/\bdepois de amanh[aã]\b/i.test(cleaned)) {
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    dueDate = formatDateToYYYYMMDD(dayAfter);
    cleaned = cleaned.replace(/\bdepois de amanh[aã]\b/i, '').trim();
  } else {
    // Check day of week (e.g. "segunda", "terça", etc.)
    const weekDaysMap: { [key: string]: number } = {
      domingo: 0,
      segunda: 1,
      'segunda-feira': 1,
      terca: 2,
      terça: 2,
      'terça-feira': 2,
      quarta: 3,
      'quarta-feira': 3,
      quinta: 4,
      'quinta-feira': 4,
      sexta: 5,
      'sexta-feira': 5,
      sabado: 6,
      sábado: 6,
    };

    for (const [dayName, dayIndex] of Object.entries(weekDaysMap)) {
      const dayRegex = new RegExp(`\\b(?:na\\s+|pr[oó]xim[ao]\\s+)?${dayName}\\b`, 'i');
      if (dayRegex.test(cleaned)) {
        const currentDay = today.getDay();
        let daysToAdd = (dayIndex - currentDay + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // next week's day
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        dueDate = formatDateToYYYYMMDD(targetDate);
        cleaned = cleaned.replace(dayRegex, '').trim();
        break;
      }
    }

    // Check specific date DD/MM
    const datePattern = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/;
    const dateMatch = cleaned.match(datePattern);
    if (dateMatch) {
      const d = parseInt(dateMatch[1], 10);
      const m = parseInt(dateMatch[2], 10) - 1;
      const y = dateMatch[3] ? (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3], 10) : parseInt(dateMatch[3], 10)) : today.getFullYear();
      const targetDate = new Date(y, m, d);
      dueDate = formatDateToYYYYMMDD(targetDate);
      cleaned = cleaned.replace(datePattern, '').trim();
    }
  }

  // Clean trailing punctuation and connector words
  cleaned = cleaned.replace(/\s+(para|às|as|no|na|em)\s*$/i, '').trim();
  if (!cleaned) {
    cleaned = input.trim();
  }

  return {
    title: cleaned,
    dueDate,
    dueTime,
    priority,
    tags,
  };
}
