import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, User, Sparkles, Trash2 } from 'lucide-react';
import { Student, SocialCategory } from '../types';
import { PRESET_AVATARS } from '../data/defaultStudents';
import { CATEGORY_CONFIGS, ALL_CATEGORIES, getStudentCategory } from '../utils/categories';

interface StudentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStudent: (student: Student) => void;
  onDeleteStudent?: (studentId: string) => void;
  editingStudent?: Student | null;
  nextRollNo: number;
}

export const StudentManagerModal: React.FC<StudentManagerModalProps> = ({
  isOpen,
  onClose,
  onSaveStudent,
  onDeleteStudent,
  editingStudent,
  nextRollNo,
}) => {
  const [rollNo, setRollNo] = useState<number>(nextRollNo);
  const [nameGu, setNameGu] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [category, setCategory] = useState<SocialCategory>('general');
  const [photoUrl, setPhotoUrl] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingStudent) {
      setRollNo(editingStudent.rollNo);
      setNameGu(editingStudent.nameGu);
      setNameEn(editingStudent.nameEn);
      setGender(editingStudent.gender);
      setCategory(getStudentCategory(editingStudent));
      setPhotoUrl(editingStudent.photoUrl);
      setParentPhone(editingStudent.parentPhone || '');
    } else {
      setRollNo(nextRollNo);
      setNameGu('');
      setNameEn('');
      setGender('boy');
      setCategory('general');
      setPhotoUrl(PRESET_AVATARS[0]);
      setParentPhone('');
    }
    stopCamera();
  }, [editingStudent, nextRollNo, isOpen]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 400 }, height: { ideal: 400 }, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('કેમેરો શરૂ કરવામાં સમસ્યા આવી. કૃપા કરીને કેમેરા પરવાનગી ચકાસો.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoUrl(dataUrl);
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameGu.trim()) {
      alert('કૃપા કરીને વિદ્યાર્થીનું નામ દાખલ કરો.');
      return;
    }

    const student: Student = {
      id: editingStudent ? editingStudent.id : `std-${Date.now()}`,
      rollNo: Number(rollNo),
      nameGu: nameGu.trim(),
      nameEn: nameEn.trim() || nameGu.trim(),
      gender,
      category,
      photoUrl: photoUrl || PRESET_AVATARS[0],
      parentPhone: parentPhone.trim() || undefined,
    };

    onSaveStudent(student);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {editingStudent ? 'વિદ્યાર્થી માહિતી સુધારો' : 'નવો વિદ્યાર્થી ઉમેરો (ધોરણ ૭)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ફોટો અને રોલ નંબર સેટ કરો જેથી બાળક સરળતાથી ક્લિક કરી શકે.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Photo Section */}
          <div className="text-center">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              વિદ્યાર્થીનો ફોટો (Student Photo)
            </label>

            {/* Photo preview or live camera */}
            <div className="relative w-32 h-32 mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shadow-inner group">
              {isCameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Student"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-slate-300" />
              )}
            </div>

            {/* Photo Action Buttons */}
            <div className="flex items-center justify-center gap-2 mt-3">
              {isCameraActive ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>ફોટો ખેંચો (Capture)</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    રદ કરો
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    <span>કેમેરાથી લો</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ગેલેરીમાંથી અપલોડ</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>

            {/* Preset Avatars Selector */}
            <div className="mt-3">
              <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                અથવા તૈયાર કાર્ટૂન અવતાર પસંદ કરો:
              </span>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {PRESET_AVATARS.map((avatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setPhotoUrl(avatar);
                    }}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer ${
                      photoUrl === avatar ? 'border-blue-600 ring-2 ring-blue-300' : 'border-slate-200'
                    }`}
                  >
                    <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Roll Number & Gender */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                રોલ નંબર (Roll No)
              </label>
              <input
                type="number"
                min="1"
                required
                value={rollNo}
                onChange={(e) => setRollNo(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                જાતિ (Gender)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setGender('boy')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                    gender === 'boy'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  કુમાર (Boy)
                </button>
                <button
                  type="button"
                  onClick={() => setGender('girl')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                    gender === 'girl'
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  કન્યા (Girl)
                </button>
              </div>
            </div>
          </div>

          {/* Social Category (SC / ST / SEBC / General) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              કેટેગરી / સામાજિક વર્ગ (Social Category) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const meta = CATEGORY_CONFIGS[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block">{meta.shortGu}</span>
                    <span className="text-[10px] font-normal opacity-80">{meta.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name in Gujarati */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              વિદ્યાર્થીનું નામ (ગુજરાતીમાં) *
            </label>
            <input
              type="text"
              required
              placeholder="દા.ત. આરવ પટેલ"
              value={nameGu}
              onChange={(e) => setNameGu(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Name in English */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Student Name (In English)
            </label>
            <input
              type="text"
              placeholder="e.g. Aarav Patel"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Parent Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              વાલીનો મોબાઈલ નંબર (વૈકલ્પિક)
            </label>
            <input
              type="tel"
              placeholder="10 અંકનો મોબાઈલ નંબર"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-slate-100">
            {editingStudent && onDeleteStudent ? (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onDeleteStudent(editingStudent.id);
                  onClose();
                }}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-200"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>વિદ્યાર્થી કાઢી નાખો (Delete)</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-800 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                રદ કરો
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{editingStudent ? 'સુધારો સાચવો' : 'વિદ્યાર્થી ઉમેરો'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
