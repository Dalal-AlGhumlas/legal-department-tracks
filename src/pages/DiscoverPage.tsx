import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  DISCOVER_QUESTIONS,
  DISCOVER_RESULT_REASONS,
  calculateRecommendedTrack
} from '../config/discoverQuiz';
import { TRACKS_BY_SLUG } from '../config/tracks';
import { TrackSlug } from '../types';
import { TrackImage } from '../components/TrackImage';
import { PrimaryProgramCta } from '../components/PrimaryProgramCta';

type StepState = 'intro' | 'questions' | 'result';

export const DiscoverPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [step, setStep] = useState<StepState>('intro');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, TrackSlug>>({});

  const totalQuestions = DISCOVER_QUESTIONS.length;
  const currentQuestion = DISCOVER_QUESTIONS[currentIndex];
  const selectedTrackForCurrent = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  const NextArrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const PrevArrow = lang === 'ar' ? ArrowRight : ArrowLeft;

  const handleSelectOption = (track: TrackSlug) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: track
    }));
  };

  const handleNext = () => {
    if (!selectedTrackForCurrent) return;
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setStep('result');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setStep('intro');
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setStep('intro');
  };

  const recommendedSlug = calculateRecommendedTrack(answers);
  const recommendedTrack = TRACKS_BY_SLUG[recommendedSlug];
  const reasonText =
    lang === 'ar'
      ? DISCOVER_RESULT_REASONS[recommendedSlug].reasonAr
      : DISCOVER_RESULT_REASONS[recommendedSlug].reasonEn;

  return (
    <div className="py-14 md:py-24">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        {/* STEP 1: INTRO */}
        {step === 'intro' && (
          <div className="space-y-8 py-6">
            <div className="space-y-4">
              <p className="text-sm font-bold text-[#4B5D16]">
                {t.discoverTeaser.kicker}
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#3C4620] leading-tight">
                {t.discoverPage.title}
              </h1>
              <p className="text-xl text-[#3C4620]/85 leading-relaxed">
                {t.discoverPage.subtitle}
              </p>
            </div>

            <div className="py-5 border-y border-[#DDD2BC] text-base text-[#3C4620]/80">
              {t.discoverPage.disclaimer}
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(0);
                  setStep('questions');
                }}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 text-lg font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] btn-press cursor-pointer"
              >
                <span>{t.discoverPage.startBtn}</span>
                <NextArrow className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FIVE QUESTIONS */}
        {step === 'questions' && currentQuestion && (
          <div className="space-y-8">
            {/* Progress Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm font-bold text-[#4B5D16]">
                <span>
                  {t.discoverPage.questionProgress
                    .replace('{current}', String(currentIndex + 1))
                    .replace('{total}', String(totalQuestions))}
                </span>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="inline-flex items-center gap-1.5 text-[#3C4620]/70 hover:text-[#3C4620] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.discoverPage.restartBtn}</span>
                </button>
              </div>

              {/* Clean Progress Bar */}
              <div className="w-full h-1.5 bg-[#ECE2CE] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3C4620] transition-transform duration-200 origin-left rtl:origin-right"
                  style={{
                    transform: `scaleX(${(currentIndex + 1) / totalQuestions})`
                  }}
                />
              </div>
            </div>

            {/* Question Prompt */}
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3C4620] leading-snug pt-2">
              {lang === 'ar'
                ? currentQuestion.promptAr
                : currentQuestion.promptEn}
            </h2>

            {/* Radio Options */}
            <div
              role="radiogroup"
              aria-label={
                lang === 'ar'
                  ? currentQuestion.promptAr
                  : currentQuestion.promptEn
              }
              className="space-y-3.5"
            >
              {currentQuestion.options.map((option) => {
                const isSelected = selectedTrackForCurrent === option.track;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectOption(option.track)}
                    className={`w-full text-start p-5 rounded-lg border transition-colors cursor-pointer flex items-start gap-4 ${
                      isSelected
                        ? 'bg-[#ECE2CE] border-[#3C4620] text-[#3C4620]'
                        : 'bg-[#FAF7F0] border-[#DDD2BC] hover:border-[#4B5D16]/60 text-[#3C4620]/90'
                    }`}
                  >
                    <span
                      className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-[#3C4620] bg-[#3C4620]'
                          : 'border-[#3C4620]/40 bg-transparent'
                      }`}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#ECE2CE]" />
                      )}
                    </span>
                    <span className="text-lg leading-relaxed font-normal">
                      {lang === 'ar' ? option.textAr : option.textEn}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Controls */}
            <div className="pt-6 border-t border-[#DDD2BC] flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-base font-bold text-[#3C4620] border border-[#3C4620]/30 hover:border-[#3C4620] rounded-md btn-press cursor-pointer"
              >
                <PrevArrow className="w-4 h-4" />
                <span>{t.discoverPage.prevBtn}</span>
              </button>

              <button
                type="button"
                disabled={!selectedTrackForCurrent}
                onClick={handleNext}
                className={`inline-flex items-center gap-2 px-7 py-2.5 text-base font-bold rounded-md btn-press ${
                  selectedTrackForCurrent
                    ? 'bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] cursor-pointer'
                    : 'bg-[#3C4620]/30 text-[#ECE2CE]/70 cursor-not-allowed'
                }`}
              >
                <span>
                  {currentIndex === totalQuestions - 1
                    ? t.discoverPage.showResultBtn
                    : t.discoverPage.nextBtn}
                </span>
                <NextArrow className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 'result' && recommendedTrack && (
          <div className="space-y-10">
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#E45C10]">
                {t.discoverPage.resultKicker}
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#3C4620]">
                {lang === 'ar'
                  ? recommendedTrack.nameAr
                  : recommendedTrack.nameEn}
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#FAF7F0] border border-[#DDD2BC] rounded-lg p-6 sm:p-8">
              <div className="md:col-span-5">
                <div className="aspect-square rounded-md overflow-hidden border border-[#DDD2BC] bg-[#ECE2CE]">
                  <TrackImage
                    slug={recommendedTrack.slug}
                    src={recommendedTrack.image}
                    alt={
                      lang === 'ar'
                        ? recommendedTrack.nameAr
                        : recommendedTrack.nameEn
                    }
                  />
                </div>
              </div>

              <div className="md:col-span-7 space-y-4">
                <h2 className="text-xl font-bold text-[#4B5D16]">
                  {t.discoverPage.whyThisTrack}
                </h2>
                <p className="text-lg text-[#3C4620] leading-relaxed">
                  {reasonText}
                </p>
                <p className="text-base text-[#3C4620]/80 leading-relaxed pt-2 border-t border-[#DDD2BC]">
                  {lang === 'ar'
                    ? recommendedTrack.descriptionAr
                    : recommendedTrack.descriptionEn}
                </p>
              </div>
            </div>

            <p className="text-base text-[#3C4620]/80 leading-relaxed border-b border-[#DDD2BC] pb-6">
              {t.discoverPage.nonBindingNote}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <PrimaryProgramCta
                  trackSlug={recommendedTrack.slug}
                  size="lg"
                  variant="olive"
                />
                <Link
                  to={recommendedTrack.route}
                  className="inline-flex items-center justify-center px-6 py-3.5 text-base font-bold rounded-md border border-[#3C4620]/40 text-[#3C4620] hover:border-[#3C4620] hover:bg-[#ECE2CE]/50 btn-press"
                >
                  {t.discoverPage.viewTrackDetails}
                </Link>
              </div>

              <button
                type="button"
                onClick={handleRestart}
                className="inline-flex items-center gap-2 text-base font-bold text-[#4B5D16] hover:text-[#3C4620] py-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.discoverPage.restartBtn}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
