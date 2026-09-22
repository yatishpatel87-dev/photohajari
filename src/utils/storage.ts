import { Student, AttendanceDatabase, DayAttendance } from '../types';
import { DEFAULT_STUDENTS } from '../data/defaultStudents';
import { computeCategoryBreakdown, getStudentCategory, CATEGORY_CONFIGS } from './categories';
import { SCHOOL_INFO } from './schoolConfig';
import { generateMonthSeedAttendance } from './monthlyAttendance';

const STUDENTS_KEY = 'dhoran_7_students_v1';
const ATTENDANCE_KEY = 'dhoran_7_attendance_v1';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatGujaratiDigits(num: number | string): string {
  const gujaratiDigits = ['૦', '૧', '૨', '૩', '૪', '૫', '૬', '૭', '૮', '૯'];
  return String(num).replace(/[0-9]/g, (digit) => gujaratiDigits[parseInt(digit, 10)]);
}

export function formatDisplayDate(dateStr: string): { gujarati: string; english: string } {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const gujaratiMonths = [
      'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
      'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
    ];
    const gujaratiDays = [
      'રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર'
    ];

    const dayNameGu = gujaratiDays[date.getDay()];
    const monthNameGu = gujaratiMonths[date.getMonth()];
    const guDate = `${formatGujaratiDigits(day)} ${monthNameGu} ${formatGujaratiDigits(year)}, ${dayNameGu}`;
    
    const enDate = date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return { gujarati: guDate, english: enDate };
  } catch {
    return { gujarati: dateStr, english: dateStr };
  }
}

export function loadStudents(): Student[] {
  if (typeof window === 'undefined') return DEFAULT_STUDENTS;
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (!raw) {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(DEFAULT_STUDENTS));
      return DEFAULT_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all students have valid category
      return parsed.map((s: Student) => ({
        ...s,
        category: getStudentCategory(s),
      }));
    }
    return DEFAULT_STUDENTS;
  } catch (e) {
    console.error('Failed to load students:', e);
    return DEFAULT_STUDENTS;
  }
}

export function saveStudents(students: Student[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students:', e);
  }
}

export function loadAllAttendance(): AttendanceDatabase {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    if (!raw) {
      const now = new Date();
      const initialDb = generateMonthSeedAttendance(DEFAULT_STUDENTS, now.getFullYear(), now.getMonth() + 1);
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(initialDb));
      return initialDb;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || Object.keys(parsed).length === 0) {
      const now = new Date();
      const initialDb = generateMonthSeedAttendance(DEFAULT_STUDENTS, now.getFullYear(), now.getMonth() + 1);
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(initialDb));
      return initialDb;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load attendance:', e);
    return {};
  }
}

export function saveDayAttendance(dateStr: string, dayAttendance: DayAttendance) {
  if (typeof window === 'undefined') return;
  try {
    const all = loadAllAttendance();
    all[dateStr] = dayAttendance;
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Failed to save day attendance:', e);
  }
}

export function generateWhatsAppSummary(dateStr: string, students: Student[], attendance: DayAttendance): string {
  const { gujarati } = formatDisplayDate(dateStr);
  const total = students.length;
  
  const boys = students.filter(s => s.gender === 'boy');
  const girls = students.filter(s => s.gender === 'girl');

  const presentBoys = boys.filter(s => attendance[s.id]?.status === 'present');
  const presentGirls = girls.filter(s => attendance[s.id]?.status === 'present');

  const presentStudents = students.filter(s => attendance[s.id]?.status === 'present');
  const absentStudents = students.filter(s => !attendance[s.id] || attendance[s.id]?.status === 'absent');
  const leaveStudents = students.filter(s => attendance[s.id]?.status === 'leave');

  const presentCount = presentStudents.length;
  const absentCount = absentStudents.length;
  const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  // Compute category breakdown
  const catBreakdown = computeCategoryBreakdown(students, attendance);

  let text = `🏫 *${SCHOOL_INFO.nameEn}*\n`;
  text += `📍 ${SCHOOL_INFO.locationEn} | DISE: ${SCHOOL_INFO.diseCode}\n`;
  text += `📚 *ધોરણ:* ૭ (Class 7) દૈનિક હાજરી રિપોર્ટ\n`;
  text += `📅 *તારીખ:* ${gujarati}\n`;
  text += `━━━━━━━━━━━━━━━━━\n`;
  text += `👦 *કુલ કુમાર:* હાજર ${presentBoys.length} / કુલ ${boys.length}\n`;
  text += `👧 *કુલ કન્યા:* હાજર ${presentGirls.length} / કુલ ${girls.length}\n`;
  text += `👥 *કુલ વિદ્યાર્થી:* હાજર ${presentCount} / કુલ ${total} (${percentage}%)\n`;
  text += `❌ *ગેરહાજર:* ${absentCount} | 📝 *રજા:* ${leaveStudents.length}\n`;
  text += `━━━━━━━━━━━━━━━━━\n`;
  text += `📋 *હાજર કુમાર-કન્યા કેટેગરીવાર (SC / ST / બક્ષી / અન્ય):*\n`;
  text += `• *અ.જા. (SC):* કુમાર ${catBreakdown.sc.boyPresent}/${catBreakdown.sc.boyTotal} | કન્યા ${catBreakdown.sc.girlPresent}/${catBreakdown.sc.girlTotal} → *હાજર: ${catBreakdown.sc.present}/${catBreakdown.sc.total}*\n`;
  text += `• *અ.જ.જા. (ST):* કુમાર ${catBreakdown.st.boyPresent}/${catBreakdown.st.boyTotal} | કન્યા ${catBreakdown.st.girlPresent}/${catBreakdown.st.girlTotal} → *હાજર: ${catBreakdown.st.present}/${catBreakdown.st.total}*\n`;
  text += `• *બક્ષીપંચ (SEBC):* કુમાર ${catBreakdown.sebc.boyPresent}/${catBreakdown.sebc.boyTotal} | કન્યા ${catBreakdown.sebc.girlPresent}/${catBreakdown.sebc.girlTotal} → *હાજર: ${catBreakdown.sebc.present}/${catBreakdown.sebc.total}*\n`;
  text += `• *અન્ય (General):* કુમાર ${catBreakdown.general.boyPresent}/${catBreakdown.general.boyTotal} | કન્યા ${catBreakdown.general.girlPresent}/${catBreakdown.general.girlTotal} → *હાજર: ${catBreakdown.general.present}/${catBreakdown.general.total}*\n`;
  text += `━━━━━━━━━━━━━━━━━\n`;

  if (absentStudents.length > 0) {
    text += `\n❌ *ગેરહાજર વિદ્યાર્થીઓની યાદી:*\n`;
    absentStudents.forEach((s, idx) => {
      const genderTag = s.gender === 'boy' ? 'કુમાર' : 'કન્યા';
      const catTag = CATEGORY_CONFIGS[getStudentCategory(s)].shortGu;
      text += `${idx + 1}. [રોલ ${s.rollNo}] ${s.nameGu} (${genderTag} • ${catTag})\n`;
    });
  }

  text += `\n_ધોરણ ૭ ફોટો હાજરી એપ્લિકેશન દ્વારા મોકલેલ_`;
  return encodeURIComponent(text);
}

export function exportAttendanceToCSV(dateStr: string, students: Student[], attendance: DayAttendance) {
  const headers = [
    'રોલ નંબર (Roll No)',
    'નામ ગુજરાતી (Name Gu)',
    'નામ અંગ્રેજી (Name En)',
    'જાતિ (Gender)',
    'કેટેગરી (Category)',
    'હાજરી સ્થિતિ (Status)',
    'સમય (Time)'
  ];
  
  const rows = students.map(student => {
    const entry = attendance[student.id];
    let statusText = 'ગેરહાજર (Absent)';
    let timeText = '-';
    if (entry?.status === 'present') {
      statusText = 'હાજર (Present)';
      timeText = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '-';
    } else if (entry?.status === 'leave') {
      statusText = 'રજા (Leave)';
    }

    const cat = getStudentCategory(student);
    const catText = CATEGORY_CONFIGS[cat].nameGu;
    const genderText = student.gender === 'boy' ? 'કુમાર (Boy)' : 'કન્યા (Girl)';

    return [
      student.rollNo,
      `"${student.nameGu}"`,
      `"${student.nameEn}"`,
      genderText,
      `"${catText}"`,
      statusText,
      timeText
    ].join(',');
  });

  const metaLines = [
    `"${SCHOOL_INFO.nameEn} (${SCHOOL_INFO.nameGu})"`,
    `"${SCHOOL_INFO.locationEn} • DISE CODE: ${SCHOOL_INFO.diseCode}"`,
    `"તારીખ: ${dateStr} - ધોરણ ૭ દૈનિક હાજરી પત્રક"`,
    ''
  ];

  const csvContent = '\uFEFF' + [...metaLines, headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Bhikhapura-Dhoran-7-Hajari-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
