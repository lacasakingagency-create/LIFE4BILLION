import React from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  Calendar, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useLanguageTheme, formatCurrency } from '../../utils/i18n';
import { getThemeColorById } from '../../utils/theme';
import { Goal, Transaction } from '../../types/schema';

interface MinimalProps {
  netBalance: number;
  totalIncome: number;
  totalExpense: number;
  goals: Goal[];
  transactions: Transaction[];
  onNavigate?: (view: string) => void;
}

export const MinimalDashboard: React.FC<MinimalProps> = ({
  netBalance,
  totalIncome,
  totalExpense,
  goals,
  transactions,
  onNavigate
}) => {
  const { t, language, theme, themeColor } = useLanguageTheme();
  const isLight = theme === 'light';
  const activeThemeOption = getThemeColorById(themeColor);

  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const balance = netBalance || 0;
  const income = totalIncome || 0;
  const expenses = totalExpense || 0;

  const activeGoals = goals.filter(g => g.status === 'in_progress').slice(0, 2);
  const recentExps = transactions.filter(t => t.type === 'expense').slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fade-in" id="minimal-dashboard">
      
      {/* Ultra Clean Top Header */}
      <div className="text-center space-y-1">
        <span 
          className="px-3 py-1 rounded-full text-xs font-semibold border"
          style={{
            backgroundColor: `${activeThemeOption.hex}15`,
            borderColor: `${activeThemeOption.hex}40`,
            color: isLight ? activeThemeOption.hex : '#ffffff'
          }}
        >
          {t('dashboard.minimal', tr('Painel Minimalista', 'Minimal Dashboard', 'Panel Minimalista'))}
        </span>
        <h2 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {tr('Visão Simples', 'Simple Overview', 'Vista Simple')}
        </h2>
        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {tr('Apenas números essenciais. Clareza sem distrações.', 'Essential numbers only. Distraction-free clarity.', 'Solo números esenciales. Claridad sin distracciones.')}
        </p>
      </div>

      {/* Main Focus Card - Current Balance (Themed Background matching Header & Sidebar) */}
      <div 
        className="border border-white/15 rounded-3xl p-8 text-center space-y-3 shadow-2xl text-white transition-colors"
        style={{ backgroundColor: activeThemeOption.hex }}
      >
        <p className="text-xs uppercase font-semibold text-white/80 tracking-widest">
          {t('dashboard.currentBalance', tr('Saldo Atual', 'Current Balance', 'Saldo Actual'))}
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          {formatCurrency(balance, language)}
        </h1>
        <p className="text-xs text-orange-300 font-semibold">
          {balance >= 0 
            ? tr('Posição financeira saudável', 'Healthy cash position', 'Posición financiera saludable') 
            : tr('Atenção: Saldo negativo', 'Negative balance attention needed', 'Atención: Saldo negativo')}
        </p>
      </div>

      {/* Two Column Summary: Income & Expenses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Income Card */}
        <div className={`border p-6 rounded-2xl flex items-center space-x-4 transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('income', tr('Entradas', 'Money In', 'Entradas'))}</p>
            <p className={`text-2xl font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurrency(income, language)}</p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className={`border p-6 rounded-2xl flex items-center space-x-4 transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 shrink-0">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('expenses', tr('Saídas', 'Money Out', 'Salidas'))}</p>
            <p className={`text-2xl font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurrency(expenses, language)}</p>
          </div>
        </div>

      </div>

      {/* Goals & Upcoming Payments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        
        {/* Simple Goals */}
        <div className={`border p-6 rounded-2xl space-y-4 transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <h3 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
            <Target className="w-4 h-4 text-emerald-400" />
            <span>{t('dashboard.financialGoals', tr('Metas Ativas', 'Active Goals', 'Metas Activas'))}</span>
          </h3>

          {activeGoals.length === 0 ? (
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{tr('Nenhuma meta ativa definida ainda.', 'No active goals set yet.', 'No hay metas activas definidas aún.')}</p>
          ) : (
            <div className="space-y-3">
              {activeGoals.map(g => (
                <div key={g.id} className="space-y-1 text-xs">
                  <div className={`flex justify-between font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <span>{g.name}</span>
                    <span className="text-emerald-500 font-bold">
                      {Math.min(100, Math.round((g.current_value / (g.target_value || 1)) * 100))}%
                    </span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                    <div 
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((g.current_value / (g.target_value || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Payments / Recent Outflows */}
        <div className={`border p-6 rounded-2xl space-y-4 transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/40 border-slate-800'
        }`}>
          <h3 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>{t('dashboard.upcomingPayments', tr('Próximos Pagamentos', 'Upcoming Payments', 'Próximos Pagos'))}</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className={`flex justify-between items-center p-2.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800/60'
            }`}>
              <div>
                <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Servidor em Nuvem AWS</p>
                <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{tr('Vence 15 Ago', 'Due Aug 15', 'Vence 15 Ago')}</p>
              </div>
              <span className="font-bold text-rose-400">{formatCurrency(1450, language)}</span>
            </div>

            <div className={`flex justify-between items-center p-2.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800/60'
            }`}>
              <div>
                <p className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{tr('Assinaturas de Software', 'Software Subscriptions', 'Suscripciones de Software')}</p>
                <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{tr('Vence 18 Ago', 'Due Aug 18', 'Vence 18 Ago')}</p>
              </div>
              <span className="font-bold text-rose-400">{formatCurrency(350, language)}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
