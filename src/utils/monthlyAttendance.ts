import { Student, AttendanceDatabase, DayAttendance } from '../types';
import { SCHOOL_INFO } from './schoolConfig';
import { formatGujaratiDigits } from './storage';
import { getStudentCategory, CATEGORY_CONFIGS } from './categories';

export interface StudentMonthlySummary {
  student: Student;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  percentage: number;
  tier: 'excellent' | 'average' | 'low'; // >=85%, 75-84%, <75%
}

export interface ClassMonthlySummary {
  monthKey: string; // 'YYYY-MM'
  monthNumber: number; // 1-12
  year: number;
  monthNameGu: string;
  monthNameEn: string;
  totalSchoolDays: number;
  recordedDates: string[]; // YYYY-MM-DD
  classAveragePercentage: number;
  boyAveragePercentage: number;
  girlAveragePercentage: number;
  topAttendanceCount: number; // >= 85%
  averageAttendanceCount: number; // 75-84%
  lowAttendanceCount: number; // < 75%
  studentsSummary: StudentMonthlySummary[];
}

export const GUJARATI_MONTHS = [
  'જાન્યુઆરી',
  'ફેબ્રુઆરી',
  'માર્ચ',
  'એપ્રિલ',
  'મે',
  'જૂન',
  'જુલાઈ',
  'ઓગસ્ટ',
  'સપ્ટેમ્બર',
  'ઓક્ટોબર',
  'નવેમ્બર',
  'ડિસેમ્બર',
];

export const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Calculates monthly attendance percentage for each student and overall class stats
 */
export function calculateMonthlyAttendance(
  students: Student[],
  attendanceDb: AttendanceDatabase,
  year: number,
  month: number // 1 to 12
): ClassMonthlySummary {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthNameGu = GUJARATI_MONTHS[month - 1] || '';
  const monthNameEn = ENGLISH_MONTHS[month - 1] || '';

  // Find all recorded dates for this month
  const recordedDates = Object.keys(attendanceDb)
    .filter((d) => d.startsWith(monthKey))
    .sort();

  const totalSchoolDays = recordedDates.length;

  if (totalSchoolDays === 0) {
    const emptyStudentsSummary: StudentMonthlySummary[] = students.map((s) => ({
      student: s,
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      percentage: 0,
      tier: 'low',
    }));

    return {
      monthKey,
      monthNumber: month,
      year,
      monthNameGu,
      monthNameEn,
      totalSchoolDays: 0,
      recordedDates: [],
      classAveragePercentage: 0,
      boyAveragePercentage: 0,
      girlAveragePercentage: 0,
      topAttendanceCount: 0,
      averageAttendanceCount: 0,
      lowAttendanceCount: 0,
      studentsSummary: emptyStudentsSummary,
    };
  }

  // Calculate per student
  let totalPercentageSum = 0;
  let boyPercentageSum = 0;
  let boyCount = 0;
  let girlPercentageSum = 0;
  let girlCount = 0;

  let topAttendanceCount = 0;
  let averageAttendanceCount = 0;
  let lowAttendanceCount = 0;

  const studentsSummary: StudentMonthlySummary[] = students.map((student) => {
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;

    recordedDates.forEach((date) => {
      const dayRecord = attendanceDb[date];
      const entry = dayRecord?.[student.id];

      if (entry?.status === 'present') {
        presentDays++;
      } else if (entry?.status === 'leave') {
        leaveDays++;
      } else {
        absentDays++;
      }
    });

    const rawPercentage = (presentDays / totalSchoolDays) * 100;
    const percentage = Math.round(rawPercentage * 10) / 10;

    let tier: 'excellent' | 'average' | 'low' = 'low';
    if (percentage >= 85) {
      tier = 'excellent';
      topAttendanceCount++;
    } else if (percentage >= 75) {
      tier = 'average';
      averageAttendanceCount++;
    } else {
      tier = 'low';
      lowAttendanceCount++;
    }

    totalPercentageSum += percentage;

    if (student.gender === 'boy') {
      boyPercentageSum += percentage;
      boyCount++;
    } else {
      girlPercentageSum += percentage;
      girlCount++;
    }

    return {
      student,
      totalDays: totalSchoolDays,
      presentDays,
      absentDays,
      leaveDays,
      percentage,
      tier,
    };
  });

  const classAveragePercentage =
    students.length > 0
      ? Math.round((totalPercentageSum / students.length) * 10) / 10
      : 0;

  const boyAveragePercentage =
    boyCount > 0 ? Math.round((boyPercentageSum / boyCount) * 10) / 10 : 0;

  const girlAveragePercentage =
    girlCount > 0 ? Math.round((girlPercentageSum / girlCount) * 10) / 10 : 0;

  return {
    monthKey,
    monthNumber: month,
    year,
    monthNameGu,
    monthNameEn,
    totalSchoolDays,
    recordedDates,
    classAveragePercentage,
    boyAveragePercentage,
    girlAveragePercentage,
    topAttendanceCount,
    averageAttendanceCount,
    lowAttendanceCount,
    studentsSummary,
  };
}

/**
 * Generate Sample / Realistic Attendance Data for a month if database is empty
 */
export function generateMonthSeedAttendance(
  students: Student[],
  year: number,
  month: number
): AttendanceDatabase {
  const seedDb: AttendanceDatabase = {};
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month - 1, day);
    // Skip Sundays (0)
    if (dateObj.getDay() === 0) continue;

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayRecord: DayAttendance = {};

    students.forEach((student, index) => {
      // Create realistic attendance profile based on student index
      // Most kids attend 80% to 100%, 1 or 2 kids occasional leave or absence
      const hash = (day * 13 + index * 7) % 100;
      let status: 'present' | 'absent' | 'leave' = 'present';

      if (index === 2 || index === 8) {
        // Average attendance student (~78%)
        if (hash < 18) status = 'absent';
        else if (hash < 24) status = 'leave';
      } else if (index === 6) {
        // Lower attendance student (~68%)
        if (hash < 26) status = 'absent';
        else if (hash < 32) status = 'leave';
      } else {
        // High attendance students (88% to 100%)
        if (hash < 5) status = 'absent';
        else if (hash < 8) status = 'leave';
      }

      if (status === 'present') {
        const hour = 10;
        const minute = String(10 + (index % 45)).padStart(2, '0');
        dayRecord[student.id] = {
          status: 'present',
          timestamp: `${dateStr}T${hour}:${minute}:00.000Z`,
        };
      } else if (status === 'leave') {
        dayRecord[student.id] = {
          status: 'leave',
          timestamp: `${dateStr}T10:00:00.000Z`,
        };
      }
    });

    seedDb[dateStr] = dayRecord;
  }

  return seedDb;
}

/**
 * Export Monthly Attendance Summary to CSV / Excel
 */
export function exportMonthlySummaryToCSV(summary: ClassMonthlySummary) {
  const headers = [
    'રોલ નં. (Roll No)',
    'વિદ્યાર્થીનું નામ (Name Gu)',
    'Student Name (En)',
    'જાતિ (Gender)',
    'કેટેગરી (Category)',
    'કુલ શાળા દિવસો (Total Days)',
    'હાજર દિવસો (Present Days)',
    'ગેરહાજર દિવસો (Absent Days)',
    'રજા દિવસો (Leave Days)',
    'હાજરી ટકાવારી (%)',
    'સ્થિતિ (Status/Tier)',
  ];

  const rows = summary.studentsSummary.map((item) => {
    const cat = getStudentCategory(item.student);
    const catMeta = CATEGORY_CONFIGS[cat];
    const tierText =
      item.tier === 'excellent'
        ? 'ઉત્કૃષ્ટ (>=85%)'
        : item.tier === 'average'
        ? 'સામાન્ય (75-84%)'
        : 'ઓછી હાજરી (<75%)';

    return [
      item.student.rollNo,
      `"${item.student.nameGu}"`,
      `"${item.student.nameEn}"`,
      item.student.gender === 'boy' ? 'કુમાર' : 'કન્યા',
      `"${catMeta.nameGu}"`,
      item.totalDays,
      item.presentDays,
      item.absentDays,
      item.leaveDays,
      `${item.percentage}%`,
      `"${tierText}"`,
    ].join(',');
  });

  const metaLines = [
    `"${SCHOOL_INFO.nameEn} (${SCHOOL_INFO.nameGu})"`,
    `"${SCHOOL_INFO.locationEn} • DISE CODE: ${SCHOOL_INFO.diseCode}"`,
    `"માસિક હાજરી ટકાવારી પત્રક - માસ: ${summary.monthNameGu} ${summary.year} (${summary.monthNameEn} ${summary.year}) - ધોરણ ૭"`,
    `"કુલ શાળા દિવસો: ${summary.totalSchoolDays} • સરેરાશ વર્ગ હાજરી: ${summary.classAveragePercentage}% • કુમાર સરેરાશ: ${summary.boyAveragePercentage}% • કન્યા સરેરાશ: ${summary.girlAveragePercentage}%"`,
    '',
  ];

  const summaryFooter = [
    '',
    `"કુલ વિદ્યાર્થી: ${summary.studentsSummary.length}"`,
    `"૮૫% થી વધુ હાજરી (ઉત્કૃષ્ટ): ${summary.topAttendanceCount} વિદ્યાર્થી"`,
    `"૭૫% થી ૮૪% હાજરી (સામાન્ય): ${summary.averageAttendanceCount} વિદ્યાર્થી"`,
    `"૭૫% થી ઓછી હાજરી (ધ્યાનપાત્ર): ${summary.lowAttendanceCount} વિદ્યાર્થી"`,
  ];

  const csvContent =
    '\uFEFF' +
    [...metaLines, headers.join(','), ...rows, ...summaryFooter].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute(
    'download',
    `Bhikhapura-Dhoran-7-Monthly-${summary.monthKey}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate WhatsApp Monthly Report Summary
 */
export function generateMonthlyWhatsAppSummary(summary: ClassMonthlySummary): string {
  let text = `🏫 *${SCHOOL_INFO.nameEn}*\n`;
  text += `📍 ${SCHOOL_INFO.locationEn} | DISE: ${SCHOOL_INFO.diseCode}\n`;
  text += `📊 *ધોરણ ૭ માસિક હાજરી ટકાવારી રિપોર્ટ*\n`;
  text += `🗓️ *માસ:* ${summary.monthNameGu} ${formatGujaratiDigits(summary.year)} (${summary.monthNameEn} ${summary.year})\n`;
  text += `📅 *કુલ શાળા દિવસો:* ${formatGujaratiDigits(summary.totalSchoolDays)}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📈 *સરેરાશ વર્ગ હાજરી:* *${formatGujaratiDigits(summary.classAveragePercentage)}%*\n`;
  text += `👦 *કુમાર સરેરાશ:* ${formatGujaratiDigits(summary.boyAveragePercentage)}%\n`;
  text += `👧 *કન્યા સરેરાશ:* ${formatGujaratiDigits(summary.girlAveragePercentage)}%\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🌟 *૮૫% થી વધુ (ઉત્કૃષ્ટ):* ${formatGujaratiDigits(summary.topAttendanceCount)} વિદ્યાર્થી\n`;
  text += `⚠️ *૭૫% થી ઓછી હાજરી:* ${formatGujaratiDigits(summary.lowAttendanceCount)} વિદ્યાર્થી\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📋 *વિદ્યાર્થીવાર ટકાવારી સારાંશ:*\n`;

  summary.studentsSummary.forEach((s) => {
    const icon = s.tier === 'excellent' ? '🟢' : s.tier === 'average' ? '🟡' : '🔴';
    text += `${icon} *${formatGujaratiDigits(s.student.rollNo)}.* ${s.student.nameGu} - *${formatGujaratiDigits(s.percentage)}%* (${formatGujaratiDigits(s.presentDays)}/${formatGujaratiDigits(s.totalDays)})\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `_ડિજિટલ ફોટો હાજરી પ્રણાલી દ્વારા સંકલિત_`;

  return text;
}
