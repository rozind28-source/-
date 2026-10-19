export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Понедельник, 6 = Воскресенье

export type TrainerName = 'Сергей Гордеев' | 'Дмитрий Суразаков';

export type SectionType = 'Бокс взр' | 'Бокс дети' | 'Кикбоксинг Дети' | 'Бокс взр 1' | 'Бокс дети 2';

export interface ScheduleSlot {
  id: string;
  time: string; // e.g. "09:00", "10:30"
  dayOfWeek: DayOfWeek; // 0..6
  section: string; // e.g. "Бокс взр", "Бокс дети"
  trainer: TrainerName;
  room?: string;
  notes?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'makeup' | 'trial';

export type PaymentType = 'Абонемент' | 'Разовое занятие' | 'Пробное' | 'Без оплаты';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  section: string;
  trainer: TrainerName;
  studentName: string; // ФИО
  status: AttendanceStatus;
  paymentType: PaymentType;
  notes?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  fullName: string; // ФИО
  phone?: string;
  preferredSection: string;
  preferredTrainer: TrainerName;
  totalVisits: number;
  notes?: string;
}

export interface MonthConfig {
  year: number;
  month: number; // 0-indexed: 0 = Январь, 10 = Ноябрь
}

export interface GoogleSheetSyncState {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  title: string | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;
}
