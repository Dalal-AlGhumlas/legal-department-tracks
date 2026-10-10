import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, Download, LogOut, X, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useProgramStore } from '../services/programStore';
import { TRACKS_BY_SLUG } from '../config/tracks';
import { OFFICIAL_PROGRAM_SCHEDULE } from '../config/program';
import { TrackImage } from '../components/TrackImage';

export const DashboardPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const {
    currentUser,
    signOut,
    getMyParticipantProfile,
    getMyCertificate,
    getSignedCertificateUrl,
    updateParticipantPassword
  } = useProgramStore();
  const navigate = useNavigate();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

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
    const signed = await getSignedCertificateUrl(profile.id);
    if (signed) {
      setPreviewUrl(signed);
    }
  };

  const handleDownloadCertificate = async () => {
    const signed = await getSignedCertificateUrl(profile.id);
    if (!signed || !certificate) return;

    const a = document.createElement('a');
    a.href = signed;
    a.download = certificate.file_name || 'certificate.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.trim().length < 6) return;
    await updateParticipantPassword(newPassword.trim());
    setNewPassword('');
    setPasswordSaved(true);
  };

  const d = t.dashboardPage;

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
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] text-[#3C4620]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-base font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] btn-press cursor-pointer"
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
              <img
                src={previewUrl}
                alt={d.certificateTitle}
                className="max-w-full max-h-[70vh] object-contain"
              />
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
