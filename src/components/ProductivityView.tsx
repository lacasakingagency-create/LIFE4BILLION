/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Clock, 
  BookOpen, 
  Calendar as CalendarIcon, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Check, 
  FileText, 
  Sparkles, 
  AlertTriangle,
  FolderOpen,
  ArrowRight,
  Bookmark,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLanguageTheme } from '../utils/i18n';

interface Task {
  id: string;
  title: string;
  project: string;
  priority: 'baixa' | 'media' | 'alta';
  status: 'todo' | 'doing' | 'done';
  dueDate: string;
  category: 'Trabalho' | 'Estudos' | 'Pessoal';
}

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'estudo' | 'trabalho' | 'compromisso';
}

interface ProductivityViewProps {
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

export default function ProductivityView({ onShowNotification }: ProductivityViewProps) {
  const { t, language } = useLanguageTheme();
  
  // Trilingual helper for dynamic fallback handling (Portuguese, English, Spanish)
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'pomodoro' | 'notes' | 'calendar'>('tasks');

  // --- TASKS STATE ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('omnisaas_tasks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 't1', title: 'Revisar conteúdo de Machine Learning', project: 'Estudos Mestrado', priority: 'alta', status: 'todo', dueDate: new Date().toISOString().split('T')[0], category: 'Estudos' },
      { id: 't2', title: 'Ajustar fluxo de caixa no ERP', project: 'Trabalho SaaS', priority: 'media', status: 'doing', dueDate: new Date().toISOString().split('T')[0], category: 'Trabalho' },
      { id: 't3', title: 'Preparar enxoval do bebê', project: 'Família', priority: 'baixa', status: 'done', dueDate: new Date().toISOString().split('T')[0], category: 'Pessoal' }
    ];
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProj, setNewTaskProj] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [newTaskCategory, setNewTaskCategory] = useState<'Trabalho' | 'Estudos' | 'Pessoal'>('Estudos');
  const [newTaskDate, setNewTaskDate] = useState('');

  useEffect(() => {
    localStorage.setItem('omnisaas_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      onShowNotification('Validação', 'Insira uma descrição válida para a tarefa.', 'warning');
      return;
    }
    const item: Task = {
      id: Math.random().toString(),
      title: newTaskTitle.trim(),
      project: newTaskProj.trim() || 'Geral',
      priority: newTaskPriority,
      status: 'todo',
      dueDate: newTaskDate || new Date().toISOString().split('T')[0],
      category: newTaskCategory
    };
    setTasks([...tasks, item]);
    setNewTaskTitle('');
    setNewTaskProj('');
    setNewTaskDate('');
    onShowNotification('Sucesso', 'Tarefa inserida com sucesso!', 'success');
  };

  const handleMoveTask = (id: string, nextStatus: 'todo' | 'doing' | 'done') => {
    const updated = tasks.map(tk => tk.id === id ? { ...tk, status: nextStatus } : tk);
    setTasks(updated);
    if (nextStatus === 'done') {
      onShowNotification('Tarefa Concluída! 🎯', 'Parabéns por completar mais uma atividade!', 'success');
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(tk => tk.id !== id));
    onShowNotification('Deletado', 'Tarefa removida.', 'info');
  };

  // --- POMODORO TIMER STATE ---
  const [timerMode, setTimerMode] = useState<'work' | 'short' | 'long'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomoCount, setPomoCount] = useState(0);

  const getPresetSeconds = (mode: 'work' | 'short' | 'long') => {
    if (mode === 'work') return 25 * 60;
    if (mode === 'short') return 5 * 60;
    return 15 * 60;
  };

  useEffect(() => {
    setTimeLeft(getPresetSeconds(timerMode));
    setIsRunning(false);
  }, [timerMode]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (timerMode === 'work') {
        setPomoCount(prev => prev + 1);
        onShowNotification('Pomodoro Concluído! ⏱️', 'Excelente foco! Hora de descansar um pouco.', 'success');
        setTimerMode('short');
      } else {
        onShowNotification('Descanso Concluído!', 'Pronto para focar novamente?', 'info');
        setTimerMode('work');
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, timerMode]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- NOTES STATE ---
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('omnisaas_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'n1', title: 'Resumo Técnica Feynman', category: 'Estudos', content: '1. Escolha um assunto.\n2. Explique para uma criança.\n3. Identifique falhas na sua explicação.\n4. Simplifique a linguagem.', updatedAt: new Date().toLocaleDateString() },
      { id: 'n2', title: 'Metas Trimestrais de Carreira', category: 'Trabalho', content: '- Finalizar MVP do SaaS OmniERP.\n- Praticar conversação em Inglês.\n- Dormir no mínimo 7 horas por noite.', updatedAt: new Date().toLocaleDateString() }
    ];
  });
  const [selectedNoteId, setSelectedNoteId] = useState<string>('n1');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCat, setNoteCat] = useState('Estudos');

  useEffect(() => {
    const active = notes.find(n => n.id === selectedNoteId);
    if (active) {
      setNoteTitle(active.title);
      setNoteContent(active.content);
      setNoteCat(active.category);
    }
  }, [selectedNoteId]);

  const handleSaveNote = () => {
    const updated = notes.map(n => n.id === selectedNoteId ? {
      ...n,
      title: noteTitle,
      content: noteContent,
      category: noteCat,
      updatedAt: new Date().toLocaleDateString()
    } : n);
    setNotes(updated);
    localStorage.setItem('omnisaas_notes', JSON.stringify(updated));
    onShowNotification('Nota Salva', 'Suas anotações foram gravadas no banco local.', 'success');
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Math.random().toString(),
      title: 'Nova Nota ' + (notes.length + 1),
      content: 'Digite seu conteúdo aqui...',
      category: 'Estudos',
      updatedAt: new Date().toLocaleDateString()
    };
    const updated = [...notes, newNote];
    setNotes(updated);
    setSelectedNoteId(newNote.id);
    localStorage.setItem('omnisaas_notes', JSON.stringify(updated));
    onShowNotification('Criada', 'Nova nota criada com sucesso.', 'success');
  };

  const handleDeleteNote = (id: string) => {
    if (notes.length <= 1) {
      onShowNotification('Aviso', 'Você precisa manter pelo menos uma nota de rascunho.', 'warning');
      return;
    }
    const filtered = notes.filter(n => n.id !== id);
    setNotes(filtered);
    setSelectedNoteId(filtered[0].id);
    localStorage.setItem('omnisaas_notes', JSON.stringify(filtered));
    onShowNotification('Removido', 'Nota excluída.', 'info');
  };

  const loadTemplate = (type: string) => {
    if (type === 'feynman') {
      setNoteTitle('Técnica Feynman: [Assunto]');
      setNoteContent('### 1. Conceito Central\n[Escreva de forma muito simples]\n\n### 2. Analogia Ilustrativa\n[Crie uma metáfora para explicar]\n\n### 3. Pontos de Dificuldade\n[Onde eu travei ao explicar?]');
    } else if (type === 'anki') {
      setNoteTitle('Flashcards Active Recall');
      setNoteContent('P: O que é Overfitting?\nR: Quando o modelo se ajusta demais aos ruídos do treino.\n\nP: Qual o objetivo do Pomodoro?\nR: Sustentar foco extremo alternado com descanso.');
    }
  };

  // --- CALENDAR STATE ---
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('omnisaas_events');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const today = new Date().toISOString().split('T')[0];
    return [
      { id: 'e1', title: 'Estudo de Algoritmos', date: today, time: '14:30', type: 'estudo' },
      { id: 'e2', title: 'Mentoria com Diretor de Produto', date: today, time: '17:00', type: 'trabalho' },
      { id: 'e3', title: 'Rotina Noturna / Higiene do Sono', date: today, time: '22:00', type: 'compromisso' }
    ];
  });

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventType, setNewEventType] = useState<'estudo' | 'trabalho' | 'compromisso'>('estudo');

  useEffect(() => {
    localStorage.setItem('omnisaas_events', JSON.stringify(events));
  }, [events]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) {
      onShowNotification('Validação', 'Título e Data do compromisso são necessários.', 'warning');
      return;
    }
    const ev: CalendarEvent = {
      id: Math.random().toString(),
      title: newEventTitle,
      date: newEventDate,
      time: newEventTime || '12:00',
      type: newEventType
    };
    setEvents([...events, ev]);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventTime('');
    onShowNotification('Sucesso', 'Compromisso agendado com sucesso!', 'success');
  };

  return (
    <div className="space-y-6" id="productivity-root">
      
      {/* View Header with Subtabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-emerald-400" />
            {tr('Produtividade, Estudos & Rotina', 'Productivity, Studies & Routine', 'Productividad, Estudios y Rutina')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {tr(
              'Seu centro completo de alta performance. Gerencie rotinas de sono, metas de aprendizado, tarefas semanais e estudos.',
              'Your complete high-performance hub. Manage sleep routines, learning goals, weekly tasks, and studies.',
              'Su centro completo de alto rendimiento. Gestione rutinas de sueño, metas de aprendizaje, tareas semanales y estudios.'
            )}
          </p>
        </div>

        {/* Subtabs controls */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl" id="prod-subtabs">
          <button
            onClick={() => setActiveSubTab('tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'tasks' ? 'bg-indigo-650 text-white' : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{tr('Tarefas', 'Tasks', 'Tareas')}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('pomodoro')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'pomodoro' ? 'bg-indigo-650 text-white' : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{tr('Pomodoro', 'Pomodoro', 'Pomodoro')}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('notes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'notes' ? 'bg-indigo-650 text-white' : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{tr('Notas & Wiki', 'Notes & Wiki', 'Notas y Wiki')}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'calendar' ? 'bg-indigo-650 text-white' : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{tr('Agenda', 'Calendar', 'Agenda')}</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: KANBAN / LISTA DE TAREFAS --- */}
      {activeSubTab === 'tasks' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" id="tasks-module">
          {/* Form Side */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl h-fit">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center">
              <Plus className="w-4 h-4 mr-1 text-emerald-400" />
              {t('createNewActivity', 'Criar Nova Atividade')}
            </h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('title', 'Título')}</label>
                <input
                  type="text"
                  placeholder={t('taskTitlePlaceholder', 'Ex: Resolver capítulo 4...')}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('projectSubject', 'Projeto / Assunto')}</label>
                <input
                  type="text"
                  placeholder={t('taskProjPlaceholder', 'Ex: Estudos IA, Pessoal')}
                  value={newTaskProj}
                  onChange={(e) => setNewTaskProj(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('category', 'Categoria')}</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Estudos">{t('studies', 'Estudos')}</option>
                    <option value="Trabalho">{t('work', 'Trabalho')}</option>
                    <option value="Pessoal">{t('personal', 'Pessoal')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('priority', 'Prioridade')}</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="baixa">{t('low', 'Baixa')}</option>
                    <option value="media">{t('medium', 'Média')}</option>
                    <option value="alta">{t('high', 'Alta')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('dueDate', 'Data de Entrega')}</label>
                <input
                  type="date"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer"
              >
                Adicionar Atividade
              </button>
            </form>
          </div>

          {/* Kanban Lanes */}
          <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4" id="kanban-lanes">
            
            {/* TODO LANE */}
            <div className="bg-slate-900/10 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                  A Fazer
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                  {tasks.filter(t => t.status === 'todo').length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.status === 'todo').map(task => (
                  <div key={task.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        task.priority === 'alta' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {task.priority}
                      </span>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-slate-600 hover:text-rose-400 p-0.5">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-slate-200">{task.title}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                      <span>{task.project}</span>
                      <span>{task.dueDate}</span>
                    </div>
                    <button
                      onClick={() => handleMoveTask(task.id, 'doing')}
                      className="w-full bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 text-[10px] text-indigo-400 font-bold py-1 rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>{t('startFocus', 'Iniciar foco')}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'todo').length === 0 && (
                  <p className="text-[11px] text-slate-500 text-center py-8">{t('noTasksInThisStage', 'Nenhuma tarefa nesta etapa.')}</p>
                )}
              </div>
            </div>

            {/* DOING LANE */}
            <div className="bg-slate-900/10 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                  {t('inProgress', 'Em Progresso')}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                  {tasks.filter(t => t.status === 'doing').length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.status === 'doing').map(task => (
                  <div key={task.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        task.priority === 'alta' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {task.priority}
                      </span>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-slate-600 hover:text-rose-400 p-0.5">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-slate-200">{task.title}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                      <span>{task.project}</span>
                      <span>{task.dueDate}</span>
                    </div>
                    <button
                      onClick={() => handleMoveTask(task.id, 'done')}
                      className="w-full bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:text-white text-[10px] text-emerald-400 font-bold py-1 rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('completeTask', 'Concluir Tarefa')}</span>
                    </button>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'doing').length === 0 && (
                  <p className="text-[11px] text-slate-500 text-center py-8">{t('noActiveTasksNow', 'Nenhuma tarefa ativa agora.')}</p>
                )}
              </div>
            </div>

            {/* DONE LANE */}
            <div className="bg-slate-900/10 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                  {t('completed', 'Concluído')}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                  {tasks.filter(t => t.status === 'done').length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.status === 'done').map(task => (
                  <div key={task.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2 opacity-60">
                    <p className="text-xs font-bold text-slate-400 line-through">{task.title}</p>
                    <div className="flex justify-between items-center pt-1 text-[9px] text-slate-600 font-mono">
                      <span>{task.project}</span>
                      <span className="text-emerald-500 font-bold">{t('doneUpper', 'FEITO')}</span>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'done').length === 0 && (
                  <p className="text-[11px] text-slate-500 text-center py-8">{t('completeTasksToArchive', 'Complete tarefas para arquivar aqui.')}</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 2: POMODORO TIMER --- */}
      {activeSubTab === 'pomodoro' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="pomodoro-module">
          <div className="md:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-8 min-h-[400px]">
            {/* Mode selection buttons */}
            <div className="flex space-x-3 bg-slate-950 p-1.5 rounded-xl border border-slate-850">
              <button
                onClick={() => setTimerMode('work')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timerMode === 'work' ? 'bg-indigo-650 text-white' : 'text-slate-450 hover:text-slate-300'
                }`}
              >
                {t('focus25m', 'Foco (25m)')}
              </button>
              <button
                onClick={() => setTimerMode('short')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timerMode === 'short' ? 'bg-emerald-650 text-white' : 'text-slate-450 hover:text-slate-300'
                }`}
              >
                {t('shortBreak5m', 'Descanso Curto (5m)')}
              </button>
              <button
                onClick={() => setTimerMode('long')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timerMode === 'long' ? 'bg-indigo-650/40 text-slate-250 border border-indigo-500/20' : 'text-slate-450 hover:text-slate-300'
                }`}
              >
                {t('longBreak15m', 'Descanso Longo (15m)')}
              </button>
            </div>

            {/* Big Countdown Timer Display */}
            <div className="relative flex items-center justify-center w-64 h-64 rounded-full border-4 border-slate-850 bg-slate-950 shadow-2xl shadow-indigo-950/20">
              <div className="text-center">
                <span className="text-4xl md:text-5xl font-black text-white font-mono tracking-wider block">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1 block">
                  {timerMode === 'work' ? t('extremeFocusTime', 'Tempo de Foco Extremo') : t('recoveryTime', 'Tempo de Recuperação')}
                </span>
              </div>
            </div>

            {/* Timer Actions */}
            <div className="flex space-x-4">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`w-36 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer ${
                  isRunning ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>{t('pause', 'Pausar')}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>{t('startFocus', 'Iniciar Foco')}</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setTimeLeft(getPresetSeconds(timerMode))}
                className="bg-slate-850 hover:bg-slate-750 text-slate-300 w-12 h-10 rounded-xl flex items-center justify-center transition border border-slate-800 cursor-pointer"
                title={t('resetTimer', 'Reiniciar Timer')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pomodoro Stats & Study Goals side */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-emerald-400" />
                {t('cyclesCompletedToday', 'Ciclos Concluídos Hoje')}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">{t('keepFrequencyFocus', 'Mantenha a frequência para estender seu foco diário.')}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 text-center py-6">
              <span className="text-4xl font-black text-emerald-400 font-mono">{pomoCount}</span>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-2">{t('finishedPomodoros', 'Pomodoros finalizados')}</p>
            </div>

            <div className="space-y-3.5">
              <h4 className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{t('techniqueBenefits', 'Benefícios da Técnica')}</h4>
              <div className="space-y-2 text-xs text-slate-400">
                <p className="flex items-start"><span className="text-emerald-500 mr-2">✔</span> {t('benefitProcrastination', 'Reduz a procrastinação crônica')}</p>
                <p className="flex items-start"><span className="text-emerald-500 mr-2">✔</span> {t('benefitStress', 'Evita o estresse acumulado nas costas e pescoço')}</p>
                <p className="flex items-start"><span className="text-emerald-500 mr-2">✔</span> {t('benefitFocus', 'Preserva o foco cognitivo por mais tempo')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: NOTES & STUDY WIKI --- */}
      {activeSubTab === 'notes' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in" id="notes-module">
          {/* Notes list left rail */}
          <div className="md:col-span-1 bg-slate-900/30 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{t('wikiDocuments', 'Documentos Wiki')}</span>
              <button
                onClick={handleCreateNote}
                className="bg-slate-800 hover:bg-slate-700 text-white p-1.5 rounded-lg border border-slate-700/60 cursor-pointer"
                title="Criar Nota"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[350px]">
              {notes.map(note => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    note.id === selectedNoteId
                      ? 'bg-indigo-650/10 border-indigo-500/40 text-white'
                      : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/40 text-slate-400'
                  }`}
                >
                  <p className="text-xs font-bold truncate">{note.title || 'Sem título'}</p>
                  <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1.5">
                    <span>{note.category}</span>
                    <span>{note.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Template shortcuts */}
            <div className="pt-4 border-t border-slate-850 space-y-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{t('insertStudyTemplates', 'Inserir Modelos de Estudo')}</span>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => loadTemplate('feynman')} className="bg-slate-950 hover:bg-slate-900 text-slate-350 text-[10px] py-1 border border-slate-850 rounded-lg cursor-pointer font-bold">Feynman</button>
                <button onClick={() => loadTemplate('anki')} className="bg-slate-950 hover:bg-slate-900 text-slate-350 text-[10px] py-1 border border-slate-850 rounded-lg cursor-pointer font-bold">Anki Active</button>
              </div>
            </div>
          </div>

          {/* Notes content / editor body */}
          <div className="md:col-span-3 bg-slate-900/30 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="bg-transparent text-white font-black text-base w-full focus:outline-none border-b border-transparent focus:border-slate-850 pb-1"
                  placeholder={t('docTitlePlaceholder', 'Título do Documento')}
                />
              </div>
              <div className="flex space-x-2 items-center">
                <select
                  value={noteCat}
                  onChange={(e) => setNoteCat(e.target.value)}
                  className="bg-slate-950 text-xs border border-slate-850 text-slate-350 px-2.5 py-1 rounded-xl focus:outline-none cursor-pointer font-bold"
                >
                  <option value="Estudos">{t('studies', 'Estudos')}</option>
                  <option value="Trabalho">{t('work', 'Trabalho')}</option>
                  <option value="Pessoal">{t('personal', 'Pessoal')}</option>
                  <option value="Rotina">{t('routineSleep', 'Rotina / Sono')}</option>
                </select>
                <button
                  onClick={handleSaveNote}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  {t('saveNote', 'Salvar Nota')}
                </button>
                <button
                  onClick={() => handleDeleteNote(selectedNoteId)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-xl hover:bg-slate-950"
                  title={t('deleteNoteTooltip', 'Apagar Nota')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-650 min-h-[250px] font-sans focus:outline-none focus:border-indigo-500 leading-relaxed"
              placeholder={t('startDraftingPlaceholder', 'Comece a redigir seu conteúdo...')}
            />
          </div>
        </div>
      )}

      {/* --- TAB 4: CALENDAR / AGENDA --- */}
      {activeSubTab === 'calendar' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in" id="calendar-module">
          
          {/* New Event Form */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 h-fit space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center">
                <Bookmark className="w-4 h-4 mr-1.5 text-indigo-400" />
                {t('scheduleInAgenda', 'Agendar na Folha de Agenda')}
              </h3>
              <p className="text-[11px] text-slate-550">{t('reserveAppointmentsDesc', 'Reserve compromissos e planeje dias de exames, aulas ou tarefas.')}</p>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('appointmentTitle', 'Título do Compromisso')}</label>
                <input
                  type="text"
                  placeholder={t('appointmentPlaceholder', 'Ex: Exame pré-natal, Revisão Prova')}
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('dateLabel', 'Data')}</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('timeLabel', 'Horário')}</label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('eventTypeLabel', 'Tipo de Evento')}</label>
                <select
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-350 focus:outline-none cursor-pointer"
                >
                  <option value="estudo">📚 {t('studiesLearning', 'Estudos & Aprendizado')}</option>
                  <option value="trabalho">💼 {t('workMeeting', 'Reunião de Trabalho')}</option>
                  <option value="compromisso">🩺 {t('medicalAppointment', 'Consulta / Médico / Sono')}</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer"
              >
                {t('saveInAgenda', 'Salvar na Agenda')}
              </button>
            </form>
          </div>

          {/* Mini Calendar + Agenda events view */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Calendar Layout */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider">{t('july2026', 'Julho de 2026')}</span>
                <div className="flex space-x-1.5">
                  <button className="p-1 rounded bg-slate-950 text-slate-500 hover:text-white cursor-pointer"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <button className="p-1 rounded bg-slate-950 text-slate-500 hover:text-white cursor-pointer"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Grid 7 cols */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                <div>{t('sunShort', 'Dom')}</div><div>{t('monShort', 'Seg')}</div><div>{t('tueShort', 'Ter')}</div><div>{t('wedShort', 'Qua')}</div><div>{t('thuShort', 'Qui')}</div><div>{t('friShort', 'Sex')}</div><div>{t('satShort', 'Sáb')}</div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {/* Pad days of previous month */}
                <div className="p-2 text-center text-slate-700 text-xs">28</div>
                <div className="p-2 text-center text-slate-700 text-xs">29</div>
                <div className="p-2 text-center text-slate-700 text-xs">30</div>
                {/* July days */}
                {Array.from({ length: 31 }, (_, i) => {
                  const dayNum = i + 1;
                  const isToday = dayNum === 10; // July 10, 2026 matches system logs
                  return (
                    <div
                      key={dayNum}
                      className={`p-2 text-center rounded-lg text-xs cursor-pointer transition ${
                        isToday
                          ? 'bg-indigo-650 text-white font-black ring-1 ring-indigo-400'
                          : 'bg-slate-950/40 border border-slate-850/80 hover:border-slate-700 text-slate-350'
                      }`}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* List of upcoming events */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">{t('upcomingAppointments', 'Próximos Compromissos')}</h3>
              <div className="space-y-3">
                {events.map(ev => (
                  <div key={ev.id} className="flex justify-between items-center bg-slate-950 border border-slate-850/85 p-3.5 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        ev.type === 'estudo' ? 'bg-indigo-500' : ev.type === 'trabalho' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} />
                      <div>
                        <p className="text-xs font-bold text-white">{ev.title}</p>
                        <span className="text-[10px] text-slate-550 block mt-0.5">{ev.time} | {ev.date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEvents(events.filter(e => e.id !== ev.id))}
                      className="text-slate-600 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-xs text-slate-550 text-center py-6">{t('noAppointmentsScheduled', 'Nenhum compromisso agendado.')}</p>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
