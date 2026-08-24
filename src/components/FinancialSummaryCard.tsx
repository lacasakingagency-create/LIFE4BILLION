/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, ArrowUpRight, ArrowDownLeft, ShieldCheck, Scale } from 'lucide-react';
import { Transaction, Budget } from '../types/schema';
import { UnifiedFilterOptions } from '../types/category';
import { findCategory } from '../utils/categorySystem';
import { CategorySticker } from './CategorySticker';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';

interface FinancialSummaryCardProps {
  transactions: Transaction[];
  budgets?: Budget[];
  filter: UnifiedFilterOptions;
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  transactions,
  budgets = [],
  filter,
}) => {
  const { language } = useLanguageTheme();
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  // Filter transactions according to period & filter options
  const filtered = transactions.filter((t) => {
    if (filter.type && filter.type !== 'all' && t.type !== filter.type) return false;
    if (filter.category && t.category.toLowerCase() !== filter.category.toLowerCase()) return false;
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      if (!matchDesc && !matchCat) return false;
    }
    return true;
  });

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  // Savings / Investment categories
  const savingsAmount = filtered
    .filter((t) => {
      const cat = t.category.toLowerCase();
      return cat.includes('saving') || cat.includes('poupança') || cat.includes('invest') || cat.includes('emergenc');
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Top Spending Category
  const expenseByCategory: Record<string, number> = {};
  filtered
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });

  let topCategoryName = '';
  let topCategoryAmount = 0;
  Object.entries(expenseByCategory).forEach(([cat, amt]) => {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCategoryName = cat;
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="financial-summary-cards">
      {/* 1. Total Income */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {tr('Total de Receitas', 'Total Income', 'Total Ingresos')}
          </p>
          <p className="text-lg font-black text-emerald-400 font-mono">
            {formatCurrency(totalIncome, language)}
          </p>
          <span className="inline-flex items-center text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
            <ArrowUpRight className="w-3 h-3 mr-1" />
            {tr('Entradas no período', 'Inflow in period', 'Entradas en el período')}
          </span>
        </div>
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>

      {/* 2. Total Expenses */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {tr('Total de Despesas', 'Total Expenses', 'Total Gastos')}
          </p>
          <p className="text-lg font-black text-rose-400 font-mono">
            {formatCurrency(totalExpense, language)}
          </p>
          <span className="inline-flex items-center text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md">
            <ArrowDownLeft className="w-3 h-3 mr-1" />
            {tr('Saídas no período', 'Outflow in period', 'Salidas en el período')}
          </span>
        </div>
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
          <TrendingDown className="w-6 h-6" />
        </div>
      </div>

      {/* 3. Net Cash Flow */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {tr('Fluxo Líquido', 'Net Cash Flow', 'Flujo Neto')}
          </p>
          <p className={`text-lg font-black font-mono ${netCashFlow >= 0 ? 'text-sky-400' : 'text-amber-400'}`}>
            {formatCurrency(netCashFlow, language)}
          </p>
          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md ${netCashFlow >= 0 ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'}`}>
            <Scale className="w-3 h-3 mr-1" />
            {netCashFlow >= 0 ? tr('Superávit', 'Surplus', 'Superávit') : tr('Déficit', 'Deficit', 'Déficit')}
          </span>
        </div>
        <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* 4. Top Spending Category */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div className="space-y-1 truncate pr-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {tr('Maior Categoria de Custo', 'Top Expense Category', 'Mayor Categoría de Gasto')}
          </p>
          <p className="text-sm font-bold text-white truncate">
            {topCategoryName || tr('Sem gastos', 'No expenses', 'Sin gastos')}
          </p>
          <p className="text-xs font-black text-rose-300 font-mono">
            {formatCurrency(topCategoryAmount, language)}
          </p>
        </div>
        {topCategoryName ? (
          <CategorySticker categoryNameOrId={topCategoryName} size="lg" />
        ) : (
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
            <PiggyBank className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};
