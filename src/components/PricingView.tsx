import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Crown, 
  RefreshCw, 
  LogOut, 
  ArrowLeft,
  Lock,
  Zap,
  Globe
} from 'lucide-react';
import OmniSaaSLogo from './OmniSaaSLogo';
import { useLanguageTheme, Language } from '../utils/i18n';
import { getPricingPlans, PlanPricing } from '../utils/pricing';
import { useAuth } from '../context/AuthContext';

interface PricingViewProps {
  onBackToLogin?: () => void;
  onPaymentSuccess?: () => void;
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

export default function PricingView({
  onBackToLogin,
  onPaymentSuccess,
  onShowNotification
}: PricingViewProps) {
  const { language, setLanguage, t } = useLanguageTheme();
  const { user, signOut, isAuthenticated } = useAuth();

  const [selectedPlanId, setSelectedPlanId] = useState<'monthly' | 'annual' | 'founder'>('annual');
  const [founderSpotsRemaining, setFounderSpotsRemaining] = useState<number>(23);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);

  // Fetch real-time pricing config & founder spots
  useEffect(() => {
    fetch('/api/pricing/founder-spots')
      .then(res => res.json())
      .then(data => {
        if (typeof data?.remaining === 'number') {
          setFounderSpotsRemaining(data.remaining);
        }
      })
      .catch(() => {});
  }, []);

  const plans = getPricingPlans(language, founderSpotsRemaining);

  const handleSubscribe = async (plan: PlanPricing) => {
    setIsLoadingCheckout(true);
    setCheckoutPlanId(plan.id);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lang: language,
          planId: plan.id,
          currency: plan.currency,
          userId: user?.id || undefined,
          userEmail: user?.email || undefined
        })
      });

      const data = await res.json().catch(() => null);

      if (data?.remainingFounderSpots !== undefined) {
        setFounderSpotsRemaining(data.remainingFounderSpots);
      }

      if (res.ok && data && data.success && data.checkoutUrl) {
        onShowNotification(
          t('stripeCheckoutTitle', 'Redirecionando para o Checkout'),
          language.startsWith('pt') 
            ? 'Abrindo checkout seguro do Stripe...' 
            : 'Redirecting to secure Stripe checkout...',
          'info'
        );

        if (window.self !== window.top) {
          window.open(data.checkoutUrl, '_blank');
        } else {
          window.location.href = data.checkoutUrl;
        }
      } else if (data && data.simulated) {
        // Safe simulation fallback when in dev test mode
        onShowNotification(
          language.startsWith('pt') ? 'Assinatura Ativada' : 'Subscription Activated',
          language.startsWith('pt') ? `Plano ${plan.name} ativado com sucesso.` : `Plan ${plan.name} activated successfully.`,
          'success'
        );
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else {
        throw new Error(data?.error || data?.message || 'Falha ao iniciar checkout.');
      }
    } catch (err: any) {
      onShowNotification(
        language.startsWith('pt') ? 'Erro no Checkout' : 'Checkout Error',
        err.message || 'Não foi possível conectar ao provedor de pagamento.',
        'warning'
      );
    } finally {
      setIsLoadingCheckout(false);
      setCheckoutPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500 selection:text-white" id="pricing-view-container">
      
      {/* Top Header Navigation */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4 border-b border-slate-850">
        <div className="flex items-center space-x-3">
          <OmniSaaSLogo size="sm" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono hidden sm:inline-block">
            Life4Billion
          </span>
        </div>

        <div className="flex items-center space-x-3">
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

          {/* User Account / Navigation State */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-2 pl-2">
              <span className="text-xs text-slate-400 hidden md:inline-block font-medium truncate max-w-[160px]">
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language.startsWith('pt') ? 'Sair' : 'Sign Out'}</span>
              </button>
            </div>
          ) : (
            onBackToLogin && (
              <button
                onClick={onBackToLogin}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language.startsWith('pt') ? 'Entrar' : 'Sign In'}</span>
              </button>
            )
          )}
        </div>
      </header>

      {/* Main Pricing Hero & Content */}
      <main className="max-w-6xl w-full mx-auto py-8 sm:py-12 flex-1 flex flex-col justify-center">
        
        {/* Title & Subtitle */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language.startsWith('pt') ? 'Planos & Ativação Life4Billion' : 'Life4Billion Plans & Activation'}</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {language.startsWith('pt') 
              ? 'Escolha seu plano e ative seu espaço' 
              : language.startsWith('es')
              ? 'Elige tu plan y activa tu espacio'
              : 'Choose your plan and activate your workspace'}
          </h1>
          
          <p className="text-sm text-slate-400 leading-relaxed">
            {language.startsWith('pt')
              ? 'Acesso completo ao ERP Executivo, Gestão Financeira, Hábitos, Metas e Copiloto de Inteligência Artificial.'
              : language.startsWith('es')
              ? 'Acceso completo al ERP Ejecutivo, Gestión Financiera, Hábitos, Metas y Copiloto de Inteligencia Artificial.'
              : 'Full access to the Executive ERP, Financial Management, Habits, Goals, and AI Copilot.'}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch" id="pricing-plans-grid">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isFounder = plan.id === 'founder';
            const isPopular = plan.popular;

            return (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                  isPopular 
                    ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-600/15' 
                    : isFounder 
                    ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-500/70 shadow-2xl shadow-amber-500/10'
                    : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'
                }`}
                id={`plan-card-${plan.id}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-3 py-1 text-[10px] font-black tracking-wider uppercase rounded-full shadow-lg whitespace-nowrap ${
                      isPopular 
                        ? 'bg-indigo-600 text-white' 
                        : isFounder 
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Icon */}
                  <div className="flex items-center justify-between mb-4 pt-1">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                      {isFounder && <Crown className="w-5 h-5 text-amber-400 shrink-0" />}
                      {isPopular && <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />}
                      <span>{plan.name}</span>
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {plan.priceDisplay}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {plan.subText}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
                      {plan.billingDetail}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="h-[1px] bg-slate-800 my-4" />

                  {/* Features List */}
                  <ul className="space-y-2.5 mb-6 text-xs text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start space-x-2.5 leading-tight">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isFounder ? 'text-amber-400' : isPopular ? 'text-indigo-400' : 'text-emerald-400'
                        }`} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Action Button */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe(plan);
                    }}
                    disabled={isLoadingCheckout}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 cursor-pointer ${
                      isFounder
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                        : isPopular
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                    id={`subscribe-btn-${plan.id}`}
                  >
                    {isLoadingCheckout && checkoutPlanId === plan.id ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{language.startsWith('pt') ? 'Conectando ao Stripe...' : 'Connecting to Stripe...'}</span>
                      </div>
                    ) : (
                      <>
                        <span>
                          {language.startsWith('pt') 
                            ? 'Assinar com Stripe' 
                            : language.startsWith('es')
                            ? 'Suscribirse con Stripe'
                            : 'Subscribe with Stripe'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-slate-500">
                    {plan.refundGuarantee}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

        {/* Security & Guarantee Trust Bar */}
        <div className="mt-12 p-4 sm:p-5 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2.5">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-slate-200">{language.startsWith('pt') ? 'Checkout Seguro' : 'Secure Checkout'}</p>
              <p className="text-[10px] text-slate-400">{language.startsWith('pt') ? 'Criptografia 256-bit SSL' : '256-bit SSL Encryption'}</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-slate-200">{language.startsWith('pt') ? 'Garantia de 7 Dias' : '7-Day Guarantee'}</p>
              <p className="text-[10px] text-slate-400">{language.startsWith('pt') ? 'Reembolso de 100%' : '100% Money Back'}</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start space-x-2.5">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-slate-200">{language.startsWith('pt') ? 'Ativação Imediata' : 'Instant Activation'}</p>
              <p className="text-[10px] text-slate-400">{language.startsWith('pt') ? 'Acesso instantâneo ao SaaS' : 'Instant workspace access'}</p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 border-t border-slate-900 text-[11px] text-slate-600 font-mono">
        Life4Billion Enterprise • Secure Subscription Gateway
      </footer>

    </div>
  );
}
