import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Share2,
  Printer,
  UserPlus,
  RotateCcw,
  Search,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Phone,
  FileSpreadsheet,
  LockKeyhole,
  TrendingUp,
  BarChart3,
  Award,
} from 'lucide-react';
import { Student, DayAttendance, AttendanceStatus, SocialCategory, AttendanceDatabase } from '../types';
import {
  formatGujaratiDigits,
  formatDisplayDate,
  generateWhatsAppSummary,
  exportAttendanceToCSV,
} from '../utils/storage';
import {
  computeCategoryBreakdown,
  getStudentCategory,
  CATEGORY_CONFIGS,
  ALL_CATEGORIES
} from '../utils/categories';
import { MonthlyAttendanceSummaryView } from './MonthlyAttendanceSummaryView';
import { calculateMonthlyAttendance } from '../utils/monthlyAttendance';

interface TeacherDashboardProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  students: Student[];
  attendance: DayAttendance;
  allAttendance?: AttendanceDatabase;
  onUpdateStatus: (studentId: string, status: AttendanceStatus) => void;
  onMarkAll: (status: AttendanceStatus) => void;
  onResetDay: () => void;
  onOpenAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onResetToDefaultStudents: () => void;
  onOpenPrintSheet: () => void;
  onLockDashboard?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  selectedDate,
  onDateChange,
  students,
  attendance,
  allAttendance,
  onUpdateStatus,
  onMarkAll,
  onResetDay,
  onOpenAddStudent,
  onEditStudent,
  onDeleteStudent,
  onResetToDefaultStudents,
  onOpenPrintSheet,
  onLockDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'leave'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate current month's attendance percentage summary for quick glance
  const currentMonthSummary = useMemo(() => {
    try {
      const [y, m] = selectedDate.split('-').map(Number);
      return calculateMonthlyAttendance(students, allAttendance || {}, y, m);
    } catch {
      const now = new Date();
      return calculateMonthlyAttendance(students, allAttendance || {}, now.getFullYear(), now.getMonth() + 1);
    }
  }, [students, allAttendance, selectedDate]);

  const studentMonthlyMap = useMemo(() => {
    const map: Record<string, { percentage: number; tier: 'excellent' | 'average' | 'low'; presentDays: number; totalDays: number }> = {};
    currentMonthSummary.studentsSummary.forEach((item) => {
      map[item.student.id] = {
        percentage: item.percentage,
        tier: item.tier,
        presentDays: item.presentDays,
        totalDays: item.totalDays,
      };
    });
    return map;
  }, [currentMonthSummary]);

  // Date formatted
  const displayDate = useMemo(() => formatDisplayDate(selectedDate), [selectedDate]);

  // Navigate dates
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const now = new Date();
    onDateChange(now.toISOString().split('T')[0]);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = students.length;
    let present = 0;
    let absent = 0;
    let leave = 0;

    let boyTotal = 0;
    let boyPresent = 0;
    let boyAbsent = 0;
    let boyLeave = 0;

    let girlTotal = 0;
    let girlPresent = 0;
    let girlAbsent = 0;
    let girlLeave = 0;

    students.forEach((s) => {
      const entry = attendance[s.id];
      const isBoy = s.gender === 'boy';
      
      if (isBoy) boyTotal++;
      else girlTotal++;

      if (entry?.status === 'present') {
        present++;
        if (isBoy) boyPresent++;
        else girlPresent++;
      } else if (entry?.status === 'leave') {
        leave++;
        if (isBoy) boyLeave++;
        else girlLeave++;
      } else {
        absent++;
        if (isBoy) boyAbsent++;
        else girlAbsent++;
      }
    });

    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    const boyPercentage = boyTotal > 0 ? Math.round((boyPresent / boyTotal) * 100) : 0;
    const girlPercentage = girlTotal > 0 ? Math.round((girlPresent / girlTotal) * 100) : 0;

    return {
      total,
      present,
      absent,
      leave,
      percentage,
      boys: { total: boyTotal, present: boyPresent, absent: boyAbsent, leave: boyLeave, percentage: boyPercentage },
      girls: { total: girlTotal, present: girlPresent, absent: girlAbsent, leave: girlLeave, percentage: girlPercentage },
    };
  }, [students, attendance]);

  const categoryStats = useMemo(() => {
    return computeCategoryBreakdown(students, attendance);
  }, [students, attendance]);

  const [filterGender, setFilterGender] = useState<'all' | 'boy' | 'girl'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | SocialCategory>('all');

  // Filter students
  const filteredList = useMemo(() => {
    return students.filter((s) => {
      const entry = attendance[s.id];
      const status: AttendanceStatus = entry?.status || 'absent';

      if (filterStatus !== 'all' && status !== filterStatus) {
        return false;
      }

      if (filterGender !== 'all' && s.gender !== filterGender) {
        return false;
      }

      if (filterCategory !== 'all' && getStudentCategory(s) !== filterCategory) {
        return false;
      }

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      const rollMatch = s.rollNo.toString() === q || formatGujaratiDigits(s.rollNo) === q;
      const nameGuMatch = s.nameGu.toLowerCase().includes(q);
      const nameEnMatch = s.nameEn.toLowerCase().includes(q);
      return rollMatch || nameGuMatch || nameEnMatch;
    });
  }, [students, attendance, filterStatus, filterGender, filterCategory, searchTerm]);

  // Share to WhatsApp
  const handleWhatsAppShare = () => {
    const textEncoded = generateWhatsAppSummary(selectedDate, students, attendance);
    window.open(`https://api.whatsapp.com/send?text=${textEncoded}`, '_blank');
  };

  // Export CSV
  const handleCSVExport = () => {
    exportAttendanceToCSV(selectedDate, students, attendance);
  };

  return (
    <div className="space-y-6">
      {/* Teacher Dashboard View Tabs: Daily Attendance vs Monthly Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>દૈનિક હાજરી (Daily)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>માસિક હાજરી સારાંશ % (Monthly Summary)</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
              ટકાવારી
            </span>
          </button>
        </div>

        {onLockDashboard && (
          <button
            type="button"
            onClick={onLockDashboard}
            className="self-end sm:self-auto flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border border-rose-200 shadow-2xs hover:scale-102 active:scale-98"
            title="શિક્ષક ડેશબોર્ડ લોક કરો અને વિદ્યાર્થી મોડ પર પાછા જાઓ"
          >
            <LockKeyhole className="w-4 h-4 text-rose-600" />
            <span>ડેશબોર્ડ લોક કરો</span>
          </button>
        )}
      </div>

      {activeTab === 'monthly' ? (
        <MonthlyAttendanceSummaryView
          students={students}
          attendanceDb={allAttendance || {}}
          currentDateStr={selectedDate}
        />
      ) : (
        <>
          {/* Top Header: Date Switcher & Control Panel */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevDay}
              title="પાછલો દિવસ"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              title="આગલો દિવસ"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              આજ
            </button>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl">
            <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <div className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                {displayDate.gujarati}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {displayDate.english}
              </div>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="ml-2 text-xs border border-slate-300 rounded-lg p-1 bg-white cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons: Add student, WhatsApp, Print, CSV */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddStudent}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>વિદ્યાર્થી ઉમેરો</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            title="WhatsApp પર હાજરી રિપોર્ટ શેર કરો"
          >
            <Share2 className="w-4 h-4" />
            <span>વોટ્સએપ શેર</span>
          </button>

          <button
            type="button"
            onClick={handleCSVExport}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-slate-200"
            title="Excel/CSV ડાઉનલોડ"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>CSV ડાઉનલોડ</span>
          </button>

          <button
            type="button"
            onClick={onOpenPrintSheet}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-slate-200"
            title="હાજરી પત્રક પ્રિન્ટ / PDF"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>પત્રક પ્રિન્ટ</span>
          </button>

          {onLockDashboard && (
            <button
              type="button"
              onClick={onLockDashboard}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border border-rose-200 shadow-2xs hover:scale-102 active:scale-98"
              title="શિક્ષક ડેશબોર્ડ લોક કરો અને વિદ્યાર્થી મોડ પર પાછા જાઓ"
            >
              <LockKeyhole className="w-4 h-4 text-rose-600" />
              <span>ડેશબોર્ડ લોક કરો</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">કુલ વિદ્યાર્થીઓ</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {formatGujaratiDigits(stats.total)}
            </h3>
            <span className="text-[11px] text-slate-500">
              કુમાર {formatGujaratiDigits(stats.boys.total)} + કન્યા {formatGujaratiDigits(stats.girls.total)}
            </span>
          </div>
        </div>

        {/* Present */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-xs flex items-center gap-4 bg-emerald-50/30">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-800">હાજર સંખ્યા</p>
            <h3 className="text-2xl font-black text-emerald-900 mt-0.5">
              {formatGujaratiDigits(stats.present)}
            </h3>
            <span className="text-xs font-bold text-emerald-600">
              {formatGujaratiDigits(stats.percentage)}% હાજરી
            </span>
          </div>
        </div>

        {/* Absent */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-rose-200/80 shadow-xs flex items-center gap-4 bg-rose-50/30">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-800">ગેરહાજર સંખ્યા</p>
            <h3 className="text-2xl font-black text-rose-900 mt-0.5">
              {formatGujaratiDigits(stats.absent)}
            </h3>
            <span className="text-xs font-medium text-rose-600">
              {stats.total > 0 ? formatGujaratiDigits(Math.round((stats.absent / stats.total) * 100)) : '૦'}% ગેરહાજર
            </span>
          </div>
        </div>

        {/* Leave */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-xs flex items-center gap-4 bg-amber-50/30">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-800">રજા પર</p>
            <h3 className="text-2xl font-black text-amber-900 mt-0.5">
              {formatGujaratiDigits(stats.leave)}
            </h3>
            <span className="text-xs text-amber-600 font-medium">અરજી સાથે</span>
          </div>
        </div>
      </div>

      {/* Gender Breakdown: Dedicated Kumar and Kanya Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Kumar (Boys) Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-blue-200/80 bg-gradient-to-br from-blue-50/60 to-white/70 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">👦</span>
              <div>
                <h4 className="font-bold text-base text-blue-950">કુલ કુમાર (Boys)</h4>
                <p className="text-xs text-blue-600 font-semibold">
                  કુલ સંખ્યા: {formatGujaratiDigits(stats.boys.total)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-700">
                {formatGujaratiDigits(stats.boys.present)} / {formatGujaratiDigits(stats.boys.total)}
              </span>
              <p className="text-xs font-bold text-emerald-600">
                {formatGujaratiDigits(stats.boys.percentage)}% હાજર
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-blue-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-emerald-700 font-semibold">
                ✓ હાજર: {formatGujaratiDigits(stats.boys.present)}
              </span>
              <span className="text-rose-600 font-semibold">
                ✕ ગેરહાજર: {formatGujaratiDigits(stats.boys.absent)}
              </span>
              {stats.boys.leave > 0 && (
                <span className="text-amber-600 font-semibold">
                  📝 રજા: {formatGujaratiDigits(stats.boys.leave)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFilterGender(filterGender === 'boy' ? 'all' : 'boy')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer text-xs ${
                filterGender === 'boy'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              {filterGender === 'boy' ? 'બધા જુઓ' : 'માત્ર કુમાર જુઓ'}
            </button>
          </div>
        </div>

        {/* Kanya (Girls) Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-pink-200/80 bg-gradient-to-br from-pink-50/60 to-white/70 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">👧</span>
              <div>
                <h4 className="font-bold text-base text-pink-950">કુલ કન્યા (Girls)</h4>
                <p className="text-xs text-pink-600 font-semibold">
                  કુલ સંખ્યા: {formatGujaratiDigits(stats.girls.total)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-pink-700">
                {formatGujaratiDigits(stats.girls.present)} / {formatGujaratiDigits(stats.girls.total)}
              </span>
              <p className="text-xs font-bold text-emerald-600">
                {formatGujaratiDigits(stats.girls.percentage)}% હાજર
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-pink-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-emerald-700 font-semibold">
                ✓ હાજર: {formatGujaratiDigits(stats.girls.present)}
              </span>
              <span className="text-rose-600 font-semibold">
                ✕ ગેરહાજર: {formatGujaratiDigits(stats.girls.absent)}
              </span>
              {stats.girls.leave > 0 && (
                <span className="text-amber-600 font-semibold">
                  📝 રજા: {formatGujaratiDigits(stats.girls.leave)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFilterGender(filterGender === 'girl' ? 'all' : 'girl')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer text-xs ${
                filterGender === 'girl'
                  ? 'bg-pink-600 text-white'
                  : 'bg-pink-100 text-pink-800 hover:bg-pink-200'
              }`}
            >
              {filterGender === 'girl' ? 'બધા જુઓ' : 'માત્ર કન્યા જુઓ'}
            </button>
          </div>
        </div>
      </div>

      {/* Social Category Attendance Breakdown Card (SC, ST, SEBC/બક્ષીપંચ, અન્ય) */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span>કેટેગરીવાર હાજરી વિશ્લેષણ (SC / ST / બક્ષીપંચ / અન્ય)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              દરેક સામાજિક વર્ગમાં હાજર કુમાર, કન્યા, ગેરહાજર અને ટકાવારીની વિગતવાર માહિતી
            </p>
          </div>
          {filterCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline self-start sm:self-auto cursor-pointer"
            >
              કેટેગરી ફિલ્ટર હટાવો ({CATEGORY_CONFIGS[filterCategory].shortGu})
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3 rounded-l-xl">કેટેગરી (સામાજિક વર્ગ)</th>
                <th className="py-2.5 px-3 text-center">કુલ નોંધાયેલ</th>
                <th className="py-2.5 px-3 text-center bg-blue-50/70 text-blue-800">👦 હાજર કુમાર</th>
                <th className="py-2.5 px-3 text-center bg-pink-50/70 text-pink-800">👧 હાજર કન્યા</th>
                <th className="py-2.5 px-3 text-center bg-emerald-50/70 text-emerald-800 font-bold">✅ કુલ હાજર</th>
                <th className="py-2.5 px-3 text-center bg-rose-50/70 text-rose-800">❌ ગેરહાજર</th>
                <th className="py-2.5 px-3 text-center">📝 રજા</th>
                <th className="py-2.5 px-3 text-center">ટકાવારી (%)</th>
                <th className="py-2.5 px-3 text-right rounded-r-xl">ક્રિયા</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ALL_CATEGORIES.map((catKey) => {
                const row = categoryStats[catKey];
                const meta = CATEGORY_CONFIGS[catKey];
                const isSelected = filterCategory === catKey;

                return (
                  <tr
                    key={catKey}
                    className={`transition-colors hover:bg-slate-50 ${
                      isSelected ? 'bg-indigo-50/40 font-medium' : ''
                    }`}
                  >
                    {/* Category Name & Badge */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${meta.badgeBg}`}>
                          {meta.shortGu}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">{row.labelGu}</span>
                          <span className="text-[10px] text-slate-500">{meta.nameEn}</span>
                        </div>
                      </div>
                    </td>

                    {/* Total Registered (Boys / Girls / Total) */}
                    <td className="py-3 px-3 text-center text-slate-700">
                      <span className="font-bold text-slate-900">{formatGujaratiDigits(row.total)}</span>
                      <span className="text-[10px] text-slate-600 block">
                        (કુ. {formatGujaratiDigits(row.boyTotal)} | ક. {formatGujaratiDigits(row.girlTotal)})
                      </span>
                    </td>

                    {/* Present Boys */}
                    <td className="py-3 px-3 text-center bg-blue-50/40 font-bold text-blue-900">
                      <span>{formatGujaratiDigits(row.boyPresent)}</span>
                      <span className="text-[10px] text-blue-600 font-normal"> / {formatGujaratiDigits(row.boyTotal)}</span>
                    </td>

                    {/* Present Girls */}
                    <td className="py-3 px-3 text-center bg-pink-50/40 font-bold text-pink-900">
                      <span>{formatGujaratiDigits(row.girlPresent)}</span>
                      <span className="text-[10px] text-pink-600 font-normal"> / {formatGujaratiDigits(row.girlTotal)}</span>
                    </td>

                    {/* Total Present */}
                    <td className="py-3 px-3 text-center bg-emerald-50/40 font-bold text-emerald-700">
                      <span className="text-sm">{formatGujaratiDigits(row.present)}</span>
                      <span className="text-[10px] text-emerald-600 font-normal"> / {formatGujaratiDigits(row.total)}</span>
                    </td>

                    {/* Absent */}
                    <td className="py-3 px-3 text-center bg-rose-50/40 font-semibold text-rose-600">
                      {formatGujaratiDigits(row.absent)}
                    </td>

                    {/* Leave */}
                    <td className="py-3 px-3 text-center text-amber-600 font-semibold">
                      {formatGujaratiDigits(row.leave)}
                    </td>

                    {/* Attendance Percentage */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.percentage >= 80 ? 'bg-emerald-500' : row.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${row.percentage}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {formatGujaratiDigits(row.percentage)}%
                        </span>
                      </div>
                    </td>

                    {/* Filter Action */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setFilterCategory(isSelected ? 'all' : catKey)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'પસંદિત ✓' : 'વિદ્યાર્થી જુઓ'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Total Summary Row */}
              <tr className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-2.5 px-3">
                  <span className="text-xs">👥 કુલ સરવાળો (Total)</span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span>{formatGujaratiDigits(stats.total)}</span>
                  <span className="text-[10px] text-slate-600 block font-normal">
                    (કુ. {formatGujaratiDigits(stats.boys.total)} | ક. {formatGujaratiDigits(stats.girls.total)})
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center bg-blue-100/50 text-blue-950">
                  {formatGujaratiDigits(stats.boys.present)} / {formatGujaratiDigits(stats.boys.total)}
                </td>
                <td className="py-2.5 px-3 text-center bg-pink-100/50 text-pink-950">
                  {formatGujaratiDigits(stats.girls.present)} / {formatGujaratiDigits(stats.girls.total)}
                </td>
                <td className="py-2.5 px-3 text-center bg-emerald-100/50 text-emerald-900 text-sm">
                  {formatGujaratiDigits(stats.present)} / {formatGujaratiDigits(stats.total)}
                </td>
                <td className="py-2.5 px-3 text-center bg-rose-100/50 text-rose-700">
                  {formatGujaratiDigits(stats.absent)}
                </td>
                <td className="py-2.5 px-3 text-center text-amber-700">
                  {formatGujaratiDigits(stats.leave)}
                </td>
                <td className="py-2.5 px-3 text-center text-emerald-700 font-extrabold">
                  {formatGujaratiDigits(stats.percentage)}%
                </td>
                <td className="py-2.5 px-3 text-right">
                  {filterCategory !== 'all' ? (
                    <button
                      type="button"
                      onClick={() => setFilterCategory('all')}
                      className="px-2 py-1 rounded-lg text-[11px] bg-slate-200 text-slate-800 hover:bg-slate-300 cursor-pointer"
                    >
                      બધા
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-600 font-normal">બધા દર્શાવેલ</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Bulk Operations & Search Filter Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-slate-200/70 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick status & gender filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                બધા ({formatGujaratiDigits(stats.total)})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('present')}
                className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  filterStatus === 'present'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                હાજર ({formatGujaratiDigits(stats.present)})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('absent')}
                className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  filterStatus === 'absent'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                ગેરહાજર ({formatGujaratiDigits(stats.absent)})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('leave')}
                className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  filterStatus === 'leave'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                રજા ({formatGujaratiDigits(stats.leave)})
              </button>
            </div>

            {/* Gender Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterGender('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterGender === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                બંને જાતિ
              </button>
              <button
                type="button"
                onClick={() => setFilterGender('boy')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterGender === 'boy'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-blue-700 hover:bg-blue-100'
                }`}
              >
                👦 કુમાર ({formatGujaratiDigits(stats.boys.total)})
              </button>
              <button
                type="button"
                onClick={() => setFilterGender('girl')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterGender === 'girl'
                    ? 'bg-pink-600 text-white shadow-2xs'
                    : 'text-pink-700 hover:bg-pink-100'
                }`}
              >
                👧 કન્યા ({formatGujaratiDigits(stats.girls.total)})
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filterCategory === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                બધી કેટેગરી
              </button>
              {ALL_CATEGORIES.map((c) => {
                const meta = CATEGORY_CONFIGS[c];
                const isSelected = filterCategory === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFilterCategory(isSelected ? 'all' : c)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {meta.shortGu} ({formatGujaratiDigits(categoryStats[c].total)})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Batch Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onMarkAll('present')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>બધાને હાજર કરો</span>
            </button>

            <button
              type="button"
              onClick={onResetDay}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>આજની હાજરી રીસેટ</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="વિદ્યાર્થી શોધો (રોલ નંબર અથવા નામ)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/70 backdrop-blur-xs border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Detailed Attendance Student Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                <th className="py-3 px-4">રોલ નં.</th>
                <th className="py-3 px-4">વિદ્યાર્થી ફોટો અને નામ</th>
                <th className="py-3 px-4">જાતિ</th>
                <th className="py-3 px-4">કેટેગરી</th>
                <th className="py-3 px-3 text-center">માસિક ટકાવારી %</th>
                <th className="py-3 px-4">હાજરી સ્થિતિ (ક્લિક કરીને બદલો)</th>
                <th className="py-3 px-4">સમય</th>
                <th className="py-3 px-4 text-right">ક્રિયા</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((student) => {
                const entry = attendance[student.id];
                const currentStatus: AttendanceStatus = entry?.status || 'absent';
                const studentCat = getStudentCategory(student);
                const catMeta = CATEGORY_CONFIGS[studentCat];

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      currentStatus === 'present'
                        ? 'bg-emerald-50/30'
                        : currentStatus === 'leave'
                        ? 'bg-amber-50/20'
                        : ''
                    }`}
                  >
                    {/* Roll No */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                        {formatGujaratiDigits(student.rollNo)}
                      </span>
                    </td>

                    {/* Photo & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.photoUrl}
                          alt={student.nameGu}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs"
                        />
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {student.nameGu}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">
                            {student.nameEn}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.gender === 'boy'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-pink-50 text-pink-700 border border-pink-200'
                        }`}
                      >
                        {student.gender === 'boy' ? 'કુમાર' : 'કન્યા'}
                      </span>
                    </td>

                    {/* Social Category */}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${catMeta.badgeBg}`}>
                        {catMeta.shortGu}
                      </span>
                    </td>

                    {/* Monthly Attendance % */}
                    <td className="py-3 px-3 text-center">
                      {studentMonthlyMap[student.id] && studentMonthlyMap[student.id].totalDays > 0 ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab('monthly')}
                          title="માસિક હાજરી સારાંશ વિગતવાર જુઓ"
                          className="inline-flex flex-col items-center group cursor-pointer"
                        >
                          <span
                            className={`text-xs font-black ${
                              studentMonthlyMap[student.id].tier === 'excellent'
                                ? 'text-emerald-700'
                                : studentMonthlyMap[student.id].tier === 'average'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {formatGujaratiDigits(studentMonthlyMap[student.id].percentage)}%
                          </span>
                          <span className="text-[10px] text-slate-400 group-hover:text-blue-600 group-hover:underline">
                            {formatGujaratiDigits(studentMonthlyMap[student.id].presentDays)}/{formatGujaratiDigits(studentMonthlyMap[student.id].totalDays)} દિવસ
                          </span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    {/* Attendance Status Buttons */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(student.id, 'present')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          ✓ હાજર
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateStatus(student.id, 'absent')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          ✕ ગેરહાજર
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateStatus(student.id, 'leave')}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentStatus === 'leave'
                              ? 'bg-amber-600 text-white shadow-xs scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          રજા
                        </button>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {entry?.timestamp ? (
                        <div className="flex items-center gap-1 text-emerald-700 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(entry.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Action buttons (Edit, Delete, Call) */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {student.parentPhone && (
                          <a
                            href={`tel:${student.parentPhone}`}
                            title={`વાલીને કોલ કરો: ${student.parentPhone}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onEditStudent(student)}
                          title="વિદ્યાર્થી ફેરફાર કરો"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteStudent(student.id)}
                          title={`${student.nameGu} ને કાઢી નાખો (Delete Student)`}
                          aria-label={`${student.nameGu} ને યાદીમાંથી કાઢી નાખો`}
                          className="p-1.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredList.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              કોઈ વિદ્યાર્થી મળ્યા નથી.
            </div>
          )}
        </div>

        {/* Footer info & restore roster */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>કુલ દર્શાવેલ: {formatGujaratiDigits(filteredList.length)} વિદ્યાર્થીઓ</span>
          <button
            type="button"
            onClick={onResetToDefaultStudents}
            className="text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer"
          >
            મૂળ ધોરણ ૭ વિદ્યાર્થી યાદી પુનઃસ્થાપિત કરો (Reset to Default Class 7 Roster)
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
