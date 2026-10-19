import React, { useState } from 'react';
import {
  Download,
  Filter,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
} from 'lucide-react';
import type { AttendanceRecord, TrainerName } from '../types/schedule.ts';
import { generateAttendanceCsv } from '../utils/calendarUtils.ts';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onOpenModal: () => void;
  onDeleteRecord: (id: string) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  onOpenModal,
  onDeleteRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filtered records
  const filteredRecords = records.filter((rec) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rec.studentName.toLowerCase().includes(q);
      const matchNotes = (rec.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchNotes) return false;
    }
    if (selectedTrainer !== 'all' && rec.trainer !== selectedTrainer) {
      return false;
    }
    if (selectedSection !== 'all' && !rec.section.includes(selectedSection)) {
      return false;
    }
    if (selectedStatus !== 'all' && rec.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const handleDownloadCsv = () => {
    const csv = generateAttendanceCsv(filteredRecords);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Посещаемость_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle className="w-3 h-3" />
            Присутствовал
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <UserX className="w-3 h-3" />
            Пропуск
          </span>
        );
      case 'makeup':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Отработка
          </span>
        );
      case 'trial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <UserCheck className="w-3 h-3" />
            Пробное
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Control bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по ФИО или примечанию..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filters and actions */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTrainer}
            onChange={(e) => setSelectedTrainer(e.target.value)}
            aria-label="Фильтр по тренеру"
            className="text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Все тренеры</option>
            <option value="Сергей Гордеев">Сергей Гордеев</option>
            <option value="Дмитрий Суразаков">Дмитрий Суразаков</option>
          </select>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            aria-label="Фильтр по направлению"
            className="text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Все секции</option>
            <option value="Бокс взр">Бокс взрослые</option>
            <option value="Бокс дети">Бокс дети</option>
            <option value="Кикбоксинг Дети">Кикбоксинг Дети</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Фильтр по статусу"
            className="text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Все статусы</option>
            <option value="present">Присутствовал</option>
            <option value="absent">Пропуск</option>
            <option value="makeup">Отработка</option>
            <option value="trial">Пробное</option>
          </select>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium transition-colors"
            title="Скачать CSV файл"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Внести ФИО</span>
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 w-12 text-center">№</th>
                <th className="py-3 px-4">Дата и время</th>
                <th className="py-3 px-4">Секция</th>
                <th className="py-3 px-4">Тренер</th>
                <th className="py-3 px-4">ФИО посетителя</th>
                <th className="py-3 px-4">Статус явки</th>
                <th className="py-3 px-4">Оплата</th>
                <th className="py-3 px-4">Заметки</th>
                <th className="py-3 px-4 text-center w-16">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                    <p className="font-medium text-sm text-slate-600 dark:text-slate-300">
                      Записей о посещениях не найдено
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Нажмите «Внести ФИО», чтобы отметить первого спортсмена на тренировке.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-medium text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {rec.date}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {rec.time}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {rec.section}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          rec.trainer === 'Сергей Гордеев'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {rec.trainer}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {rec.studentName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(rec.status)}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {rec.paymentType}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {rec.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(rec.id)}
                        aria-label={`Удалить запись ${rec.studentName}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total counter bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>
            Показано записей: <strong className="text-slate-800 dark:text-slate-200">{filteredRecords.length}</strong> из{' '}
            {records.length}
          </span>
          <span>
            Все данные могут быть выгружены в Google Таблицу на лист «Журнал посещаемости»
          </span>
        </div>
      </div>
    </div>
  );
};
