import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  CalendarDays,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Sheet,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { AnalyticsSummary } from './components/AnalyticsSummary.tsx';
import { AttendanceTable } from './components/AttendanceTable.tsx';
import { ConfirmationModal } from './components/ConfirmationModal.tsx';
import { GoogleSheetsBanner } from './components/GoogleSheetsBanner.tsx';
import { Header } from './components/Header.tsx';
import { RecordAttendanceModal } from './components/RecordAttendanceModal.tsx';
import { ScheduleGrid } from './components/ScheduleGrid.tsx';
import { StudentsList } from './components/StudentsList.tsx';
import {
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_SCHEDULE_SLOTS,
  INITIAL_STUDENTS,
} from './data/initialSchedule.ts';
import {
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from './services/auth.ts';
import {
  appendAttendanceToGoogleSheet,
  createMonthlySpreadsheet,
  syncAllAttendanceToGoogleSheet,
} from './services/googleSheets.ts';
import type {
  AttendanceRecord,
  GoogleSheetSyncState,
  ScheduleSlot,
  Student,
  TrainerName,
} from './types/schedule.ts';
import { MONTH_NAMES } from './utils/calendarUtils.ts';

type ActiveTab = 'schedule' | 'attendance' | 'students' | 'analytics';

export default function App() {
  // Current month: November 2026 (based on user's attachment: "2 ноября 02.11 ПОНЕДЕЛЬНИК")
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(10); // 10 = Ноябрь

  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');

  // Core Data
  const [slots] = useState<ScheduleSlot[]>(INITIAL_SCHEDULE_SLOTS);
  const [attendanceRecords, setAttendanceRecords] =
    useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_RECORDS);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Google Sheets state
  const [syncState, setSyncState] = useState<GoogleSheetSyncState>({
    spreadsheetId: null,
    spreadsheetUrl: null,
    title: null,
    lastSyncedAt: null,
    isSyncing: false,
    error: null,
  });

  // Modals state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendancePrefill, setAttendancePrefill] = useState<{
    date: string;
    time: string;
    section: string;
    trainer: TrainerName;
  } | null>(null);

  // Confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Init Auth on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showToast(`Вход выполнен: ${res.user.displayName || res.user.email}`, 'success');
      }
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Ошибка авторизации Google', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    showToast('Вы вышли из учетной записи Google', 'info');
  };

  // Request to create Spreadsheet (with mandatory user confirmation dialog!)
  const requestCreateSpreadsheet = () => {
    if (!user) {
      showToast('Сначала войдите через Google аккаунт для создания таблицы', 'info');
      handleSignIn();
      return;
    }

    const monthName = MONTH_NAMES[month];
    setConfirmDialog({
      isOpen: true,
      title: 'Создать Google Таблицу на месяц?',
      message: `Приложение создаст на вашем Google Диске новую таблицу «Расписание и посещаемость секций — ${monthName} ${year}».

В нее войдут 4 листа:
1. «Расписание на ${monthName}» — сетка тренировок Сергея Гордеева и Дмитрия Суразакова с датами по неделям.
2. «Журнал посещаемости» — ${attendanceRecords.length} записей с ФИО, секцией, тренером и статусом явок.
3. «Сводка по тренерам» — формулы подсчета посещений по каждому тренеру и направлению.
4. «Список спортсменов» — база с ФИО и контактами.`,
      confirmLabel: 'Создать таблицу',
      isDestructive: false,
      onConfirm: executeCreateSpreadsheet,
    });
  };

  const executeCreateSpreadsheet = async () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const res = await createMonthlySpreadsheet(
        year,
        month,
        slots,
        students,
        attendanceRecords
      );

      setSyncState({
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        title: res.title,
        lastSyncedAt: new Date().toISOString(),
        isSyncing: false,
        error: null,
      });

      showToast('Google Таблица успешно создана на вашем Google Диске!', 'success');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Ошибка при создании Google Таблицы';
      setSyncState((prev) => ({ ...prev, isSyncing: false, error: errorMsg }));
      showToast(errorMsg, 'error');
    }
  };

  // Request to Sync all records to existing Google Sheet (with mandatory confirmation!)
  const requestSyncToGoogle = () => {
    if (!syncState.spreadsheetId) {
      requestCreateSpreadsheet();
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Синхронизировать данные с Google Таблицей?',
      message: `Обновить лист «Журнал посещаемости» в таблице «${
        syncState.title || 'Расписание'
      }»? Все текущие ${attendanceRecords.length} записей будут перезаписаны в актуальном виде.`,
      confirmLabel: 'Синхронизировать',
      isDestructive: false,
      onConfirm: executeSyncToGoogle,
    });
  };

  const executeSyncToGoogle = async () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    if (!syncState.spreadsheetId) return;

    setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
    try {
      await syncAllAttendanceToGoogleSheet(syncState.spreadsheetId, attendanceRecords);
      setSyncState((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
        isSyncing: false,
      }));
      showToast('Журнал посещаемости успешно синхронизирован с Google Таблицей!', 'success');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Ошибка синхронизации с Google Таблицей';
      setSyncState((prev) => ({ ...prev, isSyncing: false, error: errorMsg }));
      showToast(errorMsg, 'error');
    }
  };

  // Add Attendance Record
  const handleSaveAttendance = async (
    newRecord: Omit<AttendanceRecord, 'id' | 'createdAt'>,
    syncToGoogle: boolean
  ) => {
    const id = `att-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const fullRecord: AttendanceRecord = {
      ...newRecord,
      id,
      createdAt,
    };

    setAttendanceRecords((prev) => [fullRecord, ...prev]);

    // Update student's visit counter or auto-add to students if new
    setStudents((prev) => {
      const existing = prev.find(
        (s) => s.fullName.toLowerCase() === newRecord.studentName.toLowerCase()
      );
      if (existing) {
        return prev.map((s) =>
          s.id === existing.id
            ? { ...s, totalVisits: (s.totalVisits || 0) + 1 }
            : s
        );
      }
      // Add new student
      return [
        ...prev,
        {
          id: `st-${Date.now()}`,
          fullName: newRecord.studentName,
          preferredSection: newRecord.section,
          preferredTrainer: newRecord.trainer,
          totalVisits: 1,
        },
      ];
    });

    showToast(`Посещение для «${newRecord.studentName}» внесено!`, 'success');

    // Optionally append to Google Sheet in background
    if (syncToGoogle && syncState.spreadsheetId) {
      try {
        await appendAttendanceToGoogleSheet(syncState.spreadsheetId, fullRecord);
        showToast('Запись добавлена в Google Таблицу онлайн', 'success');
      } catch (err) {
        console.warn('Google Sheet append error:', err);
      }
    }
  };

  // Delete Attendance Record (with mandatory confirmation!)
  const handleDeleteAttendance = (id: string) => {
    const target = attendanceRecords.find((r) => r.id === id);
    if (!target) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Удалить запись посещения?',
      message: `Вы действительно хотите удалить запись для «${target.studentName}» от ${target.date} (${target.time}, ${target.trainer})?`,
      confirmLabel: 'Удалить',
      isDestructive: true,
      onConfirm: () => {
        setAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('Запись посещения удалена', 'info');
      },
    });
  };

  // Add new student
  const handleAddStudent = (newStudent: Omit<Student, 'id' | 'totalVisits'>) => {
    const student: Student = {
      ...newStudent,
      id: `st-${Date.now()}`,
      totalVisits: 0,
    };
    setStudents((prev) => [student, ...prev]);
    showToast(`Спортсмен «${student.fullName}» добавлен в базу`, 'success');
  };

  // Open modal prefilled
  const handleOpenAttendanceModal = (prefill?: {
    date: string;
    time: string;
    section: string;
    trainer: TrainerName;
  }) => {
    setAttendancePrefill(prefill || null);
    setIsAttendanceModalOpen(true);
  };

  const handleQuickRecordStudent = (student: Student) => {
    handleOpenAttendanceModal({
      date: new Date().toISOString().slice(0, 10),
      time: '09:00',
      section: student.preferredSection,
      trainer: student.preferredTrainer,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        user={user}
        year={year}
        month={month}
        isLoggingIn={isLoggingIn}
        spreadsheetUrl={syncState.spreadsheetUrl}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onChangeMonth={(newYear, newMonth) => {
          setYear(newYear);
          setMonth(newMonth);
        }}
        onCreateSpreadsheetClick={requestCreateSpreadsheet}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Google Sheets Integration Banner */}
        <GoogleSheetsBanner
          syncState={syncState}
          hasUser={!!user}
          onSync={requestSyncToGoogle}
          onCreate={requestCreateSpreadsheet}
          onSignIn={handleSignIn}
        />

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Расписание секций (Сетка)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Журнал посещаемости (ФИО)</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 dark:bg-slate-900 text-white font-bold">
                {attendanceRecords.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'students'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Список спортсменов ({students.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Сводка по тренерам</span>
            </button>
          </nav>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => handleOpenAttendanceModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Внести посещение (ФИО)</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === 'schedule' && (
          <ScheduleGrid
            year={year}
            month={month}
            slots={slots}
            attendanceRecords={attendanceRecords}
            onOpenAttendanceModal={handleOpenAttendanceModal}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTable
            records={attendanceRecords}
            onOpenModal={() => handleOpenAttendanceModal()}
            onDeleteRecord={handleDeleteAttendance}
          />
        )}

        {activeTab === 'students' && (
          <StudentsList
            students={students}
            onAddStudent={handleAddStudent}
            onQuickRecord={handleQuickRecordStudent}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsSummary records={attendanceRecords} />}
      </main>

      {/* Record Attendance Modal */}
      <RecordAttendanceModal
        isOpen={isAttendanceModalOpen}
        students={students}
        prefill={attendancePrefill}
        hasSpreadsheet={!!syncState.spreadsheetId}
        onClose={() => setIsAttendanceModalOpen(false)}
        onSubmit={handleSaveAttendance}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        isLoading={syncState.isSyncing}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 bg-slate-900 text-white border-slate-700"
        >
          {toastMessage.type === 'success' && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          )}
          {toastMessage.type === 'error' && (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          )}
          {toastMessage.type === 'info' && (
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
