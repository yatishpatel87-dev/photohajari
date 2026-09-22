import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, X, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TEACHER_PASSWORD = '7096737731';

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (password === TEACHER_PASSWORD) {
      setError(null);
      setPassword('');
      onSuccess();
      onClose();
    } else {
      setError('ખોટો પાસવર્ડ! શિક્ષક ડેશબોર્ડ ખોલવા માટે સાચો પાસવર્ડ દાખલ કરો.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKeyPress = (num: string) => {
    setPassword((prev) => prev + num);
    if (error) setError(null);
  };

  const handleBackspace = () => {
    setPassword((prev) => prev.slice(0, -1));
    if (error) setError(null);
  };

  const handleClear = () => {
    setPassword('');
    if (error) setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 transition-all ${
          shake ? 'animate-shake' : ''
        }`}
        style={shake ? { animation: 'shake 0.4s ease-in-out' } : undefined}
      >
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
        `}</style>

        {/* Header Icon + Close */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center shadow-md shadow-slate-900/20">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="બંધ કરો"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            શિક્ષક ડેશબોર્ડ સુરક્ષા
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            શિક્ષક ડેશબોર્ડ ફક્ત શિક્ષકશ્રી માટે સુરક્ષિત છે. પ્રવેશવા માટે પાસવર્ડ દાખલ કરો.
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>સુરક્ષા પાસવર્ડ (Password)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                autoFocus
                placeholder="પાસવર્ડ દાખલ કરો..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                className={`w-full pl-4 pr-11 py-3 bg-slate-50 border rounded-2xl text-base font-semibold tracking-wider focus:outline-none focus:ring-3 focus:bg-white transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal ${
                  error
                    ? 'border-rose-400 focus:ring-rose-200 text-rose-900 bg-rose-50/30'
                    : 'border-slate-300 focus:ring-blue-200 focus:border-blue-500 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                title={showPassword ? 'પાસવર્ડ છુપાવો' : 'પાસવર્ડ જુઓ'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 mt-2 text-rose-600 text-xs font-semibold animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick On-Screen Keypad for Smart Board / Tablet / Mobile */}
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            <div className="grid grid-cols-3 gap-1.5 text-center">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  className="py-2 bg-white hover:bg-slate-100 active:scale-95 text-slate-800 font-bold text-sm rounded-xl border border-slate-200/60 shadow-2xs transition-all cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl border border-slate-200/60 transition-all cursor-pointer select-none"
              >
                સાફ કરો
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="py-2 bg-white hover:bg-slate-100 active:scale-95 text-slate-800 font-bold text-sm rounded-xl border border-slate-200/60 shadow-2xs transition-all cursor-pointer select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/60 transition-all cursor-pointer select-none"
              >
                ⌫ હટાવો
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer text-center"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              className="flex-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ડેશબોર્ડ ખોલો</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
