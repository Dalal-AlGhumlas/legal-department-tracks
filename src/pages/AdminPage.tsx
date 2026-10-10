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
    issueOrUploadCertificate,
    getSignedCertificateUrl,
    updateRegistrationWindow
  } = useProgramStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'registrations' | 'participants' | 'settings'
  >('registrations');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>(
    'all'
  );
  const [trackFilter, setTrackFilter] = useState<TrackSlug | 'all'>('all');

  // Applicant Modal State
  const [selectedReg, setSelectedReg] = useState<RegistrationRecord | null>(
    null
  );
  const [overrideTrack, setOverrideTrack] = useState<TrackSlug | ''>('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [modalError, setModalError] = useState('');
  const [generatedCreds, setGeneratedCreds] = useState<{
    email: string;
    temporaryPassword: string;
  } | null>(null);

  // Certificates state
  const [uploadingParticipantId, setUploadingParticipantId] = useState<
    string | null
  >(null);
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

  const filteredRegistrations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return registrations.filter((reg) => {
      if (statusFilter !== 'all' && reg.status !== statusFilter) return false;
      if (trackFilter !== 'all' && reg.selected_track_id !== trackFilter)
        return false;
      if (!q) return true;
      return (
        reg.full_name.toLowerCase().includes(q) ||
        reg.email.toLowerCase().includes(q) ||
        reg.university_id.toLowerCase().includes(q) ||
        reg.phone.toLowerCase().includes(q)
      );
    });
  }, [registrations, searchQuery, statusFilter, trackFilter]);

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
    setOverrideTrack(reg.selected_track_id);
    setGeneratedCreds(null);
    setModalError('');
  };

  const handleReviewDecision = async (decision: 'accepted' | 'rejected') => {
    if (!selectedReg || isReviewing) return;
    setIsReviewing(true);
    setModalError('');
    try {
      const finalTrack =
        (overrideTrack as TrackSlug) || selectedReg.selected_track_id;
      const result = await reviewApplication(
        selectedReg.id,
        decision,
        finalTrack
      );

      setSelectedReg((prev) =>
        prev
          ? {
              ...prev,
              status: decision,
              selected_track_id: finalTrack,
              participant_account_created:
                decision === 'accepted' ? true : prev.participant_account_created
            }
          : null
      );

      if (result.generatedCredentials) {
        setGeneratedCreds(result.generatedCredentials);
      }
    } catch {
      setModalError(t.adminPage.modal.actionError);
    } finally {
      setIsReviewing(false);
    }
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
              { id: 'settings', label: a.tabs.settings }
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
                    <th className="py-3.5 px-4 text-start">{a.table.track}</th>
                    <th className="py-3.5 px-4 text-start">{a.table.status}</th>
                    <th className="py-3.5 px-4 text-end">{a.table.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDD2BC] text-base">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
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
                            className="px-4 py-1.5 text-sm font-bold rounded-md bg-[#ECE2CE] text-[#3C4620] hover:bg-[#3C4620] hover:text-[#ECE2CE] transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {a.table.openDetails}
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
                {participants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-10 text-center text-[#3C4620]/70"
                    >
                      {a.table.noParticipants}
                    </td>
                  </tr>
                ) : (
                  participants.map((part) => {
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
                            {cert && (
                              <button
                                type="button"
                                onClick={() => handlePreviewCert(part.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md border border-[#3C4620]/30 text-[#3C4620] hover:border-[#3C4620] cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{a.participants.viewCertBtn}</span>
                              </button>
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

              {/* Administrative Track Selector */}
              <div className="space-y-1.5 pt-2">
                <label
                  htmlFor="modal-track-override"
                  className="block text-sm font-bold text-[#3C4620]"
                >
                  {a.modal.trackOverrideLabel}
                </label>
                <select
                  id="modal-track-override"
                  value={overrideTrack}
                  onChange={(e) =>
                    setOverrideTrack(e.target.value as TrackSlug)
                  }
                  className="w-full px-3.5 py-2 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] text-[#3C4620] font-bold"
                >
                  {TRACKS.map((tr) => (
                    <option key={tr.slug} value={tr.slug}>
                      {lang === 'ar' ? tr.nameAr : tr.nameEn}
                    </option>
                  ))}
                </select>
              </div>
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
                <button
                  type="button"
                  disabled={isReviewing}
                  onClick={() => handleReviewDecision('accepted')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md bg-[#4B5D16] text-[#ECE2CE] hover:bg-[#3C4620] disabled:opacity-60 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isReviewing ? a.modal.processing : a.modal.acceptBtn}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isReviewing || selectedReg.participant_account_created}
                  onClick={() => handleReviewDecision('rejected')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md border border-[#E45C10] text-[#E45C10] hover:bg-[#E45C10] hover:text-[#ECE2CE] disabled:opacity-40 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{a.modal.rejectBtn}</span>
                </button>
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
