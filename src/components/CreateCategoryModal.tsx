/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Tag } from 'lucide-react';
import { CategoryGroup, FinancialCategory } from '../types/category';
import {
  ALL_CATEGORY_GROUPS,
  STICKER_ICON_OPTIONS,
  CATEGORY_COLOR_PRESETS,
  saveCustomCategory,
} from '../utils/categorySystem';
import { CategorySticker } from './CategorySticker';
import { useLanguageTheme } from '../utils/i18n';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (cat: FinancialCategory) => void;
}

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
}) => {
  const { language } = useLanguageTheme();
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const [name, setName] = useState('');
  const [group, setGroup] = useState<CategoryGroup>('Personal & Family');
  const [color, setColor] = useState('#10b981');
  const [iconName, setIconName] = useState('Tag');
  const [type, setType] = useState<'income' | 'expense' | 'both'>('expense');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = saveCustomCategory({
      name: name.trim(),
      group,
      color,
      iconName,
      type,
    });

    onCategoryCreated(created);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {tr('Criar Nova Categoria', 'Create New Category', 'Crear Nueva Categoría')}
              </h3>
              <p className="text-xs text-slate-400">
                {tr(
                  'Personalize nome, grupo, cor e adesivo vetorial sem emojis.',
                  'Customize name, group, color and vector sticker without emojis.',
                  'Personalice nombre, grupo, color y adhesivo vectorial sin emojis.'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Live Preview Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
            <CategorySticker iconName={iconName} color={color} size="lg" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                {tr('Prévia da Categoria', 'Category Preview', 'Vista Previa de Categoría')}
              </p>
              <p className="text-sm font-bold text-white mt-0.5">
                {name.trim() || tr('Nome da Categoria', 'Category Name', 'Nombre de Categoría')}
              </p>
              <p className="text-[11px] text-slate-400">{group}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {tr('Nome da Categoria', 'Category Name', 'Nombre de Categoría')}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr('ex: Viagens em Família', 'e.g. Family Travel', 'ej: Viajes Familiares')}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Group & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {tr('Grupo de Categoria', 'Category Group', 'Grupo de Categoría')}
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as CategoryGroup)}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {ALL_CATEGORY_GROUPS.map((g) => (
                  <option key={g} value={g} className="bg-slate-900 text-white">
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {tr('Tipo de Lançamento', 'Transaction Type', 'Tipo de Transacción')}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="expense" className="bg-slate-900 text-white">
                  {tr('Despesa', 'Expense', 'Gasto')}
                </option>
                <option value="income" className="bg-slate-900 text-white">
                  {tr('Receita', 'Income', 'Ingreso')}
                </option>
                <option value="both" className="bg-slate-900 text-white">
                  {tr('Ambos', 'Both', 'Ambos')}
                </option>
              </select>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {tr('Cor de Identificação', 'Identification Color', 'Color de Identificación')}
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-110 border-white ring-2 ring-emerald-500' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Sticker Vector Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {tr('Selecione o Adesivo Vetorial (Sem Emojis)', 'Select Vector Sticker (No Emojis)', 'Seleccione Adhesivo Vectorial (Sin Emojis)')}
            </label>
            <div className="grid grid-cols-7 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950/80 border border-slate-800 rounded-2xl">
              {STICKER_ICON_OPTIONS.map((st) => (
                <button
                  key={st.name}
                  type="button"
                  onClick={() => setIconName(st.name)}
                  className={`p-2 rounded-xl flex items-center justify-center transition ${
                    iconName === st.name
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                      : 'hover:bg-slate-800 text-slate-400'
                  }`}
                  title={st.label}
                >
                  <CategorySticker iconName={st.name} color={iconName === st.name ? color : '#94a3b8'} showBackground={false} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
            >
              {tr('Cancelar', 'Cancel', 'Cancelar')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>{tr('Salvar Categoria', 'Save Category', 'Guardar Categoría')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
