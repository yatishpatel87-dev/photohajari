import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Clock, User } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, AttendanceEntry } from '../types';
import { formatGujaratiDigits } from '../utils/storage';
import { playSuccessChime, playRemoveChime, speakStudentName } from '../utils/sound';

interface StudentCardProps {
  student: Student;
  attendanceEntry?: AttendanceEntry;
  onToggleAttendance: (studentId: string) => void;
  voiceFeedbackEnabled?: boolean;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  attendanceEntry,
  onToggleAttendance,
  voiceFeedbackEnabled = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const isPresent = attendanceEntry?.status === 'present';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    if (!isPresent) {
      // Fire confetti from student's card location!
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { x, y },
        colors: ['#10B981', '#059669', '#34D399', '#FBBF24', '#3B82F6'],
        disableForReducedMotion: true,
      });
      playSuccessChime();
      if (voiceFeedbackEnabled) {
        speakStudentName(student.nameGu, true);
      }
    } else {
      playRemoveChime();
      if (voiceFeedbackEnabled) {
        speakStudentName(student.nameGu, false);
      }
    }

    onToggleAttendance(student.id);
  };

  return (
    <motion.button
      type="button"
      id={`student-card-${student.id}`}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`group relative w-full text-left rounded-2xl overflow-hidden transition-all duration-300 border-2 cursor-pointer shadow-sm hover:shadow-md focus:outline-none focus:ring-4 ${
        isPresent
          ? 'bg-emerald-50/85 backdrop-blur-md border-emerald-500 ring-emerald-300'
          : 'bg-white/85 backdrop-blur-md border-slate-200/80 hover:border-blue-400 ring-blue-200'
      }`}
    >
      {/* Top Banner / Roll Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
        <span
          className={`inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-xl text-xs sm:text-sm shadow-sm transition-colors ${
            isPresent
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900/85 backdrop-blur-xs text-white group-hover:bg-blue-600'
          }`}
        >
          રોલ {formatGujaratiDigits(student.rollNo)}
        </span>
      </div>

      {/* Attendance Status Badge (Top Right) */}
      <div className="absolute top-2.5 right-2.5 z-10">
        {isPresent ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-emerald-600 text-white font-bold text-xs sm:text-sm px-2.5 py-1 rounded-xl shadow-md"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>હાજર</span>
          </motion.div>
        ) : (
          <div className="text-[11px] sm:text-xs font-medium text-slate-600 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs group-hover:text-blue-600 group-hover:border-blue-200">
            ક્લિક કરો
          </div>
        )}
      </div>

      {/* Student Photo */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        {!imageError && student.photoUrl ? (
          <img
            src={student.photoUrl}
            alt={student.nameGu}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isPresent ? 'brightness-100' : 'filter contrast-[1.02]'
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-sky-100 text-slate-700">
            <User className="w-16 h-16 text-indigo-400 mb-1" />
            <span className="text-xs font-semibold text-indigo-700">{student.nameEn}</span>
          </div>
        )}

        {/* Big Overlay on Present */}
        {isPresent && (
          <div className="absolute inset-0 bg-emerald-600/15 backdrop-blur-[1px] flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white"
            >
              <Check className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3]" />
            </motion.div>
          </div>
        )}
      </div>

      {/* Student Info Footer */}
      <div className="p-3">
        <div className="flex items-baseline justify-between gap-1">
          <h3
            className={`font-bold text-base sm:text-lg leading-tight truncate ${
              isPresent ? 'text-emerald-950' : 'text-slate-800'
            }`}
          >
            {student.nameGu}
          </h3>
        </div>
        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
          {student.nameEn}
        </p>

        {/* Gender Badge */}
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              student.gender === 'boy'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-pink-50 text-pink-700 border border-pink-200'
            }`}
          >
            {student.gender === 'boy' ? '👦 કુમાર' : '👧 કન્યા'}
          </span>
        </div>

        {/* Timestamp if present */}
        {isPresent && attendanceEntry?.timestamp && (
          <div className="mt-2 pt-1.5 border-t border-emerald-200/60 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <Clock className="w-3 h-3" />
            <span>
              હાજરી સમય: {new Date(attendanceEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </motion.button>
  );
};
