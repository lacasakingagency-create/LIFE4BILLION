/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Transaction } from '../types/schema';
import { findCategory } from '../utils/categorySystem';
import { CategorySticker } from './CategorySticker';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';

interface CategoryDonutChartProps {
  transactions: Transaction[];
  type?: 'expense' | 'income';
  title?: string;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  transactions,
  type = 'expense',
  title,
}) => {
  const { language } = useLanguageTheme();
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const filtered = transactions.filter((t) => t.type === type);
  const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const categoryTotals: Record<string, number> = {};
  filtered.forEach((t) => {
    const catName = t.category || 'General';
    categoryTotals[catName] = (categoryTotals[catName] || 0) + t.amount;
  });

  const chartData = Object.entries(categoryTotals)
    .map(([catName, amount]) => {
      const category = findCategory(catName);
      const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
      return {
        name: category.name,
        value: amount,
        percentage: percentage.toFixed(1),
        color: category.color,
        iconName: category.iconName,
      };
    })
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2 min-h-[280px]">
        <div className="p-3 bg-slate-800/80 rounded-2xl text-slate-500">
          <PieChart className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold text-slate-400">
          {tr('Nenhum dado financeiro catalogado para o período.', 'No financial data for the selected period.', 'Sin datos financieros para el período.')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5" id="category-donut-panel">
      {/* Chart Title */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            {title || (type === 'expense' ? tr('Distribuição de Gastos por Categoria', 'Expense Distribution by Category', 'Distribución de Gastos por Categoría') : tr('Distribuição de Receitas', 'Income Distribution', 'Distribución de Ingresos'))}
          </h3>
          <p className="text-[11px] text-slate-400">
            {tr('Adesivo vetorial, cor customizada e percentual do total', 'Vector sticker, custom color and total percentage', 'Adhesivo vectorial, color y porcentaje')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 font-bold uppercase">{tr('Total', 'Total', 'Total')}</p>
          <p className="text-sm font-black text-emerald-400 font-mono">
            {formatCurrency(totalAmount, language)}
          </p>
        </div>
      </div>

      {/* Donut Visual & Legend Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Recharts Pie Donut */}
        <div className="lg:col-span-5 h-[220px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val), language), tr('Valor', 'Amount', 'Monto')]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-slate-500">{tr('Categorias', 'Categories', 'Categorías')}</span>
            <span className="text-lg font-black text-white font-mono">{chartData.length}</span>
          </div>
        </div>

        {/* Legend List with Stickers & Percentages */}
        <div className="lg:col-span-7 space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
            >
              <div className="flex items-center space-x-3 truncate">
                <CategorySticker categoryNameOrId={item.name} size="sm" />
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{item.percentage}% {tr('do total', 'of total', 'del total')}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-slate-200 font-mono">
                  {formatCurrency(item.value, language)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
