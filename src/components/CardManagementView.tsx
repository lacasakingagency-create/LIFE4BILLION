import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Landmark
} from 'lucide-react';
import { useLanguageTheme, formatCurrency, formatDate } from '../utils/i18n';
import { LocalDatabase } from '../utils/db';
import { FinancialCard } from '../types/schema';
import { Life4BillionConnectModal } from './Life4BillionConnectModal';

interface CardManagementViewProps {
  onShowNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function CardManagementView({ onShowNotification }: CardManagementViewProps) {
  const { t, language } = useLanguageTheme();
  
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const [cards, setCards] = useState<FinancialCard[]>(() => LocalDatabase.getCards());

  // Connect Modal State
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCardForPay, setSelectedCardForPay] = useState<FinancialCard | null>(null);
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddCardOpen) setIsAddCardOpen(false);
        if (isPayModalOpen) setIsPayModalOpen(false);
        if (isConnectModalOpen) setIsConnectModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAddCardOpen, isPayModalOpen, isConnectModalOpen]);

  // Form Fields for New Card
  const [cardName, setCardName] = useState('');
  const [cardBank, setCardBank] = useState('');
  const [cardBrand, setCardBrand] = useState<'visa' | 'master_black' | 'master_gold'>('visa');
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [cardLimit, setCardLimit] = useState('');
  const [cardBalance, setCardBalance] = useState('');
  const [cardDue, setCardDue] = useState('2026-08-20');
  const [cardRate, setCardRate] = useState('18.5');
  const [cardLast4, setCardLast4] = useState('4821');
  const [cardHolder, setCardHolder] = useState('LUCAS KING');
  const [cardExpiry, setCardExpiry] = useState('08/29');

  useEffect(() => {
    setCards(LocalDatabase.getCards());
  }, []);

  const totalCreditLimit = cards.filter(c => c.type === 'credit').reduce((sum, c) => sum + c.limit_amount, 0);
  const totalBalance = cards.reduce((sum, c) => sum + c.current_balance, 0);
  const totalAvailable = Math.max(0, totalCreditLimit - totalBalance);
  const overallUtilizationRate = totalCreditLimit > 0 ? Math.round((totalBalance / totalCreditLimit) * 100) : 0;

  const handleToggleFreeze = (id: string) => {
    const updated = LocalDatabase.toggleCardFreeze(id);
    setCards(updated);
    const targetCard = updated.find(c => c.id === id);
    if (targetCard && onShowNotification) {
      onShowNotification(
        targetCard.is_frozen ? 'Cartão Bloqueado' : 'Cartão Desbloqueado',
        `O cartão ${targetCard.name} foi ${targetCard.is_frozen ? 'bloqueado temporariamente' : 'desbloqueado para uso'}.`,
        targetCard.is_frozen ? 'warning' : 'success'
      );
    }
  };

  const handleDeleteCard = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o cartão ${name}?`)) {
      const updated = LocalDatabase.deleteCard(id);
      setCards(updated);
      if (onShowNotification) {
        onShowNotification('Cartão Removido', `O cartão ${name} foi excluído com sucesso.`, 'info');
      }
    }
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim() || !cardBank.trim()) {
      if (onShowNotification) onShowNotification('Aviso', 'Preencha o nome do cartão e o banco emissor.', 'warning');
      return;
    }

    const limit = parseFloat(cardLimit) || 10000;
    const balance = parseFloat(cardBalance) || 0;

    let color = 'from-blue-900 via-indigo-900 to-slate-950';
    if (cardBrand === 'master_black') color = 'from-zinc-950 via-neutral-900 to-black';
    if (cardBrand === 'master_gold') color = 'from-amber-600 via-yellow-500 to-amber-700';

    LocalDatabase.addCard({
      name: cardName.trim(),
      bank: cardBank.trim(),
      type: cardType,
      brand: cardBrand,
      limit_amount: limit,
      current_balance: balance,
      payment_due_date: cardDue || '2026-08-20',
      interest_rate: parseFloat(cardRate) || 18.5,
      is_frozen: false,
      last_4: cardLast4.padStart(4, '0').slice(-4),
      cardholder_name: cardHolder.toUpperCase() || 'LUCAS KING',
      expiry_date: cardExpiry || '08/29',
      color
    });

    setCards(LocalDatabase.getCards());
    setIsAddCardOpen(false);
    resetForm();

    if (onShowNotification) {
      onShowNotification('Novo Cartão Adicionado', `O cartão ${cardName} (${cardBrand.toUpperCase()}) foi registrado.`, 'success');
    }
  };

  const resetForm = () => {
    setCardName('');
    setCardBank('');
    setCardBrand('visa');
    setCardType('credit');
    setCardLimit('');
    setCardBalance('');
    setCardDue('2026-08-20');
    setCardRate('18.5');
    setCardLast4('4821');
    setCardHolder('LUCAS KING');
    setCardExpiry('08/29');
  };

  const handlePayCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardForPay) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      if (onShowNotification) onShowNotification('Aviso', 'Insira um valor de pagamento válido.', 'warning');
      return;
    }

    const newBalance = Math.max(0, selectedCardForPay.current_balance - amount);
    LocalDatabase.updateCard(selectedCardForPay.id, {
      current_balance: newBalance,
      available_credit: Math.max(0, selectedCardForPay.limit_amount - newBalance)
    });

    // Also record as a payment transaction
    LocalDatabase.addTransaction({
      description: `Pagamento Fatura ${selectedCardForPay.name}`,
      amount: amount,
      type: 'expense',
      category: 'Dívidas & Cartões',
      date: new Date().toISOString().split('T')[0]
    });

    setCards(LocalDatabase.getCards());
    setIsPayModalOpen(false);
    setPayAmount('');
    setSelectedCardForPay(null);

    if (onShowNotification) {
      onShowNotification('Pagamento Efetuado', `A fatura do cartão foi abatida em ${formatCurrency(amount, language)}.`, 'success');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="card-management-section">
      {/* Top Banner Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{tr('Limite Total', 'Total Credit Limit', 'Límite Total')}</p>
            <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(totalCreditLimit, language)}</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{tr('Faturas Atuais', 'Current Statements', 'Facturas Actuales')}</p>
            <p className="text-xl font-bold text-rose-400 mt-0.5">{formatCurrency(totalBalance, language)}</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{tr('Crédito Disponível', 'Available Credit', 'Crédito Disponible')}</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{formatCurrency(totalAvailable, language)}</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{tr('Uso do Limite', 'Utilization Rate', 'Uso del Límite')}</p>
            <p className="text-xl font-bold text-amber-300 mt-0.5">{overallUtilizationRate}%</p>
          </div>
        </div>
      </div>

      {/* Control Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/90 border border-slate-800 p-5 rounded-2xl gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>{tr('Gestão de Cartões de Crédito & Débito', 'Credit & Debit Cards Management', 'Gestión de Tarjetas de Crédito y Débito')}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Visa & Mastercard Black / Gold
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {tr('Simulação de cartões físicos com bloqueio, faturas e controle de limite.', 'Physical card simulation with lock feature, statement tracking and credit limit monitoring.', 'Simulación de tarjetas físicas con función de bloqueo, estados de cuenta y control de límite.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={() => setIsConnectModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-600/20 flex items-center space-x-2 shrink-0"
          >
            <Landmark className="w-4 h-4" />
            <span>{tr('Conectar Banco ou Cartão', 'Connect Bank or Card', 'Conectar Banco o Tarjeta')}</span>
          </button>

          <button 
            onClick={() => setIsAddCardOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition flex items-center space-x-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{tr('Adicionar Novo Cartão', 'Add New Card', 'Añadir Nueva Tarjeta')}</span>
          </button>
        </div>
      </div>

      {/* Utilization Warning */}
      {overallUtilizationRate > 30 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Atenção ao Limite de Crédito ({overallUtilizationRate}%)</p>
            <p className="text-slate-400 mt-0.5">
              A utilização agregada de seus cartões ultrapassou 30%. Recomendamos priorizar a quitação de faturas para otimizar seu score de crédito.
            </p>
          </div>
        </div>
      )}

      {/* Realistic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const util = card.limit_amount > 0 ? Math.round((card.current_balance / card.limit_amount) * 100) : 0;
          const brand = card.brand || (card.name.toLowerCase().includes('visa') ? 'visa' : card.name.toLowerCase().includes('black') ? 'master_black' : card.name.toLowerCase().includes('gold') ? 'master_gold' : 'visa');

          return (
            <div key={card.id} className="flex flex-col space-y-3">
              {/* Card Graphic Container */}
              <div 
                className={`relative h-52 w-full rounded-2xl p-5 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 ${
                  brand === 'master_black'
                    ? 'bg-gradient-to-br from-zinc-950 via-stone-900 to-black text-white border border-zinc-700/60'
                    : brand === 'master_gold'
                    ? 'bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-700 text-slate-950 border border-amber-300/60'
                    : 'bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 text-white border border-blue-500/40'
                }`}
              >
                {/* Background Ambient Metallic Shimmer Effect */}
                <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                
                {/* Frozen Overlay if locked */}
                {card.is_frozen && (
                  <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-full text-rose-400">
                      <Lock className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-rose-300 uppercase tracking-widest">Cartão Bloqueado</p>
                    <p className="text-[10px] text-slate-400 max-w-[180px]">Temporariamente inativo para segurança de compras e saques.</p>
                  </div>
                )}

                {/* Card Top Row: Bank Name & Brand Logo */}
                <div className="flex justify-between items-start z-10">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${brand === 'master_gold' ? 'text-slate-900' : 'text-slate-300'}`}>
                      {card.bank}
                    </span>
                    <h4 className={`text-sm font-bold truncate max-w-[180px] ${brand === 'master_gold' ? 'text-slate-950' : 'text-white'}`}>
                      {card.name}
                    </h4>
                  </div>

                  {/* Brand Visual Logo */}
                  {brand === 'visa' && (
                    <div className="flex flex-col items-end">
                      <span className="text-xl italic font-black tracking-tighter text-white font-serif drop-shadow-md">
                        VISA
                      </span>
                      <span className="text-[8px] tracking-widest uppercase font-bold text-blue-300">INFINITE</span>
                    </div>
                  )}

                  {brand === 'master_black' && (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center -space-x-2">
                        <div className="w-5 h-5 rounded-full bg-stone-300/90 shadow-sm" />
                        <div className="w-5 h-5 rounded-full bg-zinc-500/90 shadow-sm" />
                      </div>
                      <span className="text-[8px] font-black tracking-widest uppercase text-slate-300 mt-0.5">BLACK</span>
                    </div>
                  )}

                  {brand === 'master_gold' && (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center -space-x-2">
                        <div className="w-5 h-5 rounded-full bg-red-600/90 shadow-sm" />
                        <div className="w-5 h-5 rounded-full bg-amber-400/90 shadow-sm" />
                      </div>
                      <span className="text-[8px] font-black tracking-widest uppercase text-slate-900 mt-0.5">GOLD</span>
                    </div>
                  )}
                </div>

                {/* Card Middle Row: EMV Chip & Contactless Icon */}
                <div className="flex items-center justify-between my-1 z-10">
                  {/* Metallic EMV Chip */}
                  <div className={`w-9 h-7 rounded-md border flex items-center justify-center p-1 shadow-inner ${
                    brand === 'master_gold' ? 'bg-amber-300/80 border-amber-600/50' : 'bg-gradient-to-tr from-amber-200 to-yellow-400 border-amber-500/60'
                  }`}>
                    <div className="w-full h-full border border-amber-700/40 rounded-sm grid grid-cols-2 gap-0.5">
                      <div className="border-r border-b border-amber-700/40" />
                      <div className="border-b border-amber-700/40" />
                      <div className="border-r border-amber-700/40" />
                      <div className="" />
                    </div>
                  </div>

                  {/* Contactless Icon */}
                  <svg className={`w-5 h-5 opacity-70 ${brand === 'master_gold' ? 'text-slate-950' : 'text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a10 10 0 0 1 10 10" />
                    <path d="M12 6a6 6 0 0 1 6 6" />
                    <path d="M12 10a2 2 0 0 1 2 2" />
                  </svg>
                </div>

                {/* Card Number Row */}
                <div className="z-10">
                  <p className={`font-mono text-base tracking-widest font-extrabold ${brand === 'master_gold' ? 'text-slate-950' : 'text-slate-100'}`}>
                    •••• •••• •••• {card.last_4}
                  </p>
                </div>

                {/* Card Bottom Row: Holder & Expiry */}
                <div className="flex justify-between items-end z-10 pt-1">
                  <div>
                    <p className={`text-[8px] uppercase tracking-wider font-semibold ${brand === 'master_gold' ? 'text-slate-800' : 'text-slate-400'}`}>{t('holder', 'Titular')}</p>
                    <p className={`text-xs font-bold font-mono tracking-wide ${brand === 'master_gold' ? 'text-slate-950' : 'text-white'}`}>
                      {card.cardholder_name || 'LUCAS KING'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[8px] uppercase tracking-wider font-semibold ${brand === 'master_gold' ? 'text-slate-800' : 'text-slate-400'}`}>{t('expiry', 'Validade')}</p>
                    <p className={`text-xs font-bold font-mono ${brand === 'master_gold' ? 'text-slate-950' : 'text-white'}`}>
                      {card.expiry_date || '08/29'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Meta & Action Bar */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{t('currentStatement', 'Fatura Atual')}:</span>
                  <span className="font-bold text-rose-400">{formatCurrency(card.current_balance, language)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{t('cards.creditLimit', 'Limite do Cartão')}:</span>
                  <span className="font-bold text-slate-200">{formatCurrency(card.limit_amount, language)}</span>
                </div>

                {/* Progress Bar */}
                {card.type === 'credit' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold">
                      <span className="text-slate-400">{t('utilizationRate', 'Taxa de Uso')}</span>
                      <span className={util > 30 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{util}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full rounded-full ${util > 50 ? 'bg-rose-500' : util > 30 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, util)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
                  <button
                    onClick={() => {
                      setSelectedCardForPay(card);
                      setPayAmount(card.current_balance.toString());
                      setIsPayModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl transition flex items-center space-x-1"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{t('payBill', 'Pagar Fatura')}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => handleToggleFreeze(card.id)}
                      className={`p-2 rounded-xl border transition ${
                        card.is_frozen 
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30' 
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      title={card.is_frozen ? 'Desbloquear Cartão' : 'Bloquear Cartão'}
                    >
                      {card.is_frozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDeleteCard(card.id, card.name)}
                      className="p-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 hover:border-rose-500/30 rounded-xl transition"
                      title="Excluir Cartão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Card */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsAddCardOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsAddCardOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <span>Adicionar Novo Cartão</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Cadastre seu cartão Visa, Mastercard Black ou Mastercard Gold.</p>
            </div>

            <form onSubmit={handleAddCardSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Bandeira / Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCardBrand('visa')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
                      cardBrand === 'visa' 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-serif italic font-black text-sm">VISA</span>
                    <span className="text-[9px]">Infinite</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardBrand('master_black')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
                      cardBrand === 'master_black' 
                        ? 'bg-zinc-800 border-zinc-500 text-white' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-mono font-black text-sm text-zinc-300">MASTER</span>
                    <span className="text-[9px]">Black</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardBrand('master_gold')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center space-y-1 ${
                      cardBrand === 'master_gold' 
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-mono font-black text-sm text-amber-400">GOLD</span>
                    <span className="text-[9px]">Preferred</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Nome do Cartão</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Visa Infinite Platinum"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Banco / Emissor</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Chase, Itaú, Citibank"
                  value={cardBank}
                  onChange={(e) => setCardBank(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Limite Total (R$)</label>
                  <input 
                    type="number" 
                    placeholder="15000"
                    value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Fatura Atual (R$)</label>
                  <input 
                    type="number" 
                    placeholder="2450"
                    value={cardBalance}
                    onChange={(e) => setCardBalance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Últimos 4 Dígitos</label>
                  <input 
                    type="text" 
                    maxLength={4}
                    placeholder="4821"
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Validade (MM/AA)</label>
                  <input 
                    type="text" 
                    placeholder="08/29"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Nome no Cartão</label>
                <input 
                  type="text" 
                  placeholder="LUCAS KING"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCardOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/30"
                >
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Card */}
      {isPayModalOpen && selectedCardForPay && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsPayModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setIsPayModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Pagar Fatura do Cartão</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">{selectedCardForPay.name} ({selectedCardForPay.bank})</p>
            </div>

            <form onSubmit={handlePayCardSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Valor do Pagamento (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Fatura Atual:</span>
                  <span className="text-rose-400 font-bold">{formatCurrency(selectedCardForPay.current_balance, language)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Novo Saldo Estimado:</span>
                  <span className="text-emerald-400 font-bold">
                    {formatCurrency(Math.max(0, selectedCardForPay.current_balance - (parseFloat(payAmount) || 0)), language)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-600/30"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Life4Billion Open Banking Connect Modal */}
      <Life4BillionConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        language={language}
        onShowNotification={onShowNotification}
      />
    </div>
  );
}
