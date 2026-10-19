import React from 'react';
import type { User } from 'firebase/auth';
import { Calendar, ChevronLeft, ChevronRight, LogOut, Sheet, User as UserIcon } from 'lucide-react';
import { MONTH_NAMES } from '../utils/calendarUtils.ts';

interface HeaderProps {
  user: User | null;
  year: number;
  month: number;
  isLoggingIn: boolean;
  spreadsheetUrl: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onChangeMonth: (year: number, month: number) => void;
  onCreateSpreadsheetClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  year,
  month,
  isLoggingIn,
  spreadsheetUrl,
  onSignIn,
  onSignOut,
  onChangeMonth,
  onCreateSpreadsheetClick,
}) => {
  const handlePrevMonth = () => {
    if (month === 0) {
      onChangeMonth(year - 1, 11);
    } else {
      onChangeMonth(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      onChangeMonth(year + 1, 0);
    } else {
      onChangeMonth(year, month + 1);
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
              <Sheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-100 tracking-tight">
                  Расписание и посещаемость секций
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  Google Таблицы
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Бокс и кикбоксинг • Сергей Гордеев & Дмитрий Суразаков
              </p>
            </div>
          </div>

          {/* Month Selector */}
          <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 shadow-inner">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Предыдущий месяц"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-slate-100 min-w-[150px] justify-center">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>
                {MONTH_NAMES[month]} {year}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Следующий месяц"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Auth State & Action Button */}
          <div className="flex items-center gap-3">
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
              >
                <Sheet className="w-3.5 h-3.5 text-emerald-400" />
                Открыть таблицу
              </a>
            )}

            {user ? (
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-7 h-7 rounded-full border border-slate-600 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden lg:block text-left text-xs">
                  <div className="font-medium text-slate-200 truncate max-w-[130px]">
                    {user.displayName || 'Google Аккаунт'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                    {user.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  aria-label="Выйти из Google аккаунта"
                  title="Выйти"
                  className="ml-1 p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                disabled={isLoggingIn}
                aria-label="Войти через Google для работы с таблицами"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-sm transition-all border border-slate-200 active:scale-95 disabled:opacity-60"
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-4 h-4"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>{isLoggingIn ? 'Вход...' : 'Войти через Google'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCreateSpreadsheetClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Sheet className="w-4 h-4" />
              <span>Создать таблицу</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
