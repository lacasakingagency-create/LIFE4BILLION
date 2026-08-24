/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Target, 
  Flame, 
  TrendingUp, 
  Award, 
  ShieldAlert, 
  Clock, 
  FolderHeart,
  PlusCircle,
  HelpCircle,
  Printer,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import { LocalDatabase } from '../utils/db';
import { Habit, Goal } from '../types/schema';
import DailyPlannerView from './DailyPlannerView';
import WeeklyGoalsRoutineView from './WeeklyGoalsRoutineView';
import { useLanguageTheme } from '../utils/i18n';
import { getThemeColorById, getThemeChartPalette } from '../utils/theme';

export interface HabitTrackerRow {
  category: string;
  days: boolean[];
}

export const HABIT_TRACKER_CATEGORIES = [
  'Daily Tracker',
  'Monthly Tracker',
  'Streak Tracker',
  'Goal Tracker',
  'Mood Tracker',
  'Sleep Tracker',
  'Water Tracker',
  'Workout Tracker',
  'Reading Tracker',
  'Productivity Tracker'
];

interface HabitsGoalsViewProps {
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

export default function HabitsGoalsView({ onShowNotification }: HabitsGoalsViewProps) {
  const { t, language, themeColor, theme } = useLanguageTheme();
  const currentThemeColor = getThemeColorById(themeColor);
  const palette = getThemeChartPalette(themeColor, theme === 'light');

  // Trilingual helper for dynamic fallback handling (Portuguese, English, Spanish)
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Daily Tracker': return tr('Hábitos Diários', 'Daily Tracker', 'Rastreador Diario');
      case 'Monthly Tracker': return tr('Hábitos Mensais', 'Monthly Tracker', 'Rastreador Mensual');
      case 'Streak Tracker': return tr('Sequência de Hábitos', 'Streak Tracker', 'Rastreador de Rachas');
      case 'Goal Tracker': return tr('Acompanhamento de Metas', 'Goal Tracker', 'Rastreador de Metas');
      case 'Mood Tracker': return tr('Humor & Disposição', 'Mood Tracker', 'Rastreador de Ánimo');
      case 'Sleep Tracker': return tr('Qualidade do Sono', 'Sleep Tracker', 'Rastreador de Sueño');
      case 'Water Tracker': return tr('Consumo de Água', 'Water Tracker', 'Rastreador de Agua');
      case 'Workout Tracker': return tr('Treino & Exercícios', 'Workout Tracker', 'Rastreador de Ejercicios');
      case 'Reading Tracker': return tr('Leitura de Livros', 'Reading Tracker', 'Rastreador de Lectura');
      case 'Productivity Tracker': return tr('Produtividade & Foco', 'Productivity Tracker', 'Rastreador de Productividad');
      default: return cat;
    }
  };

  const [activeSubView, setActiveSubView] = useState<'standard' | 'habit-sheet' | 'daily-planner'>('standard');
  const [trackerMonth, setTrackerMonth] = useState(t('defaultMonth', 'Julho'));
  const [trackerYear, setTrackerYear] = useState('2026');
  const [trackerNotes, setTrackerNotes] = useState('');
  
  const [trackerGrid, setTrackerGrid] = useState<HabitTrackerRow[]>(() => {
    const saved = localStorage.getItem('omnisaas_habit_tracker_grid');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === HABIT_TRACKER_CATEGORIES.length) {
          return parsed;
        }
      } catch (e) {}
    }
    return HABIT_TRACKER_CATEGORIES.map(cat => ({
      category: cat,
      days: Array.from({ length: 31 }, () => false)
    }));
  });

  useEffect(() => {
    localStorage.setItem('omnisaas_habit_tracker_grid', JSON.stringify(trackerGrid));
  }, [trackerGrid]);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Form states & validation
  const [habitName, setHabitName] = useState('');
  const [habitFreq, setHabitFreq] = useState<'daily' | 'weekly'>('daily');
  const [habitError, setHabitError] = useState('');

  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalUnit, setGoalUnit] = useState('R$');
  const [goalCategory, setGoalCategory] = useState<'personal' | 'fitness' | 'business' | 'financial'>('business');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalError, setGoalError] = useState('');

  const [adjustingGoalId, setAdjustingGoalId] = useState<string | null>(null);
  const [goalNewValue, setGoalNewValue] = useState('');

  useEffect(() => {
    setHabits(LocalDatabase.getHabits());
    setGoals(LocalDatabase.getGoals());
  }, []);

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) {
      setHabitError(t('habitNameRequired', 'Por favor, informe o nome do hábito.'));
      return;
    }
    setHabitError('');

    const newHabit = LocalDatabase.addHabit(habitName.trim(), habitFreq);
    setHabits(LocalDatabase.getHabits());
    setHabitName('');
    onShowNotification(
      t('habitRegisteredTitle', 'Hábito Cadastrado'), 
      t('habitRegisteredMessage', '"{name}" foi registrado com sucesso!').replace('{name}', newHabit.name), 
      'success'
    );
  };

  const handleToggleHabit = (id: string) => {
    const updated = LocalDatabase.toggleHabit(id);
    setHabits(updated);
    const target = updated.find(h => h.id === id);
    if (target?.last_completed) {
      onShowNotification(
        t('habitCompletedCongratsTitle', 'Sensacional!'), 
        t('habitCompletedCongratsMessage', 'Você completou o hábito "{name}". Streak de {streak} dias!').replace('{name}', target.name).replace('{streak}', String(target.streak)), 
        'success'
      );
    }
  };

  const handleDeleteHabit = (id: string, name: string) => {
    const updated = LocalDatabase.deleteHabit(id);
    setHabits(updated);
    onShowNotification(
      t('habitDeletedTitle', 'Hábito Removido'), 
      t('habitDeletedMessage', '"{name}" foi apagado permanentemente.').replace('{name}', name), 
      'info'
    );
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) {
      setGoalError(t('goalNameRequired', 'O nome da meta é obrigatório.'));
      return;
    }
    const targetNum = parseFloat(goalTarget);
    if (isNaN(targetNum) || targetNum <= 0) {
      setGoalError(t('goalTargetInvalid', 'O valor alvo deve ser um número positivo.'));
      return;
    }
    if (!goalDeadline) {
      setGoalError(t('goalDeadlineRequired', 'Por favor, insira uma data limite de prazo.'));
      return;
    }
    setGoalError('');

    const newGoal = LocalDatabase.addGoal({
      name: goalName.trim(),
      target_value: targetNum,
      current_value: 0,
      unit: goalUnit,
      deadline: goalDeadline,
      category: goalCategory,
    });

    setGoals(LocalDatabase.getGoals());
    setGoalName('');
    setGoalTarget('');
    setGoalDeadline('');
    onShowNotification(
      t('goalCreatedTitle', 'Objetivo Criado'), 
      t('goalCreatedMessage', 'Meta "{name}" estabelecida com sucesso!').replace('{name}', newGoal.name), 
      'success'
    );
  };

  const handleUpdateGoalVal = (id: string) => {
    const val = parseFloat(goalNewValue);
    if (isNaN(val) || val < 0) {
      onShowNotification(
        t('goalProgressInvalidTitle', 'Erro de Validação'), 
        t('invalidNumberValue', 'Informe um valor numérico positivo ou zero.'), 
        'warning'
      );
      return;
    }

    const updated = LocalDatabase.updateGoalProgress(id, val);
    setGoals(updated);
    setAdjustingGoalId(null);
    setGoalNewValue('');

    const matched = updated.find(g => g.id === id);
    if (matched && matched.status === 'completed') {
      onShowNotification(
        t('goalAchievedTitle', 'Meta Atingida! 🏆'), 
        t('goalAchievedMessage', 'Parabéns! Você alcançou o objetivo "{name}"!').replace('{name}', matched.name), 
        'success'
      );
    } else {
      onShowNotification(
        t('goalProgressSavedTitle', 'Progresso Salvo'), 
        t('goalProgressSavedMessage', 'Progresso de "{name}" atualizado para {val}.').replace('{name}', matched?.name || '').replace('{val}', String(val)), 
        'success'
      );
    }
  };

  const handleDeleteGoal = (id: string, name: string) => {
    const updated = LocalDatabase.deleteGoal(id);
    setGoals(updated);
    onShowNotification(
      t('goalCancelledTitle', 'Meta Cancelada'), 
      t('goalCancelledMessage', '"{name}" foi excluída.').replace('{name}', name), 
      'info'
    );
  };

  const handlePrintHabitTracker = (month: string, year: string, grid: HabitTrackerRow[], notes: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onShowNotification('Aviso', tr('Habilite popups no seu navegador para imprimir.', 'Please enable popups in your browser to print.', 'Habilite ventanas emergentes en su navegador para imprimir.'), 'warning');
      return;
    }

    const renderHeaders = () => {
      let headers = `<th style="border: 1px solid black; padding: 6px; text-align: left; font-size: 11px;">${t('habitCategoryHeader', tr('Hábito / Categoria', 'Habit / Category', 'Hábito / Categoría'))}</th>`;
      for (let d = 1; d <= 31; d++) {
        headers += `<th style="border: 1px solid black; padding: 2px; text-align: center; font-size: 9px; width: 18px; font-family: sans-serif;">${d}</th>`;
      }
      headers += `<th style="border: 1px solid black; padding: 4px; text-align: center; font-size: 9px; width: 40px; font-family: sans-serif;">${t('total', tr('Total', 'Total', 'Total'))}</th>`;
      return headers;
    };

    const renderRows = () => {
      return grid.map(row => {
        let cells = `<td style="border: 1px solid black; padding: 6px; font-weight: bold; text-align: left; font-size: 11px; font-family: sans-serif;">${getCategoryLabel(row.category)}</td>`;
        let count = 0;
        for (let d = 0; d < 31; d++) {
          const checked = row.days[d];
          if (checked) count++;
          cells += `
            <td style="border: 1px solid black; padding: 0; text-align: center; font-size: 11px; width: 18px; height: 22px; font-weight: bold; background-color: ${checked ? '#cbd5e1' : 'transparent'};">
              ${checked ? '●' : ''}
            </td>
          `;
        }
        cells += `<td style="border: 1px solid black; padding: 4px; text-align: center; font-size: 10px; font-family: monospace; font-weight: bold;">${count}</td>`;
        return `<tr>${cells}</tr>`;
      }).join('');
    };

    printWindow.document.write(`
      <html>
        <head>
          <title>${tr('RASTREADOR DE HÁBITOS', 'HABIT TRACKER', 'RASTREADOR DE HÁBITOS')} - ${month.toUpperCase()} ${year}</title>
          <style>
            @media print {
              body { background-color: white !important; color: black !important; padding: 0 !important; border: none !important; box-shadow: none !important; }
            }
            body {
              font-family: 'Georgia', serif;
              color: #111;
              background-color: #FAF8F5;
              padding: 40px;
              max-width: 950px;
              margin: 0 auto;
              border: 1px solid #ddd;
              box-shadow: 0 0 10px rgba(0,0,0,0.05);
            }
            h1 {
              font-size: 26px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 3px;
              text-align: center;
              margin-bottom: 5px;
              font-family: 'Times New Roman', Times, serif;
            }
            .subtitle {
              text-align: center;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #555;
              margin-bottom: 25px;
            }
            .header-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              border-bottom: 1px solid black;
              padding-bottom: 8px;
              font-family: sans-serif;
              font-size: 12px;
            }
            .info-item {
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            th, td {
              border: 1px solid black;
              height: 22px;
            }
            th {
              background-color: #f3f3f3;
              font-family: sans-serif;
              font-weight: bold;
            }
            .notes-section {
              margin-top: 25px;
              text-align: left;
            }
            .notes-title {
              font-family: sans-serif;
              font-weight: bold;
              font-size: 12px;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .notes-lines {
              border: 1px solid black;
              background-color: transparent;
              min-height: 80px;
              padding: 10px;
              font-size: 11px;
              font-family: 'Georgia', serif;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <h1>${tr('Rastreador de Hábitos', 'Daily Habit Tracker', 'Rastreador de Hábitos')}</h1>
          <div class="subtitle">${tr('Rotina Diária & Disciplina', 'Daily Routines & Discipline Sheet', 'Rutinas Diarias y Hoja de Disciplina')}</div>
          
          <div class="header-info">
            <div><span class="info-item">${tr('Mês:', 'Month:', 'Mes:')}</span> ${month || '&nbsp;'}</div>
            <div><span class="info-item">${tr('Ano:', 'Year:', 'Año:')}</span> ${year || '&nbsp;'}</div>
          </div>
          
          <table>
            <thead>
              <tr>${renderHeaders()}</tr>
            </thead>
            <tbody>
              ${renderRows()}
            </tbody>
          </table>
          
          <div class="notes-section">
            <div class="notes-title">${tr('Notas & Reflexão', 'Notes & Reflection', 'Notas y Reflexión')}</div>
            <div class="notes-lines">${notes.replace(/\n/g, '<br>') || tr('Escreva suas reflexões, aprendizados e conquistas do mês...', 'Write your reflections, learnings, and achievements for the month...', 'Escriba sus reflexiones, aprendizajes y logros del mes...')}</div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    onShowNotification(
      t('success', tr('Sucesso', 'Success', 'Éxito')), 
      tr('Visualização de impressão aberta!', 'Print preview opened!', '¡Vista previa de impresión abierta!'), 
      'success'
    );
  };

  const handleToggleCell = (rowIndex: number, dayIndex: number) => {
    setTrackerGrid(prev => {
      const updated = [...prev];
      const updatedRow = { ...updated[rowIndex] };
      const updatedDays = [...updatedRow.days];
      updatedDays[dayIndex] = !updatedDays[dayIndex];
      updatedRow.days = updatedDays;
      updated[rowIndex] = updatedRow;
      return updated;
    });
  };

  const handlePrefillTracker = () => {
    setTrackerGrid(prev => {
      return prev.map((row, idx) => {
        const days = Array.from({ length: 31 }, (_, dayIdx) => {
          // Pre-fill some days randomly but with a nice realistic pattern (more checked items in first half of month)
          const prob = idx % 2 === 0 ? 0.7 - (dayIdx * 0.01) : 0.4 + (dayIdx * 0.005);
          return Math.random() < prob;
        });
        return { ...row, days };
      });
    });
    setTrackerNotes(t('prefillNotesText', 'Foco absoluto este mês! Excelente progresso na leitura diária e hidratação.'));
    onShowNotification(t('success', 'Sucesso'), t('prefillDataSuccess', 'Dados preenchidos para visualização!'), 'success');
  };

  return (
    <div className="space-y-6" id="habits-goals-container-outer">
      
      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-slate-850 overflow-x-auto scrollbar-none" id="habits-sub-tabs">
        <button 
          onClick={() => setActiveSubView('standard')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 shrink-0 ${
            activeSubView === 'standard' 
              ? 'text-white' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          style={{
            borderColor: activeSubView === 'standard' ? currentThemeColor.hex : 'transparent',
            backgroundColor: activeSubView === 'standard' ? `${currentThemeColor.hex}15` : 'transparent',
            color: activeSubView === 'standard' ? palette.primary : undefined
          }}
          id="tab-btn-standard-habits"
        >
          <Flame className="w-3.5 h-3.5" style={{ color: palette.primary }} />
          <span>{tr('Controle de Metas & Rotina', 'Goals & Routine Tracker', 'Control de Metas y Rutina')}</span>
        </button>

        <button 
          onClick={() => setActiveSubView('habit-sheet')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 shrink-0 ${
            activeSubView === 'habit-sheet' 
              ? 'text-white' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          style={{
            borderColor: activeSubView === 'habit-sheet' ? currentThemeColor.hex : 'transparent',
            backgroundColor: activeSubView === 'habit-sheet' ? `${currentThemeColor.hex}15` : 'transparent',
            color: activeSubView === 'habit-sheet' ? palette.primary : undefined
          }}
          id="tab-btn-sheet-habits"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: palette.primary }} />
          <span>{tr('Folha Habit Tracker Impressa', 'Printable Habit Tracker Sheet', 'Hoja de Habit Tracker Impresa')}</span>
        </button>

        <button 
          onClick={() => setActiveSubView('daily-planner')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 shrink-0 ${
            activeSubView === 'daily-planner' 
              ? 'text-white' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          style={{
            borderColor: activeSubView === 'daily-planner' ? currentThemeColor.hex : 'transparent',
            backgroundColor: activeSubView === 'daily-planner' ? `${currentThemeColor.hex}15` : 'transparent',
            color: activeSubView === 'daily-planner' ? palette.primary : undefined
          }}
          id="tab-btn-daily-planner"
        >
          <Calendar className="w-3.5 h-3.5" style={{ color: palette.primary }} />
          <span className="flex items-center">
            {tr('Hábitos Diários', 'Daily Habits', 'Hábitos Diarios')}{' '}
            <span className="ml-1 text-[9px] bg-slate-900 text-slate-300 border border-slate-700 px-1.5 py-0.2 rounded font-mono font-bold">
              {tr('20 Seções', '20 Sections', '20 Secciones')}
            </span>
          </span>
        </button>
      </div>

      {activeSubView === 'standard' && (
        <WeeklyGoalsRoutineView onShowNotification={onShowNotification} />
      )}

      {activeSubView === 'habit-sheet' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-fade-in" id="habit-sheet-view">
          {/* Sidebar Controller */}
          <div className="xl:col-span-1 bg-slate-900/30 border border-slate-800 rounded-2xl p-4 h-fit">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">{t('habitSheetTitle', 'Folha Habit Tracker')}</h3>
            <p className="text-slate-400 text-xs mb-4">
              {t('habitSheetDesc', 'Gerencie seus hábitos diários em uma grade de 31 dias. Clique em cada dia para preencher sua bolinha de conclusão.')}
            </p>
            
            <div className="space-y-2 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => handlePrintHabitTracker(trackerMonth, trackerYear, trackerGrid, trackerNotes)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition"
              >
                <Printer className="w-4 h-4 text-emerald-405" />
                <span>{t('printSheetBtn', 'Imprimir Folha / PDF')}</span>
              </button>
              
              <button
                onClick={handlePrefillTracker}
                className="w-full bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-300 text-xs font-semibold py-2 px-3 rounded-xl transition"
              >
                {t('prefillSampleBtn', 'Preencher Amostra')}
              </button>

              <button
                onClick={() => {
                  if (confirm(t('confirmResetGrid', 'Tem certeza de que deseja resetar toda a sua folha de hábitos?'))) {
                    setTrackerGrid(HABIT_TRACKER_CATEGORIES.map(cat => ({
                      category: cat,
                      days: Array.from({ length: 31 }, () => false)
                    })));
                    setTrackerNotes('');
                    onShowNotification(t('success', 'Sucesso'), t('gridResetSuccess', 'Grade de hábitos resetada!'), 'info');
                  }
                }}
                className="w-full bg-slate-950 hover:bg-slate-900 text-rose-400 border border-rose-500/10 hover:border-rose-500/20 text-xs font-medium py-2 px-3 rounded-xl transition"
              >
                {t('clearGridBtn', 'Limpar Grade')}
              </button>
            </div>
          </div>

          {/* Habit Paper Sheet */}
          <div className="xl:col-span-3">
            <div className="bg-[#FAF8F5] border border-slate-300 p-6 md:p-8 rounded-xl shadow-xl text-slate-900 max-w-5xl mx-auto font-serif min-h-[850px] flex flex-col justify-between">
              <div>
                <div className="text-center pb-3 border-b border-black">
                  <p className="text-[10px] font-sans font-bold tracking-widest text-slate-500 uppercase">{tr('Diário Interativo', 'Interactive Journal', 'Diario Interactivo')}</p>
                  <h2 className="text-3xl font-black tracking-widest text-black uppercase mt-1" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                    {tr('Rastreador de Hábitos', 'Daily Habit Tracker', 'Rastreador de Hábitos')}
                  </h2>
                </div>

                {/* Header Metadata inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-5 px-1 font-sans text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-black uppercase">{tr('Mês:', 'Month:', 'Mes:')}</span>
                    <input 
                      type="text" 
                      value={trackerMonth} 
                      onChange={(e) => setTrackerMonth(e.target.value)}
                      className="bg-transparent border-b border-black text-slate-900 text-sm focus:outline-none flex-1 font-medium"
                      placeholder={tr('Ex: Julho', 'E.g., July', 'Ej: Julio')}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-black uppercase">{tr('Ano:', 'Year:', 'Año:')}</span>
                    <input 
                      type="text" 
                      value={trackerYear} 
                      onChange={(e) => setTrackerYear(e.target.value)}
                      className="bg-transparent border-b border-black text-slate-900 text-sm focus:outline-none flex-1 font-medium"
                      placeholder="Ex: 2026"
                    />
                  </div>
                </div>

                {/* 31-Day Table */}
                <div className="overflow-x-auto border border-black mt-6">
                  <table className="w-full text-center border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-200/50 border-b border-black text-[10px] font-sans font-bold uppercase tracking-wider">
                        <th className="py-2 px-3 border-r border-black text-left w-[18%]">{t('habitCategoryHeader', tr('Hábito / Categoria', 'Habit / Category', 'Hábito / Categoría'))}</th>
                        {Array.from({ length: 31 }).map((_, d) => (
                          <th key={d} className="border-r border-black font-sans font-bold w-[2.2%] text-center">{d + 1}</th>
                        ))}
                        <th className="py-2 px-1 text-center w-[6%]">{t('total', tr('Total', 'Total', 'Total'))}</th>
                        <th className="py-2 px-1 text-center w-[8%]">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {trackerGrid.map((row, rIdx) => {
                        const checkedCount = row.days.filter(Boolean).length;
                        const percentage = ((checkedCount / 31) * 100).toFixed(0);
                        return (
                          <tr key={rIdx} className="hover:bg-black/5 divide-x divide-black">
                            <td className="py-2 px-3 text-left font-sans font-bold text-black text-[11px] bg-slate-100/10">
                              {getCategoryLabel(row.category)}
                            </td>
                            {row.days.map((checked, dIdx) => (
                              <td 
                                key={dIdx} 
                                onClick={() => handleToggleCell(rIdx, dIdx)}
                                className="p-0 align-middle cursor-pointer hover:bg-slate-300/30 transition-all select-none"
                              >
                                <div className="flex items-center justify-center h-7 w-full">
                                  <div className={`w-3 h-3 rounded-full border border-black/80 flex items-center justify-center transition-all ${
                                    checked ? 'bg-slate-900 scale-110 shadow-sm' : 'bg-transparent'
                                  }`} />
                                </div>
                              </td>
                            ))}
                            <td className="py-2 font-mono text-[11px] font-bold text-slate-900 bg-slate-100/5 align-middle">
                              {checkedCount}
                            </td>
                            <td className="py-2 font-mono text-[10px] font-bold text-indigo-700 bg-slate-100/5 align-middle">
                              {percentage}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lined Notes section at the bottom */}
              <div className="mt-8 border-t border-black/30 pt-6">
                <label className="block text-xs font-sans font-bold text-black uppercase tracking-wider mb-2">
                  {t('notesReflection', tr('Notas & Reflexão', 'Notes & Reflection', 'Notas y Reflexión'))}
                </label>
                <textarea
                  value={trackerNotes}
                  onChange={(e) => setTrackerNotes(e.target.value)}
                  className="w-full bg-transparent border border-black rounded-sm p-4 text-xs font-serif leading-relaxed text-slate-900 focus:outline-none focus:bg-white"
                  placeholder={t('notesReflectionPlaceholder', tr('Escreva suas reflexões, metas e aprendizados do mês aqui...', 'Write your reflections, goals, and learnings for the month here...', 'Escriba sus reflexiones, metas y aprendizajes del mes aquí...'))}
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubView === 'daily-planner' && (
        <DailyPlannerView onShowNotification={onShowNotification} />
      )}

    </div>
  );
}
