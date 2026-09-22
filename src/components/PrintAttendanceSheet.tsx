import React from 'react';
import { X, Printer } from 'lucide-react';
import { Student, DayAttendance } from '../types';
import { formatGujaratiDigits, formatDisplayDate } from '../utils/storage';
import { computeCategoryBreakdown, getStudentCategory, CATEGORY_CONFIGS, ALL_CATEGORIES } from '../utils/categories';
import { SCHOOL_INFO } from '../utils/schoolConfig';

interface PrintAttendanceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  students: Student[];
  attendance: DayAttendance;
}

export const PrintAttendanceSheet: React.FC<PrintAttendanceSheetProps> = ({
  isOpen,
  onClose,
  dateStr,
  students,
  attendance,
}) => {
  if (!isOpen) return null;

  const { gujarati, english } = formatDisplayDate(dateStr);

  const boys = students.filter((s) => s.gender === 'boy');
  const girls = students.filter((s) => s.gender === 'girl');

  const boysPresent = boys.filter((s) => attendance[s.id]?.status === 'present').length;
  const boysLeave = boys.filter((s) => attendance[s.id]?.status === 'leave').length;
  const boysAbsent = boys.length - boysPresent - boysLeave;
  const boysPercentage = boys.length > 0 ? Math.round((boysPresent / boys.length) * 100) : 0;

  const girlsPresent = girls.filter((s) => attendance[s.id]?.status === 'present').length;
  const girlsLeave = girls.filter((s) => attendance[s.id]?.status === 'leave').length;
  const girlsAbsent = girls.length - girlsPresent - girlsLeave;
  const girlsPercentage = girls.length > 0 ? Math.round((girlsPresent / girls.length) * 100) : 0;

  const presentCount = boysPresent + girlsPresent;
  const leaveCount = boysLeave + girlsLeave;
  const absentCount = boysAbsent + girlsAbsent;
  const percentage = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const categoryBreakdown = computeCategoryBreakdown(students, attendance);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Controls Bar (Hidden in Print) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">
              હાજરી પત્રક પ્રિન્ટ / પીડીએફ પ્રીવ્યૂ (Attendance Sheet)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>પ્રિન્ટ / PDF ડાઉનલોડ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="flex-1 overflow-y-auto p-8 bg-white print:p-0 print:m-0">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {SCHOOL_INFO.nameEn} ({SCHOOL_INFO.nameGu})
            </h1>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              {SCHOOL_INFO.locationEn} ({SCHOOL_INFO.locationGu}) • DISE Code: <span className="font-bold text-slate-900">{SCHOOL_INFO.diseCode}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-2 text-sm font-semibold text-slate-800">
              <span>વર્ગ / ધોરણ: <strong className="text-slate-900">ધોરણ ૭ ({SCHOOL_INFO.standardEn})</strong></span>
              <span>તારીખ: <strong className="text-slate-900">{gujarati} ({english})</strong></span>
            </div>
          </div>

          {/* Detailed Gender Breakdown Table (Gujarat School Register Standard) */}
          <table className="w-full text-center border-collapse border border-slate-400 text-xs mb-4">
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-800">
                <th className="border border-slate-300 py-2 px-3 text-left">જાતિવાર વર્ગીકરણ</th>
                <th className="border border-slate-300 py-2 px-3">કુલ સંખ્યા</th>
                <th className="border border-slate-300 py-2 px-3">હાજર</th>
                <th className="border border-slate-300 py-2 px-3">ગેરહાજર</th>
                <th className="border border-slate-300 py-2 px-3">રજા પર</th>
                <th className="border border-slate-300 py-2 px-3">હાજરી %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 py-2 px-3 text-left font-bold text-blue-900">
                  👦 કુમાર (Boys)
                </td>
                <td className="border border-slate-300 py-2 px-3 font-semibold">
                  {formatGujaratiDigits(boys.length)}
                </td>
                <td className="border border-slate-300 py-2 px-3 font-bold text-emerald-700">
                  {formatGujaratiDigits(boysPresent)}
                </td>
                <td className="border border-slate-300 py-2 px-3 font-semibold text-rose-600">
                  {formatGujaratiDigits(boysAbsent)}
                </td>
                <td className="border border-slate-300 py-2 px-3 font-semibold text-amber-600">
                  {formatGujaratiDigits(boysLeave)}
                </td>
                <td className="border border-slate-300 py-2 px-3 font-bold">
                  {formatGujaratiDigits(boysPercentage)}%
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 py-2 px-3 text-left font-bold text-pink-900">
                  👧 કન્યા (Girls)
                </td>
                <td className="border border-slate-300 py-2 px-3 font-semibold">
                  {formatGujaratiDigits(girls.length)}
                </td>
                <td className="border border-slate-300 py-2 px-3 font-bold text-emerald-700">
                  {formatGujaratiDigits(girlsPresent)}
                </td>
                <td className="border border-slate-300 py-2 px-3 font-semibold text-rose-600">
                  {formatGujaratiDigits(girlsAbsent)}
                </td>
                <td className="border border-slate-300 py-2 px-3 font-semibold text-amber-600">
                  {formatGujaratiDigits(girlsLeave)}
                </td>
                <td className="border border-slate-300 py-2 px-3 font-bold">
                  {formatGujaratiDigits(girlsPercentage)}%
                </td>
              </tr>
              <tr className="bg-slate-50 font-black">
                <td className="border border-slate-300 py-2 px-3 text-left">
                  👥 કુલ (Total)
                </td>
                <td className="border border-slate-300 py-2 px-3">
                  {formatGujaratiDigits(students.length)}
                </td>
                <td className="border border-slate-300 py-2 px-3 text-emerald-700">
                  {formatGujaratiDigits(presentCount)}
                </td>
                <td className="border border-slate-300 py-2 px-3 text-rose-600">
                  {formatGujaratiDigits(absentCount)}
                </td>
                <td className="border border-slate-300 py-2 px-3 text-amber-600">
                  {formatGujaratiDigits(leaveCount)}
                </td>
                <td className="border border-slate-300 py-2 px-3 text-blue-900">
                  {formatGujaratiDigits(percentage)}%
                </td>
              </tr>
            </tbody>
          </table>

          {/* Social Category Attendance Table (SC, ST, SEBC, General) */}
          <div className="mb-5">
            <h3 className="text-xs font-bold text-slate-800 mb-1">
              સામાજિક કેટેગરીવાર વિગત (SC / ST / બક્ષીપંચ / અન્ય)
            </h3>
            <table className="w-full text-center border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <th className="border border-slate-300 py-1.5 px-2 text-left">કેટેગરી</th>
                  <th className="border border-slate-300 py-1.5 px-2">કુલ નોંધાયેલ</th>
                  <th className="border border-slate-300 py-1.5 px-2">હાજર કુમાર</th>
                  <th className="border border-slate-300 py-1.5 px-2">હાજર કન્યા</th>
                  <th className="border border-slate-300 py-1.5 px-2">કુલ હાજર</th>
                  <th className="border border-slate-300 py-1.5 px-2">ગેરહાજર</th>
                  <th className="border border-slate-300 py-1.5 px-2">રજા</th>
                  <th className="border border-slate-300 py-1.5 px-2">હાજરી %</th>
                </tr>
              </thead>
              <tbody>
                {ALL_CATEGORIES.map((catKey) => {
                  const item = categoryBreakdown[catKey];
                  const meta = CATEGORY_CONFIGS[catKey];
                  return (
                    <tr key={catKey}>
                      <td className="border border-slate-300 py-1.5 px-2 text-left font-bold">
                        {meta.shortGu} ({meta.nameEn})
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2">
                        {formatGujaratiDigits(item.total)} (કુ.{formatGujaratiDigits(item.boyTotal)} | ક.{formatGujaratiDigits(item.girlTotal)})
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-blue-800 font-semibold">
                        {formatGujaratiDigits(item.boyPresent)}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-pink-800 font-semibold">
                        {formatGujaratiDigits(item.girlPresent)}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 font-bold text-emerald-700">
                        {formatGujaratiDigits(item.present)}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-rose-600">
                        {formatGujaratiDigits(item.absent)}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 text-amber-600">
                        {formatGujaratiDigits(item.leave)}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-2 font-bold">
                        {formatGujaratiDigits(item.percentage)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Student Table */}
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="border border-slate-300 py-2 px-2 text-center w-12">રોલ નં.</th>
                <th className="border border-slate-300 py-2 px-3">વિદ્યાર્થીનું પૂરું નામ</th>
                <th className="border border-slate-300 py-2 px-2 text-center w-16">જાતિ</th>
                <th className="border border-slate-300 py-2 px-2 text-center w-20">કેટેગરી</th>
                <th className="border border-slate-300 py-2 px-2 text-center w-24">હાજરી સ્થિતિ</th>
                <th className="border border-slate-300 py-2 px-2 text-center w-24">નોંધ્યાનો સમય</th>
                <th className="border border-slate-300 py-2 px-3">શેરો / વિગત</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const entry = attendance[student.id];
                const status = entry?.status || 'absent';
                const isPresent = status === 'present';
                const isLeave = status === 'leave';
                const cat = getStudentCategory(student);
                const catMeta = CATEGORY_CONFIGS[cat];

                return (
                  <tr key={student.id} className="border-b border-slate-200">
                    <td className="border border-slate-300 py-2 px-2 text-center font-bold">
                      {formatGujaratiDigits(student.rollNo)}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 font-semibold text-slate-900">
                      {student.nameGu}{' '}
                      <span className="text-slate-500 font-normal">({student.nameEn})</span>
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center">
                      {student.gender === 'boy' ? 'કુમાર' : 'કન્યા'}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center font-semibold">
                      {catMeta.shortGu}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center font-bold">
                      {isPresent ? (
                        <span className="text-emerald-700">હાજર (P)</span>
                      ) : isLeave ? (
                        <span className="text-amber-700">રજા (L)</span>
                      ) : (
                        <span className="text-rose-600">ગેરહાજર (A)</span>
                      )}
                    </td>
                    <td className="border border-slate-300 py-2 px-2 text-center text-slate-600">
                      {entry?.timestamp
                        ? new Date(entry.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="border border-slate-300 py-2 px-3 text-slate-400"></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Signatures Footer */}
          <div className="mt-16 pt-8 flex items-center justify-between text-xs font-bold text-slate-800">
            <div className="text-center">
              <div className="w-48 border-t border-slate-700 pt-2 mb-1"></div>
              <span>વર્ગશિક્ષકની સહી (Class Teacher)</span>
            </div>
            <div className="text-center">
              <div className="w-48 border-t border-slate-700 pt-2 mb-1"></div>
              <span>આચાર્યશ્રીની સહી અને સિક્કો (Principal)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
