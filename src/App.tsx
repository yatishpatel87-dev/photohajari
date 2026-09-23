import { useState, useEffect, useCallback } from 'react';
import { Student, AttendanceDatabase, AttendanceStatus } from './types';
import { DEFAULT_STUDENTS } from './data/defaultStudents';
import {
  getTodayDateString,
  loadStudents,
  saveStudents,
  loadAllAttendance,
  saveDayAttendance,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { StudentGrid } from './components/StudentGrid';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentManagerModal } from './components/StudentManagerModal';
import { PrintAttendanceSheet } from './components/PrintAttendanceSheet';
import { ConfirmModal } from './components/ConfirmModal';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { SCHOOL_INFO } from './utils/schoolConfig';

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [attendanceDb, setAttendanceDb] = useState<AttendanceDatabase>(() => loadAllAttendance());
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayDateString());
  const [currentView, setCurrentView] = useState<'student' | 'teacher'>('student');
  const [voiceFeedback, setVoiceFeedback] = useState<boolean>(true);

  // Security & Authentication for Teacher Dashboard
  const [isTeacherUnlocked, setIsTeacherUnlocked] = useState(false);
  const [isTeacherAuthOpen, setIsTeacherAuthOpen] = useState(false);

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [studentPendingDelete, setStudentPendingDelete] = useState<Student | null>(null);
  const [showResetDayConfirm, setShowResetDayConfirm] = useState(false);
  const [showResetRosterConfirm, setShowResetRosterConfirm] = useState(false);

  // Get current day's attendance
  const currentDayAttendance = attendanceDb[selectedDate] || {};

  // Auto save students when changed
  useEffect(() => {
    saveStudents(students);
  }, [students]);

  // Keep date synchronized with current day so each new day automatically starts with fresh attendance
  useEffect(() => {
    const handleDayCheck = () => {
      const todayStr = getTodayDateString();
      if (selectedDate !== todayStr) {
        setSelectedDate(todayStr);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleDayCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleDayCheck);
    return () => {
      document.removeEventListener('visibilitychange', handleDayCheck);
      window.removeEventListener('focus', handleDayCheck);
    };
  }, [selectedDate]);

  // Toggle student attendance (used in Student Photo mode when kid taps their photo)
  const handleToggleAttendance = useCallback(
    (studentId: string) => {
      setAttendanceDb((prev) => {
        const dayRecord = { ...(prev[selectedDate] || {}) };
        const currentEntry = dayRecord[studentId];

        if (currentEntry?.status === 'present') {
          // If already marked present, unmark to absent
          delete dayRecord[studentId];
        } else {
          // Mark present with timestamp
          dayRecord[studentId] = {
            status: 'present',
            timestamp: new Date().toISOString(),
          };
        }

        const updatedDb = { ...prev, [selectedDate]: dayRecord };
        saveDayAttendance(selectedDate, dayRecord);
        return updatedDb;
      });
    },
    [selectedDate]
  );

  // Teacher specific status updater ('present' | 'absent' | 'leave')
  const handleUpdateStatus = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      setAttendanceDb((prev) => {
        const dayRecord = { ...(prev[selectedDate] || {}) };

        if (status === 'absent') {
          // If explicitly marked absent, we can remove or set status
          dayRecord[studentId] = {
            status: 'absent',
            timestamp: '',
          };
        } else {
          dayRecord[studentId] = {
            status,
            timestamp: new Date().toISOString(),
          };
        }

        const updatedDb = { ...prev, [selectedDate]: dayRecord };
        saveDayAttendance(selectedDate, dayRecord);
        return updatedDb;
      });
    },
    [selectedDate]
  );

  // Mark all students present or absent
  const handleMarkAll = useCallback(
    (status: AttendanceStatus) => {
      setAttendanceDb((prev) => {
        const dayRecord: Record<string, { status: AttendanceStatus; timestamp: string }> = {};
        const timestamp = new Date().toISOString();

        students.forEach((s) => {
          dayRecord[s.id] = {
            status,
            timestamp: status === 'present' ? timestamp : '',
          };
        });

        const updatedDb = { ...prev, [selectedDate]: dayRecord };
        saveDayAttendance(selectedDate, dayRecord);
        return updatedDb;
      });
    },
    [selectedDate, students]
  );

  // Reset current day's attendance
  const handleResetDay = useCallback(() => {
    setShowResetDayConfirm(true);
  }, []);

  const handleConfirmResetDay = () => {
    setAttendanceDb((prev) => {
      const updatedDb = { ...prev, [selectedDate]: {} };
      saveDayAttendance(selectedDate, {});
      return updatedDb;
    });
    setShowResetDayConfirm(false);
  };

  // Save new or edited student
  const handleSaveStudent = (savedStudent: Student) => {
    setStudents((prev) => {
      const existsIndex = prev.findIndex((s) => s.id === savedStudent.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = savedStudent;
        return updated.sort((a, b) => a.rollNo - b.rollNo);
      } else {
        return [...prev, savedStudent].sort((a, b) => a.rollNo - b.rollNo);
      }
    });
    setEditingStudent(null);
  };

  // Trigger Delete student modal
  const handleDeleteStudent = (studentId: string) => {
    const studentToDelete = students.find((s) => s.id === studentId);
    if (studentToDelete) {
      setStudentPendingDelete(studentToDelete);
    }
  };

  // Confirm and execute Student Deletion
  const handleConfirmDeleteStudent = () => {
    if (!studentPendingDelete) return;
    const targetId = studentPendingDelete.id;

    // Remove student from roster
    setStudents((prev) => prev.filter((s) => s.id !== targetId));

    // Remove student's attendance entry for current day
    setAttendanceDb((prev) => {
      const dayRecord = { ...(prev[selectedDate] || {}) };
      delete dayRecord[targetId];
      saveDayAttendance(selectedDate, dayRecord);
      return { ...prev, [selectedDate]: dayRecord };
    });

    setStudentPendingDelete(null);
  };

  // Reset to default Class 7 roster
  const handleResetToDefaultStudents = () => {
    setShowResetRosterConfirm(true);
  };

  const handleConfirmResetRoster = () => {
    setStudents(DEFAULT_STUDENTS);
    saveStudents(DEFAULT_STUDENTS);
    setShowResetRosterConfirm(false);
  };

  // View Switching with Password Protection for Teacher Dashboard
  const handleViewChange = (view: 'student' | 'teacher') => {
    if (view === 'teacher') {
      if (isTeacherUnlocked) {
        setCurrentView('teacher');
      } else {
        setIsTeacherAuthOpen(true);
      }
    } else {
      // Locking teacher dashboard whenever switching back to student mode
      setIsTeacherUnlocked(false);
      setCurrentView('student');
    }
  };

  const handleTeacherAuthSuccess = () => {
    setIsTeacherUnlocked(true);
    setCurrentView('teacher');
    setIsTeacherAuthOpen(false);
  };

  const handleLockTeacher = () => {
    setIsTeacherUnlocked(false);
    setCurrentView('student');
  };

  const nextRollNo =
    students.length > 0 ? Math.max(...students.map((s) => s.rollNo || 0)) + 1 : 1;

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* App Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={handleViewChange}
        selectedDate={selectedDate}
        isTeacherUnlocked={isTeacherUnlocked}
        onLockTeacher={handleLockTeacher}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'student' ? (
          <StudentGrid
            students={students}
            attendance={currentDayAttendance}
            onToggleAttendance={handleToggleAttendance}
            voiceFeedback={voiceFeedback}
            onToggleVoice={() => setVoiceFeedback(!voiceFeedback)}
            onResetToday={handleResetDay}
            dateStr={selectedDate}
          />
        ) : (
          <TeacherDashboard
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            students={students}
            attendance={currentDayAttendance}
            allAttendance={attendanceDb}
            onUpdateStatus={handleUpdateStatus}
            onMarkAll={handleMarkAll}
            onResetDay={handleResetDay}
            onOpenAddStudent={() => {
              setEditingStudent(null);
              setIsStudentModalOpen(true);
            }}
            onEditStudent={(student) => {
              setEditingStudent(student);
              setIsStudentModalOpen(true);
            }}
            onDeleteStudent={handleDeleteStudent}
            onResetToDefaultStudents={handleResetToDefaultStudents}
            onOpenPrintSheet={() => setIsPrintModalOpen(true)}
            onLockDashboard={handleLockTeacher}
          />
        )}
      </main>

      {/* Student Add/Edit Modal */}
      <StudentManagerModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(null);
        }}
        onSaveStudent={handleSaveStudent}
        onDeleteStudent={handleDeleteStudent}
        editingStudent={editingStudent}
        nextRollNo={nextRollNo}
      />

      {/* Student Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!studentPendingDelete}
        title="વિદ્યાર્થી કાઢી નાખો (Delete Student)"
        message={`શું તમે ખરેખર ${studentPendingDelete?.nameGu || 'આ વિદ્યાર્થી'} ને ધોરણ ૭ ની વિદ્યાર્થી યાદીમાંથી કાઢી નાખવા માંગો છો?`}
        subMessage="આ વિદ્યાર્થીની આજના દિવસની હાજરી પણ યાદીમાંથી દૂર થશે."
        confirmLabel="હા, કાઢી નાખો (Delete)"
        cancelLabel="ના, રદ કરો"
        variant="danger"
        student={studentPendingDelete}
        onConfirm={handleConfirmDeleteStudent}
        onCancel={() => setStudentPendingDelete(null)}
      />

      {/* Reset Day Attendance Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetDayConfirm}
        title="આજની હાજરી નવી શરૂ કરો (Start Fresh)"
        message="શું તમે આજના દિવસ માટે નોંધાયેલ તમામ હાજરી રદ કરીને નવી તાજી હાજરી શરૂ કરવા માંગો છો?"
        subMessage="આજના દિવસની તમામ હાજરી ખાલી થશે જેથી નવા વિદ્યાર્થીઓ હાજરી પૂરી શકે."
        confirmLabel="હા, નવી હાજરી શરૂ કરો"
        cancelLabel="રદ કરો"
        variant="warning"
        onConfirm={handleConfirmResetDay}
        onCancel={() => setShowResetDayConfirm(false)}
      />

      {/* Reset Roster to Default Class 7 Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetRosterConfirm}
        title="મૂળ ધોરણ ૭ યાદી પુનઃસ્થાપિત કરો"
        message="શું તમે ધોરણ ૭ ના મૂળ ૧૬ વિદ્યાર્થીઓની ડિફોલ્ટ યાદી ફરીથી લાવવા માંગો છો?"
        subMessage="ધ્યાન: તમારા દ્વારા ઉમેરેલા નવા વિદ્યાર્થીઓ રદ થશે."
        confirmLabel="હા, મૂળ યાદી લાવો"
        cancelLabel="રદ કરો"
        variant="warning"
        onConfirm={handleConfirmResetRoster}
        onCancel={() => setShowResetRosterConfirm(false)}
      />

      {/* Gujarat Standard Attendance Sheet Modal (Print/PDF) */}
      <PrintAttendanceSheet
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        dateStr={selectedDate}
        students={students}
        attendance={currentDayAttendance}
      />

      {/* Teacher Dashboard Security Password Modal */}
      <TeacherAuthModal
        isOpen={isTeacherAuthOpen}
        onClose={() => setIsTeacherAuthOpen(false)}
        onSuccess={handleTeacherAuthSuccess}
      />

      {/* School Footer */}
      <footer className="border-t border-slate-200/60 bg-white/40 backdrop-blur-md py-4 mt-8 print:hidden">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {SCHOOL_INFO.nameEn} ({SCHOOL_INFO.nameGu}) • {SCHOOL_INFO.locationEn} • DISE: {SCHOOL_INFO.diseCode}
          </span>
          <span className="text-slate-500">
            ધોરણ ૭ દૈનિક ફોટો હાજરી પ્રણાલી
          </span>
        </div>
      </footer>
    </div>
  );
}
