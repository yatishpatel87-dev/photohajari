import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Volume2, VolumeX, CheckCircle2, AlertCircle, Sparkles, RotateCcw, Calendar } from 'lucide-react';
import { Student, DayAttendance } from '../types';
import { StudentCard } from './StudentCard';
import { formatGujaratiDigits, formatDisplayDate } from '../utils/storage';

interface StudentGridProps {
  students: Student[];
  attendance: DayAttendance;
  onToggleAttendance: (studentId: string) => void;
  voiceFeedback: boolean;
  onToggleVoice: () => void;
  onResetToday?: () => void;
  dateStr?: string;
}

type FilterMode = 'all' | 'unmarked' | 'present' | 'boys' | 'girls';

export const StudentGrid: React.FC<StudentGridProps> = ({
  students,
  attendance,
  onToggleAttendance,
  voiceFeedback,
  onToggleVoice,
  onResetToday,
  dateStr,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const displayDate = useMemo(() => {
    return dateStr ? formatDisplayDate(dateStr) : null;
  }, [dateStr]);

  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter(s => attendance[s.id]?.status === 'present').length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    const boys = students.filter(s => s.gender === 'boy');
    const girls = students.filter(s => s.gender === 'girl');

    const boysPresent = boys.filter(s => attendance[s.id]?.status === 'present').length;
    const girlsPresent = girls.filter(s => attendance[s.id]?.status === 'present').length;

    return {
      total,
      present,
      absent,
      percentage,
      boysTotal: boys.length,
      boysPresent,
      girlsTotal: girls.length,
      girlsPresent,
    };
  }, [students, attendance]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Filter by status or gender tab
      const isPresent = attendance[student.id]?.status === 'present';
      if (filterMode === 'present' && !isPresent) return false;
      if (filterMode === 'unmarked' && isPresent) return false;
      if (filterMode === 'boys' && student.gender !== 'boy') return false;
      if (filterMode === 'girls' && student.gender !== 'girl') return false;

      // Filter by search query (roll no or name in Gu/En)
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const rollMatch = student.rollNo.toString() === q || formatGujaratiDigits(student.rollNo) === q;
      const nameGuMatch = student.nameGu.toLowerCase().includes(q);
      const nameEnMatch = student.nameEn.toLowerCase().includes(q);
      return rollMatch || nameGuMatch || nameEnMatch;
    });
  }, [students, attendance, filterMode, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner for Students: Warm, inviting, clear instructions */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 rounded-3xl p-5 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mb-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>વિદ્યાર્થી ફોટો હાજરી • ધોરણ ૭</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              પોતાના ફોટા પર ક્લિક કરીને હાજરી પૂરો
            </h2>
            <p className="text-blue-100 text-sm sm:text-base mt-1">
              તમારો ફોટો શોધો અને તેના પર ટચ કરો. હાજર થતાં લીલો ખરો થશે!
            </p>

            {/* Kumar and Kanya Summary Pills in Banner */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-semibold">
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/15">
                <span>👦 કુલ કુમાર:</span>
                <strong className="text-amber-200">{formatGujaratiDigits(stats.boysTotal)}</strong>
                <span className="text-blue-200">({formatGujaratiDigits(stats.boysPresent)} હાજર)</span>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/15">
                <span>👧 કુલ કન્યા:</span>
                <strong className="text-amber-200">{formatGujaratiDigits(stats.girlsTotal)}</strong>
                <span className="text-blue-200">({formatGujaratiDigits(stats.girlsPresent)} હાજર)</span>
              </div>
            </div>
          </div>

          {/* Quick Attendance Live Progress Gauge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[240px]">
            <div className="flex items-center justify-between text-sm font-semibold mb-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-200" />
                <span>આજની હાજરી</span>
              </span>
              <span className="text-amber-300 font-bold text-base">
                {formatGujaratiDigits(stats.present)} / {formatGujaratiDigits(stats.total)}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${stats.percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-blue-100 mt-2">
              <span>{formatGujaratiDigits(stats.percentage)}% હાજર</span>
              <span>{formatGujaratiDigits(stats.absent)} બાકી</span>
            </div>

            {/* Daily Fresh Status & Quick Reset Button */}
            <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between gap-2 text-[11px]">
              {stats.present === 0 ? (
                <div className="flex items-center gap-1 text-emerald-300 font-bold">
                  <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                  <span>આજની નવી હાજરી માટે તૈયાર</span>
                </div>
              ) : (
                <div className="text-blue-100 font-medium">
                  {formatGujaratiDigits(stats.present)} વિદ્યાર્થી હાજર નોંધાયા
                </div>
              )}

              {onResetToday && (
                <button
                  type="button"
                  onClick={onResetToday}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold transition-all cursor-pointer border border-white/20 hover:scale-102"
                  title="આજની હાજરી ફરીથી નવી શરૂ કરો (રીસેટ)"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>નવી શરૂ કરો</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, and Voice Toggle */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200/70 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="student-search-input"
            type="text"
            placeholder="નામ અથવા રોલ નંબર શોધો..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-xs border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-200/80 w-5 h-5 rounded-full flex items-center justify-center"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            બધા ({formatGujaratiDigits(students.length)})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('boys')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              filterMode === 'boys'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <span>👦 કુમાર ({formatGujaratiDigits(stats.boysTotal)})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('girls')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              filterMode === 'girls'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'bg-pink-50 text-pink-800 hover:bg-pink-100'
            }`}
          >
            <span>👧 કન્યા ({formatGujaratiDigits(stats.girlsTotal)})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('unmarked')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'unmarked'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>બાકી ({formatGujaratiDigits(stats.absent)})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('present')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'present'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>હાજર ({formatGujaratiDigits(stats.present)})</span>
          </button>

          {/* Voice chime/speech toggle */}
          <button
            type="button"
            id="voice-toggle-btn"
            onClick={onToggleVoice}
            title={voiceFeedback ? 'અવાજ પ્રતિસાદ ચાલુ છે (Voice on)' : 'અવાજ પ્રતિસાદ બંધ છે (Voice off)'}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              voiceFeedback
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {voiceFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Grid of Student Photo Cards */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          <AnimatePresence>
            {filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                attendanceEntry={attendance[student.id]}
                onToggleAttendance={onToggleAttendance}
                voiceFeedbackEnabled={voiceFeedback}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">કોઈ વિદ્યાર્થી મળ્યા નથી</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            શોધ ફિલ્ટર બદલો અથવા બધા વિદ્યાર્થીઓ જુઓ.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterMode('all');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            બધા વિદ્યાર્થીઓ બતાવો
          </button>
        </div>
      )}
    </div>
  );
};
