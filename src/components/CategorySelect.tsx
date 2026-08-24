/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Plus, Check } from 'lucide-react';
import { FinancialCategory, CategoryGroup } from '../types/category';
import { getAllCategories, ALL_CATEGORY_GROUPS } from '../utils/categorySystem';
import { CategorySticker } from './CategorySticker';
import { CreateCategoryModal } from './CreateCategoryModal';
import { useLanguageTheme } from '../utils/i18n';

interface CategorySelectProps {
  value: string;
  onChange: (categoryName: string) => void;
  filterType?: 'income' | 'expense' | 'both';
  label?: string;
  className?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  filterType,
  label,
  className = '',
}) => {
  const { language } = useLanguageTheme();
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [allCategories, setAllCategories] = useState<FinancialCategory[]>(getAllCategories());

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleRefreshCategories = () => {
    setAllCategories(getAllCategories());
  };

  const selectedCategory = allCategories.find(
    (c) => c.name.toLowerCase() === value.toLowerCase() || c.id.toLowerCase() === value.toLowerCase()
  );

  const filteredCategories = allCategories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.group.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType && filterType !== 'both' && c.type !== 'both' && c.type !== filterType) {
      return false;
    }
    return true;
  });

  // Group by category group
  const grouped: Record<CategoryGroup, FinancialCategory[]> = {} as any;
  ALL_CATEGORY_GROUPS.forEach((g) => {
    grouped[g] = [];
  });

  filteredCategories.forEach((c) => {
    if (grouped[c.group]) {
      grouped[c.group].push(c);
    } else {
      if (!grouped['Business']) grouped['Business'] = [];
      grouped['Business'].push(c);
    }
  });

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* Select Trigger Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white hover:border-slate-600 transition shadow-sm text-left"
      >
        <div className="flex items-center space-x-2.5 truncate">
          {selectedCategory ? (
            <>
              <CategorySticker categoryNameOrId={selectedCategory.name} size="sm" />
              <span className="font-semibold truncate">{selectedCategory.name}</span>
            </>
          ) : (
            <span className="text-slate-400 font-medium">
              {value || tr('Selecione uma categoria', 'Select category', 'Seleccionar categoría')}
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-80 animate-fade-in">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/80 flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr('Buscar categoria...', 'Search category...', 'Buscar categoría...')}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {ALL_CATEGORY_GROUPS.map((grp) => {
              const list = grouped[grp];
              if (!list || list.length === 0) return null;

              return (
                <div key={grp} className="space-y-1">
                  <p className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {grp}
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {list.map((cat) => {
                      const isSelected =
                        value.toLowerCase() === cat.name.toLowerCase() ||
                        value.toLowerCase() === cat.id.toLowerCase();

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            onChange(cat.name);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${
                            isSelected
                              ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <CategorySticker categoryNameOrId={cat.name} size="xs" />
                            <span className="truncate">{cat.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredCategories.length === 0 && (
              <p className="p-4 text-center text-xs text-slate-500">
                {tr('Nenhuma categoria encontrada.', 'No category found.', 'No se encontró categoría.')}
              </p>
            )}
          </div>

          {/* Footer Action: Create Custom Category */}
          <div className="p-2 border-t border-slate-800 bg-slate-950/90">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsCreateModalOpen(true);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{tr('Criar Nova Categoria Customizada', 'Create Custom Category', 'Crear Categoría Personalizada')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal for Creating Category */}
      <CreateCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCategoryCreated={(createdCat) => {
          handleRefreshCategories();
          onChange(createdCat.name);
        }}
      />
    </div>
  );
};
