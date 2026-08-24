import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  Sparkles, 
  LogIn, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2,
  X
} from 'lucide-react';
import OmniSaaSLogo from './OmniSaaSLogo';
import { useLanguageTheme } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';

interface LoginViewProps {
  onLogin?: (email: string, provider: 'email' | 'google', fullName?: string, phone?: string) => void;
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
  onViewPricing?: () => void;
}

export default function LoginView({ 
  onLogin, 
  onShowNotification,
  onViewPricing 
}: LoginViewProps) {
  const { language, setLanguage, t } = useLanguageTheme();
  const { 
    signInWithPassword, 
    signUp, 
    resetPassword, 
    signInWithGoogle 
  } = useAuth();

  // App credentials states
  const [email, setEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('life4billion_remembered_email') || '';
    }
    return '';
  });
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Friendly error message formatter
  const formatAuthError = (err: string): string => {
    const lower = err.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
      return language.startsWith('pt') 
        ? 'Email ou senha incorretos. Por favor, tente novamente.'
        : language.startsWith('es')
        ? 'Correo electrónico o contraseña incorrectos.'
        : 'Invalid email or password. Please check your credentials.';
    }
    if (lower.includes('user already registered') || lower.includes('already exists')) {
      return language.startsWith('pt')
        ? 'Este email já está registrado. Por favor, faça login.'
        : language.startsWith('es')
        ? 'Este correo ya está registrado. Por favor inicia sesión.'
        : 'This email is already registered. Please sign in.';
    }
    if (lower.includes('password should be at least 6 characters')) {
      return language.startsWith('pt')
        ? 'A senha deve ter no mínimo 6 caracteres.'
        : language.startsWith('es')
        ? 'La contraseña debe tener al menos 6 caracteres.'
        : 'Password must be at least 6 characters long.';
    }
    return err;
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setAuthErrorMessage(null);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setAuthErrorMessage(res.error ? formatAuthError(res.error) : 'Falha ao autenticar com Google.');
        onShowNotification(
          language.startsWith('pt') ? 'Erro de Autenticação' : 'Authentication Error',
          res.error || 'Não foi possível conectar com o Google.',
          'warning'
        );
      }
    } catch (err: any) {
      setAuthErrorMessage(err.message || 'Falha ao iniciar autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password Submit
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setAuthErrorMessage(
        language.startsWith('pt') 
          ? 'Por favor, preencha email e senha.' 
          : 'Please enter both email and password.'
      );
      return;
    }

    if (isRegisterMode && !fullName.trim()) {
      setAuthErrorMessage(
        language.startsWith('pt') 
          ? 'Por favor, informe seu nome completo.' 
          : 'Please enter your full name.'
      );
      return;
    }

    if (isRegisterMode && !agreeTerms) {
      setAuthErrorMessage(
        language.startsWith('pt') 
          ? 'Você deve aceitar os Termos de Uso.' 
          : 'You must agree to the Terms of Service.'
      );
      return;
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        const res = await signUp(email.trim(), password, fullName.trim(), phoneNumber.trim());
        if (res.success) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('life4billion_remembered_email', email.trim());
          }
          onShowNotification(
            language.startsWith('pt') ? 'Conta Criada!' : 'Account Created!',
            language.startsWith('pt') 
              ? 'Sua conta Life4Billion foi criada com sucesso.' 
              : 'Your Life4Billion account was successfully created.',
            'success'
          );
          if (onLogin) {
            onLogin(email.trim(), 'email', fullName.trim(), phoneNumber.trim());
          }
        } else {
          setAuthErrorMessage(res.error ? formatAuthError(res.error) : 'Falha ao criar conta.');
        }
      } else {
        const res = await signInWithPassword(email.trim(), password);
        if (res.success) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('life4billion_remembered_email', email.trim());
          }
          onShowNotification(
            language.startsWith('pt') ? 'Bem-vindo de volta!' : 'Welcome back!',
            language.startsWith('pt') 
              ? 'Login realizado com sucesso.' 
              : 'Successfully signed in.',
            'success'
          );
          if (onLogin) {
            onLogin(email.trim(), 'email');
          }
        } else {
          setAuthErrorMessage(res.error ? formatAuthError(res.error) : 'Falha ao autenticar.');
        }
      }
    } catch (err: any) {
      setAuthErrorMessage(err.message || 'Erro inesperado durante a autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      onShowNotification('Atenção', 'Informe seu email cadastrado.', 'warning');
      return;
    }

    setIsSendingReset(true);
    try {
      const res = await resetPassword(forgotEmail.trim());
      if (res.success) {
        onShowNotification(
          language.startsWith('pt') ? 'Email Enviado' : 'Email Sent',
          language.startsWith('pt') 
            ? 'Instruções de recuperação foram enviadas para seu email.' 
            : 'Password reset instructions have been sent to your email.',
          'success'
        );
        setShowForgotModal(false);
      } else {
        onShowNotification('Erro', res.error || 'Não foi possível enviar o email.', 'warning');
      }
    } catch (err: any) {
      onShowNotification('Erro', err.message || 'Falha na recuperação.', 'warning');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500 selection:text-white" id="login-view-container">
      
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-850">
        <div className="flex items-center space-x-3">
          <OmniSaaSLogo size="sm" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono hidden sm:inline-block">
            Life4Billion
          </span>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setLanguage('pt-BR')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              language.startsWith('pt') ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PT
          </button>
          <button
            onClick={() => setLanguage('en-US')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              language.startsWith('en') ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('es')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              language.startsWith('es') ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ES
          </button>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="max-w-md w-full mx-auto py-8 sm:py-12 flex-1 flex flex-col justify-center">
        
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative" id="auth-card">
          
          {/* Card Header & Logo */}
          <div className="text-center space-y-3 mb-8">
            <OmniSaaSLogo size="lg" className="justify-center" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {isRegisterMode 
                ? (language.startsWith('pt') ? 'Criar Conta no Life4Billion' : language.startsWith('es') ? 'Crear Cuenta en Life4Billion' : 'Create your Life4Billion Account')
                : (language.startsWith('pt') ? 'Acesse o Life4Billion' : language.startsWith('es') ? 'Acceder a Life4Billion' : 'Sign in to Life4Billion')}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              {isRegisterMode
                ? (language.startsWith('pt') ? 'Preencha seus dados ou use sua conta Google para começar.' : 'Enter your details or use Google to get started.')
                : (language.startsWith('pt') ? 'Entre para gerenciar seu patrimônio, metas e finanças.' : 'Sign in to manage your net worth, goals, and finances.')}
            </p>
          </div>

          {/* Mode Tabs (Sign In / Sign Up) */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setAuthErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                !isRegisterMode 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="tab-sign-in"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{language.startsWith('pt') ? 'Entrar' : language.startsWith('es') ? 'Iniciar Sesión' : 'Sign In'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setAuthErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                isRegisterMode 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="tab-sign-up"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language.startsWith('pt') ? 'Criar Conta' : language.startsWith('es') ? 'Registrarse' : 'Create Account'}</span>
            </button>
          </div>

          {/* Error Banner */}
          {authErrorMessage && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start space-x-3 text-rose-300 text-xs animate-shake" id="auth-error-banner">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <p className="leading-snug">{authErrorMessage}</p>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-3 shadow-md disabled:opacity-50 cursor-pointer"
            id="google-oauth-btn"
          >
            {/* Google Vector Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>
              {language.startsWith('pt') 
                ? 'Continuar com Google' 
                : language.startsWith('es')
                ? 'Continuar con Google'
                : 'Continue with Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-[1px] bg-slate-800" />
            <span className="px-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {language.startsWith('pt') ? 'ou com email' : language.startsWith('es') ? 'o con correo' : 'or with email'}
            </span>
            <div className="flex-1 h-[1px] bg-slate-800" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4" id="email-auth-form">
            
            {/* Full Name (Only Register Mode) */}
            {isRegisterMode && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  {language.startsWith('pt') ? 'Nome Completo' : language.startsWith('es') ? 'Nombre Completo' : 'Full Name'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={language.startsWith('pt') ? 'Ex: Alexander Santos' : 'e.g. Alexander Smith'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                    id="input-fullname"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {language.startsWith('pt') ? 'Email Corporativo / Pessoal' : language.startsWith('es') ? 'Correo Electrónico' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  id="input-email"
                />
              </div>
            </div>

            {/* Phone Number (Optional, Only Register Mode) */}
            {isRegisterMode && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {language.startsWith('pt') ? 'WhatsApp / Telefone' : language.startsWith('es') ? 'Teléfono' : 'Phone Number'}
                  </label>
                  <span className="text-[10px] text-slate-600 font-normal">
                    {language.startsWith('pt') ? 'Opcional' : 'Optional'}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+55 (11) 99999-9999"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                    id="input-phone"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {language.startsWith('pt') ? 'Senha de Acesso' : language.startsWith('es') ? 'Contraseña' : 'Password'}
                </label>
                {!isRegisterMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                  >
                    {language.startsWith('pt') ? 'Esqueceu a senha?' : language.startsWith('es') ? '¿Olvidaste tu contraseña?' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  id="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions (Register Mode) */}
            {isRegisterMode && (
              <label className="flex items-start space-x-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <span className="text-[11px] text-slate-400 leading-snug">
                  {language.startsWith('pt')
                    ? 'Concordo com os Termos de Serviço e Política de Privacidade da Life4Billion.'
                    : 'I agree to the Life4Billion Terms of Service and Privacy Policy.'}
                </span>
              </label>
            )}

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50 cursor-pointer mt-2"
              id="submit-auth-btn"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language.startsWith('pt') ? 'Processando...' : 'Processing...'}</span>
                </div>
              ) : (
                <>
                  <span>
                    {isRegisterMode 
                      ? (language.startsWith('pt') ? 'Criar Conta Life4Billion' : 'Create Life4Billion Account') 
                      : (language.startsWith('pt') ? 'Entrar no Life4Billion' : 'Sign in to Life4Billion')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Optional View Plans Link */}
          {onViewPricing && (
            <div className="text-center pt-6 mt-6 border-t border-slate-850">
              <button
                type="button"
                onClick={onViewPricing}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center space-x-1.5 transition"
              >
                <span>{language.startsWith('pt') ? 'Conhecer Planos & Preços' : 'View Plans & Pricing'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 border-t border-slate-900 text-[11px] text-slate-600 font-mono">
        Life4Billion Core Architecture • Secure Private Workspace
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {language.startsWith('pt') ? 'Recuperar Senha' : 'Reset Password'}
              </h3>
              <p className="text-xs text-slate-400">
                {language.startsWith('pt')
                  ? 'Digite seu email para receber o link de redefinição.'
                  : 'Enter your email to receive a password reset link.'}
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  {language.startsWith('pt') ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2"
                >
                  {isSendingReset ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{language.startsWith('pt') ? 'Enviar' : 'Send Link'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
