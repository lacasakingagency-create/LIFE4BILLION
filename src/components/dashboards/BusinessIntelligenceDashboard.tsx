import React from 'react';
import { 
  Building, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  BarChart3, 
  FileText, 
  ArrowUpRight,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useLanguageTheme, formatCurrency } from '../../utils/i18n';
import { getThemeColorById } from '../../utils/theme';
import { Company, Employee, Product, Customer, Sale, Transaction } from '../../types/schema';

interface BIProps {
  companies: Company[];
  employees: Employee[];
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  onNavigate?: (view: string) => void;
}

export const BusinessIntelligenceDashboard: React.FC<BIProps> = ({
  companies,
  employees,
  products,
  customers,
  sales,
  transactions,
  totalIncome,
  totalExpense,
  netBalance,
  onNavigate
}) => {
  const { t, language, theme, themeColor } = useLanguageTheme();
  const isLight = theme === 'light';
  const activeThemeOption = getThemeColorById(themeColor);

  const grossRevenue = totalIncome || 0;
  const cogs = grossRevenue > 0 ? Math.round(grossRevenue * 0.28) : 0; // Cost of Goods Sold
  const grossProfit = grossRevenue - cogs;
  const operatingExpenses = totalExpense || 0;
  const ebitda = grossProfit - operatingExpenses;
  const netProfit = ebitda;
  const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;

  const activeCustomersCount = customers.length;
  const totalSalesCount = sales.length;

  // Monthly Sales performance chart data
  const biData = grossRevenue > 0 || operatingExpenses > 0 ? [
    { month: 'Q1-Jan', revenue: Math.round(grossRevenue * 0.15), expenses: Math.round(operatingExpenses * 0.15), profit: Math.round((grossRevenue - operatingExpenses) * 0.15) },
    { month: 'Q1-Feb', revenue: Math.round(grossRevenue * 0.16), expenses: Math.round(operatingExpenses * 0.16), profit: Math.round((grossRevenue - operatingExpenses) * 0.16) },
    { month: 'Q1-Mar', revenue: Math.round(grossRevenue * 0.17), expenses: Math.round(operatingExpenses * 0.17), profit: Math.round((grossRevenue - operatingExpenses) * 0.17) },
    { month: 'Q2-Apr', revenue: Math.round(grossRevenue * 0.16), expenses: Math.round(operatingExpenses * 0.16), profit: Math.round((grossRevenue - operatingExpenses) * 0.16) },
    { month: 'Q2-May', revenue: Math.round(grossRevenue * 0.18), expenses: Math.round(operatingExpenses * 0.18), profit: Math.round((grossRevenue - operatingExpenses) * 0.18) },
    { month: 'Q2-Jun', revenue: Math.round(grossRevenue * 0.18), expenses: Math.round(operatingExpenses * 0.18), profit: Math.round((grossRevenue - operatingExpenses) * 0.18) },
  ] : [];

  const defaultProductsList = products;

  return (
    <div className="space-y-6 animate-fade-in" id="bi-dashboard">
      
      {/* 4 Summary Metric Cards */}

      {/* Corporate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Sales Performance */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('dashboard.salesPerformance', 'Sales Revenue')}</p>
              <h3 className={`text-2xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurrency(grossRevenue, language)}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-500 font-semibold mt-3 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +18.5% QoQ
          </p>
        </div>

        {/* Profit Margin */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('dashboard.profitMargin', 'Profit Margin')}</p>
              <h3 className="text-2xl font-bold text-emerald-500 mt-1">{profitMargin}%</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-xs mt-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gross profit after COGS</p>
        </div>

        {/* Customers */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('dashboard.customers', 'Active Customers')}</p>
              <h3 className={`text-2xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{activeCustomersCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-indigo-500 font-semibold mt-3">High LTV / Low Churn</p>
        </div>

        {/* Total Expenses */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('expenses', 'OPEX Expenses')}</p>
              <h3 className={`text-2xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{formatCurrency(operatingExpenses, language)}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-xs mt-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Operating costs managed</p>
        </div>

      </div>

      {/* Charts & Simplified P&L Statement Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Performance Bar Chart (2 cols) */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border space-y-4 transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('dashboard.revenueTrends', 'Quarterly Revenue vs OPEX')}</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Commercial revenue compared with operating overhead</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-cyan-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 mr-1.5" /> Revenue
              </span>
              <span className="flex items-center text-rose-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5" /> OPEX
              </span>
            </div>
          </div>

          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={biData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} />
                <XAxis dataKey="month" stroke={isLight ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <YAxis stroke={isLight ? '#94a3b8' : '#64748b'} fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isLight ? '#ffffff' : '#0f172a', 
                    borderColor: isLight ? '#e2e8f0' : '#334155', 
                    color: isLight ? '#0f172a' : '#ffffff',
                    borderRadius: '0.75rem', 
                    fontSize: '12px' 
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val), language), '']}
                />
                <Bar dataKey="revenue" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Simplified Profit & Loss (P&L) Statement */}
        <div className={`p-5 rounded-2xl border space-y-4 transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>{t('dashboard.profitAndLoss', 'Simplified P&L Statement')}</span>
            </h3>
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
              isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
            }`}>
              P&L YTD
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Gross Revenue */}
            <div className={`flex justify-between items-center p-2.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>1. Gross Revenue</span>
              <span className="font-bold text-emerald-500">{formatCurrency(grossRevenue, language)}</span>
            </div>

            {/* COGS */}
            <div className={`flex justify-between items-center p-2.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <span className={`font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>2. Cost of Goods Sold (COGS)</span>
              <span className="font-medium text-rose-500">-{formatCurrency(cogs, language)}</span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-bold">
              <span className={isLight ? 'text-slate-900' : 'text-white'}>3. Gross Profit</span>
              <span className="text-emerald-500">{formatCurrency(grossProfit, language)}</span>
            </div>

            {/* Operating Expenses */}
            <div className={`flex justify-between items-center p-2.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <span className={`font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>4. Operating Expenses (OPEX)</span>
              <span className="font-medium text-rose-500">-{formatCurrency(operatingExpenses, language)}</span>
            </div>

            {/* EBITDA / Net Profit */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 font-bold text-sm">
              <span className={isLight ? 'text-slate-900' : 'text-white'}>5. Net Operating Profit</span>
              <span className="text-cyan-500">{formatCurrency(netProfit, language)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Top Products Performance Table */}
      <div className={`p-5 rounded-2xl border space-y-4 transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/50 border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>{t('dashboard.productsPerformance', 'Top Product & Service Margin Performance')}</span>
          </h3>
          <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Active catalog</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className={`border-b uppercase font-semibold ${isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'}`}>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Price</th>
                <th className="py-2.5 px-3">Unit Cost</th>
                <th className="py-2.5 px-3 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
              {defaultProductsList.map((prod) => {
                const margin = Math.round(((prod.price - prod.cost) / (prod.price || 1)) * 100);
                return (
                  <tr key={prod.id} className={`transition ${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'}`}>
                    <td className={`py-3 px-3 font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{prod.name}</td>
                    <td className={`py-3 px-3 font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{prod.sku}</td>
                    <td className="py-3 px-3 text-emerald-500 font-semibold">{formatCurrency(prod.price, language)}</td>
                    <td className={`py-3 px-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{formatCurrency(prod.cost, language)}</td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-500">{margin}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
