import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Wallet, 
  PiggyBank, 
  TrendingDown, 
  Sparkles, 
  Calendar, 
  Filter, 
  Plus, 
  Trash2, 
  Search, 
  Tag,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  PlusCircle,
  TrendingUp,
  X,
  FileText,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types/schema';
import { formatCurrency, useLanguageTheme } from '../utils/i18n';
import { CostChannelsModal } from './CostChannelsModal';

interface CategoryDashboardProps {
  category: string;
  budgetLimit: number;
  transactions: Transaction[];
  onBack: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'user_id'>) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function CategoryDashboard({
  category,
  budgetLimit,
  transactions,
  onBack,
  onAddTransaction,
  onDeleteTransaction
}: CategoryDashboardProps) {
  const { language, currency, t } = useLanguageTheme();
  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'EUR' ? '€' : '$';
  
  // Local storage for Investment specifically for this category
  const [investAmount, setInvestAmount] = useState<number>(() => {
    const saved = localStorage.getItem(`omnisaas_invest_${category.toLowerCase()}`);
    return saved ? parseFloat(saved) : 0;
  });

  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showChannelsModal, setShowChannelsModal] = useState(false);
  const [tempInvest, setTempInvest] = useState('');

  // Save investment to localStorage when updated
  useEffect(() => {
    localStorage.setItem(`omnisaas_invest_${category.toLowerCase()}`, investAmount.toString());
  }, [investAmount, category]);

  // Subtab selection
  const [activeSubTab, setActiveSubTab] = useState<'income' | 'fixed' | 'variable'>('variable');

  // Modal to add item
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemDate, setNewItemDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newItemSubcategory, setNewItemSubcategory] = useState('');

  // Filters state
  const [nameFilter, setNameFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Filter transactions for this specific category budget
  const categoryTxs = transactions.filter(
    t => t.category.toLowerCase() === category.toLowerCase()
  );

  // Group into Salary, Fixed Expenses, Variable Expenses
  const incomes = categoryTxs.filter(t => t.type === 'income');
  // If transaction has expense_type, filter by that. If not, default to fixed or let user choose.
  const fixedExpenses = categoryTxs.filter(t => t.type === 'expense' && (!t.expense_type || t.expense_type === 'fixed'));
  const variableExpenses = categoryTxs.filter(t => t.type === 'expense' && t.expense_type === 'variable');

  // Stats
  const totalReceita = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalDespesas = categoryTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalInvestir = investAmount;
  const totalSaldo = totalReceita - totalDespesas - totalInvestir;

  // Select source list based on active tab
  const getActiveList = () => {
    if (activeSubTab === 'income') return incomes;
    if (activeSubTab === 'fixed') return fixedExpenses;
    return variableExpenses;
  };

  const activeList = getActiveList();

  // Apply filters
  const filteredList = activeList.filter(item => {
    const matchesName = item.description.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesSubcategory = item.subcategory 
      ? item.subcategory.toLowerCase().includes(subcategoryFilter.toLowerCase())
      : subcategoryFilter === '';
    const matchesDate = dateFilter ? item.date.includes(dateFilter) : true;
    return matchesName && matchesSubcategory && matchesDate;
  });

  // Calculate filtered total
  const filteredTotal = filteredList.reduce((sum, item) => sum + item.amount, 0);

  // Handle adding new item from modal
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newItemAmount);
    if (isNaN(amt) || amt <= 0) return;

    onAddTransaction({
      type: activeSubTab === 'income' ? 'income' : 'expense',
      amount: amt,
      category: category,
      date: newItemDate || new Date().toISOString().split('T')[0],
      description: newItemName.trim() || `${activeSubTab === 'income' ? 'Salário' : 'Despesa'} ${category}`,
      expense_type: activeSubTab === 'income' ? undefined : activeSubTab,
      subcategory: newItemSubcategory.trim() || 'Geral'
    });

    // Reset and close
    setNewItemName('');
    setNewItemAmount('');
    setNewItemSubcategory('');
    setShowAddModal(false);
  };

  // Handle adjusting Investment
  const handleSaveInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(tempInvest);
    if (!isNaN(amt) && amt >= 0) {
      setInvestAmount(amt);
    }
    setShowInvestModal(false);
  };

  // Get distinct subcategories for dropdown filtering
  const allSubcategories = Array.from(
    new Set(
      categoryTxs
        .map(t => t.subcategory || 'Geral')
        .filter(Boolean)
    )
  );

  // Chart Calculations - group all expenses of this category by subcategory
  const allExpenses = categoryTxs.filter(t => t.type === 'expense');
  const expensesGrouped = allExpenses.reduce((acc, curr) => {
    const sub = curr.subcategory || 'Geral';
    acc[sub] = (acc[sub] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(expensesGrouped).map(([name, value]) => ({
    name,
    value,
    percentage: totalDespesas > 0 ? (value / totalDespesas) * 100 : 0
  })).sort((a, b) => b.value - a.value);

  // Color palette for chart
  const COLORS = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // rose
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#14B8A6'  // teal
  ];

  // SVG Circumference calculation
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16
  let accumulatedPercent = 0;

  return (
    <div className="space-y-6" id={`category-dashboard-${category.toLowerCase()}`}>
      {/* Header section with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800/80 hover:text-white transition text-slate-400"
            id="back-to-budgets-btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold tracking-widest text-[#1E73BE] uppercase font-mono bg-blue-500/10 px-2 py-0.5 rounded">
                {t('categoryBudgetTitle', 'Orçamento de Categoria')}
              </span>
              <span className="text-xs text-slate-500 font-mono">Teto: {formatCurrency(budgetLimit, language)}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{category}</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2 font-mono text-xs text-slate-400 bg-slate-900/30 border border-slate-800/50 px-3 py-1.5 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{t('integratedOperationalControl', 'Controle Operacional Integrado')}</span>
        </div>
      </div>

      {/* Top 4 Premium Cards (aligned with reference image: RECEITA, INVESTIR, DESPESAS, SALDO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="category-stats-grid">
        {/* RECEITA */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase font-mono">
              {t('incomeSalary', 'Receita / Salário')}
            </span>
            <div className="text-xl font-black text-emerald-300 font-mono">{formatCurrency(totalReceita, language)}</div>
            <button 
              onClick={() => {
                setActiveSubTab('income');
                setShowAddModal(true);
              }}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline transition flex items-center mt-1"
            >
              <Plus className="w-3 h-3 mr-0.5" /> {t('addIncome', 'Adicionar Receita')}
            </button>
          </div>
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* INVESTIR */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold tracking-widest text-blue-400 uppercase font-mono">
              {t('targetInvestment', 'Investimento Alvo')}
            </span>
            <div className="text-xl font-black text-blue-300 font-mono">{formatCurrency(totalInvestir, language)}</div>
            <button 
              onClick={() => {
                setTempInvest(investAmount.toString());
                setShowInvestModal(true);
              }}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold underline transition flex items-center mt-1"
            >
              {t('adjustTarget', 'Ajustar Alvo')}
            </button>
          </div>
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>

        {/* DESPESAS */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold tracking-widest text-rose-400 uppercase font-mono">
              {t('totalExpenses', 'Total Despesas')}
            </span>
            <div className="text-xl font-black text-rose-300 font-mono">{formatCurrency(totalDespesas, language)}</div>
            <span className="text-[9px] text-rose-400/70 font-mono block">
              {fixedExpenses.length} {t('fixedLabel', 'fixas')} + {variableExpenses.length} {t('variableLabel', 'variáveis')}
            </span>
          </div>
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* SALDO RESTANTE */}
        <div className={`${totalSaldo >= 0 ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-rose-500/15 border-rose-500/30'} border rounded-2xl p-5 flex items-center justify-between transition-colors`}>
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold tracking-widest uppercase font-mono text-indigo-400">
              {t('remainingBalance', 'Saldo Restante')}
            </span>
            <div className={`text-xl font-black font-mono ${totalSaldo >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
              {formatCurrency(totalSaldo, language)}
            </div>
            <span className="text-[9px] text-slate-500 font-mono flex items-center">
              {totalSaldo >= 0 ? (
                <span className="text-emerald-400 flex items-center font-bold">
                  <CheckCircle2 className="w-3 h-3 mr-0.5" /> {t('positive', 'Positivo')}
                </span>
              ) : (
                <span className="text-rose-400 flex items-center font-bold">
                  <AlertTriangle className="w-3 h-3 mr-0.5" /> {t('overBudgetWarning', 'Atenção: Estourado!')}
                </span>
              )}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${totalSaldo >= 0 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/25 text-rose-400'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Receita, Despesa Fixa, Despesa Variável */}
      <div className="flex border-b border-slate-800" id="category-dashboard-tabs">
        <button 
          onClick={() => setActiveSubTab('income')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'income' 
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>{t('income', 'Receita')}</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('fixed')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'fixed' 
              ? 'border-indigo-500 text-indigo-450 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{t('fixedExpenseLabel', 'Despesa Fixa / Comum')}</span>
        </button>

        <button 
          onClick={() => setActiveSubTab('variable')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'variable' 
              ? 'border-rose-500 text-rose-400 bg-rose-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          <span>{t('variableExpense', 'Despesa Variável')}</span>
        </button>
      </div>

      {/* Main Content Split: Filtered list on left, Doughnut Chart on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: List of items (takes 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-4">
            
            {/* Filter and Add header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center">
                <Filter className="w-4 h-4 mr-1.5 text-blue-400" />
                {activeSubTab === 'income' 
                  ? t('incomeEntries', 'Lançamentos de Receitas') 
                  : activeSubTab === 'fixed' 
                    ? t('fixedExpensesLabel', 'Despesas Fixas Comuns') 
                    : t('variableExpensesLabel', 'Despesas Variáveis')}
              </h3>
              <button 
                onClick={() => setShowAddModal(true)}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition cursor-pointer ${
                  activeSubTab === 'income' 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                    : activeSubTab === 'fixed' 
                      ? 'bg-indigo-650 hover:bg-indigo-550 text-white' 
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('addBtn', '+ Adicionar')}</span>
              </button>
            </div>

            {/* Filter controls row (Name, Subcategory, Date) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Name Filter */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input 
                  type="text"
                  placeholder={t('filterByName', 'Filtrar por nome...')}
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              {/* Category/Subcategory Dropdown Filter */}
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <select 
                  value={subcategoryFilter}
                  onChange={(e) => setSubcategoryFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-sans appearance-none"
                >
                  <option value="">{t('allCategories', 'Todas Categorias')}</option>
                  {allSubcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input 
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-sans font-mono"
                />
              </div>
            </div>

            {/* Table / List of items */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    <th className="py-3 px-3">{t('date', 'Data')}</th>
                    <th className="py-3 px-3">{t('name', 'Nome')}</th>
                    <th className="py-3 px-3">{t('category', 'Categoria')}</th>
                    <th className="py-3 px-3 text-right">{t('value', 'Valor')}</th>
                    <th className="py-3 px-3 text-center">{t('actions', 'Ações')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-slate-500 font-medium">
                        {t('noEntriesFound', 'Nenhum lançamento encontrado com os filtros ativos.')}
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item) => (
                      <tr key={item.id} className="text-xs hover:bg-slate-950/40 transition">
                        <td className="py-3 px-3 font-mono text-slate-400">
                          {new Date(item.date).toLocaleDateString(language.startsWith('pt') ? 'pt-BR' : 'en-US', {day: '2-digit', month: '2-digit'})}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-200">
                          {item.description}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-850">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span>{item.subcategory || 'Geral'}</span>
                          </span>
                        </td>
                        <td className={`py-3 px-3 text-right font-bold font-mono ${item.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount, language)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            onClick={() => onDeleteTransaction(item.id)}
                            className="p-1 hover:text-rose-400 text-slate-500 transition rounded-lg hover:bg-rose-500/5"
                            title={t('deleteEntry', 'Excluir Lançamento')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total of what was filtered (Footer) */}
            <div className="flex justify-between items-center bg-slate-950/50 border border-slate-850 p-4 rounded-xl mt-4">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {t('filteredTotalLabel', 'Total do que foi filtrado:')}
              </div>
              <div className="text-sm font-black font-mono text-white">
                {formatCurrency(filteredTotal, language)}
              </div>
            </div>

          </div>
        </div>

        {/* Right column: Doughnut Chart (takes 1 column) */}
        <div className="space-y-4">
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 space-y-6">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center">
              <PieChart className="w-4 h-4 mr-1.5 text-blue-400" />
              {t('categoryDistribution', 'Distribuição por Categoria')}
            </h3>

            {totalDespesas === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                {t('addExpensesToViewChart', 'Adicione despesas para visualizar o gráfico de distribuição.')}
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-6">
                {/* SVG Doughnut Chart */}
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle 
                      cx="60" 
                      cy="60" 
                      r={radius} 
                      fill="transparent" 
                      stroke="#1e293b" 
                      strokeWidth="12" 
                    />
                    {chartData.map((slice, i) => {
                      const color = COLORS[i % COLORS.length];
                      const strokeDash = (slice.percentage / 100) * circumference;
                      const strokeOffset = circumference - (accumulatedPercent / 100) * circumference;
                      accumulatedPercent += slice.percentage;

                      return (
                        <circle 
                           key={slice.name}
                          cx="60" 
                          cy="60" 
                          r={radius} 
                          fill="transparent" 
                          stroke={color} 
                          strokeWidth="12" 
                          strokeDasharray={`${strokeDash} ${circumference}`}
                          strokeDashoffset={strokeOffset}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest font-bold">{t('expenses', 'Despesas')}</span>
                    <span className="text-sm font-extrabold text-white font-mono">
                      {formatCurrency(totalDespesas, language)}
                    </span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="w-full space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {chartData.map((slice, i) => {
                    const color = COLORS[i % COLORS.length];
                    return (
                      <div key={slice.name} className="flex justify-between items-center text-xs text-slate-300 bg-slate-950/20 px-3 py-1.5 rounded-lg border border-slate-900 hover:border-slate-800/80 transition">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-medium text-slate-200">{slice.name}</span>
                        </div>
                        <div className="text-right font-mono text-xs">
                          <span className="font-bold text-white mr-1.5">{slice.percentage.toFixed(0)}%</span>
                          <span className="text-slate-500 text-[10px]">({formatCurrency(slice.value, language)})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom auxiliary section: Gerenciar Categorias */}
            <div className="border-t border-slate-800 pt-4 mt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-850/60">
                <span className="font-medium">{t('manageCostCategories', 'Gerenciar categorias de custos')}</span>
                <button
                  type="button"
                  onClick={() => setShowChannelsModal(true)}
                  className="text-[#1E73BE] hover:underline hover:text-[#3894e6] cursor-pointer font-bold transition flex items-center space-x-1"
                >
                  <span>{t('accessChannels', 'Acessar canais')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Adjust Investment Modal */}
      <AnimatePresence>
        {showInvestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" id="investment-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-sm relative"
            >
              <button 
                onClick={() => setShowInvestModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                <PiggyBank className="w-4 h-4 mr-1.5 text-blue-400" />
                {t('adjustInvestmentTarget', 'Ajustar Alvo de Investimento')} ({category})
              </h3>

              <form onSubmit={handleSaveInvestment} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('targetInvestment', 'Investimento Alvo')} ({currencySymbol})</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-slate-500 font-bold text-xs">{currencySymbol}</span>
                    <input 
                      type="number"
                      value={tempInvest}
                      onChange={(e) => setTempInvest(e.target.value)}
                      placeholder="1000"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-blue-500 font-mono"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button 
                    type="button"
                    onClick={() => setShowInvestModal(false)}
                    className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold text-xs py-2 rounded-xl transition"
                  >
                    {t('cancel', 'Cancelar')}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl transition"
                  >
                    {t('save', 'Salvar')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" id="add-item-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-6 w-full max-w-md relative"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                {activeSubTab === 'income' ? (
                  <>
                    <Wallet className="w-4 h-4 mr-1.5 text-emerald-400" />
                    {t('addIncome', 'Adicionar Receita')} ({category})
                  </>
                ) : activeSubTab === 'fixed' ? (
                  <>
                    <FileText className="w-4 h-4 mr-1.5 text-indigo-400" />
                    {t('fixedExpenseLabel', 'Despesa Fixa / Comum')} ({category})
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 mr-1.5 text-rose-400" />
                    {t('variableExpense', 'Despesa Variável')} ({category})
                  </>
                )}
              </h3>

              <form onSubmit={handleAddItemSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('name', 'Nome')} / {t('tableDesc', 'Descrição')}</label>
                  <input 
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={activeSubTab === 'income' ? 'Salário Mensal Principal' : activeSubTab === 'fixed' ? 'Aluguel Escritório' : 'Uber Reunião Cliente'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-blue-500"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('category', 'Categoria')}</label>
                  <input 
                    type="text"
                    value={newItemSubcategory}
                    onChange={(e) => setNewItemSubcategory(e.target.value)}
                    placeholder="Ex: Mercado, Transporte, Carro, Software"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('value', 'Valor')} ({currencySymbol})</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500 font-bold text-xs">{currencySymbol}</span>
                      <input 
                        type="number"
                        value={newItemAmount}
                        onChange={(e) => setNewItemAmount(e.target.value)}
                        placeholder="450"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-blue-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('date', 'Data')}</label>
                    <input 
                      type="date"
                      value={newItemDate}
                      onChange={(e) => setNewItemDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold text-xs py-2.5 rounded-xl transition"
                  >
                    {t('cancel', 'Cancelar')}
                  </button>
                  <button 
                    type="submit"
                    className={`flex-1 font-bold text-xs py-2.5 rounded-xl transition text-white cursor-pointer ${
                      activeSubTab === 'income' 
                        ? 'bg-emerald-600 hover:bg-emerald-500' 
                        : activeSubTab === 'fixed' 
                          ? 'bg-indigo-650 hover:bg-indigo-550' 
                          : 'bg-rose-600 hover:bg-rose-500'
                    }`}
                  >
                    {t('add', 'Confirmar')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cost & Payment Channels Modal */}
      <CostChannelsModal 
        isOpen={showChannelsModal}
        onClose={() => setShowChannelsModal(false)}
        category={category}
        categoryExpenses={totalDespesas}
      />
    </div>
  );
}
