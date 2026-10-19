import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatShortDate,
  jsDayToRussianDay,
  getWeeksForMonth,
  calculateAttendanceStats,
  generateAttendanceCsv,
  pad2,
} from './calendarUtils.ts';
import type { AttendanceRecord } from '../types/schedule.ts';

test('pad2 formats numbers with leading zero', () => {
  assert.equal(pad2(5), '05');
  assert.equal(pad2(12), '12');
  assert.equal(pad2(0), '00');
});

test('formatShortDate formats YYYY-MM-DD to DD.MM', () => {
  assert.equal(formatShortDate('2026-11-02'), '02.11');
  assert.equal(formatShortDate('2026-11-15'), '15.11');
  assert.equal(formatShortDate('invalid'), 'invalid');
});

test('jsDayToRussianDay correctly converts Sunday (0) to 6 and Monday (1) to 0', () => {
  assert.equal(jsDayToRussianDay(1), 0); // Monday
  assert.equal(jsDayToRussianDay(2), 1); // Tuesday
  assert.equal(jsDayToRussianDay(5), 4); // Friday
  assert.equal(jsDayToRussianDay(0), 6); // Sunday
  assert.equal(jsDayToRussianDay(6), 5); // Saturday
});

test('getWeeksForMonth generates weeks starting with Monday for November 2026', () => {
  // November 2026: 1st is Sunday, 2nd is Monday
  const weeks = getWeeksForMonth(2026, 10); // 10 = November
  assert.ok(weeks.length >= 4, 'Should have at least 4 weeks');
  
  // Every week should have 7 days
  for (const week of weeks) {
    assert.equal(week.days.length, 7);
    assert.equal(week.days[0].dayOfWeek, 0); // Monday
    assert.equal(week.days[6].dayOfWeek, 6); // Sunday
  }

  // Week 1 should contain 02.11 Monday as indicated in user's prompt ("2 ноября ПОНЕДЕЛЬНИК")
  const hasNov2Monday = weeks.some((w) =>
    w.days.some((d) => d.dateString === '2026-11-02' && d.dayOfWeek === 0)
  );
  assert.ok(hasNov2Monday, 'Calendar must include 2026-11-02 as Monday');
});

test('calculateAttendanceStats aggregates counts correctly', () => {
  const records: AttendanceRecord[] = [
    {
      id: '1',
      date: '2026-11-02',
      time: '09:00',
      section: 'Бокс взр',
      trainer: 'Сергей Гордеев',
      studentName: 'Иванов Иван Иванович',
      status: 'present',
      paymentType: 'Абонемент',
      createdAt: '2026-11-02T09:00:00Z',
    },
    {
      id: '2',
      date: '2026-11-02',
      time: '09:00',
      section: 'Бокс взр',
      trainer: 'Сергей Гордеев',
      studentName: 'Петров Петр Петрович',
      status: 'present',
      paymentType: 'Разовое занятие',
      createdAt: '2026-11-02T09:00:00Z',
    },
    {
      id: '3',
      date: '2026-11-03',
      time: '10:30',
      section: 'Кикбоксинг Дети',
      trainer: 'Дмитрий Суразаков',
      studentName: 'Сидоров Алексей',
      status: 'absent',
      paymentType: 'Абонемент',
      createdAt: '2026-11-03T10:30:00Z',
    },
  ];

  const stats = calculateAttendanceStats(records);
  assert.equal(stats.totalRecords, 3);
  assert.equal(stats.presentCount, 2);
  assert.equal(stats.absentCount, 1);
  assert.equal(stats.byTrainer['Сергей Гордеев'], 2);
  assert.equal(stats.byTrainer['Дмитрий Суразаков'], 1);
  assert.equal(stats.uniqueStudents, 3);
});

test('generateAttendanceCsv outputs valid CSV string with headers', () => {
  const records: AttendanceRecord[] = [
    {
      id: '1',
      date: '2026-11-02',
      time: '09:00',
      section: 'Бокс взр',
      trainer: 'Сергей Гордеев',
      studentName: 'Иванов Иван',
      status: 'present',
      paymentType: 'Абонемент',
      notes: 'Отличная тренировка',
      createdAt: '2026-11-02T09:00:00Z',
    },
  ];

  const csv = generateAttendanceCsv(records);
  assert.ok(csv.includes('№,Дата,Время,Секция,Тренер,ФИО,Статус,Оплата,Заметки'));
  assert.ok(csv.includes('Иванов Иван'));
  assert.ok(csv.includes('Сергей Гордеев'));
});
