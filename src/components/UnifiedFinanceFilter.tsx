/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Filter, Search, RotateCcw, Tag, Layers, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { TimePeriod, UnifiedFilterOptions } from '../types/category';
import { ALL_CATEGORY_GROUPS, getAllCategories } from '../utils/categorySystem';
import { useLanguageTheme } from '../utils/i18n';

interface UnifiedFinanceFilterProps {
  filter: UnifiedFilterOptions;
  onChange: (updated: UnifiedFilterOptions) => void;
  accounts?: Array<{ id: string; name: string }>;
  cards?: Array<{ id: string; name: string }>;
}

export const UnifiedFinanceFilter: React.FC<UnifiedFinanceFilterProps> = ({
  filter,
  onChange,
  accounts = [],
  cards = [],
}) => {
  const { language } = useLanguageTheme();
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const periods: Array<{ id: TimePeriod; label: string }> = [
    { id: 'day', label: tr('Dia', 'Day', 'Día') },
    { id: 'week', label: tr('Semana', 'Week', 'Semana') },
    { id: 'month', label: tr('Mês', 'Month', 'Mes') },
    { id: 'q1', label: 'Q1' },
    { id: 'q2', label: 'Q2' },
    { id: 'q3', label: 'Q3' },
    { id: 'q4', label: 'Q4' },
    { id: 'bimester', label: tr('Bimestre', 'Bimester', 'Bimestre') },
    { id: 'semester', label: tr('Semestre', 'Semester', 'Semestre') },
    { id: 'year', label: tr('Ano', 'Year', 'Año') },
  ];

  const handleReset = () => {
    onChange({
      period: 'month',
      categoryGroup: '',
      category: '',
      type: 'all',
      searchQuery: '',
    });
  };

  const allCategories = getAllCategories();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl" id="unified-finance-filter">
      {/* Top Bar: Periods Navigation Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-white">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>{tr('Período de Análise', 'Analysis Period', 'Período de Análisis')}</span>
        </div>

        {/* Period Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ ...filter, period: p.id })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                filter.period === p.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={filter.searchQuery || ''}
            onChange={(e) => onChange({ ...filter, searchQuery: e.target.value })}
            placeholder={tr('Buscar transação...', 'Search transaction...', 'Buscar transacción...')}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Transaction Type */}
        <div>
          <select
            value={filter.type || 'all'}
            onChange={(e) => onChange({ ...filter, type: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all" className="bg-slate-900">{tr('Todos os Tipos', 'All Types', 'Todos los Tipos')}</option>
            <option value="income" className="bg-slate-900">{tr('Somente Receitas', 'Income Only', 'Solo Ingresos')}</option>
            <option value="expense" className="bg-slate-900">{tr('Somente Despesas', 'Expenses Only', 'Solo Gastos')}</option>
            <option value="transfer" className="bg-slate-900">{tr('Somente Transferências', 'Transfers Only', 'Solo Transferencias')}</option>
          </select>
        </div>

        {/* Category Group */}
        <div>
          <select
            value={filter.categoryGroup || ''}
            onChange={(e) => onChange({ ...filter, categoryGroup: e.target.value, category: '' })}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="" className="bg-slate-900">{tr('Todos os Grupos', 'All Groups', 'Todos los Grupos')}</option>
            {ALL_CATEGORY_GROUPS.map((grp) => (
              <option key={grp} value={grp} className="bg-slate-900">{grp}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <select
            value={filter.category || ''}
            onChange={(e) => onChange({ ...filter, category: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="" className="bg-slate-900">{tr('Todas as Categorias', 'All Categories', 'Todas las Categorías')}</option>
            {allCategories
              .filter((c) => !filter.categoryGroup || c.group === filter.categoryGroup)
              .map((cat) => (
                <option key={cat.id} value={cat.name} className="bg-slate-900">
                  {cat.name}
                </option>
              ))}
          </select>
        </div>

        {/* Reset Filters */}
        <div>
          <button
            onClick={handleReset}
            className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 border border-slate-700/60"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>{tr('Limpar Filtros', 'Reset Filters', 'Limpiar Filtros')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
