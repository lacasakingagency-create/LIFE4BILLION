/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLanguageTheme } from '../utils/i18n';
import { LocalDatabase } from '../utils/db';
import {
  Calendar, BookOpen, Flame, Target, Timer, ClipboardList, Sun, Moon,
  MessageSquare, Brain, Briefcase, GraduationCap, Coffee, Dumbbell,
  Smile, Heart, DollarSign, Sparkles, TrendingUp, FileText,
  Plus, Trash2, Check, ShieldAlert, Printer, RefreshCw, Sparkle
} from 'lucide-react';

interface DailyPlannerViewProps {
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

// Compact structure representing all 20 daily category states in one object
interface DailyRecord {
  date: string;
  // 1. Daily Planner
  dpPriority: string;
  dpSchedule: string[]; // 06:00 to 22:00 (17 hours)
  dpTopPriorities: string[];
  dpTodoList: { id: string; text: string; done: boolean }[];
  dpMeetings: string;
  dpNotes: string;
  dpReflection: string;
  // 2. Daily Journal
  djFeeling: string;
  djGratitude: string[];
  djWhatHappened: string;
  djWhatILearned: string;
  djImprovement: string;
  djMood: number; // 1-5
  // 3. Daily Habit Tracker
  dhWater: boolean;
  dhExercise: boolean;
  dhReading: boolean;
  dhMeditation: boolean;
  dhEarlySleep: boolean;
  dhHealthyFood: boolean;
  dhStudy: boolean;
  dhDeepWork: boolean;
  // 4. Daily Goals
  dgMainGoal: string;
  dgSecondaryGoals: string[];
  dgNextSteps: string;
  dgExpectedResult: string;
  // 5. Daily Time Blocking
  dtbBlocks: { id: string; time: string; activity: string; duration: string; status: 'Pendente' | 'Em Progresso' | 'Concluído' }[];
  // 6. Daily To-Do List
  dtdItems: { id: string; task: string; category: string; priority: 'Low' | 'Medium' | 'High'; deadline: string; done: boolean }[];
  // 7. Morning Routine
  mrWakeUp: boolean;
  mrWakeTime: string;
  mrMakeBed: boolean;
  mrHygiene: boolean;
  mrExercise: boolean;
  mrBreakfast: boolean;
  mrPlanDay: boolean;
  mrReading: boolean;
  mrMeditation: boolean;
  // 8. Evening Routine
  erReviewTasks: boolean;
  erOrganizeEnv: boolean;
  erPrepClothes: boolean;
  erPlanTomorrow: boolean;
  erReading: boolean;
  erSleep: boolean;
  // 9. Meeting Notes
  mnSubject: string;
  mnAttendees: string;
  mnPointsDiscussed: string;
  mnDecisions: string;
  mnNextActions: string;
  // 10. Brain Dump
  bdIdeas: string;
  bdThoughts: string;
  bdProblems: string;
  bdSolutions: string;
  bdReminders: string;
  // 11. Work Log
  wlProject: string;
  wlTask: string;
  wlTimeSpent: number;
  wlResult: string;
  wlNextStep: string;
  // 12. Study Planner
  spSubject: string;
  spContent: string;
  spStudyTime: number; // minutes
  spExercises: string;
  spDifficulties: string;
  // 13. Meal Planner
  mpBreakfast: string;
  mpLunch: string;
  mpDinner: string;
  mpSnacks: string;
  mpWaterIntake: number; // ml
  // 14. Fitness Log
  flExercise: string;
  flSets: number;
  flReps: number;
  flWeight: number;
  flCardioTime: number;
  flCalories: number;
  // 15. Mood Tracker
  mtMood: string;
  mtEnergy: number; // 1-10
  mtStress: number; // 1-10
  mtSleepQuality: number; // 1-10
  mtObservations: string;
  // 16. Self-Care Checklist
  scWater: boolean;
  scExercise: boolean;
  scReading: boolean;
  scRest: boolean;
  scFamily: boolean;
  scNoSocialMedia: boolean;
  // 17. Expenses Today
  etExpenses: { id: string; description: string; category: string; value: number; type: 'receita' | 'despesa' }[];
  // 18. Daily Reflection
  drWhatIDidWell: string;
  drWhatILearned: string;
  drWhatToImproveTomorrow: string;
  drBiggestWin: string;
  // 20. Quick Notes
  qnQuickIdeas: string;
  qnPhones: string;
  qnLinks: string;
  qnShopping: string;
  qnReminders: string;
}

const HOURS = Array.from({ length: 17 }, (_, i) => {
  const h = i + 6;
  return `${h.toString().padStart(2, '0')}:00`;
});

const getEmptyRecord = (date: string): DailyRecord => ({
  date,
  dpPriority: '',
  dpSchedule: Array(17).fill(''),
  dpTopPriorities: ['', '', ''],
  dpTodoList: [],
  dpMeetings: '',
  dpNotes: '',
  dpReflection: '',
  djFeeling: '',
  djGratitude: ['', '', ''],
  djWhatHappened: '',
  djWhatILearned: '',
  djImprovement: '',
  djMood: 3,
  dhWater: false,
  dhExercise: false,
  dhReading: false,
  dhMeditation: false,
  dhEarlySleep: false,
  dhHealthyFood: false,
  dhStudy: false,
  dhDeepWork: false,
  dgMainGoal: '',
  dgSecondaryGoals: ['', '', ''],
  dgNextSteps: '',
  dgExpectedResult: '',
  dtbBlocks: [],
  dtdItems: [],
  mrWakeUp: false,
  mrWakeTime: '06:30',
  mrMakeBed: false,
  mrHygiene: false,
  mrExercise: false,
  mrBreakfast: false,
  mrPlanDay: false,
  mrReading: false,
  mrMeditation: false,
  erReviewTasks: false,
  erOrganizeEnv: false,
  erPrepClothes: false,
  erPlanTomorrow: false,
  erReading: false,
  erSleep: false,
  mnSubject: '',
  mnAttendees: '',
  mnPointsDiscussed: '',
  mnDecisions: '',
  mnNextActions: '',
  bdIdeas: '',
  bdThoughts: '',
  bdProblems: '',
  bdSolutions: '',
  bdReminders: '',
  wlProject: '',
  wlTask: '',
  wlTimeSpent: 0,
  wlResult: '',
  wlNextStep: '',
  spSubject: '',
  spContent: '',
  spStudyTime: 0,
  spExercises: '',
  spDifficulties: '',
  mpBreakfast: '',
  mpLunch: '',
  mpDinner: '',
  mpSnacks: '',
  mpWaterIntake: 0,
  flExercise: '',
  flSets: 0,
  flReps: 0,
  flWeight: 0,
  flCardioTime: 0,
  flCalories: 0,
  mtMood: 'Neutro',
  mtEnergy: 5,
  mtStress: 5,
  mtSleepQuality: 5,
  mtObservations: '',
  scWater: false,
  scExercise: false,
  scReading: false,
  scRest: false,
  scFamily: false,
  scNoSocialMedia: false,
  etExpenses: [],
  drWhatIDidWell: '',
  drWhatILearned: '',
  drWhatToImproveTomorrow: '',
  drBiggestWin: '',
  qnQuickIdeas: '',
  qnPhones: '',
  qnLinks: '',
  qnShopping: '',
  qnReminders: ''
});

export default function DailyPlannerView({ onShowNotification }: DailyPlannerViewProps) {
  const { t, language } = useLanguageTheme();

  // Trilingual helper for dynamic fallback handling (Portuguese, English, Spanish)
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [record, setRecord] = useState<DailyRecord>(() => getEmptyRecord(selectedDate));

  // Quick inputs
  const [newTodo, setNewTodo] = useState('');
  const [newBlock, setNewBlock] = useState({ time: '09:00', activity: '', duration: '1h', status: 'Pendente' as any });
  const [newDtd, setNewDtd] = useState({ task: '', category: 'Geral', priority: 'Medium' as any, deadline: '' });
  const [newExpense, setNewExpense] = useState({ description: '', category: 'Alimentação', value: '', type: 'despesa' as any });

  // Load and Save to localStorage scoped to current user
  useEffect(() => {
    const key = LocalDatabase.getUserKey(`daily_${selectedDate}`);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with empty record to ensure no missing properties
        setRecord({ ...getEmptyRecord(selectedDate), ...parsed, date: selectedDate });
      } catch (e) {
        setRecord(getEmptyRecord(selectedDate));
      }
    } else {
      setRecord(getEmptyRecord(selectedDate));
    }
  }, [selectedDate]);

  useEffect(() => {
    const handleUserSwitch = () => {
      const key = LocalDatabase.getUserKey(`daily_${selectedDate}`);
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRecord({ ...getEmptyRecord(selectedDate), ...parsed, date: selectedDate });
        } catch (e) {
          setRecord(getEmptyRecord(selectedDate));
        }
      } else {
        setRecord(getEmptyRecord(selectedDate));
      }
    };
    window.addEventListener('life4billion_user_switched', handleUserSwitch);
    return () => window.removeEventListener('life4billion_user_switched', handleUserSwitch);
  }, [selectedDate]);

  const updateRecord = (updates: Partial<DailyRecord>) => {
    setRecord(prev => {
      const next = { ...prev, ...updates };
      const key = LocalDatabase.getUserKey(`daily_${selectedDate}`);
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  const handleClearDay = () => {
    if (confirm('Deseja realmente limpar todos os dados deste dia?')) {
      const empty = getEmptyRecord(selectedDate);
      setRecord(empty);
      const key = LocalDatabase.getUserKey(`daily_${selectedDate}`);
      localStorage.removeItem(key);
      onShowNotification('Sucesso', 'Dados do dia redefinidos!', 'info');
    }
  };

  const handlePrefillSample = () => {
    const sample: DailyRecord = {
      date: selectedDate,
      dpPriority: 'Apresentação do MVP para os investidores primários',
      dpSchedule: HOURS.map((h, idx) => {
        if (h === '08:00') return 'Treino cardio de alta intensidade';
        if (h === '09:00') return 'Café estratégico e alinhamento de equipe';
        if (h === '10:00') return 'Revisar slides do deck do investidor';
        if (h === '14:00') return 'Reunião de Demonstração Técnica';
        if (h === '16:00') return 'Refatorar código das rotas da API';
        if (h === '20:00') return 'Leitura e reflexões gerais';
        return '';
      }),
      dpTopPriorities: [
        'Ajustar deck de slides e demonstração funcional',
        'Revisar métricas de MRR e custo de infraestrutura',
        'Consolidar pipeline de testes unitários'
      ],
      dpTodoList: [
        { id: '1', text: 'Confirmar horário da reunião de Demo', done: true },
        { id: '2', text: 'Enviar relatório financeiro prévio', done: false },
        { id: '3', text: 'Organizar pasta do Drive de investidores', done: true }
      ],
      dpMeetings: 'Investidores às 14:00, Daily Sync às 09:15',
      dpNotes: 'Ligar para o consultor financeiro caso haja dúvidas tributárias sobre a captação.',
      dpReflection: 'Excelente engajamento da equipe na preparação final do produto.',
      
      djFeeling: 'Focado e Confiante',
      djGratitude: [
        'Pelo progresso técnico consistente da plataforma',
        'Pelo suporte e mentoria do nosso principal advisor',
        'Por gozar de excelente saúde física e clareza mental'
      ],
      djWhatHappened: 'Apresentamos o MVP técnico com pleno sucesso na rodada experimental. O servidor respondeu abaixo de 40ms.',
      djWhatILearned: 'A simplicidade na interface do produto converte mais do que dezenas de filtros não solicitados.',
      djImprovement: 'Devo delegar um pouco mais a triagem inicial de bugs para focar na entrega de produto de alto impacto.',
      djMood: 5,

      dhWater: true,
      dhExercise: true,
      dhReading: true,
      dhMeditation: true,
      dhEarlySleep: true,
      dhHealthyFood: true,
      dhStudy: true,
      dhDeepWork: true,

      dgMainGoal: 'Conquistar 10 novas assinaturas corporativas ativas',
      dgSecondaryGoals: [
        'Otimizar tempo de resposta do servidor em 15%',
        'Melhorar onboarding do usuário final',
        'Publicar novo artigo de marketing técnico'
      ],
      dgNextSteps: 'Enviar emails de follow-up personalizados com os links da sandbox corporativa.',
      dgExpectedResult: 'Aumento imediato de R$ 5.000 em ARR recorrente.',

      dtbBlocks: [
        { id: '1', time: '06:00-08:00', activity: 'Morning Routine + Leitura', duration: '2h', status: 'Concluído' },
        { id: '2', time: '09:00-12:00', activity: 'Foco Profundo - Desenvolvimento', duration: '3h', status: 'Concluído' },
        { id: '3', time: '14:00-15:30', activity: 'Apresentação MVP', duration: '1.5h', status: 'Concluído' },
        { id: '4', time: '16:00-18:00', activity: 'Follow-ups e Suporte Técnico', duration: '2h', status: 'Concluído' }
      ],
      dtdItems: [
        { id: '1', task: 'Desenvolver endpoints do Daily Planner', category: 'Dev', priority: 'High', deadline: '12:00', done: true },
        { id: '2', task: 'Atualizar documentação de API', category: 'Documentação', priority: 'Medium', deadline: '15:00', done: true },
        { id: '3', task: 'Revisar faturas pendentes do Gateway', category: 'Financeiro', priority: 'Low', deadline: '18:00', done: false }
      ],

      mrWakeUp: true,
      mrWakeTime: '05:45',
      mrMakeBed: true,
      mrHygiene: true,
      mrExercise: true,
      mrBreakfast: true,
      mrPlanDay: true,
      mrReading: true,
      mrMeditation: true,

      erReviewTasks: true,
      erOrganizeEnv: true,
      erPrepClothes: true,
      erPlanTomorrow: true,
      erReading: true,
      erSleep: true,

      mnSubject: 'Kickoff Planejamento Q3',
      mnAttendees: 'Lucas, Henrique, Amanda e Sarah',
      mnPointsDiscussed: 'Revisão das metas de crescimento orgânico, prioridades de engenharia para o motor de buscas e automação do faturamento.',
      mnDecisions: 'Focar 100% em infraestrutura resiliente de pagamentos nas próximas 3 semanas.',
      mnNextActions: 'Amanda monta o cronograma Gantt refinado até quinta-feira à noite.',

      bdIdeas: 'Criar uma extensão de navegador de notas automáticas de reuniões conectada à IA do workspace.',
      bdThoughts: 'Às vezes passamos tempo demais planejando ferramentas e tempo de menos conversando com o cliente real.',
      bdProblems: 'Falta de clareza nos logs de depuração do gateway de pagamentos.',
      bdSolutions: 'Implementar interceptador customizado de requisições no servidor Express.',
      bdReminders: 'Renovar assinatura do servidor web de testes no dia 15.',

      wlProject: 'OmniSAAS Platform v2',
      wlTask: 'Otimização de consultas do banco de dados e dashboard analítico real-time',
      wlTimeSpent: 4.5,
      wlResult: 'Redução de 45% nas leituras de coleções redundantes do Firestore.',
      wlNextStep: 'Integrar testes integrados de carga nas rotas.',

      spSubject: 'Arquitetura de Sistemas Distribuídos',
      spContent: 'Algoritmos de Consenso Paxos vs Raft e replicação tolerante a falhas por partições',
      spStudyTime: 90,
      spExercises: 'Resolver os 4 desafios de replicação de log linearizável.',
      spDifficulties: 'Entender a eleição de líder em redes com latência assimétrica extrema.',

      mpBreakfast: 'Ovos mexidos com abacate, torrada integral e café preto orgânico',
      mpLunch: 'Filé de salmão grelhado, arroz integral selvagem e legumes ao vapor',
      mpDinner: 'Frango grelhado, salada de folhas escuras com azeite extra virgem',
      mpSnacks: 'Mix de castanhas de caju e nozes com iogurte grego sem açúcar',
      mpWaterIntake: 2500,

      flExercise: 'Agachamento livre, Supino inclinado e Barra fixa',
      flSets: 4,
      flReps: 12,
      flWeight: 80,
      flCardioTime: 30,
      flCalories: 580,

      mtMood: 'Satisfeito & Focado',
      mtEnergy: 9,
      mtStress: 3,
      mtSleepQuality: 8,
      mtObservations: 'Dormi maravilhosamente bem após fazer alongamento muscular e desligar todas as telas às 22h.',

      scWater: true,
      scExercise: true,
      scReading: true,
      scRest: true,
      scFamily: true,
      scNoSocialMedia: true,

      etExpenses: [
        { id: '1', description: 'Café da manhã de negócios', category: 'Alimentação', value: 45.90, type: 'despesa' },
        { id: '2', description: 'Assinatura anual de servidor', category: 'Software', value: 189.00, type: 'despesa' },
        { id: '3', description: 'Consultoria técnica terceirizada', category: 'Receita', value: 850.00, type: 'receita' }
      ],
      drWhatIDidWell: 'Excelente foco absoluto de manhã, sem interrupções de redes sociais ou notificações fúteis.',
      drWhatILearned: 'Comunicação assertiva com investidores gera credibilidade imediata.',
      drWhatToImproveTomorrow: 'Reservar períodos de intervalo regulares para evitar fadiga ocular à tarde.',
      drBiggestWin: 'Fechamento do roadmap técnico aprovado por unanimidade sem contestações do time de produto.',

      qnQuickIdeas: 'Novo funil de email focado em resolver dores de sincronização de tarefas corporativas.',
      qnPhones: '+55 11 99999-5522 (Dr. André - Saúde)',
      qnLinks: 'https://github.com/developer-workspace/api-standards',
      qnShopping: 'Suplemento ômega-3, organizador de cabos magnético para mesa',
      qnReminders: 'Pagar DAS MEI antes do dia 20.'
    };
    updateRecord(sample);
    onShowNotification('Sucesso', 'Amostra de planejamento de alta fidelidade carregada!', 'success');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onShowNotification('Aviso', 'Habilite popups no seu navegador para imprimir.', 'warning');
      return;
    }

    // Prepare dense clean printing content for the 20 categories
    const categoriesHtml = CATEGORIES.map((cat, idx) => {
      let content = '';
      if (cat.id === 1) {
        content = `
          <p><strong>Prioridade:</strong> ${record.dpPriority || 'Nenhuma'}</p>
          <p><strong>Top 3 Prioridades:</strong></p>
          <ul>${record.dpTopPriorities.map(p => `<li>${p || '---'}</li>`).join('')}</ul>
          <p><strong>Agenda (Principais):</strong></p>
          <div style="font-size:11px;">
            ${HOURS.map((h, i) => record.dpSchedule[i] ? `<div><strong>${h}:</strong> ${record.dpSchedule[i]}</div>` : '').join('')}
          </div>
        `;
      } else if (cat.id === 2) {
        content = `
          <p><strong>Como estou me sentindo:</strong> ${record.djFeeling || 'Não informado'}</p>
          <p><strong>Humor:</strong> ${'★'.repeat(record.djMood)}${'☆'.repeat(5 - record.djMood)}</p>
          <p><strong>Gratidão:</strong></p>
          <ol>${record.djGratitude.map(g => `<li>${g || '---'}</li>`).join('')}</ol>
          <p><strong>O que aconteceu hoje:</strong> ${record.djWhatHappened || 'Não preenchido'}</p>
        `;
      } else if (cat.id === 3) {
        content = `
          <p><strong>Hábitos Cumpridos:</strong></p>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 5px;">
            <div>Água: ${record.dhWater ? '✓ Sim' : '✗ Não'}</div>
            <div>Exercício: ${record.dhExercise ? '✓ Sim' : '✗ Não'}</div>
            <div>Leitura: ${record.dhReading ? '✓ Sim' : '✗ Não'}</div>
            <div>Meditação: ${record.dhMeditation ? '✓ Sim' : '✗ Não'}</div>
            <div>Dormir Cedo: ${record.dhEarlySleep ? '✓ Sim' : '✗ Não'}</div>
            <div>Alimentação Saudável: ${record.dhHealthyFood ? '✓ Sim' : '✗ Não'}</div>
            <div>Estudo: ${record.dhStudy ? '✓ Sim' : '✗ Não'}</div>
            <div>Trabalho Profundo: ${record.dhDeepWork ? '✓ Sim' : '✗ Não'}</div>
          </div>
        `;
      } else if (cat.id === 4) {
        content = `
          <p><strong>Meta Principal:</strong> ${record.dgMainGoal || 'Não informada'}</p>
          <p><strong>Objetivos Secundários:</strong></p>
          <ul>${record.dgSecondaryGoals.map(s => `<li>${s || '---'}</li>`).join('')}</ul>
          <p><strong>Próximos Passos:</strong> ${record.dgNextSteps || 'Não informados'}</p>
          <p><strong>Resultado Esperado:</strong> ${record.dgExpectedResult || 'Não informado'}</p>
        `;
      } else if (cat.id === 5) {
        content = `
          <table style="width:100%; border-collapse:collapse; font-size:11px;">
            <thead>
              <tr style="background:#eee;">
                <th style="border:1px solid #ddd; padding:4px;">Horário</th>
                <th style="border:1px solid #ddd; padding:4px;">Atividade</th>
                <th style="border:1px solid #ddd; padding:4px;">Duração</th>
                <th style="border:1px solid #ddd; padding:4px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${record.dtbBlocks.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding:4px;">Nenhum bloco</td></tr>' : 
                record.dtbBlocks.map(b => `
                  <tr>
                    <td style="border:1px solid #ddd; padding:4px;">${b.time}</td>
                    <td style="border:1px solid #ddd; padding:4px;">${b.activity}</td>
                    <td style="border:1px solid #ddd; padding:4px;">${b.duration}</td>
                    <td style="border:1px solid #ddd; padding:4px;">${b.status}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        `;
      } else if (cat.id === 6) {
        content = `
          <p><strong>Lista de Tarefas:</strong></p>
          <ul>
            ${record.dtdItems.map(item => `<li>[${item.done ? '✓' : ' '}] ${item.task} (${item.priority}) - ${item.deadline || 'Sem prazo'}</li>`).join('')}
          </ul>
        `;
      } else if (cat.id === 11) {
        content = `
          <p><strong>Projeto:</strong> ${record.wlProject || 'Não informado'}</p>
          <p><strong>Tarefa principal:</strong> ${record.wlTask || 'Não informada'}</p>
          <p><strong>Tempo gasto:</strong> ${record.wlTimeSpent} horas</p>
          <p><strong>Resultado obtido:</strong> ${record.wlResult || 'Não informado'}</p>
        `;
      } else if (cat.id === 12) {
        content = `
          <p><strong>Matéria:</strong> ${record.spSubject || 'Não informada'}</p>
          <p><strong>Conteúdo estudado:</strong> ${record.spContent || 'Não informado'}</p>
          <p><strong>Tempo total de estudo:</strong> ${record.spStudyTime} minutos</p>
          <p><strong>Dificuldades sentidas:</strong> ${record.spDifficulties || 'Nenhuma'}</p>
        `;
      } else {
        content = `<p style="color:#555; font-size:11px;">Dados arquivados no banco de dados local da aplicação.</p>`;
      }

      return `
        <div style="page-break-inside: avoid; border: 1px solid #000; border-radius: 8px; padding: 12px; margin-bottom: 12px; background: #fff;">
          <h3 style="margin-top:0; border-bottom: 1px solid #000; padding-bottom: 4px; font-family: sans-serif; text-transform: uppercase; font-size: 13px;">
            ${idx + 1}. ${language === 'pt' || language === 'pt-BR' ? cat.pt : (language === 'es' ? cat.es : cat.name)}
          </h3>
          ${content}
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>DIÁRIO DE PERFORMANCE - ${selectedDate}</title>
          <style>
            body { font-family: 'Georgia', serif; padding: 25px; background: #FDFCF7; color: #111; max-width: 800px; margin: 0 auto; }
            h1 { text-align: center; font-family: 'Times New Roman', serif; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; }
            .date { text-align: center; font-family: sans-serif; font-size: 14px; font-weight: bold; margin-bottom: 25px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            ul, ol { padding-left: 20px; font-size:12px; }
            p { font-size: 12px; margin: 6px 0; }
          </style>
        </head>
        <body>
          <h1>Diário de Performance & Hábitos</h1>
          <div class="date">DATA DE REGISTRO: ${selectedDate}</div>
          <div>${categoriesHtml}</div>
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
    onShowNotification('Sucesso', 'Fila de impressão gerada com sucesso!', 'success');
  };

  // Dynamic automatic calculations for category 19: Daily Dashboard
  const calcTotalStudyTime = () => record.spStudyTime; // minutes
  const calcTotalWorkTime = () => record.wlTimeSpent; // hours
  const calcTotalExpenses = () => {
    return record.etExpenses
      .filter(e => e.type === 'despesa')
      .reduce((sum, e) => sum + Number(e.value || 0), 0);
  };
  const calcTotalRevenue = () => {
    return record.etExpenses
      .filter(e => e.type === 'receita')
      .reduce((sum, e) => sum + Number(e.value || 0), 0);
  };

  const calcCompletedTasksCount = () => {
    const listCount = record.dpTodoList.filter(t => t.done).length;
    const todoCount = record.dtdItems.filter(t => t.done).length;
    return listCount + todoCount;
  };

  const calcCompletedHabitsCount = () => {
    let habitsCount = 0;
    if (record.dhWater) habitsCount++;
    if (record.dhExercise) habitsCount++;
    if (record.dhReading) habitsCount++;
    if (record.dhMeditation) habitsCount++;
    if (record.dhEarlySleep) habitsCount++;
    if (record.dhHealthyFood) habitsCount++;
    if (record.dhStudy) habitsCount++;
    if (record.dhDeepWork) habitsCount++;

    if (record.scWater) habitsCount++;
    if (record.scExercise) habitsCount++;
    if (record.scReading) habitsCount++;
    if (record.scRest) habitsCount++;
    if (record.scFamily) habitsCount++;
    if (record.scNoSocialMedia) habitsCount++;

    return habitsCount;
  };

  const calcTotalHabitsCount = () => 14; // 8 from tracker + 6 from self-care

  const activeCategory = CATEGORIES[activeCategoryIndex];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="daily-planner-root">
      
      {/* 20-Category Left Navigation Sidebar */}
      <div className="lg:col-span-1 bg-slate-900/30 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between" id="sidebar-categories">
        <div>
          <div className="mb-4">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              {t('chooseDateLabel', tr('Escolher Data', 'Choose Date', 'Elegir Fecha'))}
            </label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
            />
          </div>

          <div className="border-t border-slate-800/80 pt-3 mb-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">
              {t('dailyCategoriesHeading', tr('20 Categorias Diárias', '20 Daily Categories', '20 Categorías Diarias'))}
            </span>
          </div>

          <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1" id="categories-scrollable-list">
            {CATEGORIES.map((cat, idx) => {
              const IconComp = cat.icon;
              const isActive = activeCategoryIndex === idx;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center space-x-2 border text-xs ${
                    isActive 
                      ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300 font-bold' 
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-350 hover:bg-slate-800/20'
                  }`}
                  id={`btn-cat-${cat.id}`}
                >
                  <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">{cat.id}. {isPt ? cat.pt : (isEs ? cat.es : cat.name)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls in Sidebar bottom */}
        <div className="pt-4 border-t border-slate-800/80 mt-4 space-y-2">
          <button
            onClick={handlePrefillSample}
            className="w-full bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 font-semibold text-xs py-2 rounded-xl transition flex items-center justify-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('prefillSampleBtn', tr('Preencher Amostra', 'Prefill Sample', 'Rellenar Muestra'))}</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="w-full bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/25 font-semibold text-xs py-2 rounded-xl transition flex items-center justify-center space-x-1"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('printDailySheetBtn', tr('Imprimir Folha Diária', 'Print Daily Sheet', 'Imprimir Hoja Diaria'))}</span>
          </button>

          <button
            onClick={handleClearDay}
            className="w-full bg-transparent hover:bg-rose-950/15 text-rose-400 hover:text-rose-350 font-medium text-[11px] py-1.5 transition text-center"
          >
            {t('clearDayRecordBtn', tr('Limpar Registro do Dia', 'Clear Day Record', 'Limpiar Registro del Día'))}
          </button>
        </div>
      </div>

      {/* Main Workspace Category Pane */}
      <div className="lg:col-span-3 bg-slate-900/10 border border-slate-800/80 rounded-2xl p-6" id="workspace-content-panel">
        
        {/* Workspace Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${activeCategory.color}`}>
              {React.createElement(activeCategory.icon, { className: 'w-5 h-5' })}
            </div>
            <div>
              <h2 className="text-md font-bold text-white tracking-tight flex items-center">
                {isPt ? activeCategory.pt : (isEs ? activeCategory.es : activeCategory.name)}
                <span className="text-[10px] ml-2 bg-indigo-950 border border-indigo-800/50 text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                  {t('sectionLabel', tr('Seção', 'Section', 'Sección'))} {activeCategory.id} {t('ofLabel', tr('de', 'of', 'de'))} 20
                </span>
              </h2>
              <p className="text-slate-400 text-xs">{isPt ? activeCategory.pt : (isEs ? activeCategory.es : activeCategory.name)} - {t('recordOfLabel', tr('Registro de', 'Record of', 'Registro de'))} {selectedDate}</p>
            </div>
          </div>
          
          <div className="text-right hidden sm:block">
            <span className="text-xs font-mono text-slate-500 block">Status: {tr('Auto-Salvo', 'Auto-Saved', 'Auto-Guardado')}</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Local DB</span>
          </div>
        </div>

        {/* Dynamic Forms based on index */}
        <div className="space-y-6" id="category-workspace-forms">
          
          {/* 1. Daily Planner */}
          {activeCategory.id === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Prioridade Principal do Dia</label>
                <input 
                  type="text"
                  placeholder="Qual é o único objetivo inegociável de hoje?"
                  value={record.dpPriority}
                  onChange={(e) => updateRecord({ dpPriority: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Top 3 Prioridades do Dia</label>
                  <div className="space-y-2">
                    {record.dpTopPriorities.map((item, idx) => (
                      <input 
                        key={idx}
                        type="text"
                        placeholder={`Prioridade #${idx + 1}`}
                        value={item}
                        onChange={(e) => {
                          const updated = [...record.dpTopPriorities];
                          updated[idx] = e.target.value;
                          updateRecord({ dpTopPriorities: updated });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reuniões & Compromissos Marcados</label>
                  <textarea 
                    placeholder="Horários de reuniões, meetups, chamadas ou sincronizações marcadas..."
                    value={record.dpMeetings}
                    onChange={(e) => updateRecord({ dpMeetings: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Agenda Detalhada por Horário (06:00 - 22:00)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {HOURS.map((h, i) => (
                    <div key={h} className="flex items-center space-x-2 bg-slate-950/40 p-1.5 rounded-lg border border-slate-850/60">
                      <span className="text-xs font-mono font-bold text-indigo-400 w-12 text-center">{h}</span>
                      <input 
                        type="text"
                        placeholder="Atividade..."
                        value={record.dpSchedule[i] || ''}
                        onChange={(e) => {
                          const updated = [...record.dpSchedule];
                          updated[i] = e.target.value;
                          updateRecord({ dpSchedule: updated });
                        }}
                        className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none placeholder-slate-700"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Ideias & Anotações</label>
                  <textarea 
                    placeholder="Insight, pensamentos soltos ou dados importantes..."
                    value={record.dpNotes}
                    onChange={(e) => updateRecord({ dpNotes: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reflexão do Fim do Dia</label>
                  <textarea 
                    placeholder="O que funcionou hoje? O que foi concluído com sucesso?"
                    value={record.dpReflection}
                    onChange={(e) => updateRecord({ dpReflection: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Daily Journal */}
          {activeCategory.id === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Como estou me sentindo?</label>
                  <input 
                    type="text"
                    placeholder="Ex: Grato, focado, um pouco cansado, entusiasmado..."
                    value={record.djFeeling}
                    onChange={(e) => updateRecord({ djFeeling: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nível Geral de Humor (Mood Tracker)</label>
                  <div className="flex items-center space-x-3 bg-slate-950/40 p-2 rounded-xl border border-slate-800 justify-around h-[38px]">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => updateRecord({ djMood: val })}
                        className={`text-md transition-transform hover:scale-125 ${record.djMood === val ? 'opacity-100 font-bold scale-110 text-orange-400' : 'opacity-40 text-slate-400'}`}
                        title={`Humor ${val}`}
                      >
                        {val === 1 && '😢'}
                        {val === 2 && '😕'}
                        {val === 3 && '😐'}
                        {val === 4 && '🙂'}
                        {val === 5 && '🔥'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">3 Motivos de Gratidão de Hoje</label>
                <div className="space-y-2">
                  {record.djGratitude.map((item, idx) => (
                    <input 
                      key={idx}
                      type="text"
                      placeholder={`Gratidão #${idx + 1}`}
                      value={item}
                      onChange={(e) => {
                        const updated = [...record.djGratitude];
                        updated[idx] = e.target.value;
                        updateRecord({ djGratitude: updated });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">O que aconteceu de mais importante hoje?</label>
                  <textarea 
                    placeholder="Narração dos eventos mais marcantes, conversas valiosas..."
                    value={record.djWhatHappened}
                    onChange={(e) => updateRecord({ djWhatHappened: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">O que aprendi hoje?</label>
                    <textarea 
                      placeholder="Conhecimento adquirido, erros que ensinaram algo..."
                      value={record.djWhatILearned}
                      onChange={(e) => updateRecord({ djWhatILearned: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">O que posso melhorar?</label>
                    <textarea 
                      placeholder="Comportamento, procrastinação, foco ou rotina..."
                      value={record.djImprovement}
                      onChange={(e) => updateRecord({ djImprovement: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Daily Habit Tracker */}
          {activeCategory.id === 3 && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs">Marque os hábitos fundamentais conforme for concluindo-os ao longo do dia de hoje.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {[
                  { key: 'dhWater', label: 'Água', desc: 'Metas de Hidratação Diária' },
                  { key: 'dhExercise', label: 'Exercício', desc: 'Atividade física de hoje' },
                  { key: 'dhReading', label: 'Leitura', desc: 'Desenvolvimento e livros' },
                  { key: 'dhMeditation', label: 'Meditação', desc: 'Presença mental e foco' },
                  { key: 'dhEarlySleep', label: 'Dormir Cedo', desc: 'Higiene do sono correta' },
                  { key: 'dhHealthyFood', label: 'Alimentação Saudável', desc: 'Nutrição limpa de hoje' },
                  { key: 'dhStudy', label: 'Estudo', desc: 'Consumo focado de conteúdo' },
                  { key: 'dhDeepWork', label: 'Trabalho Profundo', desc: 'Foco sem interrupções' }
                ].map((item) => {
                  const checked = (record as any)[item.key];
                  return (
                    <div 
                      key={item.key}
                      onClick={() => updateRecord({ [item.key]: !checked })}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                        checked 
                          ? 'bg-emerald-950/15 border-emerald-500/40 text-emerald-300' 
                          : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold tracking-tight">{item.label}</p>
                        <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        checked ? 'bg-emerald-600 border-emerald-400 text-white' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-900/40 p-4 border border-slate-800/80 rounded-xl flex items-center space-x-3 text-xs text-slate-400">
                <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Rastreie estes hábitos para preencher automaticamente o <strong>Painel Geral Diário (Dashboard)</strong> da sua conta.</span>
              </div>
            </div>
          )}

          {/* 4. Daily Goals */}
          {activeCategory.id === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Meta Principal Diária (North Star de Hoje)</label>
                <input 
                  type="text"
                  placeholder="Qual meta guiará o sucesso de todas as atividades de hoje?"
                  value={record.dgMainGoal}
                  onChange={(e) => updateRecord({ dgMainGoal: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Objetivos Secundários Suportivos</label>
                <div className="space-y-2">
                  {record.dgSecondaryGoals.map((g, idx) => (
                    <input 
                      key={idx}
                      type="text"
                      placeholder={`Objetivo Secundário #${idx + 1}`}
                      value={g}
                      onChange={(e) => {
                        const updated = [...record.dgSecondaryGoals];
                        updated[idx] = e.target.value;
                        updateRecord({ dgSecondaryGoals: updated });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-750 focus:outline-none focus:border-indigo-500"
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Próximos Passos (Ações imediatas)</label>
                  <textarea 
                    placeholder="Quais ações práticas e de curto prazo devem ser tomadas em seguida?"
                    value={record.dgNextSteps}
                    onChange={(e) => updateRecord({ dgNextSteps: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Resultado Esperado (Métrica de Sucesso)</label>
                  <textarea 
                    placeholder="Como saberemos se a meta diária foi cumprida? Qual é o retorno numérico?"
                    value={record.dgExpectedResult}
                    onChange={(e) => updateRecord({ dgExpectedResult: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Daily Time Blocking */}
          {activeCategory.id === 5 && (
            <div className="space-y-4">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newBlock.activity.trim()) return;
                  const item = { ...newBlock, id: Date.now().toString() };
                  updateRecord({ dtbBlocks: [...record.dtbBlocks, item] });
                  setNewBlock({ time: '09:00', activity: '', duration: '1h', status: 'Pendente' });
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl"
              >
                <input 
                  type="text" 
                  placeholder="Horário (Ex: 09:00 - 10:30)" 
                  value={newBlock.time} 
                  onChange={(e) => setNewBlock({ ...newBlock, time: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                />
                <input 
                  type="text" 
                  placeholder="Atividade foca..." 
                  value={newBlock.activity} 
                  onChange={(e) => setNewBlock({ ...newBlock, activity: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white sm:col-span-2"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1 px-3 rounded">
                  Adicionar Bloco
                </button>
              </form>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900/80">
                    <tr className="border-b border-slate-850 text-slate-400">
                      <th className="p-3">Horário</th>
                      <th className="p-3">Atividade</th>
                      <th className="p-3">Duração</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-950/20">
                    {record.dtbBlocks.map((b) => (
                      <tr key={b.id}>
                        <td className="p-3 font-mono font-bold text-slate-200">{b.time}</td>
                        <td className="p-3 text-slate-300 font-medium">{b.activity}</td>
                        <td className="p-3 text-slate-400">{b.duration}</td>
                        <td className="p-3">
                          <button
                            onClick={() => {
                              const nextStatus: 'Pendente' | 'Em Progresso' | 'Concluído' = b.status === 'Pendente' ? 'Em Progresso' : b.status === 'Em Progresso' ? 'Concluído' : 'Pendente';
                              const updated = record.dtbBlocks.map(item => item.id === b.id ? { ...item, status: nextStatus } : item);
                              updateRecord({ dtbBlocks: updated });
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              b.status === 'Concluído' ? 'bg-emerald-950/20 border-emerald-800 text-emerald-400' :
                              b.status === 'Em Progresso' ? 'bg-amber-950/20 border-amber-800 text-amber-400' :
                              'bg-slate-900 border-slate-750 text-slate-400'
                            }`}
                          >
                            {b.status}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => {
                              const updated = record.dtbBlocks.filter(item => item.id !== b.id);
                              updateRecord({ dtbBlocks: updated });
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {record.dtbBlocks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center p-6 text-slate-500">Nenhum bloco de tempo criado para hoje.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Daily To-Do List */}
          {activeCategory.id === 6 && (
            <div className="space-y-4">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newDtd.task.trim()) return;
                  const item = { ...newDtd, id: Date.now().toString(), done: false };
                  updateRecord({ dtdItems: [...record.dtdItems, item] });
                  setNewDtd({ task: '', category: 'Geral', priority: 'Medium', deadline: '' });
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl"
              >
                <input 
                  type="text" 
                  placeholder="Nova tarefa..." 
                  value={newDtd.task} 
                  onChange={(e) => setNewDtd({ ...newDtd, task: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white sm:col-span-2"
                />
                <select
                  value={newDtd.priority}
                  onChange={(e) => setNewDtd({ ...newDtd, priority: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                >
                  <option value="Low">Baixa</option>
                  <option value="Medium">Média</option>
                  <option value="High">Alta</option>
                </select>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1 px-3 rounded">
                  Salvar
                </button>
              </form>

              <div className="space-y-2">
                {record.dtdItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850/80 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => {
                          const updated = record.dtdItems.map(x => x.id === item.id ? { ...x, done: !x.done } : x);
                          updateRecord({ dtdItems: updated });
                        }}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          item.done ? 'bg-emerald-600 border-emerald-400 text-white' : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {item.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span className={`text-xs ${item.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{item.task}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase ${
                        item.priority === 'High' ? 'bg-rose-950/20 border-rose-900 text-rose-400' :
                        item.priority === 'Medium' ? 'bg-amber-950/20 border-amber-900 text-amber-400' :
                        'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        {item.priority === 'High' ? 'Alta' : item.priority === 'Medium' ? 'Média' : 'Baixa'}
                      </span>
                      <button 
                        onClick={() => {
                          const updated = record.dtdItems.filter(x => x.id !== item.id);
                          updateRecord({ dtdItems: updated });
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {record.dtdItems.length === 0 && (
                  <p className="text-center py-6 text-xs text-slate-500">Sua lista de tarefas diárias está vazia.</p>
                )}
              </div>
            </div>
          )}

          {/* 7. Morning Routine */}
          {activeCategory.id === 7 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <Sun className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-slate-300">Estabeleça uma rotina matinal sólida para ancorar o dia com alta energia produtiva.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-400">Hora de Acordar</label>
                    <span className="text-[10px] text-slate-500 block">Horário que abriu os olhos hoje</span>
                  </div>
                  <input 
                    type="text"
                    value={record.mrWakeTime}
                    onChange={(e) => updateRecord({ mrWakeTime: e.target.value })}
                    className="w-24 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono text-center"
                  />
                </div>

                {[
                  { key: 'mrWakeUp', label: 'Acordar no primeiro despertador', desc: 'Sem soneca indesejada' },
                  { key: 'mrMakeBed', label: 'Arrumar a cama', desc: 'Primeira vitória em ordem visual' },
                  { key: 'mrHygiene', label: 'Higiene e autocuidado', desc: 'Autonomia matinal corporal' },
                  { key: 'mrExercise', label: 'Exercício matinal leve / Alongamento', desc: 'Oxigenação e mobilidade' },
                  { key: 'mrBreakfast', label: 'Tomar café da manhã nutritivo', desc: 'Sem pular macros essenciais' },
                  { key: 'mrPlanDay', label: 'Planejar o dia de forma consciente', desc: 'Revisar metas e compromissos' },
                  { key: 'mrReading', label: 'Leitura rápida / Aprendizado', desc: 'Alimentando o cérebro' },
                  { key: 'mrMeditation', label: 'Meditação ou respiração consciente', desc: 'Presença mental extrema' }
                ].map((item) => {
                  const checked = (record as any)[item.key];
                  return (
                    <div 
                      key={item.key}
                      onClick={() => updateRecord({ [item.key]: !checked })}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between select-none ${
                        checked ? 'bg-indigo-950/15 border-indigo-500/30 text-indigo-300' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold">{item.label}</p>
                        <span className="text-[9px] text-slate-500 block">{item.desc}</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        checked ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8. Evening Routine */}
          {activeCategory.id === 8 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <Moon className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-300">Prepare o corpo e a mente para o descanso reparador e otimize o início do dia seguinte.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'erReviewTasks', label: 'Revisar as tarefas do dia', desc: 'Conclusão e fechamento consciente' },
                  { key: 'erOrganizeEnv', label: 'Organizar ambiente / Mesa de trabalho', desc: 'Acorde com clareza amanhã' },
                  { key: 'erPrepClothes', label: 'Preparar roupas e materiais', desc: 'Reduz fadiga de decisão matinal' },
                  { key: 'erPlanTomorrow', label: 'Planejar o dia de amanhã', desc: 'Metas e cronogramas organizados' },
                  { key: 'erReading', label: 'Leitura relaxante de livros físicos', desc: 'Desacelerando o sistema nervoso' },
                  { key: 'erSleep', label: 'Dormir no horário estipulado', desc: 'Garantindo descanso profundo' }
                ].map((item) => {
                  const checked = (record as any)[item.key];
                  return (
                    <div 
                      key={item.key}
                      onClick={() => updateRecord({ [item.key]: !checked })}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between select-none ${
                        checked ? 'bg-purple-950/15 border-purple-500/30 text-purple-300' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold">{item.label}</p>
                        <span className="text-[9px] text-slate-500 block">{item.desc}</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                        checked ? 'bg-purple-600 border-purple-400 text-white' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {checked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 9. Meeting Notes */}
          {activeCategory.id === 9 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assunto / Pauta</label>
                  <input 
                    type="text"
                    placeholder="Ex: Kickoff Planejamento Técnico v2"
                    value={record.mnSubject}
                    onChange={(e) => updateRecord({ mnSubject: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Participantes Presentes</label>
                  <input 
                    type="text"
                    placeholder="Amanda, Sarah, Lucas..."
                    value={record.mnAttendees}
                    onChange={(e) => updateRecord({ mnAttendees: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Principais Pontos Discutidos</label>
                <textarea 
                  placeholder="Quais foram os tópicos debatidos? Argumentações de cada parte..."
                  value={record.mnPointsDiscussed}
                  onChange={(e) => updateRecord({ mnPointsDiscussed: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Decisões Tomadas</label>
                  <textarea 
                    placeholder="O que foi batido o martelo inegociavelmente?"
                    value={record.mnDecisions}
                    onChange={(e) => updateRecord({ mnDecisions: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Próximas Ações & Responsáveis</label>
                  <textarea 
                    placeholder="Ex: Amanda monta o roadmap técnico até quinta-feira."
                    value={record.mnNextActions}
                    onChange={(e) => updateRecord({ mnNextActions: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 10. Brain Dump */}
          {activeCategory.id === 10 && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs">Esvazie sua mente de forma intencional. Tire pensamentos, ideias e preocupações soltas para aliviar a carga cognitiva.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Novas Ideias (Sem filtros)</label>
                  <textarea 
                    placeholder="Fluxo livre de ideias inovadoras, features, artigos..."
                    value={record.bdIdeas}
                    onChange={(e) => updateRecord({ bdIdeas: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pensamentos & Preocupações</label>
                  <textarea 
                    placeholder="Sentimentos, impasses emocionais, pressões do dia..."
                    value={record.bdThoughts}
                    onChange={(e) => updateRecord({ bdThoughts: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Problemas Identificados</label>
                  <textarea 
                    placeholder="Gargalos técnicos ou relacionais..."
                    value={record.bdProblems}
                    onChange={(e) => updateRecord({ bdProblems: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Soluções Possíveis</label>
                  <textarea 
                    placeholder="Respostas imediatas ou hipóteses de teste..."
                    value={record.bdSolutions}
                    onChange={(e) => updateRecord({ bdSolutions: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lembretes Urgentes</label>
                  <textarea 
                    placeholder="Ex: Não esquecer de renovar o domínio web..."
                    value={record.bdReminders}
                    onChange={(e) => updateRecord({ bdReminders: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 11. Work Log */}
          {activeCategory.id === 11 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Projeto Relacionado</label>
                  <input 
                    type="text"
                    placeholder="Ex: OmniSAAS Platform v2"
                    value={record.wlProject}
                    onChange={(e) => updateRecord({ wlProject: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tempo Gasto (Horas)</label>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Ex: 4.5"
                    value={record.wlTimeSpent || ''}
                    onChange={(e) => updateRecord({ wlTimeSpent: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tarefa Desenvolvida</label>
                <input 
                  type="text"
                  placeholder="Ex: Refatorar API de rotas e consultas do banco..."
                  value={record.wlTask}
                  onChange={(e) => updateRecord({ wlTask: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resultado Alcançado</label>
                  <textarea 
                    placeholder="O que funcionou após esse período de foco? Métricas obtidas..."
                    value={record.wlResult}
                    onChange={(e) => updateRecord({ wlResult: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Próxima Etapa do Fluxo</label>
                  <input 
                    type="text"
                    placeholder="O que será desenvolvido logo em seguida?"
                    value={record.wlNextStep}
                    onChange={(e) => updateRecord({ wlNextStep: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 12. Study Planner */}
          {activeCategory.id === 12 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Matéria / Tópico</label>
                  <input 
                    type="text"
                    placeholder="Ex: Estruturas de Dados Avançadas"
                    value={record.spSubject}
                    onChange={(e) => updateRecord({ spSubject: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tempo de Estudo (Minutos)</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="Ex: 90"
                    value={record.spStudyTime || ''}
                    onChange={(e) => updateRecord({ spStudyTime: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Conteúdo Específico Estudado</label>
                <input 
                  type="text"
                  placeholder="Capítulo 4, árvores binárias balanceadas, algoritmos de consenso..."
                  value={record.spContent}
                  onChange={(e) => updateRecord({ spContent: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Exercícios / Testes Práticos Resolvidos</label>
                  <textarea 
                    placeholder="Quais exercícios foram realizados? Pontuação ou dúvidas..."
                    value={record.spExercises}
                    onChange={(e) => updateRecord({ spExercises: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dificuldades Enfrentadas</label>
                  <textarea 
                    placeholder="O que travou ou exige nova revisão aprofundada amanhã?"
                    value={record.spDifficulties}
                    onChange={(e) => updateRecord({ spDifficulties: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 13. Meal Planner */}
          {activeCategory.id === 13 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Café da Manhã</label>
                  <input 
                    type="text"
                    placeholder="Ex: Ovos, pão integral e mamão"
                    value={record.mpBreakfast}
                    onChange={(e) => updateRecord({ mpBreakfast: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Almoço</label>
                  <input 
                    type="text"
                    placeholder="Ex: Frango grelhado, salada e arroz"
                    value={record.mpLunch}
                    onChange={(e) => updateRecord({ mpLunch: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Jantar</label>
                  <input 
                    type="text"
                    placeholder="Ex: Salmão grelhado com brocolis ao vapor"
                    value={record.mpDinner}
                    onChange={(e) => updateRecord({ mpDinner: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lanches Intermediários</label>
                  <input 
                    type="text"
                    placeholder="Ex: Castanhas, banana, Whey protein"
                    value={record.mpSnacks}
                    onChange={(e) => updateRecord({ mpSnacks: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-400">Total de Água Consumida (ml)</label>
                  <span className="text-[10px] text-slate-500 block">Hidrate-se com constância diária</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number"
                    step="250"
                    min="0"
                    placeholder="Ex: 2000"
                    value={record.mpWaterIntake || ''}
                    onChange={(e) => updateRecord({ mpWaterIntake: Number(e.target.value) })}
                    className="w-28 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 font-mono font-bold"
                  />
                  <span className="text-xs text-slate-400">ml</span>
                </div>
              </div>
            </div>
          )}

          {/* 14. Fitness Log */}
          {activeCategory.id === 14 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Exercício Principal Desenvolvido</label>
                <input 
                  type="text"
                  placeholder="Ex: Agachamento Livre, Supino Reto, Levantamento Terra..."
                  value={record.flExercise}
                  onChange={(e) => updateRecord({ flExercise: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Séries</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="4"
                    value={record.flSets || ''}
                    onChange={(e) => updateRecord({ flSets: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Repetições</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="12"
                    value={record.flReps || ''}
                    onChange={(e) => updateRecord({ flReps: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Peso Total (kg)</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="60"
                    value={record.flWeight || ''}
                    onChange={(e) => updateRecord({ flWeight: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cardio (Minutos)</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="25"
                    value={record.flCardioTime || ''}
                    onChange={(e) => updateRecord({ flCardioTime: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-xl flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-400">Gasto Calórico Estimado (kcal)</label>
                  <span className="text-[10px] text-slate-500 block">Metabolismo ativo e esforço físico</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number"
                    min="0"
                    placeholder="500"
                    value={record.flCalories || ''}
                    onChange={(e) => updateRecord({ flCalories: Number(e.target.value) })}
                    className="w-28 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 font-mono font-bold"
                  />
                  <span className="text-xs text-slate-400">kcal</span>
                </div>
              </div>
            </div>
          )}

          {/* 15. Mood Tracker */}
          {activeCategory.id === 15 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Humor Predominante</label>
                  <select 
                    value={record.mtMood}
                    onChange={(e) => updateRecord({ mtMood: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="Feliz">Excelente / Radiante</option>
                    <option value="Produtivo">Focado / Altamente Produtivo</option>
                    <option value="Neutro">Tranquilo / Estável / Neutro</option>
                    <option value="Cansado">Fadiga física ou mental</option>
                    <option value="Ansioso">Estressado / Ansioso / Inquieto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Qualidade do Sono Reparador (1 a 10)</label>
                  <input 
                    type="range"
                    min="1"
                    max="10"
                    value={record.mtSleepQuality}
                    onChange={(e) => updateRecord({ mtSleepQuality: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-3"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>Ruim (1)</span>
                    <span className="font-bold text-indigo-400">Valor Selecionado: {record.mtSleepQuality}/10</span>
                    <span>Espetacular (10)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">Nível de Energia Diária (1 a 10)</label>
                  <input 
                    type="range"
                    min="1"
                    max="10"
                    value={record.mtEnergy}
                    onChange={(e) => updateRecord({ mtEnergy: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>Sem energia (1)</span>
                    <span className="font-bold text-amber-400">Valor: {record.mtEnergy}/10</span>
                    <span>Ativo / Imparável (10)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Índice de Estresse Absorvido (1 a 10)</label>
                  <input 
                    type="range"
                    min="1"
                    max="10"
                    value={record.mtStress}
                    onChange={(e) => updateRecord({ mtStress: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-rose-500 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>Zero estresse (1)</span>
                    <span className="font-bold text-rose-400">Valor: {record.mtStress}/10</span>
                    <span>Crítico (10)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Observações Gerais de Humor e Saúde</label>
                <textarea 
                  placeholder="Gatilhos emocionais, desconfortos ou conquistas de humor..."
                  value={record.mtObservations}
                  onChange={(e) => updateRecord({ mtObservations: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 16. Self-Care Checklist */}
          {activeCategory.id === 16 && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs">Marque o autocuidado consciente praticado hoje para restabelecer o equilíbrio biológico.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'scWater', label: 'Consumo adequado de água', desc: 'Hidratação celular completa' },
                  { key: 'scExercise', label: 'Atividade física consciente', desc: 'Mover o corpo intencionalmente' },
                  { key: 'scReading', label: 'Leitura não-técnica livre', desc: 'Desacelerar e adquirir repertório' },
                  { key: 'scRest', label: 'Tempo de descanso e ócio', desc: 'Permitir recuperação neuronal' },
                  { key: 'scFamily', label: 'Contato com amigos ou família', desc: 'Nutrir relacionamentos próximos' },
                  { key: 'scNoSocialMedia', label: 'Tempo livre sem redes sociais', desc: 'Desintoxicação de dopamina' }
                ].map((item) => {
                  const checked = (record as any)[item.key];
                  return (
                    <div 
                      key={item.key}
                      onClick={() => updateRecord({ [item.key]: !checked })}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between select-none ${
                        checked ? 'bg-pink-950/15 border-pink-500/30 text-pink-300' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">{item.label}</p>
                        <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        checked ? 'bg-pink-600 border-pink-400 text-white' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 17. Expenses Today */}
          {activeCategory.id === 17 && (
            <div className="space-y-4">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newExpense.description.trim() || !newExpense.value) return;
                  const item = { 
                    id: Date.now().toString(), 
                    description: newExpense.description, 
                    category: newExpense.category, 
                    value: Number(newExpense.value), 
                    type: newExpense.type 
                  };
                  updateRecord({ etExpenses: [...record.etExpenses, item] });
                  setNewExpense({ description: '', category: 'Alimentação', value: '', type: 'despesa' });
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl"
              >
                <input 
                  type="text" 
                  placeholder="Descrição da transação..." 
                  value={newExpense.description} 
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                />
                <input 
                  type="number" 
                  placeholder="Valor R$..." 
                  value={newExpense.value} 
                  onChange={(e) => setNewExpense({ ...newExpense, value: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                />
                <select
                  value={newExpense.type}
                  onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value as any })}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                >
                  <option value="despesa">Despesa (Gasto)</option>
                  <option value="receita">Receita (Entrada)</option>
                </select>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1 px-3 rounded">
                  Lançar Fluxo
                </button>
              </form>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900/80">
                    <tr className="border-b border-slate-850 text-slate-400">
                      <th className="p-3">Descrição</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-950/20">
                    {record.etExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td className="p-3 text-slate-300 font-medium">{exp.description}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            exp.type === 'receita' ? 'bg-emerald-950/20 border-emerald-800 text-emerald-400' : 'bg-rose-950/20 border-rose-800 text-rose-400'
                          }`}>
                            {exp.type === 'receita' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className={`p-3 font-mono font-bold ${exp.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          R$ {Number(exp.value).toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => {
                              const updated = record.etExpenses.filter(x => x.id !== exp.id);
                              updateRecord({ etExpenses: updated });
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {record.etExpenses.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center p-6 text-slate-500">Nenhum lançamento financeiro registrado para hoje.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Receitas</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">R$ {calcTotalRevenue().toFixed(2)}</span>
                </div>
                <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Despesas</span>
                  <span className="text-sm font-bold text-rose-400 font-mono">R$ {calcTotalExpenses().toFixed(2)}</span>
                </div>
                <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Saldo do Dia</span>
                  <span className={`text-sm font-bold font-mono ${(calcTotalRevenue() - calcTotalExpenses()) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    R$ {(calcTotalRevenue() - calcTotalExpenses()).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 18. Daily Reflection */}
          {activeCategory.id === 18 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">O que eu fiz muito bem hoje?</label>
                <textarea 
                  placeholder="Analise de vitórias, de conduta ou ações de alta eficiência..."
                  value={record.drWhatIDidWell}
                  onChange={(e) => updateRecord({ drWhatIDidWell: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">O que aprendi com os acontecimentos?</label>
                  <textarea 
                    placeholder="Reflexões sobre erros cometidos ou conhecimentos novos..."
                    value={record.drWhatILearned}
                    onChange={(e) => updateRecord({ drWhatILearned: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">O que devo melhorar no dia de amanhã?</label>
                  <textarea 
                    placeholder="Mudanças de abordagens práticas inegociáveis para amanhã..."
                    value={record.drWhatToImproveTomorrow}
                    onChange={(e) => updateRecord({ drWhatToImproveTomorrow: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Maior Conquista Individual de Hoje</label>
                <input 
                  type="text"
                  placeholder="Qual foi seu momento de maior orgulho ou entrega substancial?"
                  value={record.drBiggestWin}
                  onChange={(e) => updateRecord({ drBiggestWin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>
            </div>
          )}

          {/* 19. Daily Dashboard (COMPILATION SHEET) */}
          {activeCategory.id === 19 && (
            <div className="space-y-6">
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center space-x-3 text-xs text-slate-400">
                <Sparkle className="w-5 h-5 text-amber-400 animate-spin" />
                <span>Este painel é gerado e compilado automaticamente com base nos outros 19 registros realizados na data de hoje ({selectedDate}).</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/30 border border-slate-800 p-4 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-bold uppercase">
                    <Timer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Estudo Diário</span>
                  </div>
                  <p className="text-xl font-bold text-slate-100 font-mono">{calcTotalStudyTime()} min</p>
                  <span className="text-[10px] text-slate-500 block">Carregado do Estudo</span>
                </div>

                <div className="bg-slate-950/30 border border-slate-800 p-4 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-bold uppercase">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Trabalho Ativo</span>
                  </div>
                  <p className="text-xl font-bold text-slate-100 font-mono">{calcTotalWorkTime()} h</p>
                  <span className="text-[10px] text-slate-500 block">Carregado do Trabalho</span>
                </div>

                <div className="bg-slate-950/30 border border-slate-800 p-4 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-bold uppercase">
                    <ClipboardList className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tarefas Feitas</span>
                  </div>
                  <p className="text-xl font-bold text-slate-100 font-mono">{calcCompletedTasksCount()}</p>
                  <span className="text-[10px] text-slate-500 block">Do Planner & To-Do List</span>
                </div>

                <div className="bg-slate-950/30 border border-slate-800 p-4 rounded-xl space-y-1">
                  <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-bold uppercase">
                    <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                    <span>Despesas Totais</span>
                  </div>
                  <p className="text-xl font-bold text-slate-100 font-mono">R$ {calcTotalExpenses().toFixed(2)}</p>
                  <span className="text-[10px] text-slate-500 block">Dos Lançamentos Financeiros</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/30 border border-slate-800 p-5 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center">
                    <Flame className="w-4 h-4 mr-1.5 text-orange-400" />
                    Progresso de Hábitos Cumpridos
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Metas de Rotina executadas:</span>
                      <span className="font-bold text-indigo-400 font-mono">{calcCompletedHabitsCount()} de {calcTotalHabitsCount()}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-indigo-500 transition-all duration-1000" 
                        style={{ width: `${(calcCompletedHabitsCount() / calcTotalHabitsCount()) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">Calculado a partir do rastreador de hábitos padrão e checklist de autocuidado diário.</p>
                </div>

                <div className="bg-slate-950/30 border border-slate-800 p-5 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center">
                    <Smile className="w-4 h-4 mr-1.5 text-pink-400" />
                    Humor & Qualidade Biológica
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-850 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase">Humor</span>
                      <span className="font-bold text-pink-400 block mt-1">{record.mtMood}</span>
                    </div>
                    <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-850 text-center">
                      <span className="text-[10px] text-slate-500 block uppercase">Sono Reparador</span>
                      <span className="font-bold text-indigo-400 block mt-1 font-mono">{record.mtSleepQuality}/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 20. Quick Notes */}
          {activeCategory.id === 20 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ideias Rápidas</label>
                  <textarea 
                    placeholder="Anotações instantâneas sem formatação complexa..."
                    value={record.qnQuickIdeas}
                    onChange={(e) => updateRecord({ qnQuickIdeas: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Telefones & Contatos Rápidos</label>
                  <textarea 
                    placeholder="Números, emails de suporte, nomes de secretárias..."
                    value={record.qnPhones}
                    onChange={(e) => updateRecord({ qnPhones: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Links Importantes</label>
                  <textarea 
                    placeholder="Endereços web, repositórios, artigos..."
                    value={record.qnLinks}
                    onChange={(e) => updateRecord({ qnLinks: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lista de Compras Urgentes</label>
                  <textarea 
                    placeholder="Suplementos, periféricos, canetas..."
                    value={record.qnShopping}
                    onChange={(e) => updateRecord({ qnShopping: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lembretes Gerais</label>
                  <textarea 
                    placeholder="Ações complementares secundárias do dia..."
                    value={record.qnReminders}
                    onChange={(e) => updateRecord({ qnReminders: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { id: 1, name: 'Daily Planner', pt: 'Planejamento Diário', es: 'Planificación Diaria', icon: Calendar, color: 'text-blue-400 border-blue-500/25 bg-blue-500/5' },
  { id: 2, name: 'Daily Journal', pt: 'Diário de Bordo', es: 'Diario de Bordo', icon: BookOpen, color: 'text-pink-400 border-pink-500/25 bg-pink-500/5' },
  { id: 3, name: 'Daily Habit Tracker', pt: 'Rastreador de Hábitos', es: 'Seguimiento de Hábitos', icon: Flame, color: 'text-orange-400 border-orange-500/25 bg-orange-500/5' },
  { id: 4, name: 'Daily Goals', pt: 'Metas Diárias', es: 'Metas Diarias', icon: Target, color: 'text-indigo-400 border-indigo-500/25 bg-indigo-500/5' },
  { id: 5, name: 'Daily Time Blocking', pt: 'Blocos de Tempo', es: 'Bloques de Tiempo', icon: Timer, color: 'text-cyan-400 border-cyan-500/25 bg-cyan-500/5' },
  { id: 6, name: 'Daily To-Do List', pt: 'Lista de Tarefas', es: 'Lista de Tareas', icon: ClipboardList, color: 'text-teal-400 border-teal-500/25 bg-teal-500/5' },
  { id: 7, name: 'Morning Routine', pt: 'Rotina Matinal', es: 'Rutina Matinal', icon: Sun, color: 'text-yellow-400 border-yellow-500/25 bg-yellow-500/5' },
  { id: 8, name: 'Evening Routine', pt: 'Rotina Noturna', es: 'Rutina Nocturna', icon: Moon, color: 'text-purple-400 border-purple-500/25 bg-purple-500/5' },
  { id: 9, name: 'Meeting Notes', pt: 'Notas de Reunião', es: 'Notas de Reunión', icon: MessageSquare, color: 'text-sky-400 border-sky-500/25 bg-sky-500/5' },
  { id: 10, name: 'Brain Dump', pt: 'Esvaziar a Mente', es: 'Vaciado de Mente', icon: Brain, color: 'text-rose-400 border-rose-500/25 bg-rose-500/5' },
  { id: 11, name: 'Work Log', pt: 'Registro de Trabalho', es: 'Registro de Trabajo', icon: Briefcase, color: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5' },
  { id: 12, name: 'Study Planner', pt: 'Planejamento de Estudos', es: 'Planificación de Estudios', icon: GraduationCap, color: 'text-amber-400 border-amber-500/25 bg-amber-500/5' },
  { id: 13, name: 'Meal Planner', pt: 'Cardápio Diário', es: 'Menú Diario', icon: Coffee, color: 'text-red-400 border-red-500/25 bg-red-500/5' },
  { id: 14, name: 'Fitness Log', pt: 'Registro Fitness', es: 'Registro Fitness', icon: Dumbbell, color: 'text-lime-400 border-lime-500/25 bg-lime-500/5' },
  { id: 15, name: 'Mood Tracker', pt: 'Rastreador de Humor', es: 'Seguimiento de Ánimo', icon: Smile, color: 'text-indigo-400 border-indigo-500/25 bg-indigo-500/5' },
  { id: 16, name: 'Self-Care Checklist', pt: 'Autocuidado', es: 'Autocuidado', icon: Heart, color: 'text-pink-500 border-pink-500/25 bg-pink-500/5' },
  { id: 17, name: 'Expenses Today', pt: 'Despesas de Hoje', es: 'Gastos de Hoy', icon: DollarSign, color: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5' },
  { id: 18, name: 'Daily Reflection', pt: 'Reflexão Diária', es: 'Reflexión Diaria', icon: Sparkles, color: 'text-violet-400 border-violet-500/25 bg-violet-500/5' },
  { id: 19, name: 'Daily Dashboard', pt: 'Painel Geral Diário', es: 'Tablero General Diario', icon: TrendingUp, color: 'text-amber-500 border-amber-500/25 bg-amber-500/5' },
  { id: 20, name: 'Quick Notes', pt: 'Notas Rápidas', es: 'Notas Rápidas', icon: FileText, color: 'text-slate-400 border-slate-500/25 bg-slate-500/5' }
];
