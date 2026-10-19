import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Filter,
  Plus,
  UserCheck,
  Users,
} from 'lucide-react';
import type { AttendanceRecord, DayOfWeek, ScheduleSlot, TrainerName } from '../types/schedule.ts';
import {
  DAYS_OF_WEEK_NAMES,
  DAYS_SHORT,
  getWeeksForMonth,
  type CalendarWeek,
} from '../utils/calendarUtils.ts';

interface ScheduleGridProps {
  year: number;
  month: number;
  slots: ScheduleSlot[];
  attendanceRecords: AttendanceRecord[];
  onOpenAttendanceModal: (prefill?: {
    date: string;
    time: string;
    section: string;
    trainer: TrainerName;
  }) => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  year,
  month,
  slots,
  attendanceRecords,
  onOpenAttendanceModal,
}) => {
  const weeks = getWeeksForMonth(year, month);
  
  // Find index of week containing the first Monday of this month
  const getInitialWeekIndex = () => {
    const idx = weeks.findIndex((w) =>
      w.days.some((d) => d.dayOfWeek === 0 && d.isCurrentMonth)
    );
    return idx >= 0 ? idx : 0;
  };

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(getInitialWeekIndex);

  // When year or month changes, reset to initial week
  React.useEffect(() => {
    setSelectedWeekIndex(getInitialWeekIndex());
  }, [year, month]);
  const [selectedTrainer, setSelectedTrainer] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const currentWeek: CalendarWeek | undefined =
    weeks[selectedWeekIndex] || weeks[0];

  // Distinct times from slots + extra standard times from prompt
  const timeSlots = [
    '08:00',
    '08:30',
    '09:00',
    '10:30',
    '11:00',
    '12:00',
    '13:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '18:30',
    '19:00',
    '20:00',
  ];

  // Count attendances for a slot on a specific date
  const getAttendanceForSlot = (date: string, time: string, trainer: string) => {
    return attendanceRecords.filter(
      (r) => r.date === date && r.time === time && r.trainer === trainer
    );
  };

  // Section badge color helper
  const getSectionColor = (section: string) => {
    if (section.includes('Кикбоксинг')) {
      return 'bg-amber-500/15 border-amber-400/40 text-amber-700 dark:text-amber-300';
    }
    if (section.includes('взр')) {
      return 'bg-blue-500/15 border-blue-400/40 text-blue-700 dark:text-blue-300';
    }
    return 'bg-emerald-500/15 border-emerald-400/40 text-emerald-700 dark:text-emerald-300';
  };

  const getTrainerColor = (trainer: TrainerName) => {
    if (trainer === 'Сергей Гордеев') {
      return 'bg-blue-900/30 text-blue-300 border-blue-700/50';
    }
    return 'bg-amber-900/30 text-amber-300 border-amber-700/50';
  };

  return (
    <div className="space-y-4">
      {/* Filters and Week Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Week Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1 flex-shrink-0">
            <CalendarDays className="w-3.5 h-3.5" />
            Неделя:
          </span>
          {weeks.map((w, idx) => {
            const isSelected = idx === selectedWeekIndex;
            return (
              <button
                key={w.weekNumber}
                type="button"
                onClick={() => setSelectedWeekIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Неделя {w.weekNumber} ({w.days[0].formattedShort} — {w.days[6].formattedShort})
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTrainer}
              onChange={(e) => setSelectedTrainer(e.target.value)}
              aria-label="Фильтр по тренеру"
              className="text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Все тренеры</option>
              <option value="Сергей Гордеев">Сергей Гордеев (ПН, СР, ПТ)</option>
              <option value="Дмитрий Суразаков">Дмитрий Суразаков (ВТ, ЧТ)</option>
            </select>
          </div>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            aria-label="Фильтр по направлению"
            className="text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Все направления</option>
            <option value="Бокс взр">Бокс взрослые</option>
            <option value="Бокс дети">Бокс дети</option>
            <option value="Кикбоксинг Дети">Кикбоксинг Дети</option>
          </select>

          <button
            type="button"
            onClick={() => onOpenAttendanceModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Внести ФИО</span>
          </button>
        </div>
      </div>

      {/* Schedule Table Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <th className="p-3 w-20 text-xs font-bold text-slate-500 dark:text-slate-400 text-center sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Время</span>
                  </div>
                </th>
                {currentWeek?.days.map((day) => {
                  const isWeekend = day.dayOfWeek >= 5;
                  return (
                    <th
                      key={day.dateString}
                      className={`p-3 text-xs font-semibold border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${
                        isWeekend
                          ? 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{DAYS_SHORT[day.dayOfWeek]}</span>
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                            day.isCurrentMonth
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold'
                              : 'text-slate-400'
                          }`}
                        >
                          {day.formattedShort}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                        {DAYS_OF_WEEK_NAMES[day.dayOfWeek]}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {timeSlots.map((time) => {
                return (
                  <tr
                    key={time}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Time Column */}
                    <td className="p-2.5 text-center font-semibold text-slate-600 dark:text-slate-400 text-xs sticky left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-10">
                      {time}
                    </td>

                    {/* 7 Days Columns */}
                    {currentWeek?.days.map((day) => {
                      // Find slot
                      const slot = slots.find(
                        (s) => s.dayOfWeek === day.dayOfWeek && s.time === time
                      );

                      // Apply trainer & section filters
                      let isVisible = true;
                      if (slot) {
                        if (selectedTrainer !== 'all' && slot.trainer !== selectedTrainer) {
                          isVisible = false;
                        }
                        if (
                          selectedSection !== 'all' &&
                          !slot.section.includes(selectedSection)
                        ) {
                          isVisible = false;
                        }
                      }

                      if (!slot || !isVisible) {
                        return (
                          <td
                            key={day.dateString}
                            className={`p-2 border-r border-slate-100 dark:border-slate-800/80 last:border-r-0 ${
                              day.dayOfWeek >= 5 ? 'bg-slate-50/30 dark:bg-slate-900/30' : ''
                            }`}
                          >
                            <div className="h-14 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-700/60 text-[11px]">
                              —
                            </div>
                          </td>
                        );
                      }

                      const attendances = getAttendanceForSlot(
                        day.dateString,
                        slot.time,
                        slot.trainer
                      );

                      return (
                        <td
                          key={day.dateString}
                          className="p-1.5 border-r border-slate-100 dark:border-slate-800/80 last:border-r-0 align-top"
                        >
                          <div
                            onClick={() =>
                              onOpenAttendanceModal({
                                date: day.dateString,
                                time: slot.time,
                                section: slot.section,
                                trainer: slot.trainer,
                              })
                            }
                            className={`p-2 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 group ${getSectionColor(
                              slot.section
                            )}`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-[11px] leading-tight">
                                {slot.section}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-sm border font-medium truncate max-w-[90px] ${getTrainerColor(
                                  slot.trainer
                                )}`}
                                title={slot.trainer}
                              >
                                {slot.trainer === 'Сергей Гордеев' ? 'С. Гордеев' : 'Д. Суразаков'}
                              </span>
                            </div>

                            {slot.notes && (
                              <p className="text-[10px] opacity-75 mt-0.5 truncate">
                                {slot.notes}
                              </p>
                            )}

                            {/* Attendance pill / quick mark */}
                            <div className="mt-2 pt-1 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                <Users className="w-3 h-3 text-slate-500" />
                                <span>{attendances.length} чел.</span>
                              </div>
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-0.5">
                                <UserCheck className="w-3 h-3" />
                                + ФИО
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Notes & Legend (from uploaded file) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Примечания расписания:
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <strong>ПН, СР, ПТ:</strong> Бокс — тренер{' '}
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  Сергей Гордеев
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <strong>ВТ, ЧТ:</strong> Бокс и Кикбоксинг — тренер{' '}
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Дмитрий Суразаков
                </span>
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            * Нажмите на любую тренировку в сетке, чтобы быстро внести ФИО посетителя.
          </div>
        </div>
      </div>
    </div>
  );
};
