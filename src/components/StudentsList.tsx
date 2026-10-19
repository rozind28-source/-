import React, { useState } from 'react';
import { Plus, Search, UserCheck, Users, Phone, Award } from 'lucide-react';
import type { Student, TrainerName } from '../types/schedule.ts';

interface StudentsListProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id' | 'totalVisits'>) => void;
  onQuickRecord: (student: Student) => void;
}

export const StudentsList: React.FC<StudentsListProps> = ({
  students,
  onAddStudent,
  onQuickRecord,
}) => {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredSection, setPreferredSection] = useState('Бокс взр');
  const [preferredTrainer, setPreferredTrainer] = useState<TrainerName>('Сергей Гордеев');
  const [notes, setNotes] = useState('');

  const filteredStudents = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.fullName.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      s.preferredSection.toLowerCase().includes(q) ||
      s.preferredTrainer.toLowerCase().includes(q)
    );
  });

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    onAddStudent({
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      preferredSection,
      preferredTrainer,
      notes: notes.trim() || undefined,
    });
    setFullName('');
    setPhone('');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по ФИО, телефону или тренеру..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Скрыть форму' : 'Добавить спортсмена в базу'}</span>
        </button>
      </div>

      {/* Add student form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmitNew}
          className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-emerald-300 dark:border-emerald-800 space-y-3 animate-in fade-in duration-150"
        >
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            Новый спортсмен (ФИО)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ФИО <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Телефон
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Тренер
              </label>
              <select
                value={preferredTrainer}
                onChange={(e) => setPreferredTrainer(e.target.value as TrainerName)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="Сергей Гордеев">Сергей Гордеев (Бокс)</option>
                <option value="Дмитрий Суразаков">Дмитрий Суразаков (Бокс/Кикбоксинг)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Секция
              </label>
              <select
                value={preferredSection}
                onChange={(e) => setPreferredSection(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="Бокс взр">Бокс взрослые</option>
                <option value="Бокс дети">Бокс дети</option>
                <option value="Кикбоксинг Дети">Кикбоксинг Дети</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Примечания (абонемент, цель тренировок)..."
              className="flex-1 mr-3 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              Сохранить
            </button>
          </div>
        </form>
      )}

      {/* Grid of student cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredStudents.map((s) => (
          <div
            key={s.id}
            className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {s.fullName}
                  </h4>
                  {s.phone && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                </div>
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                  <Award className="w-3 h-3 text-amber-500" />
                  {s.totalVisits} визитов
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  {s.preferredSection}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {s.preferredTrainer}
                </span>
              </div>

              {s.notes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg italic">
                  {s.notes}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => onQuickRecord(s)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold transition-colors active:scale-95"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Отметить на тренировке</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
