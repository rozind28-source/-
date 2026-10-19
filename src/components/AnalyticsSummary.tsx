import React from 'react';
import { Award, CheckCircle2, TrendingUp, UserCheck, Users, XCircle } from 'lucide-react';
import type { AttendanceRecord } from '../types/schedule.ts';
import { calculateAttendanceStats } from '../utils/calendarUtils.ts';

interface AnalyticsSummaryProps {
  records: AttendanceRecord[];
}

export const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ records }) => {
  const stats = calculateAttendanceStats(records);

  const gordeevCount = stats.byTrainer['Сергей Гордеев'] || 0;
  const surazakovCount = stats.byTrainer['Дмитрий Суразаков'] || 0;
  const total = stats.totalRecords || 1;

  const gordeevPercent = Math.round((gordeevCount / total) * 100);
  const surazakovPercent = Math.round((surazakovCount / total) * 100);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Всего явок</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalRecords}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.uniqueStudents} уникальных спортсменов
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Присутствовали</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.presentCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.totalRecords > 0
              ? `${Math.round((stats.presentCount / stats.totalRecords) * 100)}% явка`
              : '0%'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Сергей Гордеев</span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
            {gordeevCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {gordeevPercent}% от всех тренировок
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Дмитрий Суразаков</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {surazakovCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {surazakovPercent}% от всех тренировок
          </div>
        </div>
      </div>

      {/* Breakdown by sections and trainers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trainers workload */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
            Нагрузка по тренерам
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-800 dark:text-slate-200">
                  Сергей Гордеев (Бокс: ПН, СР, ПТ)
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {gordeevCount} чел. ({gordeevPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${gordeevPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-800 dark:text-slate-200">
                  Дмитрий Суразаков (Бокс и Кикбоксинг: ВТ, ЧТ)
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  {surazakovCount} чел. ({surazakovPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${surazakovPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
            Посещаемость по секциям
          </h3>

          <div className="space-y-3">
            {Object.entries(stats.bySection).map(([section, count]) => {
              const secPercent = Math.round((count / total) * 100);
              return (
                <div key={section} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {section}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 dark:text-slate-400">
                      {count} записей
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white min-w-[36px] text-right">
                      {secPercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
