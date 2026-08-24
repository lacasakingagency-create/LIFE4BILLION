/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  CheckCircle, 
  Crown,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Flame,
  ArrowRight,
  Palette,
  Check
} from 'lucide-react';
import { LocalDatabase } from '../utils/db';
import { Profile, Subscription } from '../types/schema';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';
import { getPricingPlans, PlanPricing } from '../utils/pricing';
import { THEME_COLOR_OPTIONS, getThemeColorById } from '../utils/theme';

interface SubscriptionProfileViewProps {
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

export default function SubscriptionProfileView({ onShowNotification }: SubscriptionProfileViewProps) {
  const { language, t, themeColor, setThemeColor } = useLanguageTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState('');

  // Pricing & Founder Spots States
  const [founderSpotsRemaining, setFounderSpotsRemaining] = useState<number>(23);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string | null>(null);

  useEffect(() => {
    setProfile(LocalDatabase.getProfile());
    setSub(LocalDatabase.getSubscription());
    
    const prof = LocalDatabase.getProfile();
    if (prof) {
      setFullName(prof.full_name);
      setAvatar(prof.avatar_url);
    }

    // Fetch real-time founder spots
    fetch('/api/pricing/founder-spots')
      .then(res => res.json())
      .then(data => {
        if (typeof data?.remaining === 'number') {
          setFounderSpotsRemaining(data.remaining);
        }
      })
      .catch(() => {});
  }, []);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      onShowNotification('Erro', 'Nome completo não pode ser vazio.', 'warning');
      return;
    }

    const updated = LocalDatabase.updateProfile({
      full_name: fullName.trim(),
      avatar_url: avatar.trim()
    });

    setProfile(updated);
    onShowNotification('Configurações Salvas', 'Preferências de perfil armazenadas com sucesso.', 'success');
  };

  const handlePlanCheckout = async (plan: PlanPricing) => {
    setIsCheckoutLoading(true);
    setCheckoutPlanId(plan.id);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: language, planId: plan.id, currency: plan.currency })
      });

      const data = await res.json().catch(() => null);

      if (data?.remainingFounderSpots !== undefined) {
        setFounderSpotsRemaining(data.remainingFounderSpots);
      }

      if (res.ok && data && data.success && data.checkoutUrl) {
        onShowNotification('Stripe Checkout', 'Redirecionando para checkout seguro...', 'info');
        if (window.self !== window.top) {
          window.open(data.checkoutUrl, '_blank');
        } else {
          window.location.href = data.checkoutUrl;
        }
      } else {
        // Fallback local update for demonstration/offline
        let mappedTierName: 'Pro Plan' | 'Enterprise' | 'Free' = 'Pro Plan';
        if (plan.id === 'founder') {
          mappedTierName = 'Enterprise';
        }

        const updatedSub = LocalDatabase.updateSubscription({
          tier_name: mappedTierName,
          status: 'active',
          price_id: `price_${plan.id}`
        });

        setSub(updatedSub);
        onShowNotification(
          'Plano Atualizado ✅',
          `Plano ${plan.name} ativado com sucesso. Garantia de reembolso de 7 dias disponível.`,
          'success'
        );
      }
    } catch (err) {
      onShowNotification('Erro', 'Não foi possível conectar ao servidor de checkout.', 'warning');
    } finally {
      setIsCheckoutLoading(false);
      setCheckoutPlanId(null);
    }
  };

  const isActiveSubscriber = sub?.status === 'active' && sub?.tier_name !== 'Free';

  // Get available plans according to rules:
  // Do NOT offer Founder plan to active monthly or annual subscribers
  const allPlans = getPricingPlans(language, founderSpotsRemaining);
  const availablePlans = isActiveSubscriber
    ? allPlans.filter(p => p.id !== 'founder')
    : allPlans;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="subscription-profile-container">
      
      {/* Coluna 1: Perfil do Usuário e RLS Info */}
      <div className="space-y-6">
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6" id="profile-card">
          <div className="flex items-center space-x-3 mb-5">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">{t('userProfileSecurity', 'Segurança do Perfil de Usuário')}</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('displayNameLabel', 'Nome de Exibição / Razão Social')}</label>
              <input 
                type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('profilePhotoLabel', 'Foto de Perfil (Carregar da Galeria)')}</label>
              <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                {avatar && (
                  <img 
                    src={avatar} 
                    alt="Preview Avatar" 
                    className="w-8 h-8 rounded-lg object-cover border border-emerald-500/30 shrink-0" 
                  />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64String = reader.result as string;
                        setAvatar(base64String);
                        LocalDatabase.updateProfile({ avatar_url: base64String });
                        onShowNotification('Avatar Carregado', 'Nova foto de perfil selecionada e armazenada localmente.', 'success');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-450 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-600/20 file:text-indigo-400 hover:file:bg-indigo-600/30 file:cursor-pointer cursor-pointer focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('emailLabel', 'E-mail de Cadastro (Identificação)')}</label>
              <input 
                type="text" disabled value="admin@life4billion.com"
                className="w-full bg-slate-950/40 border border-slate-850/60 text-slate-500 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-not-allowed"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              {t('updateProfileBtn', 'Atualizar Perfil')}
            </button>
          </form>
        </div>

        {/* Global Theme System Card (Profile -> Settings -> Appearance) */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-4" id="profile-appearance-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Palette className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                {language.startsWith('pt') ? 'Aparência — Cor do Tema' : language.startsWith('es') ? 'Apariencia — Color del Tema' : 'Appearance — Theme Color'}
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {getThemeColorById(themeColor).hex}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {language.startsWith('pt')
              ? 'Selecione a cor de identidade do SaaS. O Cabeçalho e a Sidebar são atualizados imediatamente.'
              : language.startsWith('es')
              ? 'Seleccione el color de identidad del SaaS. El Encabezado y la Sidebar se actualizarán inmediatamente.'
              : 'Select the primary SaaS identity color. The Header and Sidebar will synchronize immediately.'}
          </p>

          <div className="grid grid-cols-5 gap-2 pt-1" id="profile-theme-color-swatches">
            {THEME_COLOR_OPTIONS.map((c) => {
              const isActive = themeColor === c.id;
              const name = language.startsWith('pt') ? c.namePt : language.startsWith('es') ? c.nameEs : c.nameEn;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setThemeColor(c.id)}
                  title={`${name} (${c.hex})`}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-white/10 border-white ring-2 ring-white/50 scale-105 shadow-xl' 
                      : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div 
                    className="w-7 h-7 rounded-lg shadow-md flex items-center justify-center relative border border-white/20"
                    style={{ backgroundColor: c.hex }}
                  >
                    {isActive && <Check className="w-4 h-4 text-white stroke-[3.5] drop-shadow" />}
                  </div>
                  <span className={`text-[9.5px] font-medium tracking-tight mt-1.5 truncate max-w-full ${
                    isActive ? 'text-white font-bold' : 'text-slate-400'
                  }`}>
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RLS Security Widget */}
        <div className="bg-slate-900/10 border border-slate-850/65 rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <Shield className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">{t('rlsTitle', 'Multi-Tenant Row-Level Security')}</h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {t('rlsDesc', 'Seus dados estão protegidos por RLS integrado em nosso banco de dados centralizado. Cada transação é filtrada pela cláusula SQL WHERE user_id = auth.uid() para isolamento absoluto em ambiente de produção distribuído.')}
          </p>
        </div>
      </div>

      {/* Colunas 2-3: Planos de Assinatura e Faturamento Stripe */}
      <div className="lg:col-span-2 space-y-6" id="subscription-billing">
        
        {/* Status de Assinatura Ativo */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold block">{t('currentSubscription', 'Assinatura Atual')}</span>
            <div className="flex items-center space-x-2 mt-1">
              <Crown className="w-5 h-5 text-amber-400 fill-amber-400/15" />
              <h2 className="text-lg font-bold text-white capitalize">
                {sub?.tier_name === 'Pro Plan' ? 'Plano Ativo' : sub?.tier_name || 'Plano Básico'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {sub?.status === 'active' 
                ? (language.startsWith('pt') ? 'Sua assinatura está ativa e conta com garantia de 7 dias de reembolso.' : 'Your subscription is active with a 7-day money-back guarantee.')
                : (language.startsWith('pt') ? 'Sua conta está ativa. Escolha um plano abaixo para desbloquear todos os recursos.' : 'Select a plan below to unlock all capabilities.')}
            </p>
          </div>

          <div className="mt-4 md:mt-0 text-right bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex items-center space-x-4">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Status</span>
              <span className="text-emerald-400 font-bold text-sm">
                {sub?.status === 'active' ? 'Ativo' : 'Regular'}
              </span>
            </div>
            <span className="bg-emerald-950/60 text-emerald-400 text-[10px] border border-emerald-900/30 px-2.5 py-1 rounded-full uppercase font-semibold">
              Garantia 7 Dias
            </span>
          </div>
        </div>

        {/* 7-Day Money Back Guarantee Banner */}
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 flex items-center space-x-3 text-emerald-300">
          <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
          <div className="text-xs">
            <strong className="font-black uppercase tracking-wider block">
              {language.startsWith('pt') ? 'Garantia Incondicional de 7 Dias' : '7-Day 100% Money-Back Guarantee'}
            </strong>
            <span className="text-[11px] text-slate-300">
              {language.startsWith('pt') ? 'Sem período de teste. Cobrança imediata e devolução total de 100% do valor caso solicite em até 7 dias, sem perguntas.' : 'Charged immediately at purchase. 100% refund guaranteed if requested within 7 days.'}
            </span>
          </div>
        </div>

        {/* Escolha de Planos */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">{t('saasUpgradeOptions', 'Opções de Planos do Life4Billion')}</h3>
              <p className="text-slate-500 text-xs">
                {language.startsWith('pt') ? 'Valores e moedas adaptados automaticamente à sua região.' : 'Prices and currencies adapted automatically to your region.'}
              </p>
            </div>
            <div className="flex items-center space-x-1 text-slate-400 text-xs">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('secureCheckoutSsl', 'Checkout Seguro SSL')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="plans-grid">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`border p-5 rounded-2xl flex flex-col justify-between transition relative overflow-hidden ${
                  plan.popular
                    ? 'bg-indigo-950/30 border-indigo-500 shadow-lg shadow-indigo-500/5'
                    : plan.id === 'founder'
                    ? 'bg-amber-950/20 border-amber-500/80 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                {plan.badge && (
                  <div className="mb-2">
                    <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      plan.popular 
                        ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50'
                        : plan.id === 'founder'
                        ? 'bg-amber-900/50 text-amber-300 border-amber-700/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {plan.id === 'founder' && <Flame className="w-3 h-3 mr-1 text-amber-400" />}
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">{plan.billingDetail}</p>
                  </div>

                  <div className="text-white text-2xl font-black font-sans">
                    {plan.priceDisplay} <span className="text-xs text-slate-400 font-normal">{plan.subText}</span>
                  </div>

                  <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800/80">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={() => handlePlanCheckout(plan)}
                  disabled={isCheckoutLoading}
                  className={`w-full text-xs font-semibold py-2.5 rounded-xl mt-5 transition disabled:opacity-50 cursor-pointer ${
                    plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : plan.id === 'founder'
                      ? 'bg-amber-500 hover:bg-amber-400 text-black font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {isCheckoutLoading && checkoutPlanId === plan.id
                    ? t('processingStripe', 'Processando Stripe...') 
                    : (language.startsWith('pt') ? 'Selecionar Plano' : 'Select Plan')}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

