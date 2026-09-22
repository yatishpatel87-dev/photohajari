import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  AlertTriangle,
  Users,
  Search,
  Share2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  CheckCheck
} from 'lucide-react';
import { Student, AttendanceDatabase } from '../types';
import {
  calculateMonthlyAttendance,
  GUJARATI_MONTHS,
  ENGLISH_MONTHS,
  exportMonthlySummaryToCSV,
  generateMonthlyWhatsAppSummary,
  StudentMonthlySummary,
} from '../utils/monthlyAttendance';
import { formatGujaratiDigits } from '../utils/storage';
import { getStudentCategory, CATEGORY_CONFIGS, ALL_CATEGORIES } from '../utils/categories';
import { SCHOOL_INFO } from '../utils/schoolConfig';

interface MonthlyAttendanceSummaryViewProps {
  students: Student[];
  attendanceDb: AttendanceDatabase;
  currentDateStr: string;
}

export const MonthlyAttendanceSummaryView: React.FC<MonthlyAttendanceSummaryViewProps> = ({
  students,
  attendanceDb,
  currentDateStr,
}) => {
  // Parse year & month from currentDateStr (YYYY-MM-DD)
  const initialDate = useMemo(() => {
    try {
      const [y, m] = currentDateStr.split('-').map(Number);
      return { year: y || new Date().getFullYear(), month: m || new Date().getMonth() + 1 };
    } catch {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
  }, [currentDateStr]);

  const [selectedYear, setSelectedYear] = useState<number>(initialDate.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialDate.month); // 1-12

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'excellent' | 'average' | 'low'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentMonthlySummary | null>(null);

  // Calculate summary for selected month
  const monthlySummary = useMemo(() => {
    return calculateMonthlyAttendance(students, attendanceDb, selectedYear, selectedMonth);
  }, [students, attendanceDb, selectedYear, selectedMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const text = generateMonthlyWhatsAppSummary(monthlySummary);
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  // CSV Export
  const handleCSVExport = () => {
    exportMonthlySummaryToCSV(monthlySummary);
  };

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return monthlySummary.studentsSummary.filter((item) => {
      // Tier filter
      if (tierFilter !== 'all' && item.tier !== tierFilter) {
        return false;
      }

      // Gender filter
      if (genderFilter !== 'all' && item.student.gender !== genderFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const cat = getStudentCategory(item.student);
        if (cat !== categoryFilter) return false;
      }

      // Search term (Roll number, Gujarati name, or English name)
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        const rollMatch = item.student.rollNo.toString().includes(term);
        const nameGuMatch = item.student.nameGu.toLowerCase().includes(term);
        const nameEnMatch = item.student.nameEn.toLowerCase().includes(term);
        if (!rollMatch && !nameGuMatch && !nameEnMatch) {
          return false;
        }
      }

      return true;
    });
  }, [monthlySummary, tierFilter, genderFilter, categoryFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Month Navigation & Action Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-slate-200/70 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Month Selector Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="પાછલો મહિનો"
              className="p-2 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              title="આગલો મહિનો"
              className="p-2 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="px-3 py-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              ચાલુ માસ
            </button>
          </div>

          {/* Month / Year Display & Selectors */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
            <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <div className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                {monthlySummary.monthNameGu} {formatGujaratiDigits(selectedYear)}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {monthlySummary.monthNameEn} {selectedYear}
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-2.5">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                aria-label="મહિનો પસંદ કરો"
                className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {GUJARATI_MONTHS.map((mName, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="વર્ષ પસંદ કરો"
                className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Working Days Pill */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold shadow-2xs">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>
              નોંધાયેલા દિવસો: <strong>{formatGujaratiDigits(monthlySummary.totalSchoolDays)}</strong>
            </span>
          </div>
        </div>

        {/* Share & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            title="WhatsApp પર માસિક હાજરી સારાંશ મોકલો"
          >
            <Share2 className="w-4 h-4" />
            <span>માસિક વોટ્સએપ રિપોર્ટ</span>
          </button>

          <button
            type="button"
            onClick={handleCSVExport}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-slate-200"
            title="Excel/CSV ડાઉનલોડ"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV ડાઉનલોડ</span>
          </button>
        </div>
      </div>

      {/* 4 Monthly Highlight Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Class Average Percentage */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">સરેરાશ વર્ગ હાજરી</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatGujaratiDigits(monthlySummary.classAveragePercentage)}%
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              માસિક સરેરાશ દર
            </span>
          </div>
        </div>

        {/* Boys Monthly Average */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-blue-200/60 bg-gradient-to-br from-blue-50/40 to-white/70 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0 text-xl font-bold">
            👦
          </div>
          <div>
            <span className="text-xs font-bold text-blue-800 block">કુમાર સરેરાશ હાજરી</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-blue-900">
                {formatGujaratiDigits(monthlySummary.boyAveragePercentage)}%
              </span>
            </div>
            <span className="text-[11px] text-blue-600 font-semibold">
              કુલ {formatGujaratiDigits(students.filter((s) => s.gender === 'boy').length)} કુમાર
            </span>
          </div>
        </div>

        {/* Girls Monthly Average */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-pink-200/60 bg-gradient-to-br from-pink-50/40 to-white/70 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-100/80 text-pink-700 flex items-center justify-center shrink-0 text-xl font-bold">
            👧
          </div>
          <div>
            <span className="text-xs font-bold text-pink-800 block">કન્યા સરેરાશ હાજરી</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-pink-900">
                {formatGujaratiDigits(monthlySummary.girlAveragePercentage)}%
              </span>
            </div>
            <span className="text-[11px] text-pink-600 font-semibold">
              કુલ {formatGujaratiDigits(students.filter((s) => s.gender === 'girl').length)} કન્યા
            </span>
          </div>
        </div>

        {/* Attendance Benchmark / At Risk Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 block">હાજરી સ્તર વહેંચણી</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md">
                ⭐ {formatGujaratiDigits(monthlySummary.topAttendanceCount)} (≥85%)
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded-md">
                ⚠️ {formatGujaratiDigits(monthlySummary.lowAttendanceCount)} (&lt;75%)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
              ૭૫% એ સરકારી સહાય/શિષ્યવૃત્તિ લઘુત્તમ ધોરણ છે
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Students */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-slate-200/70 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tier Filters */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTierFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  tierFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                બધા સ્તર ({formatGujaratiDigits(students.length)})
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('excellent')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  tierFilter === 'excellent'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                🟢 ઉત્કૃષ્ટ ≥૮૫% ({formatGujaratiDigits(monthlySummary.topAttendanceCount)})
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('average')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  tierFilter === 'average'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-100'
                }`}
              >
                🟡 સામાન્ય ૭૫-૮૪% ({formatGujaratiDigits(monthlySummary.averageAttendanceCount)})
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('low')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  tierFilter === 'low'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-rose-800 hover:bg-rose-100'
                }`}
              >
                🔴 ઓછી હાજરી &lt;૭૫% ({formatGujaratiDigits(monthlySummary.lowAttendanceCount)})
              </button>
            </div>

            {/* Gender Filters */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setGenderFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  genderFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                બંને જાતિ
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('boy')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  genderFilter === 'boy' ? 'bg-blue-600 text-white shadow-2xs' : 'text-blue-700 hover:bg-blue-100'
                }`}
              >
                👦 કુમાર
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('girl')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  genderFilter === 'girl' ? 'bg-pink-600 text-white shadow-2xs' : 'text-pink-700 hover:bg-pink-100'
                }`}
              >
                👧 કન્યા
              </button>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  categoryFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                બધી કેટેગરી
              </button>
              {ALL_CATEGORIES.map((catKey) => {
                const meta = CATEGORY_CONFIGS[catKey];
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategoryFilter(categoryFilter === catKey ? 'all' : catKey)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      categoryFilter === catKey ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {meta.shortGu}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="વિદ્યાર્થી શોધો (રોલ નં., ગુજરાતી નામ અથવા English Name)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-xs border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Student Monthly Summary Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                <th className="py-3 px-3 sm:px-4">રોલ નં.</th>
                <th className="py-3 px-3 sm:px-4">વિદ્યાર્થી ફોટો અને નામ</th>
                <th className="py-3 px-2 sm:px-3 text-center">જાતિ</th>
                <th className="py-3 px-2 sm:px-3 text-center">કેટેગરી</th>
                <th className="py-3 px-2 sm:px-3 text-center">કુલ દિવસ</th>
                <th className="py-3 px-2 sm:px-3 text-center bg-emerald-50/60 text-emerald-800 font-bold">
                  હાજર દિવસ
                </th>
                <th className="py-3 px-2 sm:px-3 text-center bg-rose-50/60 text-rose-800">
                  ગેરહાજર
                </th>
                <th className="py-3 px-2 sm:px-3 text-center bg-amber-50/60 text-amber-800">
                  રજા
                </th>
                <th className="py-3 px-3 sm:px-4 text-center min-w-[140px]">
                  માસિક હાજરી ટકાવારી (%)
                </th>
                <th className="py-3 px-3 sm:px-4 text-right">સ્થિતિ / વિગત</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    શોધ મુજબ કોઈ વિદ્યાર્થી મળ્યા નથી.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item) => {
                  const cat = getStudentCategory(item.student);
                  const catMeta = CATEGORY_CONFIGS[cat];

                  const progressBarColor =
                    item.tier === 'excellent'
                      ? 'bg-emerald-500'
                      : item.tier === 'average'
                      ? 'bg-amber-500'
                      : 'bg-rose-500';

                  const badgeBg =
                    item.tier === 'excellent'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : item.tier === 'average'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300';

                  const tierText =
                    item.tier === 'excellent'
                      ? 'ઉત્કૃષ્ટ'
                      : item.tier === 'average'
                      ? 'સામાન્ય'
                      : 'ધ્યાનપાત્ર';

                  return (
                    <tr
                      key={item.student.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Roll No */}
                      <td className="py-3 px-3 sm:px-4 font-bold text-slate-900">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                          {formatGujaratiDigits(item.student.rollNo)}
                        </span>
                      </td>

                      {/* Photo & Name */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.student.photoUrl}
                            alt={item.student.nameGu}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">
                              {item.student.nameGu}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {item.student.nameEn}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-2 sm:px-3 text-center">
                        <span
                          className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            item.student.gender === 'boy'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {item.student.gender === 'boy' ? 'કુમાર' : 'કન્યા'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-2 sm:px-3 text-center">
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${catMeta.badgeBg}`}
                        >
                          {catMeta.shortGu}
                        </span>
                      </td>

                      {/* Total Days */}
                      <td className="py-3 px-2 sm:px-3 text-center font-bold text-slate-700">
                        {formatGujaratiDigits(item.totalDays)}
                      </td>

                      {/* Present Days */}
                      <td className="py-3 px-2 sm:px-3 text-center font-black text-emerald-700 bg-emerald-50/40">
                        {formatGujaratiDigits(item.presentDays)}
                      </td>

                      {/* Absent Days */}
                      <td className="py-3 px-2 sm:px-3 text-center font-bold text-rose-600 bg-rose-50/40">
                        {formatGujaratiDigits(item.absentDays)}
                      </td>

                      {/* Leave Days */}
                      <td className="py-3 px-2 sm:px-3 text-center font-bold text-amber-600 bg-amber-50/40">
                        {formatGujaratiDigits(item.leaveDays)}
                      </td>

                      {/* Percentage Bar & Number */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span
                              className={
                                item.tier === 'excellent'
                                  ? 'text-emerald-700'
                                  : item.tier === 'average'
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }
                            >
                              {formatGujaratiDigits(item.percentage)}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {formatGujaratiDigits(item.presentDays)}/{formatGujaratiDigits(item.totalDays)} દિવસ
                            </span>
                          </div>
                          {/* Visual progress bar */}
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
                              style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Tier Badge & Details Button */}
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}
                          >
                            {tierText}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForDetail(item)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="તારીખવાર વિગતવાર હાજરી જુઓ"
                          >
                            વિગત
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total / Class Average Row at bottom of table */}
            {filteredStudents.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td className="py-3 px-3 sm:px-4" colSpan={4}>
                    <span>👥 વર્ગ માસિક સરેરાશ (Class Monthly Average)</span>
                  </td>
                  <td className="py-3 px-2 sm:px-3 text-center">
                    {formatGujaratiDigits(monthlySummary.totalSchoolDays)}
                  </td>
                  <td className="py-3 px-2 sm:px-3 text-center text-emerald-800 bg-emerald-100/40">
                    -
                  </td>
                  <td className="py-3 px-2 sm:px-3 text-center text-rose-800 bg-rose-100/40">
                    -
                  </td>
                  <td className="py-3 px-2 sm:px-3 text-center text-amber-800 bg-amber-100/40">
                    -
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-center">
                    <span className="text-base font-black text-blue-900">
                      {formatGujaratiDigits(monthlySummary.classAveragePercentage)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-right text-xs font-semibold text-slate-600">
                    કુલ {formatGujaratiDigits(filteredStudents.length)} વિદ્યાર્થી
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Student Daily History Breakdown Dialog / Modal */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudentForDetail.student.photoUrl}
                  alt={selectedStudentForDetail.student.nameGu}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-tight">
                    {selectedStudentForDetail.student.nameGu}
                  </h4>
                  <p className="text-xs text-slate-500">
                    રોલ નં: {formatGujaratiDigits(selectedStudentForDetail.student.rollNo)} •{' '}
                    {selectedStudentForDetail.student.nameEn}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Percentage Summary Bar */}
            <div className="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">માસિક ટકાવારી</span>
                <span className="text-xl font-black text-slate-900">
                  {formatGujaratiDigits(selectedStudentForDetail.percentage)}%
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                  ✓ હાજર: {formatGujaratiDigits(selectedStudentForDetail.presentDays)}
                </span>
                <span className="text-rose-700 bg-rose-100 px-2 py-1 rounded-lg">
                  ✕ ગેરહાજર: {formatGujaratiDigits(selectedStudentForDetail.absentDays)}
                </span>
                {selectedStudentForDetail.leaveDays > 0 && (
                  <span className="text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">
                    📝 રજા: {formatGujaratiDigits(selectedStudentForDetail.leaveDays)}
                  </span>
                )}
              </div>
            </div>

            {/* Date-by-date list */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                {monthlySummary.monthNameGu} {selectedYear} - તારીખવાર નોંધ:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {monthlySummary.recordedDates.map((dateStr) => {
                  const entry = attendanceDb[dateStr]?.[selectedStudentForDetail.student.id];
                  const status = entry?.status || 'absent';
                  const [y, m, d] = dateStr.split('-');

                  return (
                    <div
                      key={dateStr}
                      className={`flex items-center justify-between p-2 rounded-xl border ${
                        status === 'present'
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                          : status === 'leave'
                          ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                          : 'bg-rose-50/50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <span className="font-semibold">
                        {formatGujaratiDigits(Number(d))}/{formatGujaratiDigits(Number(m))}/{formatGujaratiDigits(Number(y))}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                          status === 'present'
                            ? 'bg-emerald-200/70 text-emerald-900'
                            : status === 'leave'
                            ? 'bg-amber-200/70 text-amber-900'
                            : 'bg-rose-200/70 text-rose-900'
                        }`}
                      >
                        {status === 'present' ? '✓ હાજર' : status === 'leave' ? '📝 રજા' : '✕ ગેરહાજર'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForDetail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                બંધ કરો
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
