import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Target,
  Flame,
  ShieldCheck,
  RefreshCw,
  Trash2,
  X,
  Edit,
  Download,
  Bell,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { LocalDatabase } from '../utils/db';
import { CalendarEvent } from '../types/schema';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';

interface SmartCalendarViewProps {
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
  onNavigate?: (view: string) => void;
}

export default function SmartCalendarView({ onShowNotification, onNavigate }: SmartCalendarViewProps) {
  const { t, language: rawLanguage } = useLanguageTheme();
  const language = rawLanguage.startsWith('pt') ? 'pt' : rawLanguage.startsWith('es') ? 'es' : 'en';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Form State for new/edited event
  const [formData, setFormData] = useState<{
    id?: string;
    title: string;
    amount: string;
    date: string;
    time: string;
    type: CalendarEvent['type'];
    status: CalendarEvent['status'];
    category: string;
    notes: string;
    is_recurring: boolean;
    recurrence_frequency: 'weekly' | 'monthly' | 'yearly';
  }>({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    type: 'bill',
    status: 'pending',
    category: 'Geral',
    notes: '',
    is_recurring: false,
    recurrence_frequency: 'monthly'
  });

  // Load and auto-sync events
  const loadEvents = () => {
    LocalDatabase.autoGenerateCalendarEvents();
    const loaded = LocalDatabase.getCalendarEvents();
    setEvents(loaded);
  };

  useEffect(() => {
    loadEvents();
    const unsubscribe = LocalDatabase.subscribe(() => {
      loadEvents();
    });
    return () => unsubscribe();
  }, []);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered events
  const filteredEvents = events.filter(e => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'payday') return e.type === 'payday';
    if (selectedFilter === 'bill') return e.type === 'bill' || e.type === 'subscription';
    if (selectedFilter === 'debt') return e.type === 'debt_payment';
    if (selectedFilter === 'savings') return e.type === 'savings_deposit' || e.type === 'goal_milestone';
    if (selectedFilter === 'habit') return e.type === 'habit_schedule';
    return true;
  });

  // Monthly stats calculation
  const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEvents = filteredEvents.filter(e => e.date.startsWith(currentMonthStr));

  const projectedIncome = monthEvents
    .filter(e => e.type === 'payday')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const projectedBills = monthEvents
    .filter(e => e.type === 'bill' || e.type === 'subscription' || e.type === 'debt_payment')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const projectedSavings = monthEvents
    .filter(e => e.type === 'savings_deposit' || e.type === 'goal_milestone')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const netCashFlow = projectedIncome - projectedBills - projectedSavings;

  // Handle Save Event
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const numericAmount = parseFloat(formData.amount) || 0;

    if (formData.id) {
      // Edit existing
      LocalDatabase.updateCalendarEvent(formData.id, {
        title: formData.title,
        amount: numericAmount,
        date: formData.date,
        time: formData.time,
        type: formData.type,
        status: formData.status,
        category: formData.category,
        notes: formData.notes,
        is_recurring: formData.is_recurring,
        recurrence_frequency: formData.recurrence_frequency
      });
      onShowNotification(
        t('eventUpdated', 'Evento Atualizado'),
        t('eventUpdatedDesc', 'O evento foi atualizado com sucesso no calendário.'),
        'success'
      );
    } else {
      // Create new
      LocalDatabase.addCalendarEvent({
        title: formData.title,
        amount: numericAmount,
        date: formData.date,
        time: formData.time,
        type: formData.type,
        status: 'pending',
        category: formData.category,
        notes: formData.notes,
        is_recurring: formData.is_recurring,
        recurrence_frequency: formData.recurrence_frequency
      });
      onShowNotification(
        t('eventCreated', 'Evento Criado'),
        t('eventCreatedDesc', 'Novo compromisso adicionado ao calendário unificado.'),
        'success'
      );
    }

    setIsAddModalOpen(false);
    setSelectedEvent(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      type: 'bill',
      status: 'pending',
      category: 'Geral',
      notes: '',
      is_recurring: false,
      recurrence_frequency: 'monthly'
    });
  };

  const handleOpenEdit = (evt: CalendarEvent) => {
    setSelectedEvent(evt);
    setFormData({
      id: evt.id,
      title: evt.title,
      amount: evt.amount ? String(evt.amount) : '',
      date: evt.date,
      time: evt.time || '09:00',
      type: evt.type,
      status: evt.status,
      category: evt.category || 'Geral',
      notes: evt.notes || '',
      is_recurring: evt.is_recurring || false,
      recurrence_frequency: evt.recurrence_frequency || 'monthly'
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    LocalDatabase.deleteCalendarEvent(id);
    onShowNotification(
      t('eventDeleted', 'Evento Removido'),
      t('eventDeletedDesc', 'O compromisso foi removido do sistema.'),
      'info'
    );
    setSelectedEvent(null);
  };

  const handleToggleStatus = (evt: CalendarEvent) => {
    const nextStatus = evt.status === 'completed' ? 'pending' : 'completed';
    LocalDatabase.updateCalendarEvent(evt.id, { status: nextStatus });

    // Auto-record transaction if marking a bill/payday as completed
    if (nextStatus === 'completed' && evt.amount) {
      if (evt.type === 'payday') {
        LocalDatabase.addTransaction({
          type: 'income',
          amount: evt.amount,
          category: 'Salário / Renda',
          date: evt.date,
          description: `[Calendar Auto] ${evt.title}`
        });
      } else if (evt.type === 'bill' || evt.type === 'subscription' || evt.type === 'debt_payment') {
        LocalDatabase.addTransaction({
          type: 'expense',
          amount: evt.amount,
          category: evt.category || 'Contas / Fixas',
          date: evt.date,
          description: `[Calendar Auto] ${evt.title}`
        });
      }
    }

    onShowNotification(
      nextStatus === 'completed' ? t('eventCompleted', 'Concluído & Sincronizado') : t('eventPending', 'Status Pendente'),
      nextStatus === 'completed' 
        ? t('eventCompletedDesc', 'Transação sincronizada automaticamente com o módulo de finanças!')
        : t('eventPendingDesc', 'Marcado como pendente.'),
      'success'
    );
  };

  const getTypeBadge = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'payday':
        return { label: 'Payday', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <ArrowUpRight className="w-3 h-3 text-emerald-400" /> };
      case 'bill':
      case 'subscription':
        return { label: 'Bill / Sub', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: <CreditCard className="w-3 h-3 text-rose-400" /> };
      case 'debt_payment':
        return { label: 'Debt', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <ArrowDownRight className="w-3 h-3 text-amber-400" /> };
      case 'savings_deposit':
      case 'goal_milestone':
        return { label: 'Savings / Goal', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: <Target className="w-3 h-3 text-indigo-400" /> };
      case 'habit_schedule':
        return { label: 'Habit', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', icon: <Flame className="w-3 h-3 text-emerald-400" /> };
      default:
        return { label: 'Event', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20', icon: <CalendarIcon className="w-3 h-3 text-sky-400" /> };
    }
  };

  const monthNames = [
    t('monthJan', 'January'), t('monthFeb', 'February'), t('monthMar', 'March'),
    t('monthApr', 'April'), t('monthMay', 'May'), t('monthJun', 'June'),
    t('monthJul', 'July'), t('monthAug', 'August'), t('monthSep', 'September'),
    t('monthOct', 'October'), t('monthNov', 'November'), t('monthDec', 'December')
  ];

  const weekDays = [
    t('daySun', 'Sun'), t('dayMon', 'Mon'), t('dayTue', 'Tue'),
    t('dayWed', 'Wed'), t('dayThu', 'Thu'), t('dayFri', 'Fri'), t('daySat', 'Sat')
  ];

  return (
    <div className="space-y-6 pb-12" id="smart-calendar-module">
      
      {/* MODULE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 backdrop-blur border border-white/5 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <CalendarIcon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {t('smartCalendarTitle', 'Smart Calendar & Cash Flow Schedule')}
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                  Real-time Sync
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                {t('smartCalendarSub', 'Unified financial events, paydays, bills, debt payments, goals & habits in one interactive schedule.')}
              </p>
            </div>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              LocalDatabase.autoGenerateCalendarEvents();
              loadEvents();
              onShowNotification(t('syncComplete', 'Sincronização Concluída'), t('syncCompleteDesc', 'Agenda atualizada com dados do orçamentos, dívidas e metas.'), 'success');
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold flex items-center space-x-2 transition shadow-sm"
            id="sync-calendar-btn"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('autoSync', 'Sync Financial Data')}</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-2 transition shadow-lg shadow-emerald-500/20"
            id="add-calendar-event-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('addEvent', 'New Event')}</span>
          </button>
        </div>
      </div>

      {/* MONTHLY SUMMARY CASH FLOW BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="calendar-financial-stats">
        {/* Income */}
        <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">{t('projectedPaydays', 'Projected Income')}</span>
            <span className="text-lg font-black text-emerald-400 mt-0.5 block">{formatCurrency(projectedIncome, language)}</span>
          </div>
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Bills */}
        <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">{t('scheduledBills', 'Bills & Debts Due')}</span>
            <span className="text-lg font-black text-rose-400 mt-0.5 block">{formatCurrency(projectedBills, language)}</span>
          </div>
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Savings */}
        <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">{t('savingsCommitments', 'Savings & Goals Target')}</span>
            <span className="text-lg font-black text-indigo-400 mt-0.5 block">{formatCurrency(projectedSavings, language)}</span>
          </div>
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Net Flow */}
        <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">{t('netMonthlyBalance', 'Forecast Net Flow')}</span>
            <span className={`text-lg font-black mt-0.5 block ${netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netCashFlow, language)}
            </span>
          </div>
          <div className={`p-2.5 rounded-xl border ${netCashFlow >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* CONTROLS & FILTER BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-white/5 p-4 rounded-xl">
        
        {/* Month Navigation */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white/5 rounded-lg border border-white/5 text-slate-300 hover:text-white transition"
            title={t('prevMonth', 'Mês Anterior')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <h2 className="text-base font-extrabold text-white min-w-[160px] text-center">
            {monthNames[month]} {year}
          </h2>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-white/5 rounded-lg border border-white/5 text-slate-300 hover:text-white transition"
            title={t('nextMonth', 'Próximo Mês')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg transition"
          >
            {t('today', 'Today')}
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: t('all', 'All') },
            { id: 'payday', label: '💰 Paydays' },
            { id: 'bill', label: '💳 Bills & Subs' },
            { id: 'debt', label: '🏦 Debts' },
            { id: 'savings', label: '🎯 Savings' },
            { id: 'habit', label: '🔥 Habits' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap border ${
                selectedFilter === f.id
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-white/5 text-xs">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded-md font-semibold transition ${viewMode === 'month' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('month', 'Month')}
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1 rounded-md font-semibold transition ${viewMode === 'agenda' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('agenda', 'Agenda')}
          </button>
        </div>
      </div>

      {/* MONTH GRID VIEW */}
      {viewMode === 'month' && (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 shadow-xl overflow-x-auto">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 pb-3 border-b border-white/5 min-w-[700px]">
            {weekDays.map((d, i) => (
              <div key={i} className="py-1 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-2 mt-3 min-w-[700px]">
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[110px] bg-slate-950/20 border border-white/5 rounded-xl opacity-30" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              const dayEvents = filteredEvents.filter(e => e.date === dateStr);

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition group hover:border-slate-700 ${
                    isToday
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-slate-950/40 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-emerald-500 text-slate-950' : 'text-slate-300'
                    }`}>
                      {dayNum}
                    </span>

                    <button
                      onClick={() => {
                        resetForm();
                        setFormData(prev => ({ ...prev, date: dateStr }));
                        setIsAddModalOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded bg-white/5 hover:bg-white/10 transition"
                      title={t('addEventOnDay', 'Adicionar evento neste dia')}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Day Events Pills */}
                  <div className="space-y-1 my-1 overflow-y-auto max-h-[75px] scrollbar-none">
                    {dayEvents.map(evt => {
                      const badge = getTypeBadge(evt.type);
                      const isCompleted = evt.status === 'completed';

                      return (
                        <div
                          key={evt.id}
                          onClick={() => handleOpenEdit(evt)}
                          className={`p-1.5 rounded-lg border text-[11px] cursor-pointer transition flex items-center justify-between gap-1 ${
                            isCompleted
                              ? 'bg-slate-900/80 border-slate-800 text-slate-500 line-through'
                              : `${badge.bg} border-white/10 hover:brightness-125`
                          }`}
                        >
                          <div className="flex items-center space-x-1 truncate">
                            {badge.icon}
                            <span className="font-semibold truncate">{evt.title}</span>
                          </div>
                          {evt.amount !== undefined && evt.amount > 0 && (
                            <span className="font-bold text-[10px] shrink-0">
                              {formatCurrency(evt.amount, language)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA / LIST VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>{t('upcomingEventsList', 'Upcoming Financial & Life Events')}</span>
          </h3>

          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm">{t('noEventsFound', 'No scheduled events found for this filter.')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(evt => {
                  const badge = getTypeBadge(evt.type);
                  const isCompleted = evt.status === 'completed';

                  return (
                    <div
                      key={evt.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isCompleted
                          ? 'bg-slate-950/50 border-white/5 opacity-60'
                          : 'bg-slate-900/80 border-white/5 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <button
                          onClick={() => handleToggleStatus(evt)}
                          className={`p-2 rounded-xl border transition ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-white/5 text-slate-500 border-white/10 hover:text-white'
                          }`}
                          title={isCompleted ? t('markPending', 'Marcar Pendente') : t('markCompleted', 'Marcar Concluído')}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">{evt.date} {evt.time && `@ ${evt.time}`}</span>
                          </div>
                          <h4 className={`text-sm font-bold text-white mt-0.5 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                            {evt.title}
                          </h4>
                          {evt.notes && <p className="text-xs text-slate-400 mt-0.5">{evt.notes}</p>}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 self-end sm:self-center">
                        {evt.amount !== undefined && evt.amount > 0 && (
                          <div className="text-right">
                            <span className="text-xs text-slate-400 block">{t('amount', 'Valor')}</span>
                            <span className={`text-base font-extrabold ${evt.type === 'payday' ? 'text-emerald-400' : 'text-slate-100'}`}>
                              {formatCurrency(evt.amount, language)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenEdit(evt)}
                            className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="p-2 text-rose-400 hover:text-rose-300 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-sky-400" />
                <span>{formData.id ? t('editEvent', 'Edit Event') : t('newEvent', 'New Calendar Event')}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t('eventTitle', 'Title')}</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Salary Payday, Electric Bill, Gym Subscription"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">{t('type', 'Type')}</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as CalendarEvent['type'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="payday">💰 Payday / Income</option>
                    <option value="bill">💳 Bill / Expense</option>
                    <option value="subscription">🔄 Subscription</option>
                    <option value="debt_payment">🏦 Debt Payment</option>
                    <option value="savings_deposit">🎯 Savings Deposit</option>
                    <option value="goal_milestone">🚩 Goal Milestone</option>
                    <option value="habit_schedule">🔥 Habit Schedule</option>
                    <option value="appointment">⏰ Appointment / Task</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">{t('amount', 'Amount ($)')}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">{t('date', 'Date')}</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">{t('time', 'Time')}</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t('notes', 'Notes')}</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0"
                />
                <label htmlFor="is_recurring" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  {t('recurringEvent', 'Recurring Event')}
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-sky-500/20"
                >
                  {t('save', 'Save Event')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
