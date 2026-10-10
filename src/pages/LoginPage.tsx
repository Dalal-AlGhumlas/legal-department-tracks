import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useProgramStore } from '../services/programStore';

export const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const { signIn, requestPasswordReset } = useProgramStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);

    try {
      const user = await signIn(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError(t.loginPage.invalidCredentials);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSignIn = async (demoEmail: string, demoPass: string) => {
    setError('');
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);
    try {
      const user = await signIn(demoEmail, demoPass);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError(t.loginPage.invalidCredentials);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      setResetSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-16 md:py-24">
      <div className="max-w-lg mx-auto px-5 sm:px-8 space-y-10">
        {!isResetMode ? (
          <>
            <div className="space-y-3 border-b border-[#DDD2BC] pb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#3C4620]">
                {t.loginPage.title}
              </h1>
              <p className="text-lg text-[#3C4620]/85 leading-relaxed">
                {t.loginPage.subtitle}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="p-4 rounded-md bg-[#E45C10]/10 border border-[#E45C10] text-[#3C4620] flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-[#E45C10] shrink-0 mt-0.5" />
                <span className="text-base font-bold">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="block text-base font-bold text-[#3C4620]"
                >
                  {t.loginPage.emailLabel}
                </label>
                <input
                  id="login-email"
                  type="email"
                  dir="ltr"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.loginPage.emailPlaceholder}
                  className="w-full px-4 py-3 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] focus:border-[#3C4620] text-[#3C4620] text-base"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="login-password"
                    className="block text-base font-bold text-[#3C4620]"
                  >
                    {t.loginPage.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setResetSuccess(false);
                      setError('');
                    }}
                    className="text-sm font-bold text-[#4B5D16] hover:text-[#3C4620] cursor-pointer"
                  >
                    {t.loginPage.forgotPasswordLink}
                  </button>
                </div>
                <input
                  id="login-password"
                  type="password"
                  dir="ltr"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.loginPage.passwordPlaceholder}
                  className="w-full px-4 py-3 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] focus:border-[#3C4620] text-[#3C4620] text-base"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 text-lg font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] disabled:opacity-60 btn-press cursor-pointer"
                >
                  {isLoading ? t.loginPage.submittingBtn : t.loginPage.submitBtn}
                </button>
              </div>
            </form>

            {/* Policy note: No public signup */}
            <p className="text-sm text-[#3C4620]/75 leading-relaxed border-t border-[#DDD2BC] pt-6">
              {t.loginPage.noPublicSignupNote}
            </p>

            {/* Quick Evaluation Sign-in Helper */}
            <div className="pt-4 border-t border-[#DDD2BC] space-y-3">
              <p className="text-xs font-bold text-[#4B5D16]">
                {t.loginPage.demoCredentialsTitle}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickSignIn(
                      'sara.alotaibi@student.ksu.edu.sa',
                      'MasarPart2026!'
                    )
                  }
                  className="px-4 py-2 text-sm font-bold rounded-md bg-[#ECE2CE] text-[#3C4620] hover:bg-[#DDD2BC] btn-press cursor-pointer"
                >
                  {t.loginPage.demoParticipantBtn}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickSignIn(
                      'development.lawclub@gmail.com',
                      'MasarAdmin2026!'
                    )
                  }
                  className="px-4 py-2 text-sm font-bold rounded-md border border-[#3C4620]/30 text-[#3C4620] hover:border-[#3C4620] btn-press cursor-pointer"
                >
                  {t.loginPage.demoAdminBtn}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2 border-b border-[#DDD2BC] pb-6">
              <h1 className="text-3xl font-bold text-[#3C4620]">
                {t.loginPage.resetPasswordTitle}
              </h1>
              <p className="text-base text-[#3C4620]/85 leading-relaxed">
                {t.loginPage.resetPasswordSubtitle}
              </p>
            </div>

            {resetSuccess ? (
              <div className="p-5 rounded-md bg-[#4B5D16]/10 border border-[#4B5D16] text-[#3C4620] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#4B5D16] shrink-0 mt-0.5" />
                <span className="text-base leading-relaxed">
                  {t.loginPage.resetSentSuccess}
                </span>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="reset-email"
                    className="block text-base font-bold text-[#3C4620]"
                  >
                    {t.loginPage.emailLabel}
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    dir="ltr"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.loginPage.emailPlaceholder}
                    className="w-full px-4 py-3 rounded-md bg-[#FAF7F0] border border-[#DDD2BC] focus:border-[#3C4620] text-[#3C4620] text-base"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 text-base font-bold rounded-md bg-[#3C4620] text-[#ECE2CE] hover:bg-[#4B5D16] btn-press cursor-pointer"
                >
                  {t.loginPage.sendResetBtn}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setIsResetMode(false)}
              className="text-base font-bold text-[#4B5D16] hover:text-[#3C4620] cursor-pointer"
            >
              {t.loginPage.backToLoginLink}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
