import { Project, ProjectRoutine } from '../types';

export interface EnrichedProjectRoutine extends ProjectRoutine {
  projectId: string;
  projectName: string;
  projectColor: string;
}

/**
 * Checks if a project routine is scheduled to be performed on a given date (YYYY-MM-DD).
 */
export function isRoutineScheduledForDate(routine: ProjectRoutine, dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, ...
  const dayOfMonth = date.getDate();

  switch (routine.frequency) {
    case 'daily':
      return true;
    case 'weekly': {
      // If specific day of week configured, check it. Default to Monday (1)
      const targetDay = routine.dayOfWeek !== undefined ? routine.dayOfWeek : 1;
      return dayOfWeek === targetDay;
    }
    case 'biweekly': {
      // 1st and 15th of the month or every other Monday
      return dayOfMonth === 1 || dayOfMonth === 15;
    }
    case 'monthly': {
      // 1st of month by default or configured day
      const targetMonthDay = routine.dayOfMonth !== undefined ? routine.dayOfMonth : 1;
      return dayOfMonth === targetMonthDay;
    }
    default:
      return true;
  }
}

/**
 * Checks if a routine was marked completed for a specific date (YYYY-MM-DD).
 */
export function isRoutineCompletedOnDate(routine: ProjectRoutine, dateStr: string): boolean {
  if (routine.completedDates && routine.completedDates.includes(dateStr)) {
    return true;
  }
  if (routine.completed && routine.lastCompletedDate === dateStr) {
    return true;
  }
  return false;
}

/**
 * Extracts all project routines with their parent project's metadata attached.
 */
export function getAllEnrichedProjectRoutines(projects: Project[]): EnrichedProjectRoutine[] {
  const list: EnrichedProjectRoutine[] = [];
  projects.forEach((project) => {
    if (project.routines && project.routines.length > 0) {
      project.routines.forEach((routine) => {
        list.push({
          ...routine,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color || '#6366f1',
        });
      });
    }
  });
  return list;
}
