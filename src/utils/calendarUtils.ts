import type { AttendanceRecord, DayOfWeek, ScheduleSlot, TrainerName } from '../types/schedule.ts';

export const DAYS_OF_WEEK_NAMES = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
] as const;

export const DAYS_SHORT = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'] as const;

export const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
] as const;

export interface CalendarDay {
  dateString: string; // YYYY-MM-DD
  dayNumber: number; // 1..31
  dayOfWeek: DayOfWeek; // 0..6
  isCurrentMonth: boolean;
  formattedShort: string; // "02.11"
}

export interface CalendarWeek {
  weekNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: CalendarDay[];
}

/**
 * Returns zero-padded string, e.g. 5 -> "05"
 */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Formats a Date or string to YYYY-MM-DD
 */
export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

/**
 * Returns short date format "DD.MM" (e.g. "02.11")
 */
export function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}`;
}

/**
 * Converts Javascript Date.getDay() (0=Sunday, 1=Monday... 6=Saturday)
 * to Russian standard DayOfWeek (0=Monday... 6=Sunday)
 */
export function jsDayToRussianDay(jsDay: number): DayOfWeek {
  return (jsDay === 0 ? 6 : jsDay - 1) as DayOfWeek;
}

/**
 * Generates all weeks and days for a given month, grouped into 7-day Monday-Sunday weeks.
 */
export function getWeeksForMonth(year: number, month: number): CalendarWeek[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  // Find Monday of the first week
  const firstJsDay = firstDay.getDay();
  const firstRuDay = jsDayToRussianDay(firstJsDay); // 0=Mon, 6=Sun

  // Start date for the calendar grid (Monday of the first week)
  const gridStart = new Date(year, month, 1 - firstRuDay);

  const weeks: CalendarWeek[] = [];
  const current = new Date(gridStart.getTime());
  let weekIndex = 1;

  while (true) {
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const curYear = current.getFullYear();
      const curMonth = current.getMonth();
      const curDate = current.getDate();
      const isoStr = toIsoDate(curYear, curMonth, curDate);
      const isCurMonth = curMonth === month && curYear === year;

      days.push({
        dateString: isoStr,
        dayNumber: curDate,
        dayOfWeek: i as DayOfWeek,
        isCurrentMonth: isCurMonth,
        formattedShort: `${pad2(curDate)}.${pad2(curMonth + 1)}`,
      });

      current.setDate(current.getDate() + 1);
    }

    weeks.push({
      weekNumber: weekIndex++,
      startDate: days[0].dateString,
      endDate: days[6].dateString,
      days,
    });

    // Check if we passed the end of the month
    if (current.getMonth() !== month && current > lastDay && days[6].dayOfWeek === 6) {
      break;
    }
    // Safety guard max 6 weeks
    if (weeks.length >= 6) {
      break;
    }
  }

  return weeks;
}

/**
 * Match schedule slots for a given day of the week
 */
export function getSlotsForDay(slots: ScheduleSlot[], dayOfWeek: DayOfWeek): ScheduleSlot[] {
  return slots
    .filter((s) => s.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Compute attendance statistics
 */
export interface AttendanceStats {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  makeupCount: number;
  trialCount: number;
  byTrainer: Record<TrainerName, number>;
  bySection: Record<string, number>;
  uniqueStudents: number;
}

export function calculateAttendanceStats(records: AttendanceRecord[]): AttendanceStats {
  const byTrainer: Record<TrainerName, number> = {
    'Сергей Гордеев': 0,
    'Дмитрий Суразаков': 0,
  };
  const bySection: Record<string, number> = {};
  const studentSet = new Set<string>();

  let presentCount = 0;
  let absentCount = 0;
  let makeupCount = 0;
  let trialCount = 0;

  for (const r of records) {
    if (r.trainer in byTrainer) {
      byTrainer[r.trainer] = (byTrainer[r.trainer] || 0) + 1;
    }
    bySection[r.section] = (bySection[r.section] || 0) + 1;

    if (r.studentName && r.studentName.trim()) {
      studentSet.add(r.studentName.trim().toLowerCase());
    }

    if (r.status === 'present') presentCount++;
    else if (r.status === 'absent') absentCount++;
    else if (r.status === 'makeup') makeupCount++;
    else if (r.status === 'trial') trialCount++;
  }

  return {
    totalRecords: records.length,
    presentCount,
    absentCount,
    makeupCount,
    trialCount,
    byTrainer,
    bySection,
    uniqueStudents: studentSet.size,
  };
}

/**
 * Generates CSV content from attendance records for export / backup
 */
export function generateAttendanceCsv(records: AttendanceRecord[]): string {
  const headers = ['№', 'Дата', 'Время', 'Секция', 'Тренер', 'ФИО', 'Статус', 'Оплата', 'Заметки'];
  const statusLabels: Record<string, string> = {
    present: 'Присутствовал',
    absent: 'Пропуск',
    makeup: 'Отработка',
    trial: 'Пробное',
  };

  const rows = records.map((r, idx) => [
    idx + 1,
    r.date,
    r.time,
    `"${r.section.replace(/"/g, '""')}"`,
    `"${r.trainer.replace(/"/g, '""')}"`,
    `"${r.studentName.replace(/"/g, '""')}"`,
    statusLabels[r.status] || r.status,
    `"${r.paymentType.replace(/"/g, '""')}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
