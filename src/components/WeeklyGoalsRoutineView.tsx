/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  RotateCcw, 
  Printer, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  CheckSquare,
  Square,
  Edit2,
  X,
  TrendingUp,
  Award
} from 'lucide-react';
import { LocalDatabase } from '../utils/db';
import { WeeklyRoutineState, WeeklyDayRoutine, WeeklyRoutineTask } from '../types/schema';
import { useLanguageTheme } from '../utils/i18n';
import { getThemeColorById, getThemeChartPalette } from '../utils/theme';

interface WeeklyGoalsRoutineViewProps {
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function WeeklyGoalsRoutineView({ onShowNotification }: WeeklyGoalsRoutineViewProps) {
  const { t, language, themeColor, theme } = useLanguageTheme();
  const currentThemeColor = getThemeColorById(themeColor);
  const palette = getThemeChartPalette(themeColor, theme === 'light');

  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const [routineData, setRoutineData] = useState<WeeklyRoutineState>(() => {
    return LocalDatabase.getWeeklyRoutine(language);
  });

  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [editingTaskId, setEditingTaskId] = useState<{ dayKey: DayKey; taskId: string } | null>(null);
  const [editingTaskText, setEditingTaskText] = useState<string>('');
  const [newTaskDay, setNewTaskDay] = useState<DayKey | null>(null);
  const [newTaskText, setNewTaskText] = useState<string>('');

  // Generate dynamic formatted dates for the selected week offset
  const getFormattedDatesForOffset = (offsetWeeks: number) => {
    const baseDate = new Date();
    // Monday of current week
    const currentDay = baseDate.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + distanceToMonday + offsetWeeks * 7);

    const dates: Record<DayKey, string> = {
      mon: '',
      tue: '',
      wed: '',
      thu: '',
      fri: '',
      sat: '',
      sun: ''
    };

    DAY_KEYS.forEach((key, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      const dayNum = d.getDate();
      const monthNum = d.getMonth() + 1;
      const yearShort = d.getFullYear().toString().slice(-2);
      dates[key] = `${dayNum}.${monthNum}.${yearShort}`;
    });

    return dates;
  };

  const currentDates = getFormattedDatesForOffset(weekOffset);

  // Handle week navigation
  const handlePrevWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const handleCurrentWeek = () => {
    setWeekOffset(0);
  };

  // Persist routine data
  useEffect(() => {
    LocalDatabase.saveWeeklyRoutine(routineData);
  }, [routineData]);

  // Day Name Localization Resolver
  const getLocalizedDayName = (dayKey: DayKey): string => {
    switch (dayKey) {
      case 'mon': return tr('SEGUNDA-FEIRA', 'MONDAY', 'LUNES');
      case 'tue': return tr('TERÇA-FEIRA', 'TUESDAY', 'MARTES');
      case 'wed': return tr('QUARTA-FEIRA', 'WEDNESDAY', 'MIÉRCOLES');
      case 'thu': return tr('QUINTA-FEIRA', 'THURSDAY', 'JUEVES');
      case 'fri': return tr('SEXTA-FEIRA', 'FRIDAY', 'VIERNES');
      case 'sat': return tr('SÁBADO', 'SATURDAY', 'SÁBADO');
      case 'sun': return tr('DOMINGO', 'SUNDAY', 'DOMINGO');
      default: return '';
    }
  };

  const getLocalizedDayShort = (dayKey: DayKey): string => {
    switch (dayKey) {
      case 'mon': return tr('Seg', 'Mon', 'Lun');
      case 'tue': return tr('Ter', 'Tue', 'Mar');
      case 'wed': return tr('Qua', 'Wed', 'Mié');
      case 'thu': return tr('Qui', 'Thu', 'Jue');
      case 'fri': return tr('Sex', 'Fri', 'Vie');
      case 'sat': return tr('Sáb', 'Sat', 'Sáb');
      case 'sun': return tr('Dom', 'Sun', 'Dom');
      default: return '';
    }
  };

  // Calculate day and weekly statistics
  const getDayStats = (dayKey: DayKey) => {
    const day = routineData.days[dayKey];
    if (!day || !day.tasks || day.tasks.length === 0) {
      return { total: 0, completed: 0, percentage: 0 };
    }
    const total = day.tasks.length;
    const completed = day.tasks.filter(t => t.done).length;
    const percentage = Math.round((completed / total) * 100);
    return { total, completed, percentage };
  };

  const weeklyStats = (() => {
    let totalTasks = 0;
    let completedTasks = 0;

    DAY_KEYS.forEach(key => {
      const stats = getDayStats(key);
      totalTasks += stats.total;
      completedTasks += stats.completed;
    });

    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { totalTasks, completedTasks, percentage };
  })();

  // Toggle Task Completion
  const handleToggleTask = (dayKey: DayKey, taskId: string) => {
    setRoutineData(prev => {
      const day = prev.days[dayKey];
      const updatedTasks = day.tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, done: !t.done };
        }
        return t;
      });

      const updated = {
        ...prev,
        days: {
          ...prev.days,
          [dayKey]: {
            ...day,
            tasks: updatedTasks
          }
        }
      };

      const task = day.tasks.find(t => t.id === taskId);
      if (task && !task.done) {
        onShowNotification(
          tr('Tarefa Concluída!', 'Task Completed!', '¡Tarea Completada!'),
          `"${task.text}" - ${tr('Ótimo progresso!', 'Great progress!', '¡Gran progreso!')}`,
          'success'
        );
      }

      return updated;
    });
  };

  // Add Task to Day
  const handleAddTask = (dayKey: DayKey) => {
    if (!newTaskText.trim()) return;

    const newTask: WeeklyRoutineTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: newTaskText.trim(),
      done: false
    };

    setRoutineData(prev => {
      const day = prev.days[dayKey];
      return {
        ...prev,
        days: {
          ...prev.days,
          [dayKey]: {
            ...day,
            tasks: [...day.tasks, newTask]
          }
        }
      };
    });

    setNewTaskText('');
    setNewTaskDay(null);
    onShowNotification(
      tr('Tarefa Adicionada', 'Task Added', 'Tarea Añadida'),
      `"${newTask.text}"`,
      'info'
    );
  };

  // Delete Task
  const handleDeleteTask = (dayKey: DayKey, taskId: string) => {
    setRoutineData(prev => {
      const day = prev.days[dayKey];
      return {
        ...prev,
        days: {
          ...prev.days,
          [dayKey]: {
            ...day,
            tasks: day.tasks.filter(t => t.id !== taskId)
          }
        }
      };
    });
  };

  // Save Inline Edit
  const handleSaveEdit = (dayKey: DayKey, taskId: string) => {
    if (!editingTaskText.trim()) return;

    setRoutineData(prev => {
      const day = prev.days[dayKey];
      return {
        ...prev,
        days: {
          ...prev.days,
          [dayKey]: {
            ...day,
            tasks: day.tasks.map(t => t.id === taskId ? { ...t, text: editingTaskText.trim() } : t)
          }
        }
      };
    });

    setEditingTaskId(null);
    setEditingTaskText('');
  };

  // Reset to default reference template in active language
  const handleResetToTemplate = () => {
    const defaultData = LocalDatabase.getDefaultWeeklyRoutine(language);
    setRoutineData(defaultData);
    onShowNotification(
      tr('Modelo Restaurado', 'Template Restored', 'Plantilla Restaurada'),
      tr('A folha semanal de metas e rotinas foi restaurada com o modelo padrão!', 'Weekly routine template has been reset to default!', '¡La plantilla de rutinas ha sido restaurada con el modelo predeterminado!'),
      'success'
    );
  };

  // Uncheck all tasks
  const handleUncheckAll = () => {
    setRoutineData(prev => {
      const newDays = { ...prev.days };
      DAY_KEYS.forEach(key => {
        newDays[key] = {
          ...newDays[key],
          tasks: newDays[key].tasks.map(t => ({ ...t, done: false }))
        };
      });
      return { ...prev, days: newDays };
    });

    onShowNotification(
      tr('Tarefas Desmarcadas', 'Tasks Reset', 'Tareas Desmarcadas'),
      tr('Todas as tarefas foram desmarcadas para iniciar uma nova semana.', 'All tasks uncompleted for a fresh week.', 'Todas las tareas fueron desmarcadas para iniciar una nueva semana.'),
      'info'
    );
  };

  // Printable Sheet Generator
  const handlePrintWeeklySheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onShowNotification(
        tr('Aviso', 'Notice', 'Aviso'),
        tr('Habilite popups no seu navegador para imprimir.', 'Please enable popups in your browser to print.', 'Habilite ventanas emergentes en su navegador para imprimir.'),
        'warning'
      );
      return;
    }

    const renderColumnHtml = (key: DayKey) => {
      const day = routineData.days[key];
      const stats = getDayStats(key);
      const dayName = getLocalizedDayName(key);

      const taskRows = day.tasks.map(t => `
        <div class="print-task-row">
          <span class="print-checkbox">${t.done ? '&#9745;' : '&#9633;'}</span>
          <span class="print-task-text ${t.done ? 'completed' : ''}">${t.text}</span>
        </div>
      `).join('');

      // Add blank rows if less than 10 to match grid sheet look
      const emptyRowsCount = Math.max(0, 10 - day.tasks.length);
      let emptyRowsHtml = '';
      for (let i = 0; i < emptyRowsCount; i++) {
        emptyRowsHtml += `
          <div class="print-task-row empty">
            <span class="print-checkbox">&#9633;</span>
            <span class="print-task-text"></span>
          </div>
        `;
      }

      return `
        <div class="print-day-col">
          <div class="print-day-header">${dayName}</div>
          <div class="print-date-sub">${weekOffset === 0 ? day.dateStr : currentDates[key]}</div>
          <div class="print-circle-stat">
            <div class="stat-ring">${stats.percentage}%</div>
          </div>
          <div class="print-tasks-header">${tr('TAREFAS DIÁRIAS', 'DAILY TASKS', 'TAREAS DIARIAS')}</div>
          <div class="print-tasks-body">
            ${taskRows}
            ${emptyRowsHtml}
          </div>
          <div class="print-col-footer">
            <span class="col-foot-cell">${stats.completed}</span>
            <span class="col-foot-cell">${Math.max(0, stats.total - stats.completed)}</span>
          </div>
        </div>
      `;
    };

    const columnsHtml = DAY_KEYS.map(k => renderColumnHtml(k)).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${tr('Controle de Metas & Rotinas Semanais', 'Weekly Goals & Routine Tracker', 'Control Semanal de Metas y Rutinas')}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 8mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            body {
              background: #fff;
              color: #111;
              padding: 10px;
            }
            .print-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid ${currentThemeColor.hex};
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .print-title {
              font-size: 16px;
              font-weight: 900;
              text-transform: uppercase;
              color: ${currentThemeColor.hex};
              letter-spacing: 0.5px;
            }
            .print-meta {
              font-size: 11px;
              color: #444;
              font-family: monospace;
            }
            .print-progress-summary {
              display: flex;
              gap: 15px;
              background: #f8fafc;
              border: 1.5px solid #cbd5e1;
              border-radius: 6px;
              padding: 8px 12px;
              margin-bottom: 12px;
              align-items: center;
              justify-content: space-between;
            }
            .summary-item {
              font-size: 11px;
              font-weight: bold;
            }
            .summary-val {
              color: ${currentThemeColor.hex};
              font-size: 13px;
            }
            .print-grid-container {
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              gap: 4px;
              width: 100%;
            }
            .print-day-col {
              border: 1.5px solid #1e293b;
              border-radius: 4px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              background: #fff;
            }
            .print-day-header {
              background: ${currentThemeColor.hex};
              color: #fff;
              font-size: 10px;
              font-weight: 900;
              text-align: center;
              padding: 4px 2px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .print-date-sub {
              background: #f1f5f9;
              color: #334155;
              font-size: 9px;
              font-weight: 700;
              font-family: monospace;
              text-align: center;
              padding: 2px;
              border-bottom: 1px solid #cbd5e1;
            }
            .print-circle-stat {
              padding: 6px 2px;
              display: flex;
              justify-content: center;
              align-items: center;
              background: #fff;
              border-bottom: 1px solid #cbd5e1;
            }
            .stat-ring {
              border: 2px solid ${currentThemeColor.hex};
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              font-weight: 900;
              color: ${currentThemeColor.hex};
            }
            .print-tasks-header {
              background: #1e293b;
              color: #fff;
              font-size: 8px;
              font-weight: 900;
              text-align: center;
              padding: 3px 1px;
              letter-spacing: 0.5px;
            }
            .print-tasks-body {
              flex: 1;
              display: flex;
              flex-direction: column;
              min-height: 280px;
            }
            .print-task-row {
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 3px 4px;
              border-bottom: 1px dotted #e2e8f0;
              font-size: 8.5px;
              line-height: 1.2;
              min-height: 22px;
            }
            .print-checkbox {
              font-size: 11px;
              color: #334155;
              flex-shrink: 0;
            }
            .print-task-text {
              flex: 1;
              word-break: break-word;
            }
            .print-task-text.completed {
              text-decoration: line-through;
              color: #64748b;
            }
            .print-task-row.empty {
              background: #fafafa;
            }
            .print-col-footer {
              display: grid;
              grid-template-columns: 1fr 1fr;
              background: #0f172a;
              color: #fff;
              font-size: 9px;
              font-weight: 900;
              font-family: monospace;
              text-align: center;
              border-top: 1.5px solid #1e293b;
            }
            .col-foot-cell {
              padding: 3px 1px;
            }
            .col-foot-cell:first-child {
              border-right: 1px solid #334155;
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div class="print-title">${tr('Controle de Metas & Rotinas Semanais', 'Weekly Goals & Routine Tracker', 'Control Semanal de Metas y Rutinas')}</div>
            <div class="print-meta">Life4Billion • ${currentDates.mon} - ${currentDates.sun}</div>
          </div>
          <div class="print-progress-summary">
            <div class="summary-item">${tr('Progresso Geral', 'Overall Progress', 'Progreso General')}: <span class="summary-val">${weeklyStats.percentage}%</span></div>
            <div class="summary-item">${tr('Tarefas Totais', 'Total Tasks', 'Tareas Totales')}: <span class="summary-val">${weeklyStats.totalTasks}</span></div>
            <div class="summary-item">${tr('Concluídas', 'Completed', 'Completadas')}: <span class="summary-val">${weeklyStats.completedTasks}</span></div>
            <div class="summary-item">${tr('Restantes', 'Remaining', 'Restantes')}: <span class="summary-val">${Math.max(0, weeklyStats.totalTasks - weeklyStats.completedTasks)}</span></div>
          </div>
          <div class="print-grid-container">
            ${columnsHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Find max task count for dynamic scale on bar chart
  const maxDayTasks = Math.max(10, ...DAY_KEYS.map(k => routineData.days[k].tasks.length));

  return (
    <div className="space-y-6" id="weekly-goals-routine-view">
      
      {/* Top Controls & Navigation Bar */}
      <div 
        className="bg-slate-900/80 border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-md transition-colors duration-300"
        style={{ borderColor: `${currentThemeColor.borderHex}55` }}
      >
        <div>
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: palette.primary }} />
            {tr('Controle de Metas & Rotinas Semanais', 'Weekly Goals & Routine Tracker', 'Control Semanal de Metas y Rutinas')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {tr('Acompanhamento diário com métricas de alta performance de Segunda a Domingo.', 'Daily tracking with high-performance completion metrics from Monday to Sunday.', 'Seguimiento diario con métricas de alto rendimiento de Lunes a Domingo.')}
          </p>
        </div>

        {/* Action Buttons & Week Navigation */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Week Navigation */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={handlePrevWeek}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title={tr('Semana anterior', 'Previous week', 'Semana anterior')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentWeek}
              className="px-2.5 py-0.5 font-semibold text-[11px] rounded transition"
              style={{
                backgroundColor: weekOffset === 0 ? `${currentThemeColor.hex}33` : 'transparent',
                color: weekOffset === 0 ? palette.primary : '#94a3b8'
              }}
            >
              {weekOffset === 0 
                ? tr('Esta Semana', 'This Week', 'Esta Semana') 
                : `${weekOffset > 0 ? '+' : ''}${weekOffset} ${tr('sem', 'wk', 'sem')}`}
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title={tr('Próxima semana', 'Next week', 'Próxima semana')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleResetToTemplate}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            title={tr('Restaurar modelo padrão no idioma ativo', 'Restore default template in active language', 'Restaurar plantilla predeterminada')}
          >
            <RotateCcw className="w-3.5 h-3.5" style={{ color: palette.primary }} />
            <span>{tr('Restaurar Modelo', 'Reset Template', 'Restaurar Plantilla')}</span>
          </button>

          <button
            onClick={handleUncheckAll}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            title={tr('Desmarcar todas as tarefas para iniciar nova semana', 'Uncheck all tasks for new week', 'Desmarcar todas las tareas')}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>{tr('Limpar Semana', 'Uncheck All', 'Limpiar Semana')}</span>
          </button>

          <button
            onClick={handlePrintWeeklySheet}
            className="px-3.5 py-1.5 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg"
            style={{ 
              backgroundColor: currentThemeColor.hex,
              boxShadow: `0 4px 14px ${currentThemeColor.hex}44`
            }}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{tr('Imprimir Folha', 'Print Sheet', 'Imprimir Hoja')}</span>
          </button>
        </div>
      </div>

      {/* TOP ANALYTICS DASHBOARD: WEEKLY PROGRESS (Exact Reference Match with Dynamic Theme & i18n) */}
      <div 
        className="bg-slate-900/90 border-2 rounded-2xl p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 shadow-xl transition-colors duration-300"
        style={{ borderColor: `${currentThemeColor.borderHex}66` }}
      >
        
        {/* Left: Weekly Progress Bar Chart (Columns: Mon - Sun) */}
        <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: currentThemeColor.hex }}
              />
              <span>{tr('PROGRESSO SEMANAL', 'WEEKLY PROGRESS', 'PROGRESO SEMANAL')}</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {tr('Escala 0 a 10+ Tarefas Concluídas', 'Scale 0 to 10+ Completed Tasks', 'Escala 0 a 10+ Tareas Completadas')}
            </span>
          </div>

          {/* Bar Chart Area */}
          <div className="relative h-44 flex items-end pt-6 pb-2 px-2 sm:px-6">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-x-2 sm:inset-x-6 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-slate-400 flex items-center justify-between text-[9px] text-slate-400 font-mono -mt-2"><span>10</span></div>
              <div className="border-b border-slate-400 flex items-center justify-between text-[9px] text-slate-400 font-mono -mt-2"><span>8</span></div>
              <div className="border-b border-slate-400 flex items-center justify-between text-[9px] text-slate-400 font-mono -mt-2"><span>6</span></div>
              <div className="border-b border-slate-400 flex items-center justify-between text-[9px] text-slate-400 font-mono -mt-2"><span>4</span></div>
              <div className="border-b border-slate-400 flex items-center justify-between text-[9px] text-slate-400 font-mono -mt-2"><span>2</span></div>
              <div className="border-b border-slate-400 flex items-center justify-between text-[9px] text-slate-400 font-mono -mt-2"><span>0</span></div>
            </div>

            {/* 7 Daily Bars */}
            <div className="w-full flex items-end justify-between gap-1 sm:gap-4 z-10">
              {DAY_KEYS.map(key => {
                const stats = getDayStats(key);
                const maxVal = Math.max(10, maxDayTasks);
                const heightPercent = Math.min(100, Math.max(4, (stats.completed / maxVal) * 100));
                const dayShort = getLocalizedDayShort(key);

                return (
                  <div key={key} className="flex-1 flex flex-col items-center group cursor-pointer">
                    {/* Top Value Label */}
                    <span 
                      className="text-[10px] font-bold opacity-80 group-hover:opacity-100 mb-1 transition"
                      style={{ color: stats.completed > 0 ? palette.primary : '#94a3b8' }}
                    >
                      {stats.completed}
                    </span>

                    {/* Bar Container */}
                    <div 
                      className="w-full max-w-[48px] h-28 bg-slate-900/60 rounded-t-md border flex items-end overflow-hidden p-0.5 transition"
                      style={{ borderColor: stats.completed > 0 ? `${currentThemeColor.borderHex}88` : '#334155' }}
                    >
                      <div 
                        className="w-full rounded-t transition-all duration-500 shadow-md"
                        style={{ 
                          height: `${heightPercent}%`,
                          background: stats.completed > 0 
                            ? `linear-gradient(to top, ${currentThemeColor.hex}, ${palette.primary})` 
                            : 'rgba(51, 65, 85, 0.4)',
                          borderTop: stats.completed > 0 ? `1.5px solid ${palette.highlightText || '#ffffff'}` : 'none'
                        }}
                      />
                    </div>

                    {/* Day Short Label */}
                    <span className="text-xs font-bold text-slate-300 mt-2 group-hover:text-white transition">
                      {dayShort}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Overall Weekly Progress Donut & Totals */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between items-center text-center">
          <div className="w-full border-b border-slate-800/80 pb-2 mb-2 flex items-center justify-center gap-2">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: currentThemeColor.hex }}
            />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              {tr('PROGRESSO SEMANAL', 'WEEKLY PROGRESS', 'PROGRESO SEMANAL')}
            </h3>
          </div>

          {/* Circular Donut Gauge */}
          <div className="relative my-auto flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="50"
                stroke="currentColor"
                strokeWidth="12"
                className="text-slate-800/80"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="50"
                stroke={currentThemeColor.hex}
                strokeWidth="12"
                className="transition-all duration-1000 ease-out"
                fill="transparent"
                strokeDasharray={314}
                strokeDashoffset={314 - (314 * weeklyStats.percentage) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white tracking-tight">
                {weeklyStats.percentage}%
              </span>
            </div>
          </div>

          {/* Bottom Metric Bars */}
          <div className="w-full space-y-1.5 pt-3 border-t border-slate-800/80">
            <div className="text-xs font-bold text-slate-300">
              {weeklyStats.totalTasks} {tr('Tarefas Totais', 'Total Tasks', 'Tareas Totales')}
            </div>
            <div 
              className="grid grid-cols-2 rounded-lg overflow-hidden text-xs border"
              style={{ borderColor: `${currentThemeColor.borderHex}88` }}
            >
              <div 
                className="py-1.5 px-2 font-bold text-white border-r"
                style={{ 
                  backgroundColor: currentThemeColor.hex,
                  borderColor: `${currentThemeColor.borderHex}aa`
                }}
              >
                {tr('Concluídas', 'Completions', 'Completadas')}
              </div>
              <div className="py-1.5 px-2 font-black text-emerald-400 bg-slate-900">
                {weeklyStats.completedTasks}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 7 DAILY SPREADSHEET COLUMNS (MONDAY TO SUNDAY) */}
      <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-7 gap-3 min-w-[1150px]">
          {DAY_KEYS.map((dayKey) => {
            const day = routineData.days[dayKey];
            const stats = getDayStats(dayKey);
            const dayName = getLocalizedDayName(dayKey);

            return (
              <div 
                key={dayKey}
                className="bg-slate-900/90 border-2 rounded-xl overflow-hidden flex flex-col justify-between shadow-lg transition-all duration-300 hover:shadow-2xl"
                style={{ borderColor: `${currentThemeColor.borderHex}66` }}
              >
                {/* 1. Day Header Banner (Themed Background, Exactly Matching Header and Sidebar) */}
                <div 
                  className="text-white text-center py-2.5 px-2 border-b transition-colors duration-300 shadow-sm"
                  style={{ 
                    backgroundColor: currentThemeColor.hex,
                    borderColor: currentThemeColor.borderHex
                  }}
                >
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {dayName}
                  </h4>
                </div>

                {/* 2. Date Subtitle */}
                <div className="text-center py-1 bg-slate-950 text-[11px] font-mono text-slate-400 border-b border-slate-850">
                  {weekOffset === 0 ? day.dateStr : currentDates[dayKey]}
                </div>

                {/* 3. Circular Progress Ring for Day */}
                <div className="py-3 px-2 flex items-center justify-center bg-slate-950/60 border-b border-slate-800">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-18 h-18 transform -rotate-90">
                      <circle
                        cx="36"
                        cy="36"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="7"
                        className="text-slate-800"
                        fill="transparent"
                      />
                      <circle
                        cx="36"
                        cy="36"
                        r="28"
                        stroke={stats.percentage === 100 ? '#10b981' : currentThemeColor.hex}
                        strokeWidth="7"
                        className="transition-all duration-700 ease-out"
                        fill="transparent"
                        strokeDasharray={176}
                        strokeDashoffset={176 - (176 * stats.percentage) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xs font-black text-white">
                        {stats.percentage}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Sub-banner: DAILY TASKS (Theme styled with high contrast) */}
                <div 
                  className="text-white text-center py-1.5 px-1 border-y transition-colors duration-300"
                  style={{ 
                    backgroundColor: `${currentThemeColor.hex}dd`,
                    borderColor: `${currentThemeColor.borderHex}aa`
                  }}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {tr('TAREFAS DIÁRIAS', 'DAILY TASKS', 'TAREAS DIARIAS')}
                  </span>
                </div>

                {/* 5. Task List Rows (Interactive Spreadsheet Rows) */}
                <div className="flex-1 divide-y divide-slate-800/80 bg-slate-950/40 min-h-[280px]">
                  {day.tasks.map((task) => {
                    const isEditing = editingTaskId?.dayKey === dayKey && editingTaskId?.taskId === task.id;

                    return (
                      <div 
                        key={task.id}
                        className={`group px-2 py-1.5 flex items-start gap-2 text-xs transition ${
                          task.done ? 'bg-slate-900/30 text-slate-500' : 'hover:bg-slate-800/40 text-slate-200'
                        }`}
                      >
                        {/* Checkbox button */}
                        <button
                          onClick={() => handleToggleTask(dayKey, task.id)}
                          className="mt-0.5 shrink-0 text-slate-400 hover:text-white transition"
                          title={task.done ? tr('Desmarcar', 'Uncheck', 'Desmarcar') : tr('Concluir', 'Complete', 'Completar')}
                        >
                          {task.done ? (
                            <div 
                              className="w-4 h-4 rounded flex items-center justify-center text-white shadow-sm"
                              style={{ 
                                backgroundColor: currentThemeColor.hex,
                                border: `1px solid ${currentThemeColor.borderHex}`
                              }}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div 
                              className="w-4 h-4 rounded border-2 bg-slate-900 transition hover:border-slate-300" 
                              style={{ borderColor: `${currentThemeColor.borderHex}88` }}
                            />
                          )}
                        </button>

                        {/* Task text or inline input */}
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-1">
                            <input
                              type="text"
                              value={editingTaskText}
                              onChange={(e) => setEditingTaskText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(dayKey, task.id);
                                if (e.key === 'Escape') setEditingTaskId(null);
                              }}
                              autoFocus
                              className="w-full bg-slate-900 border rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                              style={{ borderColor: currentThemeColor.hex }}
                            />
                            <button
                              onClick={() => handleSaveEdit(dayKey, task.id)}
                              className="text-emerald-400 hover:text-emerald-300 p-0.5"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingTaskId(null)}
                              className="text-slate-500 hover:text-rose-400 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span 
                            onClick={() => handleToggleTask(dayKey, task.id)}
                            className={`flex-1 break-words cursor-pointer select-none leading-snug ${
                              task.done ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            {task.text}
                          </span>
                        )}

                        {/* Actions on hover */}
                        {!isEditing && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition">
                            <button
                              onClick={() => {
                                setEditingTaskId({ dayKey, taskId: task.id });
                                setEditingTaskText(task.text);
                              }}
                              className="text-slate-500 hover:text-white p-0.5"
                              title={tr('Editar tarefa', 'Edit task', 'Editar')}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(dayKey, task.id)}
                              className="text-slate-500 hover:text-rose-400 p-0.5"
                              title={tr('Excluir tarefa', 'Delete task', 'Eliminar')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add task inline row */}
                  {newTaskDay === dayKey ? (
                    <div className="p-2 bg-slate-900 border-t border-slate-800 space-y-1.5">
                      <input
                        type="text"
                        placeholder={tr('Nova tarefa...', 'New task...', 'Nueva tarea...')}
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTask(dayKey);
                          if (e.key === 'Escape') {
                            setNewTaskDay(null);
                            setNewTaskText('');
                          }
                        }}
                        autoFocus
                        className="w-full bg-slate-950 border rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                        style={{ borderColor: currentThemeColor.hex }}
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setNewTaskDay(null);
                            setNewTaskText('');
                          }}
                          className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
                        >
                          {tr('Cancelar', 'Cancel', 'Cancelar')}
                        </button>
                        <button
                          onClick={() => handleAddTask(dayKey)}
                          className="px-2.5 py-0.5 text-white rounded text-[10px] font-bold transition"
                          style={{ backgroundColor: currentThemeColor.hex }}
                        >
                          {tr('Adicionar', 'Add', 'Añadir')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setNewTaskDay(dayKey);
                        setNewTaskText('');
                      }}
                      className="w-full py-1.5 px-2 text-[10px] text-slate-500 hover:text-white hover:bg-slate-900/50 flex items-center justify-center gap-1 transition border-t border-dashed border-slate-850"
                    >
                      <Plus className="w-3 h-3" style={{ color: palette.primary }} />
                      <span>{tr('+ Adicionar Tarefa', '+ Add Task', '+ Añadir Tarea')}</span>
                    </button>
                  )}
                </div>

                {/* 6. Bottom Dual-Cell Footer (Matching the image's "0 | 0" format with Theme Accents) */}
                <div 
                  className="grid grid-cols-2 text-white font-mono text-center text-xs py-1.5 font-bold border-t-2"
                  style={{ 
                    backgroundColor: `${currentThemeColor.hex}33`,
                    borderColor: `${currentThemeColor.borderHex}88`
                  }}
                >
                  <div 
                    className="border-r border-slate-700" 
                    title={tr('Tarefas Concluídas', 'Completed Tasks', 'Tareas Completadas')}
                  >
                    {stats.completed}
                  </div>
                  <div 
                    title={tr('Tarefas Restantes', 'Remaining Tasks', 'Tareas Restantes')}
                  >
                    {Math.max(0, stats.total - stats.completed)}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
