import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Student } from '../types';
import { formatGujaratiDigits } from '../utils/storage';
import { getStudentCategory, CATEGORY_CONFIGS } from '../utils/categories';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  student?: Student | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  subMessage,
  confirmLabel = 'હા, કાઢી નાખો',
  cancelLabel = 'રદ કરો',
  variant = 'danger',
  student,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const category = student ? getStudentCategory(student) : 'general';
  const catMeta = CATEGORY_CONFIGS[category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        {/* Header Icon + Close */}
        <div className="flex items-start justify-between">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              variant === 'danger'
                ? 'bg-rose-100 text-rose-600'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            {variant === 'danger' ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title and Message */}
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{message}</p>
          {subMessage && (
            <p className="text-xs text-slate-400 mt-1">{subMessage}</p>
          )}
        </div>

        {/* Optional Student Preview Card */}
        {student && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
            <img
              src={student.photoUrl}
              alt={student.nameGu}
              className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-2xs"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  રોલ #{formatGujaratiDigits(student.rollNo)}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${catMeta.badgeBg}`}>
                  {catMeta.shortGu}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm truncate mt-0.5">
                {student.nameGu}
              </h4>
              <p className="text-xs text-slate-500 truncate">{student.nameEn}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
            }`}
          >
            {variant === 'danger' && <Trash2 className="w-4 h-4" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
