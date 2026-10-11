import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Eye,
  Download,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  ScanLine
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useProgramStore } from '../services/programStore';
import { TRACKS_BY_SLUG } from '../config/tracks';
import { OFFICIAL_PROGRAM_SCHEDULE } from '../config/program';
import { TrackImage } from '../components/TrackImage';
import { supabase } from '../integrations/supabase/client';
import { Html5Qrcode } from 'html5-qrcode';

interface AttendanceStatus {
  session_id: string;
  day_number: number;
  session_date: string;
  opens_at: string;
  closes_at: string;
  is_active: boolean;
  attended: boolean;
  checked_in_at: string | null;
}

export const DashboardPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const {
    currentUser,
    authLoading,
    dataLoading,
    signOut,
    loadParticipantProfile,
    getMyParticipantProfile,
    getMyCertificate,
    getSignedCertificateUrl,
    updateParticipantPassword
  } = useProgramStore();
  const navigate = useNavigate();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceStatus[]>([]);
const [attendanceLoading, setAttendanceLoading] = useState(false);
const [attendanceError, setAttendanceError] = useState('');
const [scannerOpen, setScannerOpen] = useState(false);
const [scanning, setScanning] = useState(false);
const [checkInMessage, setCheckInMessage] = useState('');
const [checkInError, setCheckInError] = useState(''); 
const scannerRef = useRef<Html5Qrcode | null>(null);
  
  const loadAttendanceStatus = async () => {
  if (!supabase) return;

  setAttendanceLoading(true);

  const { data, error } = await supabase.rpc(
    'get_my_attendance_status'
  );

  if (error) {
    setAttendanceError(
      lang === 'ar'
        ? 'تعذر تحميل حالة الحضور.'
        : 'Unable to load attendance status.'
    );
  } else {
    setAttendance((data || []) as AttendanceStatus[]);
    setAttendanceError('');
  }

  setAttendanceLoading(false);
};
useEffect(() => {
  if (!authLoading && currentUser?.role === 'participant') {
    loadParticipantProfile(currentUser.id).catch(() => {
      // Handled by null profile state
    });
  }
}, [
  authLoading,
  currentUser?.id,
  currentUser?.role,
  loadParticipantProfile
]);

useEffect(() => {
  if (
    authLoading ||
    !currentUser ||
    currentUser.role !== 'participant' ||
    !supabase
  ) {
    return;
  }

  loadAttendanceStatus();

  const timer = window.setInterval(() => {
    loadAttendanceStatus();
  }, 30000);

  return () => {
    window.clearInterval(timer);
  };
}, [
  authLoading,
  currentUser?.id,
  currentUser?.role,
  lang
]);

  if (authLoading || dataLoading) {
    return (
      <div className="py-24 text-center text-lg font-bold text-[#3C4620]">
        {t.common.loading}
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const profile = getMyParticipantProfile();
  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  const certificate = getMyCertificate();
  const track = TRACKS_BY_SLUG[profile.selected_track_id];
  const trackName = track
    ? lang === 'ar'
      ? track.nameAr
      : track.nameEn
    : profile.selected_track_id;
  const trackDesc = track
    ? lang === 'ar'
      ? track.descriptionAr
      : track.descriptionEn
    : '';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleViewCertificate = async () => {
    try {
      const signed = await getSignedCertificateUrl(profile.id);
      if (signed) {
        setPreviewUrl(signed);
      }
    } catch {
      // Do not expose raw storage error
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      const signed = await getSignedCertificateUrl(profile.id);
      if (!signed || !certificate) return;

      const a = document.createElement('a');
      a.href = signed;
      a.download = certificate.file_name || 'certificate.svg';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // Do not expose raw storage error
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdatingPass) return;

    if (newPassword.trim().length < 8) {
      setPasswordError(t.dashboardPage.passwordUpdateError);
      return;
    }

    setPasswordError('');
    setIsUpdatingPass(true);
    try {
      await updateParticipantPassword(newPassword.trim());
      setNewPassword('');
      setPasswordSaved(true);
    } catch {
      setPasswordError(t.dashboardPage.passwordUpdateError);
    } finally {
      setIsUpdatingPass(false);
    }
  };
const getAttendanceState = (session: AttendanceStatus) => {
  if (session.attended) {
    return 'attended';
  }

  const now = new Date();
  const opensAt = new Date(session.opens_at);
  const closesAt = new Date(session.closes_at);

  if (now < opensAt) {
    return 'before';
  }

  if (now > closesAt || !session.is_active) {
    return 'closed';
  }

  return 'open';
};

const stopScanner = async () => {
  const scanner = scannerRef.current;

  if (!scanner) return;

  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
  } catch {
    // Ignore scanner stop errors
  }

  try {
    await scanner.clear();
  } catch {
    // Ignore scanner cleanup errors
  }

  scannerRef.current = null;
};

const closeScanner = async () => {
  await stopScanner();

  setScannerOpen(false);
  setScanning(false);
  setCheckInError('');
  setCheckInMessage('');
};

const handleCheckInToken = async (token: string) => {
  if (!supabase) return;

  setScanning(true);
  setCheckInError('');
  setCheckInMessage('');

  const cleanToken = token.trim();

  const { data, error } = await supabase.rpc(
    'check_in_attendance',
    {
      p_qr_token: cleanToken
    }
  );

  if (error) {
    const message = error.message || '';

    if (message.includes('INVALID_QR')) {
      setCheckInError(
        lang === 'ar'
          ? 'رمز QR غير صحيح.'
          : 'Invalid QR code.'
      );
    } else if (
      message.includes('ATTENDANCE_NOT_OPEN_YET')
    ) {
      setCheckInError(
        lang === 'ar'
          ? 'لم يبدأ وقت تسجيل الحضور بعد.'
          : 'Attendance has not started yet.'
      );
    } else if (message.includes('ATTENDANCE_CLOSED')) {
      setCheckInError(
        lang === 'ar'
          ? 'تم إغلاق تسجيل الحضور.'
          : 'Attendance is closed.'
      );
    } else {
      setCheckInError(
        lang === 'ar'
          ? 'تعذر تسجيل الحضور. حاول مرة أخرى.'
          : 'Unable to record attendance. Please try again.'
      );
    }

    setScanning(false);
    return;
  }

  const result = data as {
    success?: boolean;
    already_checked_in?: boolean;
  };

  if (result?.success) {
    setCheckInMessage(
      result.already_checked_in
        ? lang === 'ar'
          ? 'حضورك مسجل مسبقًا لهذا اليوم.'
          : 'Your attendance was already recorded for today.'
        : lang === 'ar'
          ? 'تم تسجيل حضورك بنجاح.'
          : 'Your attendance has been recorded successfully.'
    );

    await loadAttendanceStatus();

    window.setTimeout(() => {
      setScannerOpen(false);
      setCheckInMessage('');
    }, 1800);
  }

  setScanning(false);
};

const openScanner = () => {
  setScannerOpen(true);
  setCheckInError('');
  setCheckInMessage('');

  window.setTimeout(async () => {
    try {
      const scanner = new Html5Qrcode(
        'attendance-qr-reader'
      );

      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras.length) {
        setCheckInError(
          lang === 'ar'
            ? 'لم يتم العثور على كاميرا في الجهاز.'
            : 'No camera was found on this device.'
        );
        return;
      }

      const backCamera =
        cameras.find((camera) =>
          /back|rear|environment/i.test(camera.label)
        ) || cameras[cameras.length - 1];

      let qrHandled = false;

      await scanner.start(
        backCamera.id,
        {
          fps: 10,
          qrbox: {
            width: 240,
            height: 240
          }
        },
        async (decodedText) => {
          if (qrHandled) return;

          qrHandled = true;

          await stopScanner();

          await handleCheckInToken(decodedText);
        },
        () => {
          // Keep scanning until a QR code is found
        }
      );
    } catch {
      setCheckInError(
        lang === 'ar'
          ? 'تعذر تشغيل الكاميرا. تأكد من السماح للموقع باستخدام الكاميرا.'
          : 'Unable to start the camera. Please allow camera access.'
      );

      await stopScanner();
    }
  }, 150);
};

const d = t.dashboardPage;
  const isPdfCertificate = certificate?.file_name
    ?.toLowerCase()
    .endsWith('.pdf');

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 space-y-14">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DDD2BC] pb-8">
          <div className="space-y-2">
            <p className="text-sm font-bold text-[#4B5D16]">
              {d.statusLabel} · {d.statusAccepted}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3C4620]">
              {d.welcome.replace('{name}', profile.full_name)}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#3C4620] border border-[#3C4620]/30 hover:border-[#3C4620] rounded-md btn-press self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.nav.logout}</span>
          </button>
        </div>

        {/* First-login temporary password notice (if applicable) */}
        {(profile.must_change_password || passwordSaved) && (
          <section className="p-6 rounded-lg bg-[#ECE2CE] border border-[#DDD2BC] space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#3C4620]">
                {d.passwordChangeTitle}
              </h2>
              <p className="text-base text-[#3C4620]/85">
                {d.passwordChangeSubtitle}
              </p>
            </div>

            {passwordError && (
              <div
                role="alert"
                className="p-3 rounded bg-[#E45C10]/10 border border-[#E45C10] text-sm font-bold text-[#3C4620] flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-[#E45C10] shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSaved ? (
              <div className="flex items-center gap-2 text-base font-bold text-[#4B5D16]">
                <CheckCircle2 className="w-5 h-5" />
                <span>{d.passwordUpdatedMsg}</span>
              </div>
            ) : (
              <form
                onSubmit={handlePasswordChange}
                className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 max-w-xl"
              >
                <div className="flex-1 space-y-1.5">
                  <label
                    htmlFor="new-participant-pass"
                    className="block text-sm font-bold text-[#3C4620]"
                  >
                    {d.newPasswordLabel}
                  </label>
                  <input
                    id="new-participant-pass"
                    type="password"
                    dir="ltr"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] text-[#3C4620]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpdatingPass}
                  className="px-6 py-2.5 text-base font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] disabled:opacity-60 btn-press cursor-pointer"
                >
                  {d.updatePasswordBtn}
                </button>
              </form>
            )}
          </section>
        )}

        {/* Selected Track & Program Dates */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl font-bold text-[#3C4620] border-b border-[#DDD2BC] pb-3">
              {d.trackInfoTitle}
            </h2>

            {track && (
              <div className="flex flex-col sm:flex-row gap-6 items-start bg-[#FAF7F0] p-6 rounded-lg border border-[#DDD2BC]">
                <div className="w-28 h-28 rounded-md overflow-hidden bg-[#ECE2CE] border border-[#DDD2BC] shrink-0">
                  <TrackImage
                    slug={track.slug}
                    src={track.image}
                    alt={trackName}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#4B5D16]">
                    {lang === 'ar' ? track.numberAr : track.numberEn}
                  </p>
                  <h3 className="text-2xl font-bold text-[#3C4620]">
                    {trackName}
                  </h3>
                  <p className="text-base text-[#3C4620]/85 leading-relaxed">
                    {trackDesc}
                  </p>
                  <div className="pt-2">
                    <Link
                      to={track.route}
                      className="text-sm font-bold text-[#4B5D16] hover:text-[#3C4620] underline underline-offset-4"
                    >
                      {d.viewTrackPage}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Summary */}
            <div className="pt-4 space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#DDD2BC] pb-2">
                <h3 className="text-xl font-bold text-[#3C4620]">
                  {d.scheduleTitle}
                </h3>
                <span className="text-sm font-bold text-[#4B5D16]">
                  {d.scheduleValue}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                {OFFICIAL_PROGRAM_SCHEDULE.map((day) => (
                  <div key={day.dateEn} className="space-y-1.5">
                    <p className="text-sm font-bold text-[#4B5D16]">
                      {lang === 'ar' ? day.dayAr : day.dayEn} ·{' '}
                      {lang === 'ar' ? day.dateAr : day.dateEn}
                    </p>
                    <p className="text-base font-bold text-[#3C4620]">
                      {lang === 'ar' ? day.titleAr : day.titleEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Certificate Section */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-2xl font-bold text-[#3C4620] border-b border-[#DDD2BC] pb-3">
              {d.certificateTitle}
            </h2>

            <div className="p-6 rounded-lg bg-[#FAF7F0] border border-[#DDD2BC] space-y-5">
              {certificate ? (
                <>
                  <div className="space-y-1.5">
                    <p className="text-lg font-bold text-[#4B5D16]">
                      {certificate.file_name}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleViewCertificate}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] btn-press cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{d.viewCertificateBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadCertificate}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md border border-[#3C4620]/40 text-[#3C4620] hover:border-[#3C4620] btn-press cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{d.downloadCertificateBtn}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-bold text-[#3C4620]">
                    {d.certificateUnavailable}
                  </p>
                  <p className="text-sm text-[#3C4620]/75 leading-relaxed">
                    {d.certificateUnavailableNote}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
{/* Attendance */}
<section className="space-y-6">
  <div className="space-y-2 border-b border-[#DDD2BC] pb-3">
    <h2 className="text-2xl font-bold text-[#3C4620]">
      {d.attendanceTitle}
    </h2>

    <p className="text-sm text-[#3C4620]/75">
      {d.attendanceSubtitle}
    </p>
  </div>

  {attendanceLoading && attendance.length === 0 ? (
    <p className="text-sm font-bold text-[#4B5D16]">
      {t.common.loading}
    </p>
  ) : attendanceError ? (
    <div className="p-4 rounded-md border border-[#E45C10]/40 bg-[#E45C10]/5">
      <p className="text-sm font-bold text-[#E45C10]">
        {attendanceError}
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {attendance.map((session) => {
        const state = getAttendanceState(session);

        const dateLabel = new Intl.DateTimeFormat(
          lang === 'ar' ? 'ar-SA' : 'en-US',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }
        ).format(new Date(`${session.session_date}T12:00:00`));

        return (
          <div
            key={session.session_id}
            className="p-5 rounded-lg bg-[#FAF7F0] border border-[#DDD2BC] space-y-4"
          >
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#E45C10]">
                {lang === 'ar'
                  ? `اليوم ${session.day_number}`
                  : `Day ${session.day_number}`}
              </p>

              <p className="text-lg font-bold text-[#3C4620]">
                {dateLabel}
              </p>
            </div>

            {state === 'attended' && (
              <div className="flex items-center gap-2 text-[#4B5D16] font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>{d.attendanceRecorded}</span>
              </div>
            )}

            {state === 'before' && (
              <p className="text-sm text-[#3C4620]/70">
                {d.attendanceNotStarted}
              </p>
            )}

            {state === 'closed' && (
              <p className="text-sm text-[#3C4620]/70">
                {d.attendanceClosed}
              </p>
            )}

{state === 'open' && (
  <button
    type="button"
    onClick={openScanner}
    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#3C4620] text-[#ECE2CE] font-bold hover:bg-[#4B5D16] transition-colors cursor-pointer btn-press"
  >
    <ScanLine className="w-5 h-5" />
    <span>{d.attendanceButton}</span>
  </button>
)}
          </div>
        );
      })}
    </div>
  )}
</section>
        {/* Participant Personal Information */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[#3C4620] border-b border-[#DDD2BC] pb-3">
            {d.personalInfoTitle}
          </h2>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <div className="space-y-1 border-b border-[#DDD2BC]/70 pb-3">
              <dt className="text-sm text-[#3C4620]/70">{d.fullName}</dt>
              <dd className="text-lg font-bold text-[#3C4620]">
                {profile.full_name}
              </dd>
            </div>
            <div className="space-y-1 border-b border-[#DDD2BC]/70 pb-3">
              <dt className="text-sm text-[#3C4620]/70">{d.email}</dt>
              <dd dir="ltr" className="text-lg font-bold text-[#3C4620] text-start">
                {profile.email}
              </dd>
            </div>
            <div className="space-y-1 border-b border-[#DDD2BC]/70 pb-3">
              <dt className="text-sm text-[#3C4620]/70">{d.phone}</dt>
              <dd
                dir="ltr"
                className="text-lg font-bold text-[#3C4620] tabular-nums text-start"
              >
                {profile.phone}
              </dd>
            </div>
            <div className="space-y-1 border-b border-[#DDD2BC]/70 pb-3">
              <dt className="text-sm text-[#3C4620]/70">{d.university}</dt>
              <dd className="text-lg font-bold text-[#3C4620]">
                {profile.university}
              </dd>
            </div>
            <div className="space-y-1 border-b border-[#DDD2BC]/70 pb-3">
              <dt className="text-sm text-[#3C4620]/70">{d.major}</dt>
              <dd className="text-lg font-bold text-[#3C4620]">
                {profile.major}
              </dd>
            </div>
            <div className="space-y-1 border-b border-[#DDD2BC]/70 pb-3">
              <dt className="text-sm text-[#3C4620]/70">{d.academicLevel}</dt>
              <dd className="text-lg font-bold text-[#3C4620]">
                {profile.academic_level}
              </dd>
            </div>
            <div className="space-y-1 border-b border-[#DDD2BC]/70 pb-3">
              <dt className="text-sm text-[#3C4620]/70">{d.universityId}</dt>
              <dd
                dir="ltr"
                className="text-lg font-bold text-[#3C4620] tabular-nums text-start"
              >
                {profile.university_id}
              </dd>
            </div>
          </dl>
        </section>
      </div>
{/* Attendance QR Scanner Modal */}
{scannerOpen && (
  <div
    role="dialog"
    aria-modal="true"
    className="fixed inset-0 z-50 bg-[#3C4620]/80 flex items-center justify-center p-4"
  >
    <div className="w-full max-w-md rounded-xl bg-[#F6F1E6] border border-[#DDD2BC] p-5 space-y-5">

      <div className="flex items-start justify-between gap-4 border-b border-[#DDD2BC] pb-3">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[#3C4620]">
            {lang === 'ar'
              ? 'تسجيل الحضور'
              : 'Attendance Check-In'}
          </h3>

          <p className="text-sm text-[#3C4620]/70">
            {lang === 'ar'
              ? 'وجّه الكاميرا نحو رمز QR المعروض في القاعة.'
              : 'Point your camera at the QR code displayed in the hall.'}
          </p>
        </div>

        <button
          type="button"
          onClick={closeScanner}
          className="p-2 rounded-md hover:bg-[#ECE2CE] text-[#3C4620] cursor-pointer shrink-0"
          aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!checkInMessage && (
        <div
          id="attendance-qr-reader"
          className="w-full overflow-hidden rounded-lg bg-black min-h-[280px]"
        />
      )}

      {scanning && (
        <p className="text-center text-sm font-bold text-[#4B5D16]">
          {lang === 'ar'
            ? 'جاري تسجيل حضورك...'
            : 'Recording your attendance...'}
        </p>
      )}

      {checkInMessage && (
        <div className="flex items-center gap-3 p-4 rounded-md bg-[#4B5D16]/10 border border-[#4B5D16]/30">
          <CheckCircle2 className="w-6 h-6 text-[#4B5D16] shrink-0" />

          <p className="font-bold text-[#3C4620]">
            {checkInMessage}
          </p>
        </div>
      )}

      {checkInError && (
        <div className="flex items-center gap-3 p-4 rounded-md bg-[#E45C10]/10 border border-[#E45C10]/30">
          <AlertCircle className="w-6 h-6 text-[#E45C10] shrink-0" />

          <p className="font-bold text-[#3C4620]">
            {checkInError}
          </p>
        </div>
      )}

    </div>
  </div>
)}
      {/* Private Certificate Preview Modal */}
      {previewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#3C4620]/75 flex items-center justify-center p-4"
        >
          <div className="bg-[#F6F1E6] border border-[#DDD2BC] rounded-lg max-w-4xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDD2BC] pb-3">
              <h3 className="text-xl font-bold text-[#3C4620]">
                {d.certificateTitle}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="p-1.5 rounded-md hover:bg-[#ECE2CE] text-[#3C4620] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FAF7F0] border border-[#DDD2BC] rounded overflow-hidden flex items-center justify-center max-h-[72vh]">
              {isPdfCertificate ? (
                <iframe
                  src={previewUrl}
                  title={d.certificateTitle}
                  className="w-full h-[70vh] border-0"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={d.certificateTitle}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[70vh] object-contain"
                />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadCertificate}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{d.downloadCertificateBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
