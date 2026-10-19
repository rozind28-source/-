import type { AttendanceRecord, ScheduleSlot, Student } from '../types/schedule.ts';
import {
  DAYS_OF_WEEK_NAMES,
  MONTH_NAMES,
  formatShortDate,
  getWeeksForMonth,
} from '../utils/calendarUtils.ts';
import { getAccessToken } from './auth.ts';

export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

const statusRu: Record<string, string> = {
  present: 'Присутствовал',
  absent: 'Пропуск',
  makeup: 'Отработка',
  trial: 'Пробное',
};

/**
 * Creates a complete monthly schedule and attendance tracking spreadsheet
 * with 4 dedicated sheets and formatting.
 */
export async function createMonthlySpreadsheet(
  year: number,
  month: number,
  slots: ScheduleSlot[],
  students: Student[],
  attendance: AttendanceRecord[]
): Promise<CreateSpreadsheetResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Требуется авторизация через Google аккаунт для создания таблицы.');
  }

  const monthName = MONTH_NAMES[month];
  const title = `Расписание и посещаемость секций — ${monthName} ${year}`;

  // 1. Create Spreadsheet with basic sheet structures
  const createPayload = {
    properties: {
      title,
      locale: 'ru_RU',
      timeZone: 'Europe/Moscow',
    },
    sheets: [
      {
        properties: {
          title: `Расписание на ${monthName}`,
          gridProperties: {
            rowCount: 100,
            columnCount: 10,
            frozenRowCount: 4,
          },
        },
      },
      {
        properties: {
          title: 'Журнал посещаемости',
          gridProperties: {
            rowCount: 500,
            columnCount: 10,
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Сводка по тренерам',
          gridProperties: {
            rowCount: 50,
            columnCount: 8,
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Список спортсменов',
          gridProperties: {
            rowCount: 200,
            columnCount: 8,
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(
      errData.error?.message || `Ошибка создания таблицы Google: ${createRes.statusText}`
    );
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare Data for Sheet 1: "Расписание на Месяц"
  const scheduleRows: (string | number)[][] = [];

  // Top header block
  scheduleRows.push([`РАСПИСАНИЕ ТРЕНИРОВОЧНЫХ СЕКЦИЙ — ${monthName.toUpperCase()} ${year}`]);
  scheduleRows.push([
    'ПРИМЕЧАНИЯ ПО ТРЕНЕРАМ: Понедельник, Среда, Пятница — Бокс (Сергей Гордеев) | Вторник, Четверг — Бокс и Кикбоксинг (Дмитрий Суразаков)',
  ]);
  scheduleRows.push([
    'Инструкция: Отмечайте явку спортсменов на листе "Журнал посещаемости" с указанием ФИО, даты и статуса.',
  ]);
  scheduleRows.push([]); // blank separator

  const weeks = getWeeksForMonth(year, month);
  const timeSlotsList = [
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

  // Output each week of the month
  weeks.forEach((w) => {
    scheduleRows.push([
      `НЕДЕЛЯ ${w.weekNumber} (${formatShortDate(w.startDate)} — ${formatShortDate(w.endDate)})`,
    ]);

    // Row with Dates: e.g. 02.11, 03.11...
    const dateRow: (string | number)[] = ['Время'];
    w.days.forEach((d) => {
      dateRow.push(d.formattedShort);
    });
    dateRow.push('Тренеры дня');
    scheduleRows.push(dateRow);

    // Row with Day of Week names
    const dayNameRow: (string | number)[] = [''];
    DAYS_OF_WEEK_NAMES.forEach((name) => {
      dayNameRow.push(name.toUpperCase());
    });
    dayNameRow.push('');
    scheduleRows.push(dayNameRow);

    // Grid of time slots
    timeSlotsList.forEach((time) => {
      const row: (string | number)[] = [time];
      const trainersInRow = new Set<string>();

      // Monday (0) to Sunday (6)
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const slot = slots.find((s) => s.dayOfWeek === dayIndex && s.time === time);
        if (slot) {
          row.push(`${slot.section} (${slot.trainer})`);
          trainersInRow.add(slot.trainer);
        } else {
          row.push('');
        }
      }

      row.push(Array.from(trainersInRow).join(', '));
      scheduleRows.push(row);
    });

    scheduleRows.push([]); // empty space between weeks
  });

  // 3. Prepare Data for Sheet 2: "Журнал посещаемости"
  const attendanceRows: (string | number)[][] = [
    [
      '№',
      'Дата',
      'День недели',
      'Время',
      'Секция',
      'Тренер',
      'ФИО посетителя (спортсмена)',
      'Статус явки',
      'Оплата / Абонемент',
      'Заметки',
    ],
  ];

  attendance.forEach((rec, idx) => {
    const d = new Date(rec.date);
    const dayName = !isNaN(d.getTime())
      ? DAYS_OF_WEEK_NAMES[(d.getDay() === 0 ? 6 : d.getDay() - 1)]
      : '';
    attendanceRows.push([
      idx + 1,
      rec.date,
      dayName,
      rec.time,
      rec.section,
      rec.trainer,
      rec.studentName,
      statusRu[rec.status] || rec.status,
      rec.paymentType,
      rec.notes || '',
    ]);
  });

  // 4. Prepare Data for Sheet 3: "Сводка по тренерам"
  const statsRows: (string | number)[][] = [
    ['СВОДНЫЙ ОТЧЕТ ПО ТРЕНЕРАМ И СЕКЦИЯМ ЗА МЕСЯЦ'],
    ['Тренер', 'Основное направление', 'Дни ведения', 'Количество записей в журнале'],
    ['Сергей Гордеев', 'Бокс (взрослые и дети)', 'ПН, СР, ПТ', '=COUNTIF(\'Журнал посещаемости\'!F:F, "Сергей Гордеев")'],
    ['Дмитрий Суразаков', 'Бокс и Кикбоксинг', 'ВТ, ЧТ', '=COUNTIF(\'Журнал посещаемости\'!F:F, "Дмитрий Суразаков")'],
    [],
    ['Секция', 'Категория', 'Всего посещений (формула)'],
    ['Бокс взр', 'Взрослая группа', '=COUNTIF(\'Журнал посещаемости\'!E:E, "Бокс взр") + COUNTIF(\'Журнал посещаемости\'!E:E, "Бокс взр 1")'],
    ['Бокс дети', 'Детская группа', '=COUNTIF(\'Журнал посещаемости\'!E:E, "Бокс дети") + COUNTIF(\'Журнал посещаемости\'!E:E, "Бокс дети 2")'],
    ['Кикбоксинг Дети', 'Детская группа', '=COUNTIF(\'Журнал посещаемости\'!E:E, "Кикбоксинг Дети")'],
    [],
    ['ОБЩАЯ СТАТИСТИКА'],
    ['Всего отмеченных явок (Присутствовал)', '=COUNTIF(\'Журнал посещаемости\'!H:H, "Присутствовал")'],
    ['Всего пропусков', '=COUNTIF(\'Журнал посещаемости\'!H:H, "Пропуск")'],
    ['Всего отработок', '=COUNTIF(\'Журнал посещаемости\'!H:H, "Отработка")'],
  ];

  // 5. Prepare Data for Sheet 4: "Список спортсменов"
  const studentRows: (string | number)[][] = [
    ['№', 'ФИО спортсмена', 'Телефон', 'Секция', 'Тренер', 'Всего посещений', 'Примечания'],
  ];

  students.forEach((s, idx) => {
    studentRows.push([
      idx + 1,
      s.fullName,
      s.phone || '',
      s.preferredSection,
      s.preferredTrainer,
      `=COUNTIF('Журнал посещаемости'!G:G, "${s.fullName}")`,
      s.notes || '',
    ]);
  });

  // 6. Batch update values to all sheets
  const valueData = [
    {
      range: `'Расписание на ${monthName}'!A1`,
      values: scheduleRows,
    },
    {
      range: `'Журнал посещаемости'!A1`,
      values: attendanceRows,
    },
    {
      range: `'Сводка по тренерам'!A1`,
      values: statsRows,
    },
    {
      range: `'Список спортсменов'!A1`,
      values: studentRows,
    },
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueData,
      }),
    }
  );

  if (!updateRes.ok) {
    console.warn('Batch values update warning:', await updateRes.text());
  }

  // 7. Styling format via batchUpdate requests
  const sheet0Id = spreadsheet.sheets[0].properties.sheetId;
  const sheet1Id = spreadsheet.sheets[1].properties.sheetId;
  const sheet2Id = spreadsheet.sheets[2].properties.sheetId;
  const sheet3Id = spreadsheet.sheets[3].properties.sheetId;

  const styleRequests = [
    // Header for Sheet 0 (Расписание)
    {
      repeatCell: {
        range: {
          sheetId: sheet0Id,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 9,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.12, green: 0.23, blue: 0.54 }, // Navy blue
            textFormat: { bold: true, fontSize: 13, foregroundColor: { red: 1, green: 1, blue: 1 } },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
    // Header for Sheet 1 (Журнал посещаемости)
    {
      repeatCell: {
        range: {
          sheetId: sheet1Id,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 10,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.05, green: 0.45, blue: 0.27 }, // Emerald green
            textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 1, green: 1, blue: 1 } },
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
      },
    },
    // Header for Sheet 2 (Сводка)
    {
      repeatCell: {
        range: {
          sheetId: sheet2Id,
          startRowIndex: 0,
          endRowIndex: 2,
          startColumnIndex: 0,
          endColumnIndex: 4,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.3, green: 0.2, blue: 0.6 }, // Indigo
            textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 1, green: 1, blue: 1 } },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
    // Header for Sheet 3 (Список спортсменов)
    {
      repeatCell: {
        range: {
          sheetId: sheet3Id,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 7,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.18, green: 0.31, blue: 0.31 }, // Slate
            textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 1, green: 1, blue: 1 } },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
    // Auto-resize columns on sheets
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: sheet0Id,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 9,
        },
      },
    },
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: sheet1Id,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 10,
        },
      },
    },
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId: sheet3Id,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 7,
        },
      },
    },
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests: styleRequests }),
  }).catch((err) => {
    console.warn('Styling batchUpdate notice:', err);
  });

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
}

/**
 * Appends a new attendance record row directly to Google Sheets
 */
export async function appendAttendanceToGoogleSheet(
  spreadsheetId: string,
  record: AttendanceRecord
): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Требуется авторизация через Google');

  const d = new Date(record.date);
  const dayName = !isNaN(d.getTime())
    ? DAYS_OF_WEEK_NAMES[(d.getDay() === 0 ? 6 : d.getDay() - 1)]
    : '';

  const rowData = [
    '', // Will be filled or next sequence
    record.date,
    dayName,
    record.time,
    record.section,
    record.trainer,
    record.studentName,
    statusRu[record.status] || record.status,
    record.paymentType,
    record.notes || '',
  ];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Журнал посещаемости'!A:J:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowData],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Не удалось добавить запись в Google Таблицу');
  }
}

/**
 * Full sync: Updates the entire "Журнал посещаемости" sheet with all current records
 */
export async function syncAllAttendanceToGoogleSheet(
  spreadsheetId: string,
  records: AttendanceRecord[]
): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Требуется авторизация через Google');

  const attendanceRows: (string | number)[][] = [
    [
      '№',
      'Дата',
      'День недели',
      'Время',
      'Секция',
      'Тренер',
      'ФИО посетителя (спортсмена)',
      'Статус явки',
      'Оплата / Абонемент',
      'Заметки',
    ],
  ];

  records.forEach((rec, idx) => {
    const d = new Date(rec.date);
    const dayName = !isNaN(d.getTime())
      ? DAYS_OF_WEEK_NAMES[(d.getDay() === 0 ? 6 : d.getDay() - 1)]
      : '';
    attendanceRows.push([
      idx + 1,
      rec.date,
      dayName,
      rec.time,
      rec.section,
      rec.trainer,
      rec.studentName,
      statusRu[rec.status] || rec.status,
      rec.paymentType,
      rec.notes || '',
    ]);
  });

  // Clear existing values in attendance sheet
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Журнал посещаемости'!A1:J500:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  ).catch((e) => console.warn('Clear notice:', e));

  // Write updated data
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Журнал посещаемости'!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: attendanceRows,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Не удалось синхронизировать записи с Google Таблицей');
  }
}
