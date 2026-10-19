import React from 'react';
import { ExternalLink, RefreshCw, Sheet, CheckCircle2, AlertCircle } from 'lucide-react';
import type { GoogleSheetSyncState } from '../types/schedule.ts';

interface GoogleSheetsBannerProps {
  syncState: GoogleSheetSyncState;
  hasUser: boolean;
  onSync: () => void;
  onCreate: () => void;
  onSignIn: () => void;
}

export const GoogleSheetsBanner: React.FC<GoogleSheetsBannerProps> = ({
  syncState,
  hasUser,
  onSync,
  onCreate,
  onSignIn,
}) => {
  return (
    <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900/60 to-teal-900/30 border border-emerald-700/40 rounded-2xl p-4 sm:p-5 shadow-sm text-slate-100">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
            <Sheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-base text-white">
                Интеграция с Google Таблицами (Google Sheets)
              </h2>
              {syncState.spreadsheetId ? (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Таблица подключена
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  Таблица не создана
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {syncState.spreadsheetId ? (
                <>
                  Файл:{' '}
                  <span className="font-medium text-emerald-300">
                    {syncState.title || 'Расписание и посещаемость секций'}
                  </span>
                  . Все тренировки тренеров Сергея Гордеева и Дмитрия Суразакова
                  автоматически распределены по неделям месяца, а журнал фиксирует ФИО и
                  посещаемость.
                </>
              ) : (
                'Сформируйте удобную Google Таблицу на месяц из вашего файла расписания. В таблице будут 4 листа: Расписание с датами по неделям, Журнал посещаемости с ФИО, Сводка по тренерам с формулами и База спортсменов.'
              )}
            </p>

            {syncState.lastSyncedAt && (
              <div className="text-[11px] text-slate-400 mt-1">
                Последняя синхронизация:{' '}
                {new Date(syncState.lastSyncedAt).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            )}

            {syncState.error && (
              <div className="text-xs text-rose-300 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded-lg mt-2 inline-block">
                {syncState.error}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {!hasUser ? (
            <button
              type="button"
              onClick={onSignIn}
              className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100 transition-colors shadow-sm active:scale-95"
            >
              Войти через Google для выгрузки
            </button>
          ) : syncState.spreadsheetId ? (
            <>
              <a
                href={syncState.spreadsheetUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Открыть в Google Таблицах</span>
              </a>
              <button
                type="button"
                onClick={onSync}
                disabled={syncState.isSyncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-emerald-400 ${
                    syncState.isSyncing ? 'animate-spin' : ''
                  }`}
                />
                <span>{syncState.isSyncing ? 'Синхронизация...' : 'Синхронизировать'}</span>
              </button>
              <button
                type="button"
                onClick={onCreate}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
                title="Пересоздать новую таблицу"
              >
                Создать новую
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onCreate}
              disabled={syncState.isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sheet className="w-4 h-4" />
              <span>Создать Google Таблицу на месяц</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
