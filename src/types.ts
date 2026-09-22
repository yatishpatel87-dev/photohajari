export type AttendanceStatus = 'present' | 'absent' | 'leave';

export type SocialCategory = 'sc' | 'st' | 'sebc' | 'general';

export interface Student {
  id: string;
  rollNo: number;
  nameGu: string;
  nameEn: string;
  gender: 'boy' | 'girl';
  category: SocialCategory; // 'sc' (અ.જા.), 'st' (અ.જ.જા.), 'sebc' (બક્ષીપંચ), 'general' (અન્ય)
  photoUrl: string;
  parentPhone?: string;
}

export interface AttendanceEntry {
  status: AttendanceStatus;
  timestamp: string; // ISO string or time string
}

// Record mapping studentId to AttendanceEntry for a specific date (YYYY-MM-DD)
export type DayAttendance = Record<string, AttendanceEntry>;

// Record of all dates
export type AttendanceDatabase = Record<string, DayAttendance>;

export interface CategoryBreakdown {
  labelGu: string;
  shortGu: string;
  labelEn: string;
  boyTotal: number;
  boyPresent: number;
  boyAbsent: number;
  boyLeave: number;
  girlTotal: number;
  girlPresent: number;
  girlAbsent: number;
  girlLeave: number;
  total: number;
  present: number;
  absent: number;
  leave: number;
  percentage: number;
}

export interface ClassStats {
  total: number;
  present: number;
  absent: number;
  leave: number;
  percentage: number;
}
