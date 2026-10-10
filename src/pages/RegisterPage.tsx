import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useProgramStore } from '../services/programStore';
import { TRACKS, getTrackBySlug } from '../config/tracks';
import { ACADEMIC_LEVELS } from '../config/program';
import { KnowledgeLevel, TrackSlug } from '../types';

const MOTIVATION_MAX_LENGTH = 500;

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  university?: string;
  major?: string;
  academic_level?: string;
  university_id?: string;
selected_track_id?: string;
second_track_id?: string;
track_motivation?: string;
  has_previous_legal_training?: string;
  previous_training_details?: string;
  legal_department_knowledge_level?: string;
  attendance_commitment_confirmed?: string;
  form?: string;
}

export const RegisterPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const { registrationState, submitApplication } = useProgramStore();
  const [searchParams] = useSearchParams();

  // Preselect track if passed via ?track=SLUG
  const initialTrackParam = searchParams.get('track');
  const preselectedTrack = getTrackBySlug(initialTrackParam)?.slug || '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState<TrackSlug | ''>(
    preselectedTrack
  );
  const [secondTrackId, setSecondTrackId] = useState<TrackSlug | ''>('');
  const [trackMotivation, setTrackMotivation] = useState('');
  const [hasPreviousTraining, setHasPreviousTraining] = useState<
    'yes' | 'no' | ''
  >('');
  const [previousTrainingDetails, setPreviousTrainingDetails] = useState('');
  const [knowledgeLevel, setKnowledgeLevel] = useState<KnowledgeLevel | ''>('');
  const [commitmentConfirmed, setCommitmentConfirmed] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  useEffect(() => {
    const matched = getTrackBySlug(searchParams.get('track'));
    if (matched) {
      setSelectedTrackId(matched.slug);
    }
  }, [searchParams]);

  // Gate when registration is closed or not yet open
  if (registrationState === 'closed' && !isSubmittedSuccess) {
    return (
      <div className="py-20 md:py-28">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 space-y-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#3C4620]">
            {t.registerPage.closedTitle}
          </h1>
          <p className="text-lg text-[#3C4620]/85 leading-relaxed">
            {t.registerPage.closedMessage}
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-7 py-3.5 text-base font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] btn-press"
            >
              {t.nav.ctaClosed}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (registrationState === 'before' && !isSubmittedSuccess) {
    return (
      <div className="py-20 md:py-28">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 space-y-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#3C4620]">
            {t.registerPage.beforeTitle}
          </h1>
          <p className="text-lg text-[#3C4620]/85 leading-relaxed">
            {t.registerPage.beforeMessage}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              to="/discover"
              className="inline-flex items-center justify-center px-7 py-3.5 text-base font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] btn-press"
            >
              {t.nav.discover}
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3.5 text-base font-bold rounded-md border border-[#3C4620]/40 text-[#3C4620] hover:border-[#3C4620]"
            >
              {t.nav.home}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calm Success State after submission
  if (isSubmittedSuccess) {
    const chosenTrack = getTrackBySlug(selectedTrackId);
    return (
      <div className="py-20 md:py-28">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 space-y-8">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#4B5D16]/15 text-[#4B5D16] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3C4620]">
              {t.registerPage.success.title}
            </h1>
            <p className="text-xl text-[#3C4620]/90">
              {t.registerPage.success.lead}
            </p>
          </div>

          {chosenTrack && (
            <div className="py-4 border-y border-[#DDD2BC] flex items-center justify-between gap-4">
              <span className="text-base text-[#3C4620]/75">
                {t.registerPage.success.selectedTrackLabel}
              </span>
              <span className="text-lg font-bold text-[#3C4620]">
                {lang === 'ar' ? chosenTrack.nameAr : chosenTrack.nameEn}
              </span>
            </div>
          )}

          <ul className="space-y-3 text-lg text-[#3C4620]/85 leading-relaxed">
            {t.registerPage.success.points.map((pt) => (
              <li key={pt} className="flex items-baseline gap-3">
                <span aria-hidden="true" className="text-[#4B5D16] font-bold">
                  —
                </span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>

          <div className="pt-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-7 py-3.5 text-base font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] btn-press"
            >
              {t.registerPage.success.backHomeBtn}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const v = t.registerPage.validation;

    if (!fullName.trim()) {
      nextErrors.full_name = v.fullNameRequired;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      nextErrors.email = v.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = v.emailInvalid;
    }

    const cleanedPhone = phone.replace(/[\s-]/g, '');
    if (!cleanedPhone) {
      nextErrors.phone = v.phoneRequired;
    } else if (!/^(?:05\d{8}|\+?9665\d{8})$/.test(cleanedPhone)) {
      nextErrors.phone = v.phoneInvalid;
    }

    if (!university.trim()) {
      nextErrors.university = v.universityRequired;
    }

    if (!major.trim()) {
      nextErrors.major = v.majorRequired;
    }

    if (!academicLevel) {
      nextErrors.academic_level = v.academicLevelRequired;
    }

    if (!universityId.trim()) {
      nextErrors.university_id = v.universityIdRequired;
    }

if (!selectedTrackId) {
  nextErrors.selected_track_id = v.trackRequired;
}

if (!secondTrackId) {
  nextErrors.second_track_id = v.secondTrackRequired;
} else if (secondTrackId === selectedTrackId) {
  nextErrors.second_track_id = v.tracksMustDiffer;
}

    if (!trackMotivation.trim()) {
      nextErrors.track_motivation = v.motivationRequired;
    } else if (trackMotivation.trim().length > MOTIVATION_MAX_LENGTH) {
      nextErrors.track_motivation = v.motivationTooLong;
    }

    if (!hasPreviousTraining) {
      nextErrors.has_previous_legal_training = v.previousTrainingRequired;
    } else if (
      hasPreviousTraining === 'yes' &&
      !previousTrainingDetails.trim()
    ) {
      nextErrors.previous_training_details = v.previousTrainingDetailsRequired;
    }

    if (!knowledgeLevel) {
      nextErrors.legal_department_knowledge_level = v.knowledgeRequired;
    }

    if (!commitmentConfirmed) {
      nextErrors.attendance_commitment_confirmed = v.commitmentRequired;
    }

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await submitApplication({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.replace(/[\s-]/g, ''),
        university: university.trim(),
        major: major.trim(),
        academic_level: academicLevel,
        university_id: universityId.trim(),
selected_track_id: selectedTrackId as TrackSlug,
second_track_id: secondTrackId as TrackSlug,
track_motivation: trackMotivation.trim(),
        has_previous_legal_training: hasPreviousTraining === 'yes',
        previous_training_details:
          hasPreviousTraining === 'yes' ? previousTrainingDetails.trim() : null,
        legal_department_knowledge_level: knowledgeLevel as KnowledgeLevel,
        attendance_commitment_confirmed: commitmentConfirmed
      });

      setIsSubmittedSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'EMAIL_DUPLICATE') {
        setErrors({
          email: t.registerPage.validation.emailDuplicate
        });
      } else if (code === 'REGISTRATION_CLOSED') {
        setErrors({
          form: t.registerPage.validation.registrationClosedError
        });
      } else {
        setErrors({
          form: t.registerPage.validation.genericError
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const f = t.registerPage.fields;
  const knowledgeLevels: { value: KnowledgeLevel; label: string }[] = [
    { value: 'متقدم', label: f.knowledgeOptions.advanced },
    { value: 'متوسط', label: f.knowledgeOptions.intermediate },
    { value: 'مبتدئ', label: f.knowledgeOptions.beginner }
  ];

  return (
    <div className="py-14 md:py-24">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 space-y-12">
        {/* Page Header */}
        <div className="space-y-4 border-b border-[#DDD2BC] pb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#3C4620] leading-tight">
            {t.registerPage.title}
          </h1>
          <p className="text-lg text-[#3C4620]/85 leading-relaxed">
            {t.registerPage.subtitle}
          </p>
        </div>

        {errors.form && (
          <div
            role="alert"
            className="p-4 rounded-md bg-[#E45C10]/10 border border-[#E45C10] text-[#3C4620] flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-[#E45C10] shrink-0 mt-0.5" />
            <span className="text-base font-bold">{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-16">
          {/* 01. PERSONAL INFORMATION */}
          <section className="space-y-6">
            <div className="flex items-baseline gap-3 border-b border-[#DDD2BC] pb-3">
              <span className="text-sm font-bold text-[#E45C10] tabular-nums">
                {t.registerPage.sec01Num}
              </span>
              <h2 className="text-2xl font-bold text-[#3C4620]">
                {t.registerPage.sec01Title}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 1. Full Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label
                  htmlFor="reg-full-name"
                  className="block text-base font-bold text-[#3C4620]"
                >
                  {f.fullName}
                </label>
                <input
                  id="reg-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={f.fullNamePlaceholder}
                  aria-invalid={Boolean(errors.full_name)}
                  className="w-full px-4 py-3 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] focus:border-[#3C4620] text-[#3C4620] text-base"
                />
                {errors.full_name && (
                  <p className="text-sm font-bold text-[#E45C10]">
                    {errors.full_name}
                  </p>
                )}
              </div>

              {/* 2. Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-email"
                  className="block text-base font-bold text-[#3C4620]"
                >
                  {f.email}
                </label>
                <input
                  id="reg-email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={f.emailPlaceholder}
                  aria-invalid={Boolean(errors.email)}
                  className="w-full px-4 py-3 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] focus:border-[#3C4620] text-[#3C4620] text-base"
                />
                {errors.email && (
                  <p className="text-sm font-bold text-[#E45C10]">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* 3. Phone */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-phone"
                  className="block text-base font-bold text-[#3C4620]"
                >
                  {f.phone}
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={f.phonePlaceholder}
                  aria-invalid={Boolean(errors.phone)}
                  className="w-full px-4 py-3 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] focus:border-[#3C4620] text-[#3C4620] text-base"
                />
                {errors.phone && (
                  <p className="text-sm font-bold text-[#E45C10]">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* 4. University */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-university"
                  className="block text-base font-bold text-[#3C4620]"
                >
                  {f.university}
                </label>
                <input
                  id="reg-university"
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder={f.universityPlaceholder}
                  aria-invalid={Boolean(errors.university)}
                  className="w-full px-4 py-3 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] focus:border-[#3C4620] text-[#3C4620] text-base"
                />
                {errors.university && (
                  <p className="text-sm font-bold text-[#E45C10]">
                    {errors.university}
                  </p>
                )}
              </div>

              {/* 5. Major */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-major"
                  className="block text-base font-bold text-[#3C4620]"
                >
                  {f.major}
                </label>
                <input
                  id="reg-major"
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder={f.majorPlaceholder}
                  aria-invalid={Boolean(errors.major)}
                  className="w-full px-4 py-3 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] focus:border-[#3C4620] text-[#3C4620] text-base"
                />
                {errors.major && (
                  <p className="text-sm font-bold text-[#E45C10]">
                    {errors.major}
                  </p>
                )}
              </div>

              {/* 6. Academic Level */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-academic-level"
                  className="block text-base font-bold text-[#3C4620]"
                >
                  {f.academicLevel}
                </label>
                <select
                  id="reg-academic-level"
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  aria-invalid={Boolean(errors.academic_level)}
                  className="w-full px-4 py-3 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] focus:border-[#3C4620] text-[#3C4620] text-base"
                >
                  <option value="">{f.academicLevelPlaceholder}</option>
                  {ACADEMIC_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lang === 'ar' ? lvl.labelAr : lvl.labelEn}
                    </option>
                  ))}
                </select>
                {errors.academic_level && (
                  <p className="text-sm font-bold text-[#E45C10]">
                    {errors.academic_level}
                  </p>
                )}
              </div>

              {/* 7. University ID */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-university-id"
                  className="block text-base font-bold text-[#3C4620]"
                >
                  {f.universityId}
                </label>
                <input
                  id="reg-university-id"
                  type="text"
                  dir="ltr"
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  placeholder={f.universityIdPlaceholder}
                  aria-invalid={Boolean(errors.university_id)}
                  className="w-full px-4 py-3 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] focus:border-[#3C4620] text-[#3C4620] text-base tabular-nums"
                />
                {errors.university_id && (
                  <p className="text-sm font-bold text-[#E45C10]">
                    {errors.university_id}
                  </p>
                )}
              </div>
            </div>
          </section>

{/* 02. TRACK SELECTION */}
<section className="space-y-8">
  <div className="flex items-baseline gap-3 border-b border-[#DDD2BC] pb-3">
    <span className="text-sm font-bold text-[#E45C10] tabular-nums">
      {t.registerPage.sec02Num}
    </span>

    <h2 className="text-2xl font-bold text-[#3C4620]">
      {t.registerPage.sec02Title}
    </h2>
  </div>

  <p className="text-base text-[#3C4620]/85 leading-relaxed bg-[#ECE2CE]/60 p-4 rounded-md border border-[#DDD2BC]">
    {f.trackExplanation}
  </p>

  {/* FIRST PREFERENCE */}
  <div className="space-y-4">
    <p className="text-xl font-bold text-[#3C4620]">
      {f.firstPreference}
    </p>

    <div
      role="radiogroup"
      aria-label={f.firstPreference}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {TRACKS.map((track) => {
        const isSelected = selectedTrackId === track.slug;

        const trackName =
          lang === 'ar' ? track.nameAr : track.nameEn;

        const trackDesc =
          lang === 'ar' ? track.descriptionAr : track.descriptionEn;

        return (
          <button
            key={track.slug}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => {
              setSelectedTrackId(track.slug);

              if (secondTrackId === track.slug) {
                setSecondTrackId('');
              }
            }}
            className={`p-5 rounded-lg border text-start transition-colors cursor-pointer flex flex-col justify-between gap-3 ${
              isSelected
                ? 'bg-[#ECE2CE] border-[#3C4620] text-[#3C4620]'
                : 'bg-[#FAF7F0] border-[#DDD2BC] hover:border-[#4B5D16]/60 text-[#3C4620]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">

                <span className="text-xl font-bold text-[#3C4620]">
                  {trackName}
                </span>

                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-[#3C4620] bg-[#3C4620]'
                      : 'border-[#3C4620]/40'
                  }`}
                >
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#ECE2CE]" />
                  )}
                </span>

              </div>

              <p className="text-sm text-[#3C4620]/85 leading-relaxed">
                {trackDesc}
              </p>
            </div>
          </button>
        );
      })}
    </div>

    {errors.selected_track_id && (
      <p className="text-sm font-bold text-[#E45C10]">
        {errors.selected_track_id}
      </p>
    )}
  </div>

  {/* SECOND PREFERENCE */}
  <div className="space-y-4">
    <p className="text-xl font-bold text-[#3C4620]">
      {f.secondPreference}
    </p>

    <div
      role="radiogroup"
      aria-label={f.secondPreference}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {TRACKS.map((track) => {
        const isSelected = secondTrackId === track.slug;
        const isDisabled = selectedTrackId === track.slug;

        const trackName =
          lang === 'ar' ? track.nameAr : track.nameEn;

        const trackDesc =
          lang === 'ar' ? track.descriptionAr : track.descriptionEn;

        return (
          <button
            key={track.slug}
            type="button"
            role="radio"
            disabled={isDisabled}
            aria-checked={isSelected}
            onClick={() => setSecondTrackId(track.slug)}
            className={`p-5 rounded-lg border text-start transition-colors flex flex-col justify-between gap-3 ${
              isDisabled
                ? 'bg-[#FAF7F0] border-[#DDD2BC] opacity-40 cursor-not-allowed'
                : isSelected
                  ? 'bg-[#ECE2CE] border-[#3C4620] text-[#3C4620] cursor-pointer'
                  : 'bg-[#FAF7F0] border-[#DDD2BC] hover:border-[#4B5D16]/60 text-[#3C4620] cursor-pointer'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">

                <span className="text-xl font-bold text-[#3C4620]">
                  {trackName}
                </span>

                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-[#3C4620] bg-[#3C4620]'
                      : 'border-[#3C4620]/40'
                  }`}
                >
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#ECE2CE]" />
                  )}
                </span>

              </div>

              <p className="text-sm text-[#3C4620]/85 leading-relaxed">
                {trackDesc}
              </p>
            </div>
          </button>
        );
      })}
    </div>

    {errors.second_track_id && (
      <p className="text-sm font-bold text-[#E45C10]">
        {errors.second_track_id}
      </p>
    )}
  </div>
</section>

          {/* 03. MOTIVATION & EXPERIENCE */}
          <section className="space-y-8">
            <div className="flex items-baseline gap-3 border-b border-[#DDD2BC] pb-3">
              <span className="text-sm font-bold text-[#E45C10] tabular-nums">
                {t.registerPage.sec03Num}
              </span>
              <h2 className="text-2xl font-bold text-[#3C4620]">
                {t.registerPage.sec03Title}
              </h2>
            </div>

            {/* Track Motivation */}
            <div className="space-y-2">
              <label
                htmlFor="reg-motivation"
                className="block text-lg font-bold text-[#3C4620]"
              >
                {f.motivationQuestion}
              </label>
              <textarea
                id="reg-motivation"
                rows={4}
                maxLength={MOTIVATION_MAX_LENGTH}
                value={trackMotivation}
                onChange={(e) => setTrackMotivation(e.target.value)}
                placeholder={f.motivationPlaceholder}
                aria-invalid={Boolean(errors.track_motivation)}
                className="w-full px-4 py-3 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] focus:border-[#3C4620] text-[#3C4620] text-base leading-relaxed"
              />
              <div className="flex items-center justify-between gap-2">
                {errors.track_motivation ? (
                  <p className="text-sm font-bold text-[#E45C10]">
                    {errors.track_motivation}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-[#3C4620]/65 tabular-nums">
                  {f.motivationCharCount
                    .replace('{count}', String(trackMotivation.length))
                    .replace('{max}', String(MOTIVATION_MAX_LENGTH))}
                </span>
              </div>
            </div>

            {/* Previous Training / Experience */}
            <div className="space-y-4">
              <p className="text-lg font-bold text-[#3C4620]">
                {f.previousTrainingQuestion}
              </p>

              <div className="flex items-center gap-4">
                {(
                  [
                    { val: 'yes', label: f.yes },
                    { val: 'no', label: f.no }
                  ] as const
                ).map((opt) => {
                  const isSelected = hasPreviousTraining === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setHasPreviousTraining(opt.val)}
                      className={`px-6 py-2.5 rounded-md border text-base font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#3C4620] text-[#ECE2CE] border-[#3C4620]'
                          : 'bg-[#FAF7F0] text-[#3C4620] border-[#DDD2BC] hover:border-[#4B5D16]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {errors.has_previous_legal_training && (
                <p className="text-sm font-bold text-[#E45C10]">
                  {errors.has_previous_legal_training}
                </p>
              )}

              {/* Conditional Details when "نعم" is selected */}
              {hasPreviousTraining === 'yes' && (
                <div className="pt-2 space-y-2">
                  <label
                    htmlFor="reg-prev-details"
                    className="block text-base font-bold text-[#3C4620]"
                  >
                    {f.previousTrainingDetailsLabel}
                  </label>
                  <textarea
                    id="reg-prev-details"
                    rows={2}
                    value={previousTrainingDetails}
                    onChange={(e) => setPreviousTrainingDetails(e.target.value)}
                    placeholder={f.previousTrainingDetailsPlaceholder}
                    aria-invalid={Boolean(errors.previous_training_details)}
                    className="w-full px-4 py-3 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] focus:border-[#3C4620] text-[#3C4620] text-base"
                  />
                  {errors.previous_training_details && (
                    <p className="text-sm font-bold text-[#E45C10]">
                      {errors.previous_training_details}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Knowledge Level */}
            <div className="space-y-3">
              <p className="text-lg font-bold text-[#3C4620]">
                {f.knowledgeQuestion}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {knowledgeLevels.map((lvl) => {
                  const isSelected = knowledgeLevel === lvl.value;
                  return (
                    <button
                      key={lvl.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setKnowledgeLevel(lvl.value)}
                      className={`py-3 px-4 rounded-md border text-base font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#3C4620] text-[#ECE2CE] border-[#3C4620]'
                          : 'bg-[#FAF7F0] text-[#3C4620] border-[#DDD2BC] hover:border-[#4B5D16]'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  );
                })}
              </div>

              {errors.legal_department_knowledge_level && (
                <p className="text-sm font-bold text-[#E45C10]">
                  {errors.legal_department_knowledge_level}
                </p>
              )}
            </div>
          </section>

          {/* 04. ATTENDANCE COMMITMENT & SUBMISSION */}
          <section className="space-y-6">
            <div className="flex items-baseline gap-3 border-b border-[#DDD2BC] pb-3">
              <span className="text-sm font-bold text-[#E45C10] tabular-nums">
                {t.registerPage.sec04Num}
              </span>
              <h2 className="text-2xl font-bold text-[#3C4620]">
                {t.registerPage.sec04Title}
              </h2>
            </div>

            <div className="p-6 rounded-lg bg-[#FAF7F0] border border-[#DDD2BC] space-y-4">
              <p className="text-base sm:text-lg text-[#3C4620] leading-relaxed">
                {f.commitmentQuestion}
              </p>

              <label className="flex items-start gap-3.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={commitmentConfirmed}
                  onChange={(e) => setCommitmentConfirmed(e.target.checked)}
                  className="mt-1.5 w-5 h-5 accent-[#3C4620] rounded shrink-0 cursor-pointer"
                />
                <span className="text-lg font-bold text-[#3C4620]">
                  {f.commitmentCheckbox}
                </span>
              </label>

              {errors.attendance_commitment_confirmed && (
                <p className="text-sm font-bold text-[#E45C10]">
                  {errors.attendance_commitment_confirmed}
                </p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-10 py-4 text-lg font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] disabled:opacity-60 btn-press cursor-pointer"
              >
                {isSubmitting ? f.submittingBtn : f.submitBtn}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};
