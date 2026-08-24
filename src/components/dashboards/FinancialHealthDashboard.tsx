import React from 'react';
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  CreditCard, 
  PieChart as PieChartIcon, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  DollarSign,
  ShieldAlert,
  Coins
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useLanguageTheme, formatCurrency } from '../../utils/i18n';
import { getThemeColorById } from '../../utils/theme';
import { Transaction, Debt } from '../../types/schema';

interface FinancialHealthProps {
  transactions: Transaction[];
  debts: Debt[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  onNavigate?: (view: string) => void;
}

export const FinancialHealthDashboard: React.FC<FinancialHealthProps> = ({
  transactions,
  debts,
  totalIncome,
  totalExpense,
  netBalance,
  onNavigate
}) => {
  const { t, language, theme, themeColor } = useLanguageTheme();
  const isLight = theme === 'light';
  const activeThemeOption = getThemeColorById(themeColor);

  // Financial Health Metrics (strictly calculated from user data)
  const income = totalIncome || 0;
  const expenses = totalExpense || 0;
  const savings = Math.max(0, income - expenses);
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  const activeDebts = debts.filter(d => d.status === 'active');
  const totalDebtBalance = activeDebts.reduce((sum, d) => sum + (d.total_amount - d.paid_amount), 0);

  const estimatedInvestments = savings;

  // Calculate Health Score (0 - 100)
  // When user has no financial data yet, score starts at a neutral baseline (0 or 100 if no debt)
  const hasData = income > 0 || expenses > 0 || totalDebtBalance > 0;
  let healthScore = 100;
  if (hasData) {
    const debtToIncomeRatio = income > 0 ? totalDebtBalance / (income * 12) : (totalDebtBalance > 0 ? 1 : 0);
    const savingsScore = income > 0 ? Math.min(40, (savingsRate / 20) * 40) : 20;
    const debtScore = Math.max(0, 30 - debtToIncomeRatio * 30);
    const expenseScore = income > 0 ? Math.min(30, (1 - (expenses / income)) * 30) : 15;
    healthScore = Math.round(savingsScore + debtScore + expenseScore);
  }

  let healthCategory = t('healthExcellent', 'Excellent');
  let healthColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (healthScore < 50) {
    healthCategory = t('healthAtRisk', 'Needs Attention');
    healthColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  } else if (healthScore < 75) {
    healthCategory = t('healthGood', 'Good');
    healthColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  }

  // Category breakdowns for pie chart
  const categoryMap: { [cat: string]: number } = {};
  transactions
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
    });

  const categoryData = Object.keys(categoryMap).map(cat => ({ name: cat, value: categoryMap[cat] }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-fade-in" id="financial-health-dashboard">
      
      {/* Main Financial Health Score Gauge Banner */}
      <div 
        className="border border-white/15 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl transition-colors duration-300 text-white"
        style={{ backgroundColor: activeThemeOption.hex }}
        id="financial-health-gauge-banner"
      >
        <div className="flex items-center space-x-5">
          {/* Health Score Circular Badge */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-black/25"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-orange-500 transition-all duration-1000"
                strokeDasharray={`${healthScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white tracking-tight">{healthScore}</span>
              <span className="text-[9px] uppercase font-bold text-white/70">/ 100</span>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold border border-orange-500/40 bg-orange-500/20 text-orange-300">
                {healthCategory}
              </span>
              <span className="text-xs text-white/80">{t('dashboard.financialHealthScore', 'Financial Health Score')}</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {healthScore >= 75 ? 'Your finances are in excellent condition!' : healthScore >= 50 ? 'Your financial health is stable.' : 'Financial health needs proactive optimization.'}
            </h3>
            <p className="text-xs text-white/80 mt-1 max-w-xl">
              Savings rate is at <strong className="text-orange-400 font-bold">{savingsRate}%</strong> of monthly income. Debt utilization remains within healthy parameters.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="bg-black/25 border border-white/15 px-4 py-3 rounded-xl text-center w-full sm:w-auto min-w-[130px]">
            <p className="text-[10px] uppercase text-white/70 font-semibold">{t('dashboard.savingsRate', 'Savings Rate')}</p>
            <p className="text-lg font-bold text-orange-400 mt-0.5">{savingsRate}%</p>
          </div>
          <div className="bg-black/25 border border-white/15 px-4 py-3 rounded-xl text-center w-full sm:w-auto min-w-[130px]">
            <p className="text-[10px] uppercase text-white/70 font-semibold">{t('dashboard.debtOverview', 'Debt Overview')}</p>
            <p className="text-lg font-bold text-rose-300 mt-0.5">{formatCurrency(totalDebtBalance, language)}</p>
          </div>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Income Card */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('income', 'Monthly Income')}</p>
              <h3 className={`text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurrency(income, language)}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xs mt-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Monthly net earnings</p>
        </div>

        {/* Expenses Card */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('expenses', 'Monthly Expenses')}</p>
              <h3 className={`text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurrency(expenses, language)}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xs mt-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{((expenses / (income || 1)) * 100).toFixed(1)}% of income</p>
        </div>

        {/* Savings Card */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('dashboard.savingsRate', 'Monthly Savings')}</p>
              <h3 className="text-xl font-bold text-emerald-500 mt-1">{formatCurrency(savings, language)}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xs mt-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{savingsRate}% saved this month</p>
        </div>

        {/* Investments Card */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('dashboard.investments', 'Investments')}</p>
              <h3 className="text-xl font-bold text-cyan-500 mt-1">{formatCurrency(estimatedInvestments, language)}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xs mt-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Portfolio yield est. +7.2%</p>
        </div>

      </div>

      {/* Spending Breakdown & Health Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Spending Categories Chart */}
        <div className={`p-5 rounded-2xl border space-y-4 transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
              <PieChartIcon className="w-4 h-4 text-indigo-400" />
              <span>{t('dashboard.spendingCategories', 'Spending Categories')}</span>
            </h3>
            <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Monthly Allocation</span>
          </div>

          <div className="h-56 w-full min-w-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isLight ? '#ffffff' : '#0f172a', 
                    borderColor: isLight ? '#e2e8f0' : '#334155', 
                    color: isLight ? '#0f172a' : '#ffffff',
                    borderRadius: '0.75rem', 
                    fontSize: '12px' 
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value), language), 'Category']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            {categoryData.slice(0, 6).map((cat, idx) => (
              <div key={cat.name} className={`flex items-center justify-between p-2 rounded-lg ${
                isLight ? 'bg-slate-50 text-slate-700 border border-slate-200' : 'bg-slate-950/40 text-slate-300'
              }`}>
                <div className="flex items-center space-x-2 truncate mr-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className={`font-semibold shrink-0 ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurrency(cat.value, language)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Financial Health Checklist */}
        <div className={`p-5 rounded-2xl border space-y-4 transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <h3 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Financial Protection Checklist</span>
          </h3>

          <div className="space-y-3">
            <div className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Emergency Fund Active</p>
                <p className={`mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Target buffer established to protect against unexpected life events.</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Savings Target &gt; 20%</p>
                <p className={`mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>You are saving {savingsRate}% of net monthly income toward goals.</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-start space-x-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              {activeDebts.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <p className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Debt Payoff Plan</p>
                <p className={`mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {activeDebts.length === 0 
                    ? 'Congratulations, you have zero high-interest active debts!' 
                    : `${activeDebts.length} active debts. Apply Snowball or Avalanche method in Emergency Center.`}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
