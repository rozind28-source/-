import React, { useState, useEffect } from 'react';
import { Check, Clock, Plus, User, X } from 'lucide-react';
import type {
  AttendanceRecord,
  AttendanceStatus,
  PaymentType,
  Student,
  TrainerName,
} from '../types/schedule.ts';

interface RecordAttendanceModalProps {
  isOpen: boolean;
  students: Student[];
  prefill?: {
    date: string;
    time: string;
    section: string;
    trainer: TrainerName;
  } | null;
  hasSpreadsheet: boolean;
  onClose: () => void;
  onSubmit: (
    record: Omit<AttendanceRecord, 'id' | 'createdAt'>,
    syncToGoogle: boolean
  ) => Promise<void>;
}

export const RecordAttendanceModal: React.FC<RecordAttendanceModalProps> = ({
  isOpen,
  students,
  prefill,
  hasSpreadsheet,
  onClose,
  onSubmit,
}) => {
  const [studentName, setStudentName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [section, setSection] = useState('Бокс взр');
  const [trainer, setTrainer] = useState<TrainerName>('Сергей Гордеев');
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [paymentType, setPaymentType] = useState<PaymentType>('Абонемент');
  const [notes, setNotes] = useState('');
  const [syncToGoogle, setSyncToGoogle] = useState(hasSpreadsheet);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggestions for autocomplete
  const [suggestions, setSuggestions] = useState<Student[]>([]);

  useEffect(() => {
    if (prefill) {
      if (prefill.date) setDate(prefill.date);
      if (prefill.time) setTime(prefill.time);
      if (prefill.section) setSection(prefill.section);
      if (prefill.trainer) setTrainer(prefill.trainer);
    } else {
      // Default to today
      const today = new Date().toISOString().slice(0, 10);
      setDate(today);
    }
  }, [prefill, isOpen]);

  useEffect(() => {
    if (!studentName.trim()) {
      setSuggestions([]);
      return;
    }
    const q = studentName.toLowerCase();
    const matched = students.filter((s) => s.fullName.toLowerCase().includes(q));
    setSuggestions(matched);
  }, [studentName, students]);

  if (!isOpen) return null;

  const handleSelectSuggestion = (s: Student) => {
    setStudentName(s.fullName);
    if (s.preferredTrainer) setTrainer(s.preferredTrainer);
    if (s.preferredSection) setSection(s.preferredSection);
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('Пожалуйста, введите ФИО посетителя.');
      return;
    }
    if (!date) {
      setError('Пожалуйста, выберите дату тренировки.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          date,
          time,
          section,
          trainer,
          studentName: studentName.trim(),
          status,
          paymentType,
          notes: notes.trim(),
        },
        syncToGoogle
      );
      // Reset
      setStudentName('');
      setNotes('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении посещения');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3
              id="attendance-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Внести посещение секции
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Учет явки спортсмена на тренировку у тренера
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть модальное окно"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* ФИО спортсмена */}
          <div className="relative">
            <label
              htmlFor="student-name-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              ФИО спортсмена / посетителя <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="student-name-input"
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="например: Воронов Михаил Андреевич"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Suggestions drop */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-20 max-h-40 overflow-y-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between transition-colors"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {s.fullName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {s.preferredSection} ({s.preferredTrainer})
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Trainer and Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="trainer-select"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Тренер <span className="text-rose-500">*</span>
              </label>
              <select
                id="trainer-select"
                value={trainer}
                onChange={(e) => setTrainer(e.target.value as TrainerName)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Сергей Гордеев">Сергей Гордеев (ПН, СР, ПТ)</option>
                <option value="Дмитрий Суразаков">Дмитрий Суразаков (ВТ, ЧТ)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="section-select"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Секция / Группа <span className="text-rose-500">*</span>
              </label>
              <select
                id="section-select"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Бокс взр">Бокс взрослые</option>
                <option value="Бокс дети">Бокс дети</option>
                <option value="Кикбоксинг Дети">Кикбоксинг Дети</option>
                <option value="Бокс взр 1">Бокс взр 1</option>
                <option value="Бокс дети 2">Бокс дети 2</option>
              </select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="attendance-date"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Дата <span className="text-rose-500">*</span>
              </label>
              <input
                id="attendance-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="attendance-time"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Время тренировки
              </label>
              <select
                id="attendance-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="08:00">08:00</option>
                <option value="08:30">08:30</option>
                <option value="09:00">09:00</option>
                <option value="10:30">10:30</option>
                <option value="11:00">11:00</option>
                <option value="12:00">12:00</option>
                <option value="13:30">13:30</option>
                <option value="15:00">15:00</option>
                <option value="15:30">15:30</option>
                <option value="16:00">16:00</option>
                <option value="16:30">16:30</option>
                <option value="17:00">17:00</option>
                <option value="18:30">18:30</option>
                <option value="19:00">19:00</option>
                <option value="20:00">20:00</option>
              </select>
            </div>
          </div>

          {/* Status & Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="attendance-status"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Статус посещения
              </label>
              <select
                id="attendance-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="present">Присутствовал</option>
                <option value="absent">Пропуск</option>
                <option value="makeup">Отработка</option>
                <option value="trial">Пробное занятие</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="attendance-payment"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Тип оплаты / Абонемент
              </label>
              <select
                id="attendance-payment"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Абонемент">Абонемент</option>
                <option value="Разовое занятие">Разовое занятие</option>
                <option value="Пробное">Пробное занятие</option>
                <option value="Без оплаты">Без оплаты / Перерасчет</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="attendance-notes"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Заметки / Примечания к тренировке
            </label>
            <input
              id="attendance-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="например: Отработка защитных стоек, подготовка к турниру"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Google Sheets instant sync toggle */}
          {hasSpreadsheet && (
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 cursor-pointer">
              <input
                type="checkbox"
                checked={syncToGoogle}
                onChange={(e) => setSyncToGoogle(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                Сразу записать эту строку в Google Таблицу («Журнал посещаемости»)
              </span>
            </label>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Сохранить посещение</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
