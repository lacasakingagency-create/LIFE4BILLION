import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit3, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Sparkles, 
  Calculator, 
  Target, 
  DollarSign, 
  AlertTriangle,
  Bot,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useLanguageTheme, formatCurrency, formatDate } from '../utils/i18n';
import { LocalDatabase } from '../utils/db';
import { EmergencyFund, Debt, FinancialCard, PaidDebtLog, Transaction } from '../types/schema';
import CardManagementView from './CardManagementView';

interface EmergencyFundViewProps {
  onShowNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const EmergencyFundView: React.FC<EmergencyFundViewProps> = ({
  onShowNotification
}) => {
  const { t, language } = useLanguageTheme();

  // Trilingual helper for dynamic fallback handling (Portuguese, English, Spanish)
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  // State
  const [fund, setFund] = useState<EmergencyFund>(() => LocalDatabase.getEmergencyFund());
  const [debts, setDebts] = useState<Debt[]>(() => LocalDatabase.getDebts());
  const [cards, setCards] = useState<FinancialCard[]>(() => LocalDatabase.getCards());
  const [paidDebts, setPaidDebts] = useState<PaidDebtLog[]>(() => LocalDatabase.getPaidDebts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => LocalDatabase.getTransactions());

  // UI Tabs
  const [activeTab, setActiveTab] = useState<'fund' | 'debts' | 'cards' | 'history' | 'coach'>('fund');
  const [debtStrategy, setDebtStrategy] = useState<'snowball' | 'avalanche'>('snowball');

  // Modals & Inputs
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isEditFundModalOpen, setIsEditFundModalOpen] = useState(false);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDepositModalOpen) setIsDepositModalOpen(false);
        if (isEditFundModalOpen) setIsEditFundModalOpen(false);
        if (isAddDebtOpen) setIsAddDebtOpen(false);
        if (isAddCardOpen) setIsAddCardOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDepositModalOpen, isEditFundModalOpen, isAddDebtOpen, isAddCardOpen]);
  const [depositAmount, setDepositAmount] = useState('');
  const [fundTargetInput, setFundTargetInput] = useState(fund.target_amount.toString());
  const [fundDeadlineInput, setFundDeadlineInput] = useState(fund.deadline);
  const [fundPurposeInput, setFundPurposeInput] = useState(fund.purpose);

  // New Debt Form
  const [debtCreditor, setDebtCreditor] = useState('');
  const [debtTotal, setDebtTotal] = useState('');
  const [debtRate, setDebtRate] = useState('');
  const [debtMin, setDebtMin] = useState('');
  const [debtDue, setDebtDue] = useState('2026-08-15');
  const [debtCategory, setDebtCategory] = useState<Debt['category']>('credit_card');

  // New Card Form
  const [cardName, setCardName] = useState('');
  const [cardBank, setCardBank] = useState('');
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [cardLimit, setCardLimit] = useState('');
  const [cardBalance, setCardBalance] = useState('');
  const [cardDue, setCardDue] = useState('2026-08-20');
  const [cardRate, setCardRate] = useState('18.5');
  const [cardLast4, setCardLast4] = useState('4321');

  // Calculate user income & expenses for formula recommendation
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) || 12500;
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) || 6200;
  const monthlySurplus = Math.max(0, totalIncome - totalExpenses);

  // Calculate Emergency Fund completion & monthly recommendation formula
  const fundRemaining = Math.max(0, fund.target_amount - fund.current_balance);
  const fundPct = Math.min(100, Math.round((fund.current_balance / (fund.target_amount || 1)) * 100));

  // Months to deadline calculation
  const deadlineDate = new Date(fund.deadline);
  const now = new Date();
  const monthsRemaining = Math.max(1, Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const recommendedMonthlyContribution = Math.round(fundRemaining / monthsRemaining);

  // Debt Calculations
  const activeDebts = debts.filter(d => d.status === 'active');
  const totalDebtBalance = activeDebts.reduce((sum, d) => sum + (d.total_amount - d.paid_amount), 0);
  const totalMinPayments = activeDebts.reduce((sum, d) => sum + d.minimum_payment, 0);

  // Debt Snowball (smallest balance first) vs Avalanche (highest interest first)
  const sortedDebts = [...activeDebts].sort((a, b) => {
    if (debtStrategy === 'snowball') {
      return (a.total_amount - a.paid_amount) - (b.total_amount - b.paid_amount);
    } else {
      return b.interest_rate - a.interest_rate;
    }
  });

  // Total Card Limit & Utilization
  const creditCards = cards.filter(c => c.type === 'credit');
  const totalCreditLimit = creditCards.reduce((acc, c) => acc + c.limit_amount, 0);
  const totalCreditBalance = creditCards.reduce((acc, c) => acc + c.current_balance, 0);
  const overallUtilizationRate = totalCreditLimit > 0 ? Math.round((totalCreditBalance / totalCreditLimit) * 100) : 0;

  // Actions
  const handleDepositFund = () => {
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) return;
    const newBal = fund.current_balance + val;
    const updated = LocalDatabase.updateEmergencyFund({ current_balance: newBal });
    setFund(updated);
    setDepositAmount('');
    setIsDepositModalOpen(false);
    if (onShowNotification) {
      onShowNotification(
        'Emergency Fund Updated',
        `Successfully added ${formatCurrency(val, language)} to your fund balance.`,
        'success'
      );
    }
  };

  const handleSaveFundTarget = () => {
    const target = parseFloat(fundTargetInput) || fund.target_amount;
    const updated = LocalDatabase.updateEmergencyFund({
      target_amount: target,
      deadline: fundDeadlineInput,
      purpose: fundPurposeInput
    });
    setFund(updated);
    setIsEditFundModalOpen(false);
    if (onShowNotification) {
      onShowNotification('Target Updated', 'Emergency fund target parameters saved.', 'success');
    }
  };

  const handleAddDebt = () => {
    if (!debtCreditor || !debtTotal) return;
    const total = parseFloat(debtTotal);
    LocalDatabase.addDebt({
      creditor: debtCreditor,
      total_amount: total,
      paid_amount: 0,
      interest_rate: parseFloat(debtRate) || 12.0,
      minimum_payment: parseFloat(debtMin) || 100,
      due_date: debtDue,
      category: debtCategory
    });
    setDebts(LocalDatabase.getDebts());
    setDebtCreditor('');
    setDebtTotal('');
    setIsAddDebtOpen(false);
    if (onShowNotification) {
      onShowNotification('Debt Registered', `Added ${debtCreditor} to Debt Center.`, 'success');
    }
  };

  const handlePayOffDebt = (debtId: string) => {
    const updated = LocalDatabase.markDebtPaid(debtId);
    setDebts(updated);
    setPaidDebts(LocalDatabase.getPaidDebts());
    if (onShowNotification) {
      onShowNotification('Congratulations! 🎉', 'You have fully paid off and eliminated this debt!', 'success');
    }
  };

  const handleToggleFreezeCard = (cardId: string) => {
    const updated = LocalDatabase.toggleCardFreeze(cardId);
    setCards(updated);
    const card = updated.find(c => c.id === cardId);
    if (onShowNotification && card) {
      onShowNotification(
        card.is_frozen ? 'Card Frozen' : 'Card Unfrozen',
        `${card.name} status is now ${card.is_frozen ? 'FROZEN' : 'ACTIVE'}.`,
        card.is_frozen ? 'warning' : 'info'
      );
    }
  };

  const handleAddCard = () => {
    if (!cardName || !cardBank || !cardLimit) return;
    const limit = parseFloat(cardLimit);
    const balance = parseFloat(cardBalance) || 0;
    LocalDatabase.addCard({
      name: cardName,
      bank: cardBank,
      type: cardType,
      limit_amount: limit,
      current_balance: balance,
      payment_due_date: cardDue,
      interest_rate: parseFloat(cardRate) || 18.0,
      is_frozen: false,
      last_4: cardLast4 || '8888',
      color: cardType === 'credit' ? 'from-indigo-600 to-blue-800' : 'from-emerald-600 to-teal-800'
    });
    setCards(LocalDatabase.getCards());
    setCardName('');
    setCardBank('');
    setCardLimit('');
    setCardBalance('');
    setIsAddCardOpen(false);
    if (onShowNotification) {
      onShowNotification('Card Added', 'New financial card added to manager.', 'success');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="emergency-fund-center-view">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {tr('PROTEÇÃO FINANCEIRA', 'FINANCIAL PROTECTION', 'PROTECCIÓN FINANCIERA')}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {tr('Reserva de Emergência & Centro de Dívidas', 'Emergency Reserve & Debt Center', 'Reserva de Emergencia y Centro de Deudas')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {t('emergency.fundCenter', tr('Central de Reserva de Emergência', 'Emergency Reserve & Protection Center', 'Centro de Reserva de Emergencia y Protección'))}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr(
                'Proteja seu patrimônio, elimine dívidas com estratégias Snowball/Avalanche e controle limites de cartão.',
                'Protect your wealth, eliminate debt with Snowball/Avalanche strategies, and control card limits.',
                'Proteja su patrimonio, elimine deudas con estrategias Snowball/Avalanche y controle los límites de sus tarjetas.'
              )}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl shrink-0">
          <button 
            onClick={() => setActiveTab('fund')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'fund' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tr('Reserva de Emergência', 'Emergency Fund', 'Fondo de Emergencia')}
          </button>
          <button 
            onClick={() => setActiveTab('debts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'debts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tr('Central de Dívidas', 'Debt Center', 'Centro de Deudas')} ({activeDebts.length})
          </button>
          <button 
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'cards' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tr('Cartões', 'Cards', 'Tarjetas')} ({cards.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tr('Dívidas Quitadas', 'Paid Debts', 'Deudas Pagadas')} ({paidDebts.length})
          </button>
          <button 
            onClick={() => setActiveTab('coach')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1 ${
              activeTab === 'coach' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-emerald-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{tr('Coach de IA', 'AI Coach', 'Coach de IA')}</span>
          </button>
        </div>
      </div>

      {/* 1. EMERGENCY FUND TAB */}
      {activeTab === 'fund' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Main Fund Progress Card */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                  {t('emergency.currentBalance', tr('RESERVA DE EMERGÊNCIA ATUAL', 'CURRENT EMERGENCY RESERVE', 'RESERVA DE EMERGENCIA ACTUAL'))}
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
                  {formatCurrency(fund.current_balance, language)}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  {tr('Meta Alvo:', 'Target Goal:', 'Meta Objetivo:')}{' '}
                  <strong className="text-emerald-400">{formatCurrency(fund.target_amount, language)}</strong>{' '}
                  {tr(`(${fundPct}% Concluído)`, `(${fundPct}% Completed)`, `(${fundPct}% Completado)`)}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsDepositModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{tr('Adicionar Aporte', 'Add Contribution', 'Añadir Aporte')}</span>
                </button>
                <button 
                  onClick={() => setIsEditFundModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs border border-slate-700 transition flex items-center space-x-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{tr('Ajustar Meta', 'Adjust Target', 'Ajustar Objetivo')}</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-700" 
                  style={{ width: `${fundPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>{tr('R$0', '$0', '€0')}</span>
                <span>{tr(`${fundPct}% Alcançado`, `${fundPct}% Reached`, `${fundPct}% Alcanzado`)}</span>
                <span>{formatCurrency(fund.target_amount, language)}</span>
              </div>
            </div>

            {/* Formula Calculation Recommendation Banner */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start space-x-3 text-xs">
              <Calculator className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-white text-sm">
                  {tr('Recomendação de Aporte Inteligente', 'Smart Contribution Recommendation', 'Recomendación de Aporte Inteligente')}
                </p>
                <p className="text-slate-300 leading-relaxed">
                  {tr(
                    `Com base na sua renda, despesas e metas, você deve poupar `,
                    `Based on your income, expenses and goals, you should save `,
                    `Según sus ingresos, gastos y metas, debe ahorrar `
                  )}
                  <strong className="text-emerald-300 font-bold">
                    {formatCurrency(recommendedMonthlyContribution, language)} {tr('por mês', 'per month', 'al mes')}
                  </strong>{' '}
                  {tr(
                    `nos próximos ${monthsRemaining} mês(es) para atingir sua meta até ${formatDate(fund.deadline)}.`,
                    `over the next ${monthsRemaining} month(s) to reach your emergency target date of ${formatDate(fund.deadline)}.`,
                    `durante los próximos ${monthsRemaining} mes(es) para alcanzar su meta antes del ${formatDate(fund.deadline)}.`
                  )}
                </p>
              </div>
            </div>

            {/* Purpose & Target Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-[10px] uppercase font-semibold text-slate-400">
                  {tr('Propósito da Meta', 'Target Purpose', 'Propósito de la Meta')}
                </p>
                <p className="text-sm font-bold text-white mt-1 capitalize">
                  {fund.purpose === 'job_loss' 
                    ? tr('Proteção contra Desemprego', 'Job Loss Protection', 'Protección por Desempleo') 
                    : fund.purpose === 'medical' 
                    ? tr('Emergência Médica', 'Medical Emergency', 'Emergencia Médica')
                    : fund.purpose === 'family'
                    ? tr('Segurança Familiar', 'Family Security', 'Seguridad Familiar')
                    : fund.purpose === 'unexpected'
                    ? tr('Despesas Inesperadas', 'Unexpected Expenses', 'Gastos Inesperados')
                    : tr('Meta Personalizada', 'Custom Goal', 'Meta Personalizada')}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-[10px] uppercase font-semibold text-slate-400">
                  {tr('Data Estimada de Conclusão', 'Estimated Completion Date', 'Fecha Estimada de Finalización')}
                </p>
                <p className="text-sm font-bold text-emerald-400 mt-1">{formatDate(fund.deadline)}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-[10px] uppercase font-semibold text-slate-400">
                  {tr('Restante a Poupar', 'Remaining to Save', 'Restante por Ahorrar')}
                </p>
                <p className="text-sm font-bold text-indigo-400 mt-1">{formatCurrency(fundRemaining, language)}</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. DEBT MANAGEMENT CENTER TAB */}
      {activeTab === 'debts' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Debt Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div>
              <h3 className="text-base font-bold text-white">
                {t('debt.managementCenter', tr('Central de Gestão de Dívidas', 'Debt Management Center', 'Centro de Gestión de Deudas'))}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {tr(
                  'Aplique estratégias Bola de Neve (Snowball) ou Avalanche para minimizar os juros pagos.',
                  'Apply Debt Snowball or Debt Avalanche strategies to minimize interest paid.',
                  'Aplique estrategias de Bola de Nieve (Snowball) o Avalancha para minimizar los intereses pagados.'
                )}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Strategy Selector */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button 
                  onClick={() => setDebtStrategy('snowball')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    debtStrategy === 'snowball' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title={tr('Menores dívidas primeiro para ganho de impulso rápido', 'Smallest debts first for quick momentum', 'Deudas más pequeñas primero para ganar impulso rápido')}
                >
                  {tr('Bola de Neve', 'Snowball', 'Bola de Nieve')}
                </button>
                <button 
                  onClick={() => setDebtStrategy('avalanche')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    debtStrategy === 'avalanche' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title={tr('Maior taxa de juros primeiro para economizar mais dinheiro', 'Highest interest rate first to save maximum money', 'Mayor tasa de interés primero para ahorrar máximo dinero')}
                >
                  Avalanche
                </button>
              </div>

              <button 
                onClick={() => setIsAddDebtOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{tr('Adicionar Dívida', 'Add Debt', 'Añadir Deuda')}</span>
              </button>
            </div>
          </div>

          {/* Debt Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <p className="text-xs uppercase font-semibold text-slate-400">
                {tr('Dívida Ativa Total', 'Total Active Debt', 'Deuda Activa Total')}
              </p>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(totalDebtBalance, language)}</h3>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <p className="text-xs uppercase font-semibold text-slate-400">
                {tr('Pagamentos Mínimos Mensais', 'Monthly Minimum Payments', 'Pagos Mínimos Mensuales')}
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">{formatCurrency(totalMinPayments, language)}</h3>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
              <p className="text-xs uppercase font-semibold text-slate-400">
                {tr('Previsão para Quitação', 'Estimated Debt-Free Date', 'Fecha Estimada Libre de Deuda')}
              </p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                {activeDebts.length === 0 
                  ? tr('Livre de Dívidas!', 'Debt Free!', '¡Libre de Deudas!') 
                  : tr('Out 2027', 'Oct 2027', 'Oct 2027')}
              </h3>
            </div>
          </div>

          {/* Strategy Strategy Description */}
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-slate-300">
            <span className="font-bold text-white">
              {tr('Estratégia Ativa:', 'Active Strategy:', 'Estrategia Activa:')}{' '}
              {debtStrategy === 'snowball' 
                ? tr('Método Bola de Neve', 'Debt Snowball Method', 'Método Bola de Nieve') 
                : tr('Método Avalanche', 'Debt Avalanche Method', 'Método Avalancha')}
            </span>
            <p className="mt-0.5 text-slate-400">
              {debtStrategy === 'snowball' 
                ? tr(
                    'Foco nas dívidas de menor saldo primeiro para construir impulso psicológico e reduzir o número de credores.',
                    'Targeting smallest balance debts first to build psychological momentum and reduce the number of creditors.',
                    'Enfocado en las deudas de menor saldo primero para generar impulso psicológico y reducir el número de acreedores.'
                  )
                : tr(
                    'Foco nas dívidas com maior taxa de juros anual primeiro para minimizar matematicamente o total de juros ao longo do tempo.',
                    'Targeting highest annual interest rate debts first to mathematically minimize total interest expenses over time.',
                    'Enfocado en las deudas con mayor tasa de interés anual primero para minimizar matemáticamente el costo total de intereses.'
                  )}
            </p>
          </div>

          {/* Debts Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-950/40">
                  <th className="py-3 px-4">{tr('Credor', 'Creditor', 'Acreedor')}</th>
                  <th className="py-3 px-4">{tr('Categoria', 'Category', 'Categoría')}</th>
                  <th className="py-3 px-4">{tr('Saldo Restante', 'Remaining Balance', 'Saldo Restante')}</th>
                  <th className="py-3 px-4">{tr('Taxa de Juros', 'Interest Rate', 'Tasa de Interés')}</th>
                  <th className="py-3 px-4">{tr('Paz. Mínimo', 'Min. Payment', 'Pago Mínimo')}</th>
                  <th className="py-3 px-4 text-right">{tr('Ações', 'Actions', 'Acciones')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedDebts.map((d, index) => {
                  const rem = d.total_amount - d.paid_amount;
                  return (
                    <tr key={d.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-white flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                          #{index + 1}
                        </span>
                        <span>{d.creditor}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 uppercase text-[10px]">{d.category.replace('_', ' ')}</td>
                      <td className="py-3.5 px-4 font-bold text-rose-400">{formatCurrency(rem, language)}</td>
                      <td className="py-3.5 px-4 font-semibold text-amber-400">{d.interest_rate}% APR</td>
                      <td className="py-3.5 px-4 text-slate-300">{formatCurrency(d.minimum_payment, language)}/{tr('mês', 'mo', 'mes')}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => handlePayOffDebt(d.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-md shadow-emerald-600/20"
                        >
                          {tr('Marcar como Quitada', 'Mark Fully Paid', 'Marcar Totalmente Pagada')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 3. CARD MANAGEMENT TAB */}
      {activeTab === 'cards' && (
        <CardManagementView onShowNotification={onShowNotification} />
      )}

      {/* 4. PAID DEBTS HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>{t('debt.paidHistory', tr('Conquistas Financeiras & Dívidas Quitadas', 'Financial Accomplishments & Paid Debts', 'Logros Financieros y Deudas Pagadas'))}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr(
                'Celebre seus marcos de eliminação de dívidas e juros economizados ao longo do tempo.',
                'Celebrate your debt elimination milestones and interest saved over time.',
                'Celebre sus hitos de eliminación de deudas e intereses ahorrados a lo largo del tiempo.'
              )}
            </p>
          </div>

          <div className="space-y-3">
            {paidDebts.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {tr('Parabéns! Você quitou sua dívida de ', 'Congratulations! You eliminated your ', '¡Felicitaciones! Eliminaste tu deuda de ')}
                      {formatCurrency(item.total_paid, language)} {tr('com ', 'with ', 'con ')}{item.creditor}.
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {tr('Concluído em ', 'Completed on ', 'Completado el ')}{formatDate(item.date_completed)}. {tr('Você economizou cerca de ', 'You saved approximately ', 'Ahorraste aproximadamente ')}
                      <strong className="text-emerald-300">{formatCurrency(item.interest_saved, language)}</strong> {tr('em taxas de juros.', 'in interest fees.', 'en tarifas de interés.')}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-center shrink-0">
                  {tr('Quitada', 'Paid In Full', 'Pagada Totalmente')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. AI FINANCIAL COACH WIDGET TAB */}
      {activeTab === 'coach' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 shrink-0">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {tr('Seu Treinador Financeiro de IA', 'Your Personal AI Financial Coach', 'Su Entrenador Financiero de IA')}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                  {tr(
                    'Inteligência financeira automatizada analisando relações entre Orçamento \u2192 Despesas \u2192 Reserva de Emergência \u2192 Quitação de Dívidas \u2192 Patrimônio Líquido.',
                    'Automated financial intelligence analyzing relationships between Budget \u2192 Expenses \u2192 Emergency Reserve \u2192 Debt Payoff \u2192 Net Worth.',
                    'Inteligencia financiera automatizada que analiza relaciones entre Presupuesto \u2192 Gastos \u2192 Reserva de Emergencia \u2192 Pago de Deudas \u2192 Patrimonio Neto.'
                  )}
                </p>
              </div>
            </div>

            <div className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold rounded-xl shrink-0">
              {tr('Contexto Geral Ativo', 'SaaS-Wide Context Active', 'Contexto General Activo')}
            </div>
          </div>

          {/* Coach Insight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Daily Insight */}
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-3">
              <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {tr('Insight Diário', 'Daily Financial Insight', 'Insight Diario')}
              </span>
              <h4 className="font-bold text-white text-sm">
                {tr('Aceleração da Reserva de Emergência', 'Emergency Reserve Acceleration', 'Aceleración de Reserva de Emergencia')}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {tr(
                  'Suas despesas com restaurantes aumentaram 35% este mês. Reorientar $120 para sua Reserva de Emergência acelerará seu objetivo em 18 dias.',
                  'Your dining expenses increased 35% this month. Reallocating $120 from dining out into your Emergency Reserve will accelerate your target completion by 18 days.',
                  'Sus gastos en restaurantes aumentaron un 35% este mes. Reorientar $120 a su Reserva de Emergencia acelerará su objetivo en 18 días.'
                )}
              </p>
            </div>

            {/* Card 2: Weekly Review */}
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-3">
              <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {tr('Revisão Semanal', 'Weekly Review', 'Revisión Semanal')}
              </span>
              <h4 className="font-bold text-white text-sm">
                {tr('Marco de Eliminação de Dívidas', 'Debt Payoff Milestone', 'Hito de Eliminación de Deudas')}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {tr(
                  'Aplicar o método Bola de Neve ao saldo do seu menor cartão eliminará a dívida em 4 meses, liberando $150/mês de fluxo de caixa adicional.',
                  'Applying the Debt Snowball strategy to your smallest card balance will eliminate card debt within 4 months, unlocking $150/mo additional cash flow.',
                  'Aplicar la estrategia Bola de Nieve al saldo de su tarjeta más pequeña eliminará la deuda en 4 meses, liberando $150/mes de flujo adicional.'
                )}
              </p>
            </div>

            {/* Card 3: Monthly Report */}
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-3">
              <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {tr('Relatório Mensal', 'Monthly Report', 'Informe Mensual')}
              </span>
              <h4 className="font-bold text-white text-sm">
                {tr('Pontuação Global de Proteção: 88/100', 'Overall Protection Score: 88/100', 'Puntuación Global de Protección: 88/100')}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {tr(
                  `Sua reserva de emergência está 50% concluída e a utilização geral do cartão de crédito permanece saudável. Você está no caminho certo para a independência financeira.`,
                  `Your emergency fund is 50% completed and overall credit card utilization remains healthy at ${overallUtilizationRate}%. You are on track for financial freedom.`,
                  `Su fondo de emergencia está completado al 50% y la utilización general de tarjetas se mantiene saludable. Está en el camino correcto hacia la libertad financiera.`
                )}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* MODAL: ADD CONTRIBUTION */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsDepositModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white">
              {tr('Adicionar Aporte para Reserva de Emergência', 'Add Emergency Fund Contribution', 'Añadir Aporte a Reserva de Emergencia')}
            </h3>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">
                {tr('Valor do Aporte', 'Contribution Amount', 'Monto del Aporte')}
              </label>
              <input 
                type="number" 
                value={depositAmount} 
                onChange={e => setDepositAmount(e.target.value)}
                placeholder="500.00" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setIsDepositModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-400">
                {tr('Cancelar', 'Cancel', 'Cancelar')}
              </button>
              <button onClick={handleDepositFund} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs">
                {tr('Confirmar Aporte', 'Confirm Contribution', 'Confirmar Aporte')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT FUND TARGET */}
      {isEditFundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsEditFundModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white">
              {tr('Ajustar Parâmetros da Reserva', 'Adjust Emergency Target Parameters', 'Ajustar Parámetros de Reserva')}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">
                  {tr('Valor Alvo', 'Target Amount', 'Monto Objetivo')}
                </label>
                <input 
                  type="number" 
                  value={fundTargetInput} 
                  onChange={e => setFundTargetInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  {tr('Data Limite', 'Target Deadline', 'Fecha Límite')}
                </label>
                <input 
                  type="date" 
                  value={fundDeadlineInput} 
                  onChange={e => setFundDeadlineInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  {tr('Propósito Principal', 'Primary Purpose', 'Propósito Principal')}
                </label>
                <select 
                  value={fundPurposeInput} 
                  onChange={e => setFundPurposeInput(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                >
                  <option value="job_loss">{tr('Proteção contra Desemprego', 'Job Loss Protection', 'Protección por Desempleo')}</option>
                  <option value="medical">{tr('Emergência Médica', 'Medical Emergency', 'Emergencia Médica')}</option>
                  <option value="family">{tr('Segurança Familiar', 'Family Security', 'Seguridad Familiar')}</option>
                  <option value="unexpected">{tr('Despesas Inesperadas', 'Unexpected Expenses', 'Gastos Inesperados')}</option>
                  <option value="custom">{tr('Meta Personalizada', 'Custom Goal', 'Meta Personalizada')}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setIsEditFundModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-400">
                {tr('Cancelar', 'Cancel', 'Cancelar')}
              </button>
              <button onClick={handleSaveFundTarget} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs">
                {tr('Salvar Meta', 'Save Target', 'Guardar Meta')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD DEBT */}
      {isAddDebtOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddDebtOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white">
              {tr('Adicionar Obrigação de Dívida', 'Add Debt Obligation', 'Añadir Obligación de Deuda')}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">
                  {tr('Nome do Credor', 'Creditor Name', 'Nombre del Acreedor')}
                </label>
                <input 
                  type="text" 
                  value={debtCreditor} 
                  onChange={e => setDebtCreditor(e.target.value)}
                  placeholder={tr('ex: Cartão de Crédito Itaú', 'e.g. Platinum Credit Card', 'ej: Tarjeta de Crédito')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">
                    {tr('Valor Total', 'Total Amount', 'Monto Total')}
                  </label>
                  <input 
                    type="number" 
                    value={debtTotal} 
                    onChange={e => setDebtTotal(e.target.value)}
                    placeholder="3000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">
                    {tr('Taxa de Juros (% a.a.)', 'Interest Rate (% APR)', 'Tasa de Interés (% APR)')}
                  </label>
                  <input 
                    type="number" 
                    value={debtRate} 
                    onChange={e => setDebtRate(e.target.value)}
                    placeholder="18.9"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">
                    {tr('Pagamento Mínimo', 'Minimum Payment', 'Pago Mínimo')}
                  </label>
                  <input 
                    type="number" 
                    value={debtMin} 
                    onChange={e => setDebtMin(e.target.value)}
                    placeholder="150"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">
                    {tr('Data de Vencimento', 'Due Date', 'Fecha de Vencimiento')}
                  </label>
                  <input 
                    type="date" 
                    value={debtDue} 
                    onChange={e => setDebtDue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setIsAddDebtOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-400">
                {tr('Cancelar', 'Cancel', 'Cancelar')}
              </button>
              <button onClick={handleAddDebt} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs">
                {tr('Adicionar Dívida', 'Add Debt', 'Añadir Deuda')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CARD */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddCardOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-white">
              {tr('Adicionar Novo Cartão', 'Add New Card', 'Añadir Nueva Tarjeta')}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">
                    {tr('Nome do Cartão', 'Card Name', 'Nombre de la Tarjeta')}
                  </label>
                  <input 
                    type="text" 
                    value={cardName} 
                    onChange={e => setCardName(e.target.value)}
                    placeholder={tr('ex: Platinum Mastercard', 'e.g. Sapphire Preferred', 'ej: Tarjeta Oro')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">
                    {tr('Banco / Emissor', 'Bank / Issuer', 'Banco / Emisor')}
                  </label>
                  <input 
                    type="text" 
                    value={cardBank} 
                    onChange={e => setCardBank(e.target.value)}
                    placeholder="Nubank / Chase"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">
                    {tr('Limite de Crédito', 'Credit Limit', 'Límite de Crédito')}
                  </label>
                  <input 
                    type="number" 
                    value={cardLimit} 
                    onChange={e => setCardLimit(e.target.value)}
                    placeholder="10000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">
                    {tr('Fatura Atual', 'Current Balance', 'Saldo Actual')}
                  </label>
                  <input 
                    type="number" 
                    value={cardBalance} 
                    onChange={e => setCardBalance(e.target.value)}
                    placeholder="2500"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setIsAddCardOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-400">
                {tr('Cancelar', 'Cancel', 'Cancelar')}
              </button>
              <button onClick={handleAddCard} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs">
                {tr('Salvar Cartão', 'Save Card', 'Guardar Tarjeta')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
