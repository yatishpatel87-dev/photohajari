import React from 'react';
import { Camera, LayoutDashboard, Calendar, School, Sparkles, Lock, LockKeyhole } from 'lucide-react';
import { formatDisplayDate } from '../utils/storage';
import { SCHOOL_INFO } from '../utils/schoolConfig';

interface NavbarProps {
  currentView: 'student' | 'teacher';
  onViewChange: (view: 'student' | 'teacher') => void;
  selectedDate: string;
  isTeacherUnlocked?: boolean;
  onLockTeacher?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  selectedDate,
  isTeacherUnlocked = false,
  onLockTeacher,
}) => {
  const { gujarati } = formatDisplayDate(selectedDate);

  return (
    <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-slate-200/70 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.25rem] sm:min-h-[4.75rem] py-2 gap-2 sm:gap-3">
          {/* Logo & School Name */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <School className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 leading-tight tracking-tight">
                  {SCHOOL_INFO.nameEn}
                </h1>
                <span className="hidden xs:inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  {SCHOOL_INFO.standardGu}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] sm:text-xs text-slate-600 font-medium">
                <span className="text-slate-700 font-semibold">{SCHOOL_INFO.locationEn}</span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200 text-[10px] sm:text-[11px]">
                  DISE: {SCHOOL_INFO.diseCode}
                </span>
                <span className="text-slate-400 hidden lg:inline text-[11px]">
                  ({SCHOOL_INFO.nameGu})
                </span>
              </div>
            </div>
          </div>

          {/* Date pill on desktop */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 backdrop-blur-sm border border-slate-200/60 text-slate-700 text-xs font-semibold shadow-2xs shrink-0">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{gujarati}</span>
          </div>

          {/* View Mode Toggle: Student Mode vs Teacher Dashboard */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-slate-200/70 shadow-2xs">
              <button
                type="button"
                id="student-view-tab"
                onClick={() => onViewChange('student')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'student'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>વિદ્યાર્થી મોડ</span>
              </button>

              <button
                type="button"
                id="teacher-view-tab"
                onClick={() => onViewChange('teacher')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  currentView === 'teacher'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {currentView === 'teacher' ? (
                  <LayoutDashboard className="w-4 h-4" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>શિક્ષક ડેશબોર્ડ</span>
              </button>
            </div>

            {/* If currently in Teacher Dashboard and unlocked, allow one-click Lock */}
            {currentView === 'teacher' && onLockTeacher && (
              <button
                type="button"
                onClick={onLockTeacher}
                title="ડેશબોર્ડ લોક કરો અને વિદ્યાર્થી મોડમાં જાઓ"
                className="hidden sm:flex items-center gap-1 px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <LockKeyhole className="w-3.5 h-3.5" />
                <span>લોક કરો</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
