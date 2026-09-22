import { SocialCategory, Student, DayAttendance, CategoryBreakdown } from '../types';

export interface CategoryMeta {
  id: SocialCategory;
  nameGu: string;
  shortGu: string;
  nameEn: string;
  colorBg: string;
  colorText: string;
  badgeBg: string;
}

export const CATEGORY_CONFIGS: Record<SocialCategory, CategoryMeta> = {
  sc: {
    id: 'sc',
    nameGu: 'અનુસૂચિત જાતિ (અ.જા. / SC)',
    shortGu: 'અ.જા.',
    nameEn: 'SC',
    colorBg: 'bg-purple-50',
    colorText: 'text-purple-700',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  st: {
    id: 'st',
    nameGu: 'અનુસૂચિત જનજાતિ (અ.જ.જા. / ST)',
    shortGu: 'અ.જ.જા.',
    nameEn: 'ST',
    colorBg: 'bg-amber-50',
    colorText: 'text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  sebc: {
    id: 'sebc',
    nameGu: 'સા.શૈ.પ. વર્ગ (બક્ષીપંચ / OBC)',
    shortGu: 'બક્ષીપંચ',
    nameEn: 'SEBC',
    colorBg: 'bg-teal-50',
    colorText: 'text-teal-700',
    badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  general: {
    id: 'general',
    nameGu: 'સામાન્ય વર્ગ (અન્ય / General)',
    shortGu: 'અન્ય',
    nameEn: 'General',
    colorBg: 'bg-blue-50',
    colorText: 'text-blue-700',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
  },
};

export const ALL_CATEGORIES: SocialCategory[] = ['sc', 'st', 'sebc', 'general'];

export function getStudentCategory(student: Student): SocialCategory {
  if (student.category && ALL_CATEGORIES.includes(student.category)) {
    return student.category;
  }
  // Fallback if legacy student without category
  const roll = student.rollNo;
  if (roll === 7 || roll === 11 || roll === 12) return 'sc';
  if (roll === 14 || roll === 15) return 'st';
  if (roll === 3 || roll === 6 || roll === 9 || roll === 10 || roll === 16) return 'sebc';
  return 'general';
}

export function computeCategoryBreakdown(
  students: Student[],
  attendance: DayAttendance
): Record<SocialCategory, CategoryBreakdown> {
  const result: Record<SocialCategory, CategoryBreakdown> = {
    sc: {
      labelGu: 'અનુસૂચિત જાતિ (અ.જા.)',
      shortGu: 'અ.જા.',
      labelEn: 'SC',
      boyTotal: 0,
      boyPresent: 0,
      boyAbsent: 0,
      boyLeave: 0,
      girlTotal: 0,
      girlPresent: 0,
      girlAbsent: 0,
      girlLeave: 0,
      total: 0,
      present: 0,
      absent: 0,
      leave: 0,
      percentage: 0,
    },
    st: {
      labelGu: 'અનુસૂચિત જનજાતિ (અ.જ.જા.)',
      shortGu: 'અ.જ.જા.',
      labelEn: 'ST',
      boyTotal: 0,
      boyPresent: 0,
      boyAbsent: 0,
      boyLeave: 0,
      girlTotal: 0,
      girlPresent: 0,
      girlAbsent: 0,
      girlLeave: 0,
      total: 0,
      present: 0,
      absent: 0,
      leave: 0,
      percentage: 0,
    },
    sebc: {
      labelGu: 'બક્ષીપંચ (SEBC/OBC)',
      shortGu: 'બક્ષીપંચ',
      labelEn: 'SEBC',
      boyTotal: 0,
      boyPresent: 0,
      boyAbsent: 0,
      boyLeave: 0,
      girlTotal: 0,
      girlPresent: 0,
      girlAbsent: 0,
      girlLeave: 0,
      total: 0,
      present: 0,
      absent: 0,
      leave: 0,
      percentage: 0,
    },
    general: {
      labelGu: 'અન્ય (સામાન્ય / General)',
      shortGu: 'અન્ય',
      labelEn: 'General',
      boyTotal: 0,
      boyPresent: 0,
      boyAbsent: 0,
      boyLeave: 0,
      girlTotal: 0,
      girlPresent: 0,
      girlAbsent: 0,
      girlLeave: 0,
      total: 0,
      present: 0,
      absent: 0,
      leave: 0,
      percentage: 0,
    },
  };

  students.forEach((s) => {
    const cat = getStudentCategory(s);
    const target = result[cat];
    const isBoy = s.gender === 'boy';
    const entry = attendance[s.id];
    const status = entry?.status || 'absent';

    target.total++;
    if (isBoy) target.boyTotal++;
    else target.girlTotal++;

    if (status === 'present') {
      target.present++;
      if (isBoy) target.boyPresent++;
      else target.girlPresent++;
    } else if (status === 'leave') {
      target.leave++;
      if (isBoy) target.boyLeave++;
      else target.girlLeave++;
    } else {
      target.absent++;
      if (isBoy) target.boyAbsent++;
      else target.girlAbsent++;
    }
  });

  // Calculate percentages
  ALL_CATEGORIES.forEach((cat) => {
    const item = result[cat];
    item.percentage = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
  });

  return result;
}
