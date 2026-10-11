import React, { useState, useMemo, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Search,
  LogOut,
  CheckCircle2,
  XCircle,
  Upload,
  Eye,
  X,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useProgramStore } from '../services/programStore';
import { TRACKS, TRACKS_BY_SLUG } from '../config/tracks';
import { ApplicationStatus, RegistrationRecord, TrackSlug } from '../types';
import QRCode from 'react-qr-code';
import { supabase } from '../integrations/supabase/client';

interface AdminAttendanceSession {
  id: string;
  day_number: number;
  session_date: string;
  opens_at: string;
  closes_at: string;
  is_active: boolean;
  qr_token: string;
}
interface AdminAttendanceRecord {
  id: string;
  participant_id: string;
  session_id: string;
  checked_in_at: string;
}
export const AdminPage: React.FC = () => {
  const { lang, t } = useLanguage();
const {
  currentUser,
  authLoading,
  dataLoading,
  signOut,
  registrations,
  participants,
  certificates,
  settings,
  registrationState,
  refreshAdminData,
  reviewApplication,
  generateParticipantCredentials,
  issueOrUploadCertificate,
  deleteCertificate,
  getSignedCertificateUrl,
  updateRegistrationWindow
} = useProgramStore();
  const navigate = useNavigate();

const [activeTab, setActiveTab] = useState<
  'registrations' | 'participants' | 'attendance' | 'settings'
>('registrations');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>(
    'all'
  );
  const [trackFilter, setTrackFilter] = useState<TrackSlug | 'all'>('all');
  const [participantTrackFilter, setParticipantTrackFilter] =
  useState<TrackSlug | 'all'>('all');

  // Applicant Modal State
  const [selectedReg, setSelectedReg] = useState<RegistrationRecord | null>(
    null
  );
  const [isReviewing, setIsReviewing] = useState(false);
  const [modalError, setModalError] = useState('');
  const [generatedCreds, setGeneratedCreds] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [selectedAcceptanceTrack, setSelectedAcceptanceTrack] =
  useState<TrackSlug | null>(null);

  // Certificates state
  const [uploadingParticipantId, setUploadingParticipantId] = useState<
    string | null
  >(null);
  const [deletingCertificateId, setDeletingCertificateId] =
  useState<string | null>(null);
  const [credentialsLoadingId, setCredentialsLoadingId] =
  useState<string | null>(null);

const [participantCredentials, setParticipantCredentials] = useState<{
  participantId: string;
  name: string;
  email: string;
  temporaryPassword: string;
} | null>(null);
  const [previewCertUrl, setPreviewCertUrl] = useState<string | null>(null);
  const [previewCertIsPdf, setPreviewCertIsPdf] = useState<boolean>(false);

  // Settings state
  const [openAtInput, setOpenAtInput] = useState(
    settings.registration_open_at.slice(0, 16)
  );
  const [closeAtInput, setCloseAtInput] = useState(
    settings.registration_close_at.slice(0, 16)
  );
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [attendanceSessions, setAttendanceSessions] = useState<
  AdminAttendanceSession[]
>([]);
const [attendanceAdminLoading, setAttendanceAdminLoading] =
  useState(false);
const [attendanceAdminError, setAttendanceAdminError] =
  useState('');
const [savingAttendanceId, setSavingAttendanceId] =
  useState<string | null>(null);
const [attendanceRecords, setAttendanceRecords] = useState<
  AdminAttendanceRecord[]
>([]);

const [manualParticipantBySession, setManualParticipantBySession] =
  useState<Record<string, string>>({});

const [manualAttendanceSavingId, setManualAttendanceSavingId] =
  useState<string | null>(null);

  useEffect(() => {
    setOpenAtInput(settings.registration_open_at.slice(0, 16));
    setCloseAtInput(settings.registration_close_at.slice(0, 16));
  }, [settings.registration_open_at, settings.registration_close_at]);

  

  useEffect(() => {
    if (!authLoading && currentUser?.role === 'admin') {
      refreshAdminData().catch(() => {
        // Handled by empty/error states
      });
    }
  }, [authLoading, currentUser?.id, currentUser?.role, refreshAdminData]);

  const loadAttendanceSessions = async () => {
  if (!supabase) return;

  setAttendanceAdminLoading(true);
  setAttendanceAdminError('');

  const { data, error } = await supabase
    .from('attendance_sessions')
    .select(
      'id, day_number, session_date, opens_at, closes_at, is_active, qr_token'
    )
    .order('day_number');

  if (error) {
    setAttendanceAdminError(
      lang === 'ar'
        ? 'تعذر تحميل جلسات الحضور.'
        : 'Unable to load attendance sessions.'
    );
  } else {
    setAttendanceSessions(
      (data || []) as AdminAttendanceSession[]
    );
  }

  setAttendanceAdminLoading(false);
};
const loadAttendanceRecords = async () => {
  if (!supabase) return;

  const { data, error } = await supabase
    .from('attendance_records')
    .select(
      'id, participant_id, session_id, checked_in_at'
    )
    .order('checked_in_at', { ascending: true });

  if (error) {
    setAttendanceAdminError(
      lang === 'ar'
        ? 'تعذر تحميل سجلات الحضور.'
        : 'Unable to load attendance records.'
    );
    return;
  }

  setAttendanceRecords(
    (data || []) as AdminAttendanceRecord[]
  );
};
  
useEffect(() => {
  if (!authLoading && currentUser?.role === 'admin') {
    loadAttendanceSessions();
    loadAttendanceRecords();

    const timer = window.setInterval(() => {
      loadAttendanceRecords();
    }, 10000);

    return () => {
      window.clearInterval(timer);
    };
  }
}, [
  authLoading,
  currentUser?.id,
  currentUser?.role
]);

const toDateTimeLocal = (iso: string) => {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 16);
};

const handleAttendanceTimeChange = (
  sessionId: string,
  field: 'opens_at' | 'closes_at',
  value: string
) => {
  setAttendanceSessions((current) =>
    current.map((session) =>
      session.id === sessionId
        ? {
            ...session,
            [field]: new Date(value).toISOString()
          }
        : session
    )
  );
};

const handleSaveAttendanceSession = async (
  session: AdminAttendanceSession
) => {
  if (!supabase) return;

  setSavingAttendanceId(session.id);
  setAttendanceAdminError('');

  const { error } = await supabase
    .from('attendance_sessions')
    .update({
      opens_at: session.opens_at,
      closes_at: session.closes_at
    })
    .eq('id', session.id);

  if (error) {
    setAttendanceAdminError(
      lang === 'ar'
        ? 'تعذر حفظ وقت الحضور.'
        : 'Unable to save attendance time.'
    );
  } else {
    await loadAttendanceSessions();
  }

  setSavingAttendanceId(null);
};

const handleToggleAttendance = async (
  session: AdminAttendanceSession
) => {
  if (!supabase) return;

  setSavingAttendanceId(session.id);
  setAttendanceAdminError('');

  const { error } = await supabase
    .from('attendance_sessions')
    .update({
      is_active: !session.is_active
    })
    .eq('id', session.id);

  if (error) {
    setAttendanceAdminError(
      lang === 'ar'
        ? 'تعذر تغيير حالة الحضور.'
        : 'Unable to change attendance status.'
    );
  } else {
    await loadAttendanceSessions();
  }

  setSavingAttendanceId(null);
};

const handleRegenerateAttendanceQr = async (
  session: AdminAttendanceSession
) => {
  if (!supabase) return;

  setSavingAttendanceId(session.id);
  setAttendanceAdminError('');

  const { error } = await supabase
    .from('attendance_sessions')
    .update({
      qr_token: crypto.randomUUID()
    })
    .eq('id', session.id);

  if (error) {
    setAttendanceAdminError(
      lang === 'ar'
        ? 'تعذر إنشاء رمز QR جديد.'
        : 'Unable to generate a new QR code.'
    );
  } else {
    await loadAttendanceSessions();
  }

  setSavingAttendanceId(null);
};
const handleManualAttendance = async (
  session: AdminAttendanceSession
) => {
  if (!supabase) return;

  const participantId =
    manualParticipantBySession[session.id];

  if (!participantId) return;

  setManualAttendanceSavingId(session.id);
  setAttendanceAdminError('');

  const { error } = await supabase
    .from('attendance_records')
    .upsert(
      {
        participant_id: participantId,
        session_id: session.id
      },
      {
        onConflict: 'participant_id,session_id',
        ignoreDuplicates: true
      }
    );

  if (error) {
    setAttendanceAdminError(
      lang === 'ar'
        ? 'تعذر تسجيل حضور المشارك يدويًا.'
        : 'Unable to record manual attendance.'
    );
  } else {
    await loadAttendanceRecords();

    setManualParticipantBySession((current) => ({
      ...current,
      [session.id]: ''
    }));
  }

  setManualAttendanceSavingId(null);
};
  const filteredRegistrations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return registrations.filter((reg) => {
      if (statusFilter !== 'all' && reg.status !== statusFilter) return false;
if (
  trackFilter !== 'all' &&
  reg.selected_track_id !== trackFilter &&
  reg.second_track_id !== trackFilter
) {
  return false;
}
      if (!q) return true;
      return (
        reg.full_name.toLowerCase().includes(q) ||
        reg.email.toLowerCase().includes(q) ||
        reg.university_id.toLowerCase().includes(q) ||
        reg.phone.toLowerCase().includes(q)
      );
    });
  }, [registrations, searchQuery, statusFilter, trackFilter]);
const filteredParticipants = useMemo(() => {
  if (participantTrackFilter === 'all') {
    return participants;
  }

  return participants.filter(
    (participant) =>
      participant.selected_track_id === participantTrackFilter
  );
}, [participants, participantTrackFilter]);
  if (authLoading) {
    return (
      <div className="py-24 text-center text-lg font-bold text-[#3C4620]">
        {t.common.loading}
      </div>
    );
  }

  // Enforce strict Admin authorization
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

const handleOpenApplicant = (reg: RegistrationRecord) => {
  setSelectedReg(reg);
  setSelectedAcceptanceTrack(reg.selected_track_id);
  setGeneratedCreds(null);
  setModalError('');
};

const handleReviewDecision = async (
  decision: 'accepted' | 'rejected' | 'pending'
) => {
    if (!selectedReg || isReviewing) return;
    setIsReviewing(true);
    setModalError('');
    try {
const result = await reviewApplication(
  selectedReg.id,
  decision,
  decision === 'accepted'
    ? selectedAcceptanceTrack || selectedReg.selected_track_id
    : undefined
);

setSelectedReg((prev) =>
  prev
    ? {
        ...prev,
        status: decision,
        participant_account_created:
          decision === 'accepted'
            ? true
            : prev.participant_account_created
      }
    : null
);

if (result.generatedCredentials) {
  setGeneratedCreds(result.generatedCredentials);
} else {
  setGeneratedCreds(null);
}
    } catch {
      setModalError(t.adminPage.modal.actionError);
    } finally {
      setIsReviewing(false);
    }
  };
const handleGenerateParticipantCredentials = async (
  participantId: string,
  participantName: string
) => {
  const confirmed = window.confirm(
    lang === 'ar'
      ? 'سيتم إنشاء كلمة مرور مؤقتة جديدة لهذا المشارك. إذا كان لديه كلمة مرور سابقة فلن تعمل بعد الآن. هل تريدين المتابعة؟'
      : 'A new temporary password will be created for this participant. Any previous password will stop working. Continue?'
  );

  if (!confirmed) return;

  setCredentialsLoadingId(participantId);

  try {
    const result = await generateParticipantCredentials(
      participantId
    );

    setParticipantCredentials({
      participantId,
      name: participantName,
      email: result.email,
      temporaryPassword: result.temporaryPassword
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'UNKNOWN_ERROR';

    window.alert(
      lang === 'ar'
        ? `تعذر إنشاء بيانات الدخول.\n\nالخطأ: ${message}`
        : `Unable to generate login credentials.\n\nError: ${message}`
    );
  } finally {
    setCredentialsLoadingId(null);
  }
};

const handleCopyCredentials = async () => {
  if (!participantCredentials) return;

  const text =
    lang === 'ar'
      ? `بيانات الدخول لبرنامج مسارات الإدارات القانونية

البريد الإلكتروني: ${participantCredentials.email}
كلمة المرور المؤقتة: ${participantCredentials.temporaryPassword}

يمكنك تسجيل الدخول باستخدام البيانات أعلاه، ثم تغيير كلمة المرور بعد الدخول.`
      : `Legal Department Tracks Login Details

Email: ${participantCredentials.email}
Temporary Password: ${participantCredentials.temporaryPassword}

You can sign in using the details above and change your password after logging in.`;

  await navigator.clipboard.writeText(text);

  window.alert(
    lang === 'ar'
      ? 'تم نسخ بيانات الدخول.'
      : 'Login details copied.'
  );
};
  const handleIssueDefaultCertificate = async (participantId: string) => {
    setUploadingParticipantId(participantId);
    try {
      await issueOrUploadCertificate(participantId, null);
    } catch {
      // Handled silently
    } finally {
      setUploadingParticipantId(null);
    }
  };

  const handleFileUploadCertificate = async (
    participantId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingParticipantId(participantId);
    try {
      await issueOrUploadCertificate(participantId, file);
    } catch {
      // Handled silently
    } finally {
      setUploadingParticipantId(null);
      e.target.value = '';
    }
  };

  const handlePreviewCert = async (participantId: string) => {
    try {
      const cert = certificates[participantId];
      const url = await getSignedCertificateUrl(participantId);
      if (url) {
        setPreviewCertIsPdf(
          Boolean(cert?.file_name?.toLowerCase().endsWith('.pdf'))
        );
        setPreviewCertUrl(url);
      }
    } catch {
      // Ignore preview failure
    }
  };
const handleDeleteCertificate = async (
  participantId: string
) => {
  const confirmed = window.confirm(
    lang === 'ar'
      ? 'هل أنت متأكد من حذف الشهادة؟ سيعود بإمكانك إصدار شهادة جديدة لهذا المشارك.'
      : 'Are you sure you want to delete this certificate? You can issue a new certificate afterward.'
  );

  if (!confirmed) return;

  setDeletingCertificateId(participantId);

  try {
    await deleteCertificate(participantId);
  } catch {
    window.alert(
      lang === 'ar'
        ? 'تعذر حذف الشهادة.'
        : 'Unable to delete the certificate.'
    );
  } finally {
    setDeletingCertificateId(null);
  }
};
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSaved(false);

    const openDate = new Date(openAtInput);
    const closeDate = new Date(closeAtInput);

    if (
      Number.isNaN(openDate.getTime()) ||
      Number.isNaN(closeDate.getTime()) ||
      openDate.getTime() >= closeDate.getTime()
    ) {
      setSettingsError(t.adminPage.settings.invalidDateRange);
      return;
    }

    try {
      await updateRegistrationWindow(
        openDate.toISOString(),
        closeDate.toISOString()
      );
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch {
      setSettingsError(t.adminPage.modal.actionError);
    }
  };

  const a = t.adminPage;

  const getTrackLabel = (slug: TrackSlug) => {
    const tr = TRACKS_BY_SLUG[slug];
    if (!tr) return slug;
    return lang === 'ar' ? tr.nameAr : tr.nameEn;
  };

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-10">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DDD2BC] pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#3C4620]">{a.title}</h1>
            <p className="text-base text-[#3C4620]/80">{a.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#3C4620] border border-[#3C4620]/30 hover:border-[#3C4620] rounded-md self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.nav.logout}</span>
          </button>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#DDD2BC] pb-4">
          {(
            [
{
  id: 'registrations',
  label: a.tabs.registrations,
  count: registrations.length
},
{
  id: 'participants',
  label: a.tabs.participants,
  count: participants.length
},
{
  id: 'attendance',
  label: lang === 'ar' ? 'الحضور' : 'Attendance'
},
{
  id: 'settings',
  label: a.tabs.settings
}
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-base font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#3C4620] text-[#ECE2CE]'
                    : 'bg-[#FAF7F0] text-[#3C4620] border border-[#DDD2BC] hover:border-[#4B5D16]'
                }`}
              >
                <span>{tab.label}</span>
                {'count' in tab && tab.count !== undefined && (
                  <span className="ms-2 text-sm opacity-80 tabular-nums">
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {dataLoading && (
          <div className="py-8 text-center text-base font-bold text-[#3C4620]/80">
            {t.common.loading}
          </div>
        )}

        {/* TAB 1: REGISTRATIONS */}
        {!dataLoading && activeTab === 'registrations' && (
          <div className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-[#3C4620]/60 absolute top-3.5 start-3.5 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={a.searchPlaceholder}
                  className="w-full ps-10 pe-4 py-2.5 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] text-[#3C4620] text-base"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as ApplicationStatus | 'all')
                  }
                  aria-label={a.table.status}
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] text-[#3C4620] text-base font-bold"
                >
                  <option value="all">{a.filterStatusAll}</option>
                  <option value="pending">{a.filterStatusPending}</option>
                  <option value="accepted">{a.filterStatusAccepted}</option>
                  <option value="rejected">{a.filterStatusRejected}</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={trackFilter}
                  onChange={(e) =>
                    setTrackFilter(e.target.value as TrackSlug | 'all')
                  }
                  aria-label={a.table.track}
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] text-[#3C4620] text-base font-bold"
                >
                  <option value="all">{a.filterTrackAll}</option>
                  {TRACKS.map((tr) => (
                    <option key={tr.slug} value={tr.slug}>
                      {lang === 'ar' ? tr.nameAr : tr.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Registrations Table */}
            <div className="bg-[#FAF7F0] border border-[#DDD2BC] rounded-lg overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="border-b border-[#DDD2BC] bg-[#ECE2CE]/60 text-sm font-bold text-[#3C4620]">
                    <th className="py-3.5 px-4 text-start">{a.table.applicant}</th>
                    <th className="py-3.5 px-4 text-start">{a.table.university}</th>
<th className="py-3.5 px-4 text-start">الرغبة الأولى</th>
<th className="py-3.5 px-4 text-start">الرغبة الثانية</th>
                    <th className="py-3.5 px-4 text-start">{a.table.status}</th>
                    <th className="py-3.5 px-4 text-end">{a.table.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD2BC] text-base">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-[#3C4620]/70"
                      >
                        {a.table.noResults}
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <tr
                        key={reg.id}
                        className="hover:bg-[#ECE2CE]/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="font-bold text-[#3C4620]">
                            {reg.full_name}
                          </div>
                          <div
                            dir="ltr"
                            className="text-sm text-[#3C4620]/70 text-start tabular-nums"
                          >
                            {reg.email} · {reg.phone}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-[#3C4620]">{reg.university}</div>
                          <div className="text-sm text-[#3C4620]/70">
                            {reg.academic_level} ·{' '}
                            <span className="tabular-nums">
                              {reg.university_id}
                            </span>
                          </div>
                        </td>
<td className="py-4 px-4 font-bold text-[#3C4620]">
  {getTrackLabel(reg.selected_track_id)}
</td>

<td className="py-4 px-4 font-bold text-[#3C4620]">
  {reg.second_track_id
    ? getTrackLabel(reg.second_track_id)
    : '—'}
</td>
                        <td className="py-4 px-4">
                          <span
                            className={`text-sm font-bold ${
                              reg.status === 'accepted'
                                ? 'text-[#4B5D16]'
                                : reg.status === 'rejected'
                                ? 'text-[#E45C10]'
                                : 'text-[#3C4620]/80'
                            }`}
                          >
                            {a.statusLabels[reg.status]}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-end">
<button
  type="button"
  onClick={() => handleOpenApplicant(reg)}
  className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
    reg.status === 'accepted'
      ? 'bg-[#4B5D16] text-[#ECE2CE]'
      : reg.status === 'rejected'
      ? 'bg-[#E45C10]/10 text-[#E45C10] border border-[#E45C10]/40'
      : 'bg-[#ECE2CE] text-[#3C4620] hover:bg-[#3C4620] hover:text-[#ECE2CE]'
  }`}
>
  {reg.status === 'accepted'
    ? lang === 'ar'
      ? 'تم القبول'
      : 'Accepted'
    : reg.status === 'rejected'
    ? lang === 'ar'
      ? 'تم الرفض'
      : 'Rejected'
    : a.table.openDetails}
</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ACCEPTED PARTICIPANTS & CERTIFICATES */}
{!dataLoading && activeTab === 'participants' && (
  <div className="space-y-4">

    <div className="flex justify-end">
      <select
        value={participantTrackFilter}
        onChange={(e) =>
          setParticipantTrackFilter(
            e.target.value as TrackSlug | 'all'
          )
        }
        className="w-full sm:w-64 px-4 py-2.5 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] text-[#3C4620] font-bold"
      >
<option value="all">
  {lang === 'ar'
    ? `جميع المسارات (${participants.length})`
    : `All Tracks (${participants.length})`}
</option>

{TRACKS.map((track) => {
  const count = participants.filter(
    (participant) =>
      participant.selected_track_id === track.slug
  ).length;

  return (
    <option
      key={track.slug}
      value={track.slug}
    >
      {lang === 'ar'
        ? `${track.nameAr} (${count})`
        : `${track.nameEn} (${count})`}
    </option>
  );
})}
      </select>
    </div>

    <div className="bg-[#FAF7F0] border border-[#DDD2BC] rounded-lg overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-[#DDD2BC] bg-[#ECE2CE]/60 text-sm font-bold text-[#3C4620]">
                  <th className="py-3.5 px-4 text-start">{a.table.applicant}</th>
                  <th className="py-3.5 px-4 text-start">{a.table.track}</th>
                  <th className="py-3.5 px-4 text-start">
                    {a.participants.certificateStatus}
                  </th>
                  <th className="py-3.5 px-4 text-end">{a.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDD2BC] text-base">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-10 text-center text-[#3C4620]/70"
                    >
                      {a.table.noParticipants}
                    </td>
                  </tr>
                ) : (
                 filteredParticipants.map((part) => {
                    const cert = certificates[part.id];
                    const isBusy = uploadingParticipantId === part.id;
                    return (
                      <tr key={part.id} className="hover:bg-[#ECE2CE]/30">
                        <td className="py-4 px-4">
                          <div className="font-bold text-[#3C4620]">
                            {part.full_name}
                          </div>
                          <div
                            dir="ltr"
                            className="text-sm text-[#3C4620]/70 text-start tabular-nums"
                          >
                            {part.email} · {part.university_id}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-[#3C4620]">
                          {getTrackLabel(part.selected_track_id)}
                        </td>
                        <td className="py-4 px-4">
                          {cert ? (
                            <span className="text-sm font-bold text-[#4B5D16]">
                              {a.participants.certIssued} ({cert.file_name})
                            </span>
                          ) : (
                            <span className="text-sm text-[#3C4620]/70">
                              {a.participants.certNotIssued}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-end">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
  type="button"
  disabled={credentialsLoadingId === part.id}
  onClick={() =>
    handleGenerateParticipantCredentials(
      part.id,
      part.full_name
    )
  }
  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold rounded-md border border-[#4B5D16] text-[#4B5D16] hover:bg-[#4B5D16] hover:text-[#ECE2CE] disabled:opacity-50 cursor-pointer"
>
  <KeyRound className="w-3.5 h-3.5" />

  <span>
    {credentialsLoadingId === part.id
      ? lang === 'ar'
        ? 'جاري الإنشاء...'
        : 'Generating...'
      : lang === 'ar'
      ? 'إنشاء بيانات الدخول'
      : 'Generate Login Details'}
  </span>
</button>
{cert && (
  <>
    <button
      type="button"
      onClick={() => handlePreviewCert(part.id)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md border border-[#3C4620]/30 text-[#3C4620] hover:border-[#3C4620] cursor-pointer"
    >
      <Eye className="w-3.5 h-3.5" />
      <span>{a.participants.viewCertBtn}</span>
    </button>

    <button
      type="button"
      disabled={deletingCertificateId === part.id}
      onClick={() => handleDeleteCertificate(part.id)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md border border-[#E45C10] text-[#E45C10] hover:bg-[#E45C10] hover:text-white disabled:opacity-50 cursor-pointer"
    >
      <XCircle className="w-3.5 h-3.5" />

      <span>
        {deletingCertificateId === part.id
          ? lang === 'ar'
            ? 'جاري الحذف...'
            : 'Deleting...'
          : lang === 'ar'
          ? 'حذف الشهادة'
          : 'Delete Certificate'}
      </span>
    </button>
  </>
)}

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleIssueDefaultCertificate(part.id)
                              }
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] disabled:opacity-60 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {isBusy
                                  ? a.participants.uploading
                                  : cert
                                  ? a.participants.replaceCertBtn
                                  : a.participants.uploadCertBtn}
                              </span>
                            </button>

                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md bg-[#ECE2CE] text-[#3C4620] hover:bg-[#DDD2BC] cursor-pointer">
                              <Upload className="w-3.5 h-3.5" />
                              <span>PDF / PNG</span>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.svg"
                                onChange={(e) =>
                                  handleFileUploadCertificate(part.id, e)
                                }
                                className="hidden"
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}
{/* ATTENDANCE MANAGEMENT */}
{!dataLoading && activeTab === 'attendance' && (
  <div className="space-y-6">

    <div className="space-y-1">
      <h2 className="text-2xl font-bold text-[#3C4620]">
        {lang === 'ar'
          ? 'إدارة الحضور'
          : 'Attendance Management'}
      </h2>

      <p className="text-sm text-[#3C4620]/70">
        {lang === 'ar'
          ? 'يمكنك تحديد وقت الحضور وفتحه أو إغلاقه وعرض رمز QR لكل يوم.'
          : 'Set attendance times, open or close check-in, and display the QR code for each day.'}
      </p>
    </div>

    {attendanceAdminError && (
      <div className="p-4 rounded-md bg-[#E45C10]/10 border border-[#E45C10]/30">
        <p className="font-bold text-[#E45C10]">
          {attendanceAdminError}
        </p>
      </div>
    )}

    {attendanceAdminLoading ? (
      <p className="font-bold text-[#3C4620]">
        {t.common.loading}
      </p>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {attendanceSessions.map((session) => {
          const isBusy =
            savingAttendanceId === session.id;
const sessionRecords = attendanceRecords.filter(
  (record) => record.session_id === session.id
);

const attendedParticipantIds = new Set(
  sessionRecords.map((record) => record.participant_id)
);

const availableParticipants = participants.filter(
  (participant) =>
    !attendedParticipantIds.has(participant.id)
);
          return (
            <div
              key={session.id}
              className="bg-[#FAF7F0] border border-[#DDD2BC] rounded-xl p-5 space-y-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#E45C10]">
                    {lang === 'ar'
                      ? `اليوم ${session.day_number}`
                      : `Day ${session.day_number}`}
                  </p>

                  <p className="font-bold text-[#3C4620]">
                    {session.session_date}
                  </p>
                </div>

                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full ${
                    session.is_active
                      ? 'bg-[#4B5D16]/10 text-[#4B5D16]'
                      : 'bg-[#DDD2BC] text-[#3C4620]/70'
                  }`}
                >
                  {session.is_active
                    ? lang === 'ar'
                      ? 'مفتوح'
                      : 'Open'
                    : lang === 'ar'
                    ? 'مغلق'
                    : 'Closed'}
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#3C4620]">
                  {lang === 'ar'
                    ? 'وقت فتح الحضور'
                    : 'Check-in opens'}
                </label>

                <input
                  type="datetime-local"
                  dir="ltr"
                  value={toDateTimeLocal(session.opens_at)}
                  onChange={(e) =>
                    handleAttendanceTimeChange(
                      session.id,
                      'opens_at',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 rounded-md border border-[#DDD2BC] bg-[#F6F1E6]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#3C4620]">
                  {lang === 'ar'
                    ? 'وقت إغلاق الحضور'
                    : 'Check-in closes'}
                </label>

                <input
                  type="datetime-local"
                  dir="ltr"
                  value={toDateTimeLocal(session.closes_at)}
                  onChange={(e) =>
                    handleAttendanceTimeChange(
                      session.id,
                      'closes_at',
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 rounded-md border border-[#DDD2BC] bg-[#F6F1E6]"
                />
              </div>

              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  handleSaveAttendanceSession(session)
                }
                className="w-full px-4 py-2 rounded-md border border-[#3C4620]/30 text-[#3C4620] font-bold hover:border-[#3C4620] disabled:opacity-50"
              >
                {lang === 'ar'
                  ? 'حفظ الوقت'
                  : 'Save Time'}
              </button>

              <div className="border-t border-[#DDD2BC] pt-5 space-y-4">
                <div className="bg-white p-4 rounded-lg flex justify-center">
                  <QRCode
                    value={session.qr_token}
                    size={180}
                    bgColor="#FFFFFF"
                    fgColor="#3C4620"
                  />
                </div>

                <p className="text-xs text-center text-[#3C4620]/65">
                  {lang === 'ar'
                    ? 'اعرض هذا الرمز للمشاركين داخل القاعة.'
                    : 'Display this code to participants in the hall.'}
                </p>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    handleRegenerateAttendanceQr(session)
                  }
                  className="w-full px-4 py-2 rounded-md bg-[#ECE2CE] text-[#3C4620] font-bold hover:bg-[#DDD2BC] disabled:opacity-50"
                >
                  {lang === 'ar'
                    ? 'إنشاء QR جديد'
                    : 'Generate New QR'}
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    handleToggleAttendance(session)
                  }
                  className={`w-full px-4 py-3 rounded-md font-bold disabled:opacity-50 ${
                    session.is_active
                      ? 'bg-[#E45C10] text-white'
                      : 'bg-[#4B5D16] text-[#ECE2CE]'
                  }`}
                >
                  {session.is_active
                    ? lang === 'ar'
                      ? 'إغلاق الحضور'
                      : 'Close Attendance'
                    : lang === 'ar'
                    ? 'فتح الحضور'
                    : 'Open Attendance'}
                </button>
<div className="border-t border-[#DDD2BC] pt-5 space-y-4">

  <div className="flex items-center justify-between gap-3">
    <h3 className="font-bold text-[#3C4620]">
      {lang === 'ar'
        ? 'الحاضرون'
        : 'Attendees'}
    </h3>

    <span className="px-3 py-1 rounded-full bg-[#4B5D16]/10 text-[#4B5D16] text-sm font-bold">
      {sessionRecords.length}
    </span>
  </div>

  {sessionRecords.length === 0 ? (
    <p className="text-sm text-[#3C4620]/60">
      {lang === 'ar'
        ? 'لم يتم تسجيل حضور أي مشارك حتى الآن.'
        : 'No attendance has been recorded yet.'}
    </p>
  ) : (
    <div className="space-y-2 max-h-52 overflow-y-auto">
      {sessionRecords.map((record) => {
        const participant = participants.find(
          (item) =>
            item.id === record.participant_id
        );

        return (
          <div
            key={record.id}
            className="flex items-center justify-between gap-3 p-3 rounded-md bg-[#ECE2CE]/50"
          >
            <div>
              <p className="text-sm font-bold text-[#3C4620]">
                {participant?.full_name ||
                  (lang === 'ar'
                    ? 'مشارك'
                    : 'Participant')}
              </p>

              {participant && (
                <p
                  dir="ltr"
                  className="text-xs text-[#3C4620]/60 text-start"
                >
                  {participant.university_id}
                </p>
              )}
            </div>

            <CheckCircle2 className="w-5 h-5 text-[#4B5D16] shrink-0" />
          </div>
        );
      })}
    </div>
  )}

  <div className="border-t border-[#DDD2BC] pt-4 space-y-3">

    <p className="text-sm font-bold text-[#3C4620]">
      {lang === 'ar'
        ? 'تسجيل حضور يدوي'
        : 'Manual Check-In'}
    </p>

    <select
      value={
        manualParticipantBySession[session.id] || ''
      }
      onChange={(e) =>
        setManualParticipantBySession(
          (current) => ({
            ...current,
            [session.id]: e.target.value
          })
        )
      }
      className="w-full px-3 py-2.5 rounded-md bg-[#F6F1E6] border border-[#DDD2BC] text-[#3C4620]"
    >
      <option value="">
        {lang === 'ar'
          ? 'اختر المشارك'
          : 'Select participant'}
      </option>

      {availableParticipants.map(
        (participant) => (
          <option
            key={participant.id}
            value={participant.id}
          >
            {participant.full_name} —{' '}
            {participant.university_id}
          </option>
        )
      )}
    </select>

    <button
      type="button"
      disabled={
        !manualParticipantBySession[session.id] ||
        manualAttendanceSavingId === session.id
      }
      onClick={() =>
        handleManualAttendance(session)
      }
      className="w-full px-4 py-2.5 rounded-md bg-[#3C4620] text-[#ECE2CE] font-bold hover:bg-[#4B5D16] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {manualAttendanceSavingId === session.id
        ? lang === 'ar'
          ? 'جاري التسجيل...'
          : 'Recording...'
        : lang === 'ar'
        ? 'تسجيل الحضور يدويًا'
        : 'Record Attendance'}
    </button>

  </div>

</div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
        {/* TAB 3: REGISTRATION WINDOW SETTINGS */}
        {!dataLoading && activeTab === 'settings' && (
          <div className="max-w-xl bg-[#FAF7F0] border border-[#DDD2BC] rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#DDD2BC] pb-4">
              <span className="text-base font-bold text-[#3C4620]">
                {a.settings.currentStatusLabel}
              </span>
              <span className="text-base font-bold text-[#4B5D16]">
                {registrationState === 'open'
                  ? t.nav.ctaOpen
                  : registrationState === 'closed'
                  ? t.nav.ctaClosed
                  : t.nav.ctaBefore}
              </span>
            </div>

            {settingsError && (
              <div
                role="alert"
                className="p-3.5 rounded-md bg-[#E45C10]/10 border border-[#E45C10] text-sm font-bold text-[#3C4620] flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-[#E45C10] shrink-0" />
                <span>{settingsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-open-at"
                  className="block text-sm font-bold text-[#3C4620]"
                >
                  {a.settings.openAtLabel}
                </label>
                <input
                  id="admin-open-at"
                  type="datetime-local"
                  dir="ltr"
                  value={openAtInput}
                  onChange={(e) => setOpenAtInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md bg-[#F6F1E6] border border-[#DDD2BC] text-[#3C4620]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-close-at"
                  className="block text-sm font-bold text-[#3C4620]"
                >
                  {a.settings.closeAtLabel}
                </label>
                <input
                  id="admin-close-at"
                  type="datetime-local"
                  dir="ltr"
                  value={closeAtInput}
                  onChange={(e) => setCloseAtInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md bg-[#F6F1E6] border border-[#DDD2BC] text-[#3C4620]"
                />
              </div>

              {settingsSaved && (
                <p className="text-sm font-bold text-[#4B5D16]">
                  {a.settings.savedSuccess}
                </p>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 text-base font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] cursor-pointer"
              >
                {a.settings.saveSettingsBtn}
              </button>
            </form>
          </div>
        )}
      </div>
{participantCredentials && (
  <div
    role="dialog"
    aria-modal="true"
    className="fixed inset-0 z-50 bg-[#3C4620]/70 flex items-center justify-center p-4"
  >
    <div className="bg-[#F6F1E6] border border-[#DDD2BC] rounded-xl max-w-lg w-full p-6 space-y-5">

      <div className="flex items-center justify-between border-b border-[#DDD2BC] pb-3">
        <div>
          <h2 className="text-xl font-bold text-[#3C4620]">
            {lang === 'ar'
              ? 'بيانات دخول المشارك'
              : 'Participant Login Details'}
          </h2>

          <p className="text-sm text-[#3C4620]/70 mt-1">
            {participantCredentials.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setParticipantCredentials(null)}
          className="p-1.5 rounded-md hover:bg-[#ECE2CE] text-[#3C4620] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 rounded-lg bg-[#ECE2CE] border border-[#4B5D16] space-y-4">

        <div>
          <p className="text-xs text-[#3C4620]/60 mb-1">
            {lang === 'ar'
              ? 'البريد الإلكتروني'
              : 'Email'}
          </p>

          <p
            dir="ltr"
            className="font-bold text-[#3C4620] text-start break-all"
          >
            {participantCredentials.email}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#3C4620]/60 mb-1">
            {lang === 'ar'
              ? 'كلمة المرور المؤقتة'
              : 'Temporary Password'}
          </p>

          <p
            dir="ltr"
            className="font-mono font-bold text-lg text-[#3C4620] bg-[#FAF7F0] border border-[#DDD2BC] rounded-md px-3 py-2 text-start"
          >
            {participantCredentials.temporaryPassword}
          </p>
        </div>

      </div>

      <p className="text-sm text-[#3C4620]/70">
        {lang === 'ar'
          ? 'احتفظي بهذه البيانات أو انسخيها قبل إغلاق النافذة. كلمة المرور لن تظهر مرة أخرى.'
          : 'Copy these details before closing. The temporary password will not be shown again.'}
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopyCredentials}
          className="flex-1 px-5 py-2.5 rounded-md bg-[#3C4620] text-[#ECE2CE] font-bold hover:bg-[#4B5D16] cursor-pointer"
        >
          {lang === 'ar'
            ? 'نسخ بيانات الدخول'
            : 'Copy Login Details'}
        </button>

        <button
          type="button"
          onClick={() => setParticipantCredentials(null)}
          className="px-5 py-2.5 rounded-md border border-[#3C4620] text-[#3C4620] font-bold hover:bg-[#ECE2CE] cursor-pointer"
        >
          {lang === 'ar' ? 'إغلاق' : 'Close'}
        </button>
      </div>

    </div>
  </div>
)}
      {/* APPLICANT REVIEW MODAL */}
      {selectedReg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#3C4620]/70 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-[#F6F1E6] border border-[#DDD2BC] rounded-lg max-w-2xl w-full p-6 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-[#DDD2BC] pb-3">
              <h2 className="text-2xl font-bold text-[#3C4620]">
                {a.modal.title}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                className="p-1.5 rounded-md hover:bg-[#ECE2CE] text-[#3C4620] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div
                role="alert"
                className="p-3.5 rounded-md bg-[#E45C10]/10 border border-[#E45C10] text-sm font-bold text-[#3C4620] flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-[#E45C10] shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
              <div>
                <dt className="text-xs text-[#3C4620]/70">
                  {t.registerPage.fields.fullName}
                </dt>
                <dd className="font-bold text-[#3C4620]">
                  {selectedReg.full_name}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#3C4620]/70">
                  {t.registerPage.fields.email}
                </dt>
                <dd dir="ltr" className="font-bold text-[#3C4620] text-start">
                  {selectedReg.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#3C4620]/70">
                  {t.registerPage.fields.phone}
                </dt>
                <dd
                  dir="ltr"
                  className="font-bold text-[#3C4620] tabular-nums text-start"
                >
                  {selectedReg.phone}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#3C4620]/70">
                  {t.registerPage.fields.university} ·{' '}
                  {t.registerPage.fields.major}
                </dt>
                <dd className="font-bold text-[#3C4620]">
                  {selectedReg.university} — {selectedReg.major}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#3C4620]/70">
                  {t.registerPage.fields.academicLevel}
                </dt>
                <dd className="font-bold text-[#3C4620]">
                  {selectedReg.academic_level}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#3C4620]/70">
                  {t.registerPage.fields.universityId}
                </dt>
                <dd
                  dir="ltr"
                  className="font-bold text-[#3C4620] tabular-nums text-start"
                >
                  {selectedReg.university_id}
                </dd>
              </div>
            </dl>

            <div className="space-y-4 border-t border-[#DDD2BC] pt-4">
              <div>
                <p className="text-xs text-[#3C4620]/70">
                  {t.registerPage.fields.motivationQuestion}
                </p>
                <p className="text-base text-[#3C4620] leading-relaxed mt-1 bg-[#FAF7F0] p-3.5 rounded border border-[#DDD2BC]">
                  {selectedReg.track_motivation}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#3C4620]/70">
                    {t.registerPage.fields.previousTrainingQuestion}
                  </p>
                  <p className="font-bold text-[#3C4620] mt-0.5">
                    {selectedReg.has_previous_legal_training
                      ? `${t.registerPage.fields.yes} — ${selectedReg.previous_training_details}`
                      : t.registerPage.fields.no}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#3C4620]/70">
                    {t.registerPage.fields.knowledgeQuestion}
                  </p>
                  <p className="font-bold text-[#3C4620] mt-0.5">
                    {selectedReg.legal_department_knowledge_level}
                  </p>
                </div>
              </div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div className="p-4 rounded-md bg-[#ECE2CE]/60 border border-[#DDD2BC]">
    <p className="text-xs text-[#3C4620]/70 mb-1">
      الرغبة الأولى
    </p>
    <p className="font-bold text-[#3C4620]">
      {getTrackLabel(selectedReg.selected_track_id)}
    </p>
  </div>

  <div className="p-4 rounded-md bg-[#ECE2CE]/60 border border-[#DDD2BC]">
    <p className="text-xs text-[#3C4620]/70 mb-1">
      الرغبة الثانية
    </p>
    <p className="font-bold text-[#3C4620]">
      {selectedReg.second_track_id
        ? getTrackLabel(selectedReg.second_track_id)
        : '—'}
    </p>
  </div>
</div>
{selectedReg.status === 'pending' && (
  <div className="p-4 rounded-md border border-[#4B5D16]/30 bg-[#FAF7F0] space-y-3">
    <p className="text-sm font-bold text-[#3C4620]">
      {lang === 'ar'
        ? 'اختيار المسار عند القبول'
        : 'Select Track for Acceptance'}
    </p>

    <select
      value={selectedAcceptanceTrack || ''}
      onChange={(e) =>
        setSelectedAcceptanceTrack(
          e.target.value as TrackSlug
        )
      }
      className="w-full px-4 py-2.5 rounded-md bg-[#F6F1E6] border border-[#DDD2BC] text-[#3C4620] font-bold"
    >
      <option value={selectedReg.selected_track_id}>
        {lang === 'ar'
          ? `الرغبة الأولى — ${getTrackLabel(
              selectedReg.selected_track_id
            )}`
          : `First Preference — ${getTrackLabel(
              selectedReg.selected_track_id
            )}`}
      </option>

      {selectedReg.second_track_id && (
        <option value={selectedReg.second_track_id}>
          {lang === 'ar'
            ? `الرغبة الثانية — ${getTrackLabel(
                selectedReg.second_track_id
              )}`
            : `Second Preference — ${getTrackLabel(
                selectedReg.second_track_id
              )}`}
        </option>
      )}
    </select>

    <p className="text-xs text-[#3C4620]/60">
      {lang === 'ar'
        ? 'يمكن اختيار إحدى الرغبتين فقط.'
        : 'Only one of the applicant’s two preferences can be selected.'}
    </p>
  </div>
)}
            </div>

            {/* One-Time Generated Participant Credentials Display */}
            {generatedCreds && (
              <div className="p-4 rounded-md bg-[#ECE2CE] border border-[#4B5D16] space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-[#4B5D16]">
                  <KeyRound className="w-4 h-4" />
                  <span>{a.modal.credentialsTitle}</span>
                </div>
                <div dir="ltr" className="text-sm font-mono space-y-1 text-start">
                  <div>
                    <strong>Email:</strong> {generatedCreds.email}
                  </div>
                  <div>
                    <strong>{a.modal.tempPasswordLabel}</strong>{' '}
                    <span className="bg-[#FAF7F0] px-2 py-0.5 rounded border border-[#DDD2BC]">
                      {generatedCreds.temporaryPassword}
                    </span>
                  </div>
                </div>
              </div>
            )}
{/* Decision Buttons */}
<div className="pt-4 border-t border-[#DDD2BC] flex flex-wrap items-center justify-between gap-3">
  <div className="flex flex-wrap items-center gap-3">

    {/* ACCEPTED */}
    {selectedReg.status === 'accepted' && (
      <>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md bg-[#4B5D16] text-[#ECE2CE] cursor-default"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {lang === 'ar' ? 'تم القبول' : 'Accepted'}
          </span>
        </button>

        <button
          type="button"
          disabled={isReviewing}
          onClick={() => handleReviewDecision('pending')}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md border border-[#3C4620] text-[#3C4620] hover:bg-[#3C4620] hover:text-[#ECE2CE] disabled:opacity-50 cursor-pointer"
        >
          <span>
            {isReviewing
              ? a.modal.processing
              : lang === 'ar'
              ? 'إرجاع إلى تحت المراجعة'
              : 'Return to Review'}
          </span>
        </button>

        <button
          type="button"
          disabled={isReviewing}
          onClick={() => handleReviewDecision('rejected')}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md border border-[#E45C10] text-[#E45C10] hover:bg-[#E45C10] hover:text-white disabled:opacity-50 cursor-pointer"
        >
          <XCircle className="w-4 h-4" />
          <span>
            {lang === 'ar' ? 'رفض الطلب' : 'Reject'}
          </span>
        </button>
      </>
    )}

    {/* REJECTED */}
    {selectedReg.status === 'rejected' && (
      <>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md bg-[#E45C10] text-white cursor-default"
        >
          <XCircle className="w-4 h-4" />
          <span>
            {lang === 'ar' ? 'تم الرفض' : 'Rejected'}
          </span>
        </button>

        <button
          type="button"
          disabled={isReviewing}
          onClick={() => handleReviewDecision('pending')}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md border border-[#3C4620] text-[#3C4620] hover:bg-[#3C4620] hover:text-[#ECE2CE] disabled:opacity-50 cursor-pointer"
        >
          <span>
            {isReviewing
              ? a.modal.processing
              : lang === 'ar'
              ? 'إرجاع إلى تحت المراجعة'
              : 'Return to Review'}
          </span>
        </button>
      </>
    )}

    {/* PENDING */}
    {selectedReg.status === 'pending' && (
      <>
        <button
          type="button"
          disabled={isReviewing}
          onClick={() => handleReviewDecision('accepted')}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md bg-[#4B5D16] text-[#ECE2CE] hover:bg-[#3C4620] disabled:opacity-60 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {isReviewing
              ? a.modal.processing
              : a.modal.acceptBtn}
          </span>
        </button>

        <button
          type="button"
          disabled={isReviewing}
          onClick={() => handleReviewDecision('rejected')}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md border border-[#E45C10] text-[#E45C10] hover:bg-[#E45C10] hover:text-[#ECE2CE] disabled:opacity-40 cursor-pointer"
        >
          <XCircle className="w-4 h-4" />
          <span>{a.modal.rejectBtn}</span>
        </button>
      </>
    )}

  </div>

  <button
    type="button"
    onClick={() => setSelectedReg(null)}
    className="px-4 py-2 text-sm font-bold text-[#3C4620] hover:underline cursor-pointer"
  >
    {a.modal.close}
  </button>
</div>

          </div>
        </div>
      )}

      {/* CERTIFICATE PREVIEW MODAL */}
      {previewCertUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#3C4620]/75 flex items-center justify-center p-4"
        >
          <div className="bg-[#F6F1E6] border border-[#DDD2BC] rounded-lg max-w-4xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DDD2BC] pb-3">
              <h3 className="text-xl font-bold text-[#3C4620]">
                {a.participants.viewCertBtn}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewCertUrl(null)}
                className="p-1.5 rounded-md hover:bg-[#ECE2CE] text-[#3C4620] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#FAF7F0] border border-[#DDD2BC] rounded overflow-hidden flex items-center justify-center max-h-[75vh]">
              {previewCertIsPdf ? (
                <iframe
                  src={previewCertUrl}
                  title={a.participants.viewCertBtn}
                  className="w-full h-[70vh] border-0"
                />
              ) : (
                <img
                  src={previewCertUrl}
                  alt="Certificate Preview"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[72vh] object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
