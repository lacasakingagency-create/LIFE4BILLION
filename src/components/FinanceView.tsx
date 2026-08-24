/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  AlertTriangle, 
  CheckCircle, 
  PlusCircle, 
  PiggyBank, 
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  BrainCircuit
} from 'lucide-react';
import { LocalDatabase } from '../utils/db';
import { Transaction, Budget, FinancialCard } from '../types/schema';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';
import PaycheckPlannerView from './PaycheckPlannerView';
import CategoryDashboard from './CategoryDashboard';
import CardManagementView from './CardManagementView';
import { CategorySelect } from './CategorySelect';
import { UnifiedFinanceFilter } from './UnifiedFinanceFilter';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { CategoryDonutChart } from './CategoryDonutChart';
import { TransferModal } from './TransferModal';
import { CategorySticker } from './CategorySticker';
import { UnifiedFilterOptions } from '../types/category';
import { ArrowRightLeft, Landmark } from 'lucide-react';
import { Life4BillionConnectModal } from './Life4BillionConnectModal';

interface FinanceViewProps {
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

interface ExcelRow {
  id: string;
  description: string;
  category: string;
  planned: number;
  actual: number;
  status: 'Pendente' | 'Concluído' | 'Pending' | 'Completed' | 'Pendiente' | 'Concluido';
  notes: string;
}

export interface LifeCategoryOption {
  id: string;
  icon: string;
  labelPt: string;
  labelEn: string;
  labelEs: string;
  group?: 'salary_bills' | 'daily_life' | 'wealth_goals' | 'lifestyle';
}

export const EXCEL_BUDGET_CATEGORIES: LifeCategoryOption[] = [
  // Contas de Salário / Fim de Mês (Payday Bills & Essentials)
  { id: 'moradia', icon: '🏠', labelPt: 'Moradia & Aluguel', labelEn: 'Housing & Rent', labelEs: 'Vivienda y Alquiler', group: 'salary_bills' },
  { id: 'contas_basicas', icon: '💡', labelPt: 'Contas Básicas (Luz, Água, Gás)', labelEn: 'Utilities (Power, Water, Gas)', labelEs: 'Servicios Básicos (Luz, Agua, Gas)', group: 'salary_bills' },
  { id: 'telecom', icon: '📶', labelPt: 'Internet Fibra & Celular', labelEn: 'Fiber Internet & Mobile', labelEs: 'Internet Fibra y Celular', group: 'salary_bills' },
  { id: 'cartao_dividas', icon: '💳', labelPt: 'Fatura Cartão & Financiamentos', labelEn: 'Credit Card & Loans', labelEs: 'Tarjeta de Crédito y Préstamos', group: 'salary_bills' },
  { id: 'saude', icon: '🏥', labelPt: 'Plano de Saúde & Farmácia', labelEn: 'Health Insurance & Pharmacy', labelEs: 'Seguro Médico y Farmacia', group: 'salary_bills' },
  { id: 'educacao', icon: '📚', labelPt: 'Educação & Mensalidades', labelEn: 'Education & Tuition', labelEs: 'Educación y Matrículas', group: 'salary_bills' },
  { id: 'investimentos', icon: '📈', labelPt: 'Aporte Reserva & Investimentos', labelEn: 'Savings Reserve & Investments', labelEs: 'Aporte de Ahorro e Inversión', group: 'wealth_goals' },
  { id: 'assinaturas', icon: '📺', labelPt: 'Assinaturas & Streaming', labelEn: 'Subscriptions & Streaming', labelEs: 'Suscripciones y Streaming', group: 'salary_bills' },
  { id: 'familia_filhos', icon: '👪', labelPt: 'Família & Despesas dos Filhos', labelEn: 'Family & Children Expenses', labelEs: 'Familia y Gastos de Hijos', group: 'salary_bills' },

  // Dia a Dia & Rotina (Daily Life & Routine)
  { id: 'alimentacao', icon: '🛒', labelPt: 'Supermercado & Alimentação', labelEn: 'Groceries & Supermarket', labelEs: 'Supermercado y Alimentación', group: 'daily_life' },
  { id: 'transporte', icon: '🚗', labelPt: 'Combustível & Transporte', labelEn: 'Fuel & Transportation', labelEs: 'Combustible y Transporte', group: 'daily_life' },
  { id: 'lazer_restaurantes', icon: '🍽️', labelPt: 'Lazer, Delivery & Restaurantes', labelEn: 'Dining, Delivery & Leisure', labelEs: 'Ocio, Delivery y Restaurantes', group: 'lifestyle' },
  { id: 'cuidados_pessoais', icon: '💈', labelPt: 'Cuidados Pessoais & Barbearia', labelEn: 'Personal Care & Grooming', labelEs: 'Cuidado Personal y Barbería', group: 'lifestyle' },
  { id: 'pets', icon: '🐾', labelPt: 'Pets, Ração & Veterinário', labelEn: 'Pets, Food & Vet', labelEs: 'Mascotas, Alimento y Veterinaria', group: 'daily_life' },
  { id: 'trabalho_negocios', icon: '💼', labelPt: 'Trabalho, Ferramentas & Ads', labelEn: 'Work, Tools & Ads', labelEs: 'Trabajo, Herramientas y Ads', group: 'daily_life' },
  { id: 'imprevistos', icon: '🛡️', labelPt: 'Imprevistos & Manutenção', labelEn: 'Emergency & Home Repairs', labelEs: 'Imprevistos y Mantenimiento', group: 'daily_life' },
  { id: 'sono', icon: '😴', labelPt: 'Sono & Bem-Estar', labelEn: 'Sleep & Wellness', labelEs: 'Sueño y Bienestar', group: 'lifestyle' },
  { id: 'dinheiro', icon: '💰', labelPt: 'Dinheiro & Outras Finanças', labelEn: 'Money & Miscellaneous', labelEs: 'Dinero y Finanzas Varias', group: 'wealth_goals' },
];

export const getCategoryDisplay = (catNameOrId: string, language: string) => {
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const raw = (catNameOrId || '').toLowerCase().trim();

  const found = EXCEL_BUDGET_CATEGORIES.find(c => 
    c.id === raw || 
    c.labelPt.toLowerCase() === raw ||
    c.labelEn.toLowerCase() === raw ||
    c.labelEs.toLowerCase() === raw ||
    raw.includes(c.id) ||
    (c.id === 'moradia' && (raw.includes('aluguel') || raw.includes('moradia') || raw.includes('rent') || raw.includes('housing') || raw.includes('vivienda'))) ||
    (c.id === 'contas_basicas' && (raw.includes('conta') || raw.includes('luz') || raw.includes('energia') || raw.includes('água') || raw.includes('utilities') || raw.includes('servicios'))) ||
    (c.id === 'telecom' && (raw.includes('internet') || raw.includes('celular') || raw.includes('fibra') || raw.includes('mobile') || raw.includes('telefonia'))) ||
    (c.id === 'alimentacao' && (raw.includes('supermercado') || raw.includes('alimenta') || raw.includes('mercado') || raw.includes('grocer') || raw.includes('comida'))) ||
    (c.id === 'transporte' && (raw.includes('transporte') || raw.includes('combust') || raw.includes('gasolina') || raw.includes('fuel') || raw.includes('carro'))) ||
    (c.id === 'cartao_dividas' && (raw.includes('cartão') || raw.includes('cartao') || raw.includes('carton') || raw.includes('fatura') || raw.includes('card') || raw.includes('debt') || raw.includes('deuda'))) ||
    (c.id === 'saude' && (raw.includes('saúde') || raw.includes('saude') || raw.includes('health') || raw.includes('salud') || raw.includes('farmácia') || raw.includes('farmacia') || raw.includes('médic') || raw.includes('medic'))) ||
    (c.id === 'investimentos' && (raw.includes('invest') || raw.includes('reserva') || raw.includes('poup') || raw.includes('saving') || raw.includes('ahorro'))) ||
    (c.id === 'assinaturas' && (raw.includes('assinatura') || raw.includes('subscript') || raw.includes('suscrip') || raw.includes('streaming') || raw.includes('netflix') || raw.includes('openai'))) ||
    (c.id === 'educacao' && (raw.includes('educa') || raw.includes('estudo') || raw.includes('curso') || raw.includes('school') || raw.includes('tuition'))) ||
    (c.id === 'familia_filhos' && (raw.includes('famíl') || raw.includes('famil') || raw.includes('filho') || raw.includes('child') || raw.includes('kid') || raw.includes('hijo'))) ||
    (c.id === 'lazer_restaurantes' && (raw.includes('lazer') || raw.includes('restaurante') || raw.includes('delivery') || raw.includes('dining') || raw.includes('ocio'))) ||
    (c.id === 'cuidados_pessoais' && (raw.includes('cuidado') || raw.includes('barbearia') || raw.includes('groom') || raw.includes('higiene') || raw.includes('personal'))) ||
    (c.id === 'trabalho_negocios' && (raw.includes('trabalho') || raw.includes('work') || raw.includes('trabajo') || raw.includes('produtividade') || raw.includes('ads') || raw.includes('business'))) ||
    (c.id === 'pets' && (raw.includes('pet') || raw.includes('animal') || raw.includes('ração') || raw.includes('racion') || raw.includes('mascota') || raw.includes('veterin'))) ||
    (c.id === 'imprevistos' && (raw.includes('imprevisto') || raw.includes('manuten') || raw.includes('emergency') || raw.includes('conserto') || raw.includes('repar'))) ||
    (c.id === 'sono' && (raw.includes('sono') || raw.includes('sleep') || raw.includes('sueño'))) ||
    (c.id === 'dinheiro' && (raw.includes('dinheiro') || raw.includes('money') || raw.includes('dinero')))
  );

  if (found) {
    const label = isPt ? found.labelPt : isEs ? found.labelEs : found.labelEn;
    return `${found.icon} ${label}`;
  }
  return catNameOrId;
};

export const getDefaultExcelRows = (lang: string): ExcelRow[] => {
  const isPt = lang.toLowerCase().startsWith('pt');
  const isEs = lang.toLowerCase().startsWith('es');

  if (isPt) {
    return [
      { id: '1', description: 'Aluguel do Imóvel / Moradia', category: 'moradia', planned: 2200, actual: 2200, status: 'Concluído', notes: 'Pago no dia 5 após receber salário.' },
      { id: '2', description: 'Condomínio & Taxa IPTU', category: 'moradia', planned: 650, actual: 650, status: 'Concluído', notes: 'Cota condominial mensal do prédio.' },
      { id: '3', description: 'Conta de Energia Elétrica (Luz)', category: 'contas_basicas', planned: 280, actual: 265, status: 'Concluído', notes: 'Consumo do mês com desconto pontualidade.' },
      { id: '4', description: 'Água, Saneamento & Gás Encanado', category: 'contas_basicas', planned: 190, actual: 185, status: 'Concluído', notes: 'Débito automático bancário.' },
      { id: '5', description: 'Supermercado do Mês (Rancho & Feira)', category: 'alimentacao', planned: 1600, actual: 1540, status: 'Concluído', notes: 'Compras principais de mantimentos e proteínas.' },
      { id: '6', description: 'Internet Fibra Ótica & Plano Celular', category: 'telecom', planned: 230, actual: 230, status: 'Concluído', notes: 'Plano 600 Mbps + Linha móvel ilimitada.' },
      { id: '7', description: 'Fatura Integral do Cartão de Crédito', category: 'cartao_dividas', planned: 2400, actual: 2380, status: 'Concluído', notes: 'Pagamento total sem incidência de juros.' },
      { id: '8', description: 'Plano de Saúde Familiar (Convênio)', category: 'saude', planned: 850, actual: 850, status: 'Concluído', notes: 'Mensalidade da assistência médica.' },
      { id: '9', description: 'Combustível & Abastecimento do Carro', category: 'transporte', planned: 600, actual: 580, status: 'Concluído', notes: 'Gasolina aditivada para locomoção diária.' },
      { id: '10', description: 'Aporte na Reserva de Emergência (10%)', category: 'investimentos', planned: 1000, actual: 1000, status: 'Concluído', notes: 'Aporte direto no Tesouro Selic / CDB Liquidez Diária.' },
      { id: '11', description: 'Assinaturas (Netflix, Spotify, ChatGPT Plus)', category: 'assinaturas', planned: 180, actual: 180, status: 'Concluído', notes: 'Serviços digitais de entretenimento e IA.' },
      { id: '12', description: 'Farmácia, Vitaminas & Remédios Contínuos', category: 'saude', planned: 150, actual: 120, status: 'Concluído', notes: 'Vitamina D, Ômega 3 e remédios de rotina.' },
      { id: '13', description: 'Delivery, Jantar & Lazer de Fim de Semana', category: 'lazer_restaurantes', planned: 400, actual: 350, status: 'Concluído', notes: 'Refeições com a família nos finais de semana.' },
      { id: '14', description: 'Ração Super Premium & Pet Shop', category: 'pets', planned: 220, actual: 210, status: 'Concluído', notes: 'Ração de 15kg e antipulgas do cão.' },
      { id: '15', description: 'Barbearia / Salão & Cuidados Pessoais', category: 'cuidados_pessoais', planned: 160, actual: 160, status: 'Concluído', notes: 'Corte de cabelo, barba e higiene pessoal.' },
    ];
  } else if (isEs) {
    return [
      { id: '1', description: 'Alquiler de Vivienda / Hogar', category: 'moradia', planned: 2200, actual: 2200, status: 'Concluido', notes: 'Pagado el día 5 tras cobrar el sueldo.' },
      { id: '2', description: 'Gastos Comunes / Condominio e Impuestos', category: 'moradia', planned: 650, actual: 650, status: 'Concluido', notes: 'Cuota mensual del edificio.' },
      { id: '3', description: 'Factura de Electricidad (Luz)', category: 'contas_basicas', planned: 280, actual: 265, status: 'Concluido', notes: 'Consumo eléctrico del hogar.' },
      { id: '4', description: 'Agua, Saneamiento y Gas', category: 'contas_basicas', planned: 190, actual: 185, status: 'Concluido', notes: 'Débito automático bancario.' },
      { id: '5', description: 'Supermercado del Mes y Alimentos', category: 'alimentacao', planned: 1600, actual: 1540, status: 'Concluido', notes: 'Compra mensual de despensa.' },
      { id: '6', description: 'Internet Fibra Óptica y Telefonía Móvil', category: 'telecom', planned: 230, actual: 230, status: 'Concluido', notes: 'Conexión de 600 Mbps + Línea móvil.' },
      { id: '7', description: 'Resumen de Tarjeta de Crédito', category: 'cartao_dividas', planned: 2400, actual: 2380, status: 'Concluido', notes: 'Pago total del resumen mensual.' },
      { id: '8', description: 'Seguro Médico / Obra Social Familiar', category: 'saude', planned: 850, actual: 850, status: 'Concluido', notes: 'Cuota mensual de cobertura médica.' },
      { id: '9', description: 'Combustible y Movilidad', category: 'transporte', planned: 600, actual: 580, status: 'Concluido', notes: 'Carga de combustible para el trabajo.' },
      { id: '10', description: 'Aporte al Fondo de Emergencia / Ahorro', category: 'investimentos', planned: 1000, actual: 1000, status: 'Concluido', notes: '10% del salario destinado a ahorro.' },
      { id: '11', description: 'Suscripciones (Netflix, Spotify, ChatGPT)', category: 'assinaturas', planned: 180, actual: 180, status: 'Concluido', notes: 'Servicios digitales y streaming.' },
      { id: '12', description: 'Farmacia y Vitaminas de Rutina', category: 'saude', planned: 150, actual: 120, status: 'Concluido', notes: 'Medicamentos y cuidado de la salud.' },
      { id: '13', description: 'Delivery y Cenas de Fin de Semana', category: 'lazer_restaurantes', planned: 400, actual: 350, status: 'Concluido', notes: 'Comidas y entretenimiento familiar.' },
      { id: '14', description: 'Alimento y Veterinaria de Mascotas', category: 'pets', planned: 220, actual: 210, status: 'Concluido', notes: 'Alimento balanceado premium.' },
      { id: '15', description: 'Barbería y Cuidado Personal', category: 'cuidados_pessoais', planned: 160, actual: 160, status: 'Concluido', notes: 'Corte de cabello e higiene.' },
    ];
  } else {
    return [
      { id: '1', description: 'Home Rent / Mortgage Payment', category: 'moradia', planned: 2200, actual: 2200, status: 'Completed', notes: 'Paid on the 5th after paycheck deposit.' },
      { id: '2', description: 'HOA Fees & Property Taxes', category: 'moradia', planned: 650, actual: 650, status: 'Completed', notes: 'Monthly building / community fee.' },
      { id: '3', description: 'Electric Power & Light Bill', category: 'contas_basicas', planned: 280, actual: 265, status: 'Completed', notes: 'Monthly residential power consumption.' },
      { id: '4', description: 'Water, Sewer & Natural Gas', category: 'contas_basicas', planned: 190, actual: 185, status: 'Completed', notes: 'Automatic bank debit.' },
      { id: '5', description: 'Monthly Groceries & Food Supplies', category: 'alimentacao', planned: 1600, actual: 1540, status: 'Completed', notes: 'Essential supermarket haul and fresh produce.' },
      { id: '6', description: 'Fiber Internet & Cell Phone Plan', category: 'telecom', planned: 230, actual: 230, status: 'Completed', notes: '600 Mbps fiber + Unlimited mobile line.' },
      { id: '7', description: 'Credit Card Full Statement Bill', category: 'cartao_dividas', planned: 2400, actual: 2380, status: 'Completed', notes: 'Paid in full to avoid revolving interest.' },
      { id: '8', description: 'Family Health Insurance Premium', category: 'saude', planned: 850, actual: 850, status: 'Completed', notes: 'Monthly medical plan coverage.' },
      { id: '9', description: 'Vehicle Fuel & Commute Gas', category: 'transporte', planned: 600, actual: 580, status: 'Completed', notes: 'Weekly fuel for work commute.' },
      { id: '10', description: 'Emergency Fund Savings Deposit', category: 'investimentos', planned: 1000, actual: 1000, status: 'Completed', notes: '10% of monthly salary to high-yield reserve.' },
      { id: '11', description: 'Digital Subscriptions (Netflix, Spotify, ChatGPT)', category: 'assinaturas', planned: 180, actual: 180, status: 'Completed', notes: 'Streaming, audio and AI tools.' },
      { id: '12', description: 'Pharmacy, Supplements & First Aid', category: 'saude', planned: 150, actual: 120, status: 'Completed', notes: 'Routine vitamins and prescription items.' },
      { id: '13', description: 'Weekend Dining & Food Delivery', category: 'lazer_restaurantes', planned: 400, actual: 350, status: 'Completed', notes: 'Family dinners and takeout meals.' },
      { id: '14', description: 'Pet Nutrition, Treats & Vet Care', category: 'pets', planned: 220, actual: 210, status: 'Completed', notes: 'Super premium pet food bag.' },
      { id: '15', description: 'Barbershop, Hair & Personal Grooming', category: 'cuidados_pessoais', planned: 160, actual: 160, status: 'Completed', notes: 'Haircut and hygiene products.' },
    ];
  }
};

export interface PlannerItem {
  date: string;
  description: string;
  amount: number;
}

export interface PlannerSheet {
  budgetGoal: string;
  month: string;
  income: PlannerItem[];
  fixedExpenses: PlannerItem[];
  otherExpenses: PlannerItem[];
  bills: PlannerItem[];
  recapGoals: {
    earnt: number;
    spent: number;
    debt: number;
    saved: number;
  };
}

export const PLANNER_CATEGORIES = [
  'Monthly Budget',
  'Expense Tracker',
  'Income Tracker',
  'Bills Tracker',
  'Savings Tracker',
  'Debt Tracker',
  'Net Worth Tracker',
  'Subscription Tracker',
  'Cash Flow Tracker',
  'Financial Goals Tracker'
];

const DEFAULT_PLANNER_SHEET = (): PlannerSheet => ({
  budgetGoal: '',
  month: '',
  income: Array.from({ length: 8 }, () => ({ date: '', description: '', amount: 0 })),
  fixedExpenses: Array.from({ length: 8 }, () => ({ date: '', description: '', amount: 0 })),
  otherExpenses: Array.from({ length: 8 }, () => ({ date: '', description: '', amount: 0 })),
  bills: Array.from({ length: 8 }, () => ({ date: '', description: '', amount: 0 })),
  recapGoals: {
    earnt: 0,
    spent: 0,
    debt: 0,
    saved: 0
  }
});

export default function FinanceView({ onShowNotification }: FinanceViewProps) {
  const { t, language, currency } = useLanguageTheme();
  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'EUR' ? '€' : '$';

  // Trilingual helper for dynamic fallback handling (Portuguese, English, Spanish)
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const [activeTab, setActiveTab] = useState<'cards' | 'paycheck-planner' | 'transactions' | 'budgets' | 'excel-budget' | 'planner-universal'>('cards');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const isCompletedStatus = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    return s === 'concluído' || s === 'completed' || s === 'concluido' || s === 'pago' || s === 'paid';
  };

  const getStatusLabel = (status: string) => {
    if (isCompletedStatus(status)) {
      return tr('Concluído', 'Completed', 'Concluido');
    }
    return tr('Pendente', 'Pending', 'Pendiente');
  };

  const handleExport = (type: 'excel' | 'pdf' | 'docs' | 'print') => {
    const title = tr(
      'Planilha de Planejamento Orçamentário (I Love Mi)',
      'Budget Planning Spreadsheet (I Love Mi)',
      'Planilla de Planificación Presupuestaria (I Love Mi)'
    );
    if (type === 'excel') {
      const headers = [
        tr('Ref', 'Ref', 'Ref'),
        tr('Descrição', 'Description', 'Descripción'),
        tr('Categoria de Vida', 'Life Category', 'Categoría de Vida'),
        tr('Valor Planejado', 'Planned Value', 'Valor Planificado'),
        tr('Valor Real', 'Actual Value', 'Valor Real'),
        tr('Diferença', 'Difference', 'Diferencia'),
        tr('Status', 'Status', 'Estado'),
        tr('Anotações/Observações', 'Notes/Comments', 'Notas/Observaciones')
      ];
      const csvRows = [headers.join(",")];
      excelRows.forEach((row, i) => {
        const ref = String.fromCharCode(65 + (i % 26)) + (i + 1);
        const diff = (row.planned || 0) - (row.actual || 0);
        const catLabel = getCategoryDisplay(row.category, language);
        const statusLabel = getStatusLabel(row.status);
        csvRows.push([
          ref,
          `"${(row.description || '').replace(/"/g, '""')}"`,
          `"${catLabel.replace(/"/g, '""')}"`,
          row.planned || 0,
          row.actual || 0,
          diff,
          statusLabel,
          `"${(row.notes || '').replace(/"/g, '""')}"`
        ].join(","));
      });
      const blob = new Blob(["\ufeff" + csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `planilha_orcamento_life4billion_${language}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowNotification(
        tr('Sucesso', 'Success', 'Éxito'),
        tr('Planilha exportada com sucesso em formato Excel!', 'Spreadsheet successfully exported in Excel format!', '¡Planilla exportada con éxito en formato Excel!'),
        'success'
      );
    } else if (type === 'docs') {
      const docContent = `\ufeff===============================================\n`
        + `${title.toUpperCase()}\n`
        + `===============================================\n\n`
        + excelRows.map((row, i) => {
          const ref = String.fromCharCode(65 + (i % 26)) + (i + 1);
          const catLabel = getCategoryDisplay(row.category, language);
          const statusLabel = getStatusLabel(row.status);
          return `[${ref}] ${row.description}\n`
            + `   - ${tr('Categoria', 'Category', 'Categoría')}: ${catLabel}\n`
            + `   - ${tr('Planejado', 'Planned', 'Planificado')}: ${formatCurrency(row.planned || 0, language)}\n`
            + `   - ${tr('Real', 'Actual', 'Real')}: ${formatCurrency(row.actual || 0, language)}\n`
            + `   - ${tr('Status', 'Status', 'Estado')}: ${statusLabel}\n`
            + `   - ${tr('Notas', 'Notes', 'Notas')}: ${row.notes || 'N/A'}\n`;
        }).join("\n");
      const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_orcamento_life4billion_${language}.doc`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowNotification(
        tr('Sucesso', 'Success', 'Éxito'),
        tr('Relatório exportado com sucesso em formato DOCS!', 'Report successfully exported in DOCS format!', '¡Informe exportado con éxito en formato DOCS!'),
        'success'
      );
    } else if (type === 'print' || type === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { font-family: sans-serif; padding: 20px; color: #111; }
                h1 { border-bottom: 2px solid #ccc; padding-bottom: 10px; font-size: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
              </style>
            </head>
            <body>
              <h1>${title}</h1>
              <p>${tr('Relatório gerado em', 'Report generated on', 'Informe generado el')} ${new Date().toLocaleDateString()}</p>
              <table>
                <thead>
                  <tr>
                    <th>${tr('Ref', 'Ref', 'Ref')}</th>
                    <th>${tr('Descrição', 'Description', 'Descripción')}</th>
                    <th>${tr('Categoria de Vida', 'Life Category', 'Categoría de Vida')}</th>
                    <th class="text-right">${tr('Valor Planejado', 'Planned Value', 'Valor Planificado')}</th>
                    <th class="text-right">${tr('Valor Real', 'Actual Value', 'Valor Real')}</th>
                    <th class="text-right">${tr('Diferença', 'Difference', 'Diferencia')}</th>
                    <th class="text-center">${tr('Status', 'Status', 'Estado')}</th>
                    <th>${tr('Anotações', 'Notes', 'Notas')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${excelRows.map((row, i) => {
                    const ref = String.fromCharCode(65 + (i % 26)) + (i + 1);
                    const diff = (row.planned || 0) - (row.actual || 0);
                    const catLabel = getCategoryDisplay(row.category, language);
                    const statusLabel = getStatusLabel(row.status);
                    return `
                      <tr>
                        <td class="text-center font-bold">${ref}</td>
                        <td>${row.description || ''}</td>
                        <td>${catLabel}</td>
                        <td class="text-right">${formatCurrency(row.planned || 0, language)}</td>
                        <td class="text-right">${formatCurrency(row.actual || 0, language)}</td>
                        <td class="text-right font-bold">${diff >= 0 ? '+' : ''}${formatCurrency(diff, language)}</td>
                        <td class="text-center">${statusLabel}</td>
                        <td>${row.notes || ''}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
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
          tr('Sucesso', 'Success', 'Éxito'),
          type === 'pdf'
            ? tr('Aberto diálogo de salvamento em PDF!', 'PDF export dialog opened!', '¡Diálogo de guardado en PDF abierto!')
            : tr('Diálogo de impressão aberto!', 'Print dialog opened!', '¡Diálogo de impresión abierto!'),
          'success'
        );
      } else {
        onShowNotification(
          tr('Aviso', 'Warning', 'Aviso'),
          tr('Por favor, habilite popups no seu navegador para exportar.', 'Please enable popups in your browser to export.', 'Por favor, habilite las ventanas emergentes para exportar.'),
          'warning'
        );
      }
    }
  };

  const handlePrintPlanner = (category: string, sheet: PlannerSheet) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onShowNotification('Aviso', 'Habilite popups no seu navegador para imprimir.', 'warning');
      return;
    }
    
    // Calculate sums
    const sumIncome = sheet.income.reduce((sum, item) => sum + (item.amount || 0), 0);
    const sumFixed = sheet.fixedExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const sumOther = sheet.otherExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const sumBills = sheet.bills.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const actualSpent = sumFixed + sumOther + sumBills;
    const actualDebt = sheet.recapGoals.debt; 
    const actualSaved = sumIncome - actualSpent - actualDebt;
    
    const diffEarnt = sumIncome - sheet.recapGoals.earnt;
    const diffSpent = sheet.recapGoals.spent - actualSpent;
    const diffDebt = sheet.recapGoals.debt - actualDebt;
    const diffSaved = actualSaved - sheet.recapGoals.saved;

    const renderRows = (items: PlannerItem[]) => {
      return items.map((item) => `
        <tr>
          <td style="width: 20%; border: 1px solid black; padding: 6px; font-family: monospace; text-align: center; height: 24px;">${item.date || ''}</td>
          <td style="width: 60%; border: 1px solid black; padding: 6px; text-align: left; height: 24px;">${item.description || ''}</td>
          <td style="width: 20%; border: 1px solid black; padding: 6px; font-family: monospace; text-align: right; height: 24px;">${item.amount ? formatCurrency(item.amount, language) : ''}</td>
        </tr>
      `).join('');
    };

    printWindow.document.write(`
      <html>
        <head>
          <title>${category.toUpperCase()} - BUDGET PLANNER</title>
          <style>
            @media print {
              body { background-color: white !important; color: black !important; padding: 0 !important; border: none !important; box-shadow: none !important; }
              .no-print { display: none !important; }
            }
            body {
              font-family: 'Georgia', serif;
              color: #111;
              background-color: #FAF8F5;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #ddd;
              box-shadow: 0 0 10px rgba(0,0,0,0.05);
            }
            h1 {
              font-size: 28px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 2px;
              text-align: center;
              margin-bottom: 20px;
              font-family: 'Times New Roman', Times, serif;
            }
            .grid-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-top: 20px;
            }
            .section-title {
              font-family: sans-serif;
              font-weight: bold;
              font-size: 14px;
              text-align: left;
              margin-bottom: 5px;
              color: #000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            th, td {
              border: 1px solid black;
              padding: 5px;
              font-size: 11px;
            }
            th {
              font-family: sans-serif;
              font-weight: bold;
              background-color: #f0f0f0;
              text-transform: uppercase;
              text-align: center;
            }
            .total-row td {
              font-weight: bold;
              font-family: sans-serif;
            }
            .header-inputs {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 20px;
            }
            .header-field {
              border-bottom: 1px solid black;
              padding-bottom: 5px;
              font-size: 12px;
              font-family: sans-serif;
              text-align: left;
            }
            .header-field-title {
              font-weight: bold;
            }
            .recap-table th {
              background-color: #e5e5e5;
            }
            .recap-table td {
              padding: 6px;
              height: 20px;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; text-align: center; color: #666; margin-bottom: 5px;">
            ${category}
          </div>
          <h1>${t('monthlyBudgetPlanner', 'Monthly Budget Planner')}</h1>
          
          <div class="header-inputs">
            <div class="header-field">
              <span class="header-field-title">${t('budgetGoalLabel', 'Budget Goal:')}</span> ${sheet.budgetGoal || '&nbsp;'}
            </div>
            <div class="header-field">
              <span class="header-field-title">${t('monthLabel', 'Month:')}</span> ${sheet.month || '&nbsp;'}
            </div>
          </div>
          
          <div class="grid-container">
            <div>
              <div class="section-title">${t('income', 'Income')}</div>
              <table>
                <thead>
                  <tr>
                    <th>${t('dateLabel', 'Date')}</th>
                    <th>${t('description', 'Description')}</th>
                    <th>${t('amount', 'Amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderRows(sheet.income)}
                  <tr class="total-row">
                    <td colspan="2">${t('total', 'Total')}</td>
                    <td style="text-align: right; font-family: monospace;">${formatCurrency(sumIncome, language)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div class="section-title">${t('fixedExpenses', 'Fixed Expenses')}</div>
              <table>
                <thead>
                  <tr>
                    <th>${t('dateLabel', 'Date')}</th>
                    <th>${t('description', 'Description')}</th>
                    <th>${t('amount', 'Amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderRows(sheet.fixedExpenses)}
                  <tr class="total-row">
                    <td colspan="2">${t('total', 'Total')}</td>
                    <td style="text-align: right; font-family: monospace;">${formatCurrency(sumFixed, language)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div class="section-title">${t('otherExpenses', 'Other Expenses')}</div>
              <table>
                <thead>
                  <tr>
                    <th>${t('dateLabel', 'Date')}</th>
                    <th>${t('description', 'Description')}</th>
                    <th>${t('amount', 'Amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderRows(sheet.otherExpenses)}
                  <tr class="total-row">
                    <td colspan="2">${t('total', 'Total')}</td>
                    <td style="text-align: right; font-family: monospace;">${formatCurrency(sumOther, language)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div class="section-title">${t('bills', 'Bills')}</div>
              <table>
                <thead>
                  <tr>
                    <th>${t('dateLabel', 'Date')}</th>
                    <th>${t('description', 'Description')}</th>
                    <th>${t('amount', 'Amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${renderRows(sheet.bills)}
                  <tr class="total-row">
                    <td colspan="2">${t('total', 'Total')}</td>
                    <td style="text-align: right; font-family: monospace;">${formatCurrency(sumBills, language)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div style="margin-top: 10px;">
            <div class="section-title">${t('recap', 'Recap')}</div>
            <table class="recap-table">
              <thead>
                <tr>
                  <th style="width: 25%;"></th>
                  <th style="width: 25%;">${t('goal', 'Goal')}</th>
                  <th style="width: 25%;">${t('actual', 'Actual')}</th>
                  <th style="width: 25%;">${t('difference', 'Difference')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: bold; background-color: #f9f9f9; text-align: left;">${t('earnt', 'Earnt')}</td>
                  <td style="text-align: right; font-family: monospace;">${formatCurrency(sheet.recapGoals.earnt, language)}</td>
                  <td style="text-align: right; font-family: monospace;">${formatCurrency(sumIncome, language)}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatCurrency(diffEarnt, language)}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; background-color: #f9f9f9; text-align: left;">${t('spent', 'Spent')}</td>
                  <td style="text-align: right; font-family: monospace;">${formatCurrency(sheet.recapGoals.spent, language)}</td>
                  <td style="text-align: right; font-family: monospace;">${formatCurrency(actualSpent, language)}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatCurrency(diffSpent, language)}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; background-color: #f9f9f9; text-align: left;">${t('debt', 'Debt')}</td>
                  <td style="text-align: right; font-family: monospace;">${formatCurrency(sheet.recapGoals.debt, language)}</td>
                  <td style="text-align: right; font-family: monospace;">${formatCurrency(actualDebt, language)}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatCurrency(diffDebt, language)}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; background-color: #f9f9f9; text-align: left;">${t('saved', 'Saved')}</td>
                  <td style="text-align: right; font-family: monospace;">${formatCurrency(sheet.recapGoals.saved, language)}</td>
                  <td style="text-align: right; font-family: monospace;">${formatCurrency(actualSaved, language)}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatCurrency(diffSaved, language)}</td>
                </tr>
              </tbody>
            </table>
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
    onShowNotification('Sucesso', 'Visualização de impressão aberta!', 'success');
  };

  // Excel Sheet budget state scoped to active user
  const loadUserExcelRows = (): ExcelRow[] => {
    const key = LocalDatabase.getUserKey('excel_budget');
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return getDefaultExcelRows(language);
  };

  const [excelRows, setExcelRows] = useState<ExcelRow[]>(loadUserExcelRows);
  const [excelCategoryFilter, setExcelCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const key = LocalDatabase.getUserKey('excel_budget');
    localStorage.setItem(key, JSON.stringify(excelRows));
  }, [excelRows]);

  // Universal Planner states scoped to active user
  const loadUserPlannerSheets = (): { [category: string]: PlannerSheet } => {
    const key = LocalDatabase.getUserKey('planner_sheets');
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        PLANNER_CATEGORIES.forEach(cat => {
          if (!parsed[cat]) {
            parsed[cat] = DEFAULT_PLANNER_SHEET();
            parsed[cat].month = '';
          } else {
            // Ensure lists have 8 items
            const keys: ('income' | 'fixedExpenses' | 'otherExpenses' | 'bills')[] = ['income', 'fixedExpenses', 'otherExpenses', 'bills'];
            keys.forEach(listKey => {
              const list = parsed[cat][listKey] || [];
              if (list.length < 8) {
                parsed[cat][listKey] = [...list, ...Array.from({ length: 8 - list.length }, () => ({ date: '', description: '', amount: 0 }))];
              }
            });
          }
        });
        return parsed;
      } catch (e) {}
    }

    const initial: { [category: string]: PlannerSheet } = {};
    PLANNER_CATEGORIES.forEach(cat => {
      initial[cat] = DEFAULT_PLANNER_SHEET();
      initial[cat].month = '';
    });
    return initial;
  };

  const [selectedPlannerCategory, setSelectedPlannerCategory] = useState<string>('Monthly Budget');
  const [plannerSheets, setPlannerSheets] = useState<{ [category: string]: PlannerSheet }>(loadUserPlannerSheets);

  useEffect(() => {
    const key = LocalDatabase.getUserKey('planner_sheets');
    localStorage.setItem(key, JSON.stringify(plannerSheets));
  }, [plannerSheets]);

  // Transaction form states & validation
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Vendas SaaS');
  const [txDate, setTxDate] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txError, setTxError] = useState('');

  // Budget form states & validation
  const [bgCategory, setBgCategory] = useState('Infraestrutura');
  const [bgLimit, setBgLimit] = useState('');
  const [bgPeriod, setBgPeriod] = useState('2026-07');
  const [bgError, setBgError] = useState('');

  // Selected category dashboard states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBudgetLimit, setSelectedBudgetLimit] = useState<number>(0);

  // Categories list
  const incomeCategories = ['Vendas SaaS', 'Consultorias', 'Aportes', 'Outros'];
  const expenseCategories = ['Infraestrutura', 'Ferramentas IA', 'Marketing', 'Alimentação', 'Folha de Pagamento', 'Escritório', 'Impostos', 'Outros'];

  // Cards and Filter states
  const [cards, setCards] = useState<FinancialCard[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [unifiedFilter, setUnifiedFilter] = useState<UnifiedFilterOptions>({
    period: 'month',
    categoryGroup: '',
    category: '',
    type: 'all',
    searchQuery: '',
  });

  const reloadData = () => {
    setTransactions(LocalDatabase.getTransactions());
    setBudgets(LocalDatabase.getBudgets());
    setCards(LocalDatabase.getCards());
    setExcelRows(loadUserExcelRows());
    setPlannerSheets(loadUserPlannerSheets());
  };

  useEffect(() => {
    reloadData();
    window.addEventListener('life4billion_user_switched', reloadData);
    return () => window.removeEventListener('life4billion_user_switched', reloadData);
  }, []);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxError('Por favor, informe um valor monetário positivo maior que zero.');
      return;
    }
    if (!txDate) {
      setTxError('Por favor, insira uma data válida para o lançamento.');
      return;
    }
    setTxError('');

    const newTx = LocalDatabase.addTransaction({
      type: txType,
      amount: amountNum,
      category: txCategory,
      date: txDate,
      description: txDesc.trim() || `Lançamento de ${txCategory}`
    });

    // Refresh state
    setTransactions(LocalDatabase.getTransactions());
    setBudgets(LocalDatabase.getBudgets());
    
    // Reset inputs
    setTxAmount('');
    setTxDesc('');
    
    onShowNotification(
      'Lançamento Efetuado', 
      `${txType === 'income' ? 'Crédito' : 'Débito'} de ${formatCurrency(amountNum, language)} registrado em "${txCategory}".`, 
      'success'
    );
  };

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(bgLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setBgError('Por favor, insira um limite orçamentário positivo.');
      return;
    }
    if (!bgPeriod.trim()) {
      setBgError('Especifique a competência periódica (Ex: 2026-07).');
      return;
    }
    setBgError('');

    LocalDatabase.addBudget({
      category: bgCategory,
      limit_amount: limitNum,
      period: bgPeriod
    });

    setBudgets(LocalDatabase.getBudgets());
    setBgLimit('');
    onShowNotification('Teto Orçamentário Salvo', `Orçamento para "${bgCategory}" definido em ${formatCurrency(limitNum, language)}.`, 'success');
  };

  const handleDeleteTransaction = (id: string, amount: number) => {
    const updated = LocalDatabase.deleteTransaction(id);
    setTransactions(updated);
    setBudgets(LocalDatabase.getBudgets());
    onShowNotification('Transação Cancelada', `Lançamento de ${formatCurrency(amount, language)} apagado permanentemente.`, 'info');
  };

  const handleDeleteBudget = (id: string, category: string) => {
    const updated = LocalDatabase.deleteBudget(id);
    setBudgets(updated);
    onShowNotification('Orçamento Excluído', `Teto limite para "${category}" removido do controle corporativo.`, 'info');
  };

  const handleCategoryAddTransaction = (tx: Omit<Transaction, 'id' | 'user_id'>) => {
    LocalDatabase.addTransaction(tx);
    setTransactions(LocalDatabase.getTransactions());
    setBudgets(LocalDatabase.getBudgets());
    onShowNotification(
      'Lançamento Registrado', 
      `${tx.type === 'income' ? 'Receita' : 'Despesa'} de ${formatCurrency(tx.amount, language)} adicionada a ${tx.category}.`, 
      'success'
    );
  };

  const handleCategoryDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    const amount = tx ? tx.amount : 0;
    const updated = LocalDatabase.deleteTransaction(id);
    setTransactions(updated);
    setBudgets(LocalDatabase.getBudgets());
    onShowNotification('Lançamento Removido', `O registro de ${formatCurrency(amount, language)} foi removido com sucesso.`, 'info');
  };

  // Summaries calculation
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6" id="finance-view-root">
      
      {/* Top Ledger Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="finance-ledger-cards">
        {/* Receitas */}
        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block">
              {t('grossIncomeAccumulated', tr('Receita Bruta Acumulada', 'Gross Income Accumulated', 'Ingresos Brutos Acumulados'))}
            </span>
            <span className="text-emerald-400 font-black text-xl">{formatCurrency(totalIncome, language)}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/10">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block">
              {t('operatingExpenses', tr('Despesas Operacionais', 'Operating Expenses', 'Gastos Operativos'))}
            </span>
            <span className="text-rose-400 font-black text-xl">{formatCurrency(totalExpense, language)}</span>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/10">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block">
              {t('netCashFlow', tr('Fluxo de Caixa Líquido', 'Net Cash Flow', 'Flujo de Caja Neto'))}
            </span>
            <span className={`font-black text-xl ${balance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              {formatCurrency(balance, language)}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${balance >= 0 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/10' : 'bg-rose-500/10 text-rose-400 border-rose-500/10'}`}>
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-850 gap-1" id="finance-sub-tabs">
        <button 
          onClick={() => setActiveTab('cards')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'cards' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-cards"
        >
          <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
          <span>{tr('Cartões & Faturas (Visa / Master)', 'Cards & Invoices (Visa / Master)', 'Tarjetas y Facturas (Visa / Master)')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('transactions')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'transactions' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-transactions"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{tr('Extrato de Transações', 'Transactions Statement', 'Estado de Transacciones')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('budgets')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'budgets' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-budgets"
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>{tr('Orçamentos de Categoria', 'Category Budgets', 'Presupuestos por Categoría')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('excel-budget')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'excel-budget' 
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-excel-budget"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>{tr('Planilha Orçamentária Excel (I Love Mi)', 'Excel Budget Spreadsheet (I Love Mi)', 'Hoja de Presupuesto Excel (I Love Mi)')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('planner-universal')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'planner-universal' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-planner-universal"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
          <span>{tr('Planner Universal', 'Universal Planner', 'Planificador Universal')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('paycheck-planner')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'paycheck-planner' 
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-paycheck-planner"
        >
          <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
          <span>{tr('Paycheck Planner (IA)', 'Paycheck Planner (AI)', 'Planificador de Salario (IA)')}</span>
        </button>

        <div className="ml-auto flex items-center self-center pr-2 pb-1">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl transition flex items-center space-x-2 shadow-sm"
            id="btn-open-finance-modal"
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>{tr('Conectar Banco / Open Finance', 'Connect Bank / Open Finance', 'Conectar Banco / Open Finance')}</span>
          </button>
        </div>
      </div>

      {/* VIEW 0: CARDS & CREDIT */}
      {activeTab === 'cards' && (
        <CardManagementView onShowNotification={onShowNotification} />
      )}

      {/* VIEW 1: TRANSACT FLOW */}
      {activeTab === 'transactions' && (
        <div className="space-y-6" id="panel-transactions">
          {/* Top Controls: Unified Filter */}
          <UnifiedFinanceFilter
            filter={unifiedFilter}
            onChange={setUnifiedFilter}
          />

          {/* Financial Summary Cards */}
          <FinancialSummaryCard
            transactions={transactions}
            budgets={budgets}
            filter={unifiedFilter}
          />

          {/* Action Bar: Transfer Between Accounts Button */}
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {tr('Transferência Entre Contas e Cartões', 'Transfer Between Accounts & Cards', 'Transferencia Entre Cuentas y Tarjetas')}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {tr('Mova saldos entre instituições bancárias sem alterar receitas e despesas líquidas.', 'Move balances safely between accounts without double counting.', 'Mueva saldos sin duplicar ingresos/gastos.')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center space-x-2 shrink-0"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{tr('Nova Transferência', 'New Transfer', 'Nueva Transferencia')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Adicionar Transação Form */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 h-fit space-y-4" id="transaction-form-panel">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center">
                <PlusCircle className="w-4 h-4 mr-1.5 text-indigo-400" />
                {t('addTransaction', 'Lançar Movimentação Financeira')}
              </h3>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                {/* Type toggle */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                  <button 
                    type="button"
                    onClick={() => {
                      setTxType('income');
                      setTxCategory('Paycheck');
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      txType === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{tr('Crédito (Entrada)', 'Income (Credit)', 'Crédito (Entrada)')}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setTxType('expense');
                      setTxCategory('Groceries');
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
                      txType === 'expense' ? 'bg-rose-650 text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>{tr('Débito (Saída)', 'Expense (Debit)', 'Débito (Salida)')}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {tr('Valor Monetário', 'Monetary Amount', 'Monto Monetario')} ({currencySymbol})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-slate-500 font-bold text-xs">{currencySymbol}</span>
                    <input 
                      type="number" step="0.01" placeholder="450.00"
                      value={txAmount} onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 font-mono"
                      id="input-tx-amount"
                    />
                  </div>
                </div>

                {/* Category Select with Vector Stickers */}
                <CategorySelect
                  value={txCategory}
                  onChange={setTxCategory}
                  filterType={txType}
                  label={t('category', 'Categoria')}
                />

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    {t('competenceDate', 'Data Competência')}
                  </label>
                  <input 
                    type="date"
                    value={txDate} onChange={(e) => setTxDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    {t('descriptionNotes', 'Descrição / Notas do Lançamento')}
                  </label>
                  <input 
                    type="text" placeholder={t('txDescPlaceholder', 'Ex: Assinatura AWS Cloud mensal')}
                    value={txDesc} onChange={(e) => setTxDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20"
                  id="submit-tx-btn"
                >
                  {t('saveTransaction', 'Salvar Lançamento')}
                </button>

                {txError && (
                  <p className="text-rose-400 text-xs flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    {txError}
                  </p>
                )}
              </form>
            </div>

            {/* Listagem Extrato */}
            <div className="xl:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-6" id="transactions-ledger-panel">
              <h2 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-indigo-400" />
                {tr('Histórico do Livro-Razão (Ledger)', 'Financial Ledger History', 'Historial del Libro Mayor')}
              </h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {transactions
                  .filter((t) => {
                    if (unifiedFilter.type && unifiedFilter.type !== 'all' && t.type !== unifiedFilter.type) return false;
                    if (unifiedFilter.category && t.category.toLowerCase() !== unifiedFilter.category.toLowerCase()) return false;
                    if (unifiedFilter.searchQuery) {
                      const q = unifiedFilter.searchQuery.toLowerCase();
                      if (!t.description.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
                    }
                    return true;
                  })
                  .map((t) => (
                    <div key={t.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between hover:border-slate-800 transition">
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Vector Sticker Icon */}
                        <CategorySticker categoryNameOrId={t.category} size="md" />

                        <div className="truncate pr-4">
                          <p className="text-sm font-bold text-slate-200 truncate" title={t.description}>{t.description}</p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-1">
                            <span className="font-semibold uppercase tracking-wider">{t.category}</span>
                            <span>•</span>
                            <span>{t.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className={`font-mono font-black text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount, language)}
                        </span>
                        <button 
                          onClick={() => handleDeleteTransaction(t.id, t.amount)}
                          className="text-slate-650 hover:text-rose-400 p-1.5 hover:bg-slate-900 rounded-lg transition"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                {transactions.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-12">{t('noTransactionsCataloged', 'Nenhum lançamento financeiro catalogado.')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Donut Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryDonutChart transactions={transactions} type="expense" />
            <CategoryDonutChart transactions={transactions} type="income" />
          </div>

          {/* Transfer Modal */}
          <TransferModal
            isOpen={isTransferModalOpen}
            onClose={() => setIsTransferModalOpen(false)}
            cards={cards}
            onTransferCompleted={() => {
              setCards(LocalDatabase.getCards());
              setTransactions(LocalDatabase.getTransactions());
              onShowNotification(
                tr('Transferência Efetuada', 'Transfer Completed', 'Transferencia Completada'),
                tr('Transferência realizada e saldos atualizados com sucesso.', 'Transfer executed and balances updated successfully.', 'Transferencia realizada con éxito.'),
                'success'
              );
            }}
          />
        </div>
      )}

      {/* VIEW 2: BUDGETS */}
      {activeTab === 'budgets' && (
        selectedCategory ? (
          <CategoryDashboard
            category={selectedCategory}
            budgetLimit={selectedBudgetLimit}
            transactions={transactions}
            onBack={() => setSelectedCategory(null)}
            onAddTransaction={handleCategoryAddTransaction}
            onDeleteTransaction={handleCategoryDeleteTransaction}
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="panel-budgets">
            
            {/* Adicionar Orçamento Form */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 h-fit" id="budget-form-panel">
              <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center">
                <PiggyBank className="w-4 h-4 mr-1.5 text-indigo-400" />
                {t('stipulateCategoryLimit', 'Estipular Limite por Categoria')}
              </h3>

              <form onSubmit={handleAddBudget} className="space-y-4">
                <CategorySelect
                  value={bgCategory}
                  onChange={setBgCategory}
                  filterType="expense"
                  label={t('costCategory', 'Categoria de Custo')}
                />

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    {tr('Teto Máximo de Gastos', 'Maximum Spending Limit', 'Límite Máximo de Gastos')} ({currencySymbol})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-slate-500 font-bold text-xs">{currencySymbol}</span>
                    <input 
                      type="number" placeholder="2500"
                      value={bgLimit} onChange={(e) => setBgLimit(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Período / Competência</label>
                  <input 
                    type="text" placeholder="2026-07"
                    value={bgPeriod} onChange={(e) => setBgPeriod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none font-mono"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-xl transition"
                  id="submit-budget-btn"
                >
                  Definir Teto Orçamentário
                </button>

                {bgError && (
                  <p className="text-rose-400 text-xs flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    {bgError}
                  </p>
                )}
              </form>
            </div>

            {/* Listagem de Orçamentos com Progress bar */}
            <div className="xl:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-6" id="budgets-ledger-panel">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-white tracking-tight">{t('plannedBudgetsHealth', 'Saúde dos Orçamentos Planejados')}</h2>
                <span className="text-[10px] text-[#1E73BE] font-bold uppercase tracking-wider font-mono animate-pulse">{t('clickCardForDashboard', 'Clique no cartão para o Dashboard')}</span>
              </div>
              <div className="space-y-5 max-h-[500px] overflow-y-auto pr-1">
                {budgets.map((b) => {
                  const percent = Math.min(100, (b.spent_amount / b.limit_amount) * 100);
                  const isOverBudget = b.spent_amount > b.limit_amount;
                  return (
                    <div 
                      key={b.id} 
                      onClick={() => {
                        setSelectedCategory(b.category);
                        setSelectedBudgetLimit(b.limit_amount);
                      }}
                      className="bg-slate-950/40 border border-slate-850 p-5 rounded-xl space-y-3 relative cursor-pointer hover:bg-slate-900/60 hover:border-slate-700 transition-all duration-300 group"
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBudget(b.id, b.category);
                        }}
                        className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 p-1 z-20"
                        title={t('deleteBudget', 'Excluir orçamento')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <CategorySticker categoryNameOrId={b.category} size="md" />
                          <div>
                            <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition">{b.category}</h4>
                            <span className="text-[10px] bg-slate-900 text-slate-500 border border-slate-800/80 px-2 py-0.5 rounded-full mt-1.5 inline-block font-mono">{t('period', 'Período')}: {b.period}</span>
                          </div>
                        </div>
                        <div className="text-right pr-6">
                          <span className="text-[10px] text-slate-500 block">{t('consumed', 'Consumido')}</span>
                          <span className={`font-bold text-sm ${isOverBudget ? 'text-rose-400 font-extrabold' : 'text-slate-300'}`}>
                            {formatCurrency(b.spent_amount, language)} / {formatCurrency(b.limit_amount, language)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-rose-500' : percent >= 85 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-500">Utilização: {percent.toFixed(1)}%</span>
                          {isOverBudget ? (
                            <span className="text-rose-400 flex items-center font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 mr-0.5" />
                              Teto Estourado!
                            </span>
                          ) : (
                            <span className="text-emerald-400 flex items-center">
                              <CheckCircle className="w-3.5 h-3.5 mr-0.5" />
                              Dentro do limite
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] text-[#1E73BE] opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-right font-bold font-mono">
                        Visualizar Dashboard de Categoria →
                      </div>
                    </div>
                  );
                })}

                {budgets.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-12">{t('noMonthlyBudgetsPlanned', 'Nenhum orçamento mensal planejado.')}</p>
                )}
              </div>
            </div>

          </div>
        )
      )}

      {/* VIEW 3: EXCEL BUDGET PLANNER */}
      {activeTab === 'excel-budget' && (() => {
        const filteredRows = excelCategoryFilter === 'all' 
          ? excelRows 
          : excelRows.filter(r => {
              const catRaw = (r.category || '').toLowerCase();
              const filterRaw = excelCategoryFilter.toLowerCase();
              return catRaw === filterRaw || catRaw.includes(filterRaw) || filterRaw.includes(catRaw);
            });

        const totalPlanned = excelRows.reduce((sum, r) => sum + (Number(r.planned) || 0), 0);
        const totalActual = excelRows.reduce((sum, r) => sum + (Number(r.actual) || 0), 0);
        const totalDiff = totalPlanned - totalActual;
        const paidCount = excelRows.filter(r => isCompletedStatus(r.status)).length;
        const pendingCount = excelRows.length - paidCount;
        const completionRate = excelRows.length > 0 ? Math.round((paidCount / excelRows.length) * 100) : 0;

        const filteredPlanned = filteredRows.reduce((sum, r) => sum + (Number(r.planned) || 0), 0);
        const filteredActual = filteredRows.reduce((sum, r) => sum + (Number(r.actual) || 0), 0);
        const filteredDiff = filteredPlanned - filteredActual;

        const handleAddSalaryExpense = () => {
          const newRow: ExcelRow = {
            id: Math.random().toString(),
            description: tr('Nova Conta de Salário (Aluguel/Luz/Cartão)', 'New Payday Bill (Rent/Power/Card)', 'Nueva Factura de Sueldo (Alquiler/Luz/Tarjeta)'),
            category: 'moradia',
            planned: 0,
            actual: 0,
            status: isPt ? 'Pendente' : isEs ? 'Pendiente' : 'Pending',
            notes: tr('Pagamento pós-salário no início do mês', 'Paid after monthly paycheck', 'Pago después del sueldo a inicio de mes')
          };
          setExcelRows([...excelRows, newRow]);
          onShowNotification(
            tr('Sucesso', 'Success', 'Éxito'),
            tr('Nova conta de salário adicionada à planilha', 'New payday bill added to spreadsheet', 'Nueva factura de sueldo añadida a la planilla'),
            'success'
          );
        };

        const handleAddDailyExpense = () => {
          const newRow: ExcelRow = {
            id: Math.random().toString(),
            description: tr('Nova Despesa do Dia a Dia (Mercado/Combustível)', 'New Daily Expense (Groceries/Fuel)', 'Nuevo Gasto Diario (Super/Combustible)'),
            category: 'alimentacao',
            planned: 0,
            actual: 0,
            status: isPt ? 'Pendente' : isEs ? 'Pendiente' : 'Pending',
            notes: tr('Gasto recorrente de rotina', 'Routine everyday expense', 'Gasto recurrente de rutina')
          };
          setExcelRows([...excelRows, newRow]);
          onShowNotification(
            tr('Sucesso', 'Success', 'Éxito'),
            tr('Nova despesa diária adicionada à planilha', 'New daily expense added to spreadsheet', 'Nuevo gasto diario añadido a la planilla'),
            'success'
          );
        };

        const handleSeedPaydayPack = () => {
          const pack: ExcelRow[] = [
            { id: Math.random().toString(), description: tr('Aluguel / Financiamento Habitacional', 'Housing Rent / Mortgage', 'Alquiler / Hipoteca de Vivienda'), category: 'moradia', planned: 2200, actual: 2200, status: isPt ? 'Concluído' : isEs ? 'Concluido' : 'Completed', notes: tr('Pago após salário', 'Paid after paycheck', 'Pagado tras el sueldo') },
            { id: Math.random().toString(), description: tr('Energia Elétrica (Luz Residencial)', 'Electric Utility Bill', 'Factura de Electricidad (Luz)'), category: 'contas_basicas', planned: 280, actual: 265, status: isPt ? 'Concluído' : isEs ? 'Concluido' : 'Completed', notes: tr('Conta de luz do mês', 'Monthly electricity bill', 'Factura de luz del mes') },
            { id: Math.random().toString(), description: tr('Água, Saneamento & Gás', 'Water & Gas Utilities', 'Agua, Saneamiento y Gas'), category: 'contas_basicas', planned: 190, actual: 185, status: isPt ? 'Concluído' : isEs ? 'Concluido' : 'Completed', notes: tr('Débito automático', 'Automatic debit', 'Débito automático') },
            { id: Math.random().toString(), description: tr('Internet Fibra Ótica & Telefonia', 'Fiber Internet & Phone', 'Internet Fibra Óptica y Teléfono'), category: 'telecom', planned: 230, actual: 230, status: isPt ? 'Concluído' : isEs ? 'Concluido' : 'Completed', notes: tr('Plano 600 Mbps', '600 Mbps plan', 'Plan 600 Mbps') },
            { id: Math.random().toString(), description: tr('Fatura Integral do Cartão de Crédito', 'Credit Card Statement', 'Resumen de Tarjeta de Crédito'), category: 'cartao_dividas', planned: 2400, actual: 2380, status: isPt ? 'Concluído' : isEs ? 'Concluido' : 'Completed', notes: tr('Sem juros rotativos', 'No revolving interest', 'Sin intereses rotativos') },
            { id: Math.random().toString(), description: tr('Supermercado Mensal (Rancho & Proteínas)', 'Monthly Supermarket Haul', 'Supermercado Mensual y Compras'), category: 'alimentacao', planned: 1600, actual: 1540, status: isPt ? 'Concluído' : isEs ? 'Concluido' : 'Completed', notes: tr('Mantimentos essenciais', 'Essential supplies', 'Alimentos esenciales') },
            { id: Math.random().toString(), description: tr('Plano de Saúde Familiar', 'Family Health Insurance', 'Seguro Médico Familiar'), category: 'saude', planned: 850, actual: 850, status: isPt ? 'Concluído' : isEs ? 'Concluido' : 'Completed', notes: tr('Mensalidade médica', 'Monthly health fee', 'Cuota médica mensual') },
            { id: Math.random().toString(), description: tr('Aporte na Reserva de Emergência (10%)', 'Emergency Savings Deposit (10%)', 'Aporte al Fondo de Emergencia (10%)'), category: 'investimentos', planned: 1000, actual: 1000, status: isPt ? 'Concluído' : isEs ? 'Concluido' : 'Completed', notes: tr('Investimento seguro', 'Safe savings deposit', 'Inversión segura') },
          ];
          setExcelRows([...excelRows, ...pack]);
          onShowNotification(
            tr('Pacote Adicionado!', 'Pack Added!', '¡Paquete Añadido!'),
            tr('8 despesas essenciais de salário inseridas com sucesso.', '8 essential payday expenses added successfully.', '8 gastos esenciales de sueldo insertados con éxito.'),
            'success'
          );
        };

        return (
          <div className="space-y-6" id="panel-excel-budget">
            {/* Header & Instructions Card */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-lg" id="excel-instructions-card">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-2 shadow-sm shadow-emerald-500/50"></span>
                    {tr(
                      'Planilha Orçamentária de Vida & Salário (Estilo Excel)',
                      'Life & Payday Budget Spreadsheet (Excel Style)',
                      'Planilla de Presupuesto de Vida y Sueldo (Estilo Excel)'
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 mb-3 max-w-3xl leading-relaxed">
                    {tr(
                      'Organize e audite despesas essenciais de salário no fim do mês (aluguel, contas, cartão, mercado) e compras do dia a dia nas 3 línguas do sistema. Edite células diretamente na grade.',
                      'Organize and audit essential month-end payday bills (rent, utilities, credit card, groceries) and everyday expenses in all 3 system languages. Edit cells directly in the grid.',
                      'Organice y audite gastos esenciales de sueldo a fin de mes (alquiler, servicios, tarjeta, mercado) y compras diarias en los 3 idiomas del sistema. Edite directamente en la cuadrícula.'
                    )}
                  </p>
                  
                  {/* Export Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold self-center mr-1">
                      {tr('Exportar:', 'Export:', 'Exportar:')}
                    </span>
                    <button
                      onClick={() => handleExport('excel')}
                      className="bg-slate-900 hover:bg-slate-850 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                      title={tr('Exportar para formato Excel (.csv)', 'Export to Excel format (.csv)', 'Exportar a formato Excel (.csv)')}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>EXCEL</span>
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="bg-slate-900 hover:bg-slate-850 border border-rose-500/30 hover:border-rose-500/60 text-rose-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                      title={tr('Salvar como PDF', 'Save as PDF', 'Guardar como PDF')}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      onClick={() => handleExport('docs')}
                      className="bg-slate-900 hover:bg-slate-850 border border-blue-500/30 hover:border-blue-500/60 text-blue-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                      title={tr('Exportar Relatório Word (.doc)', 'Export Word Report (.doc)', 'Exportar Informe Word (.doc)')}
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>DOCS</span>
                    </button>
                    <button
                      onClick={() => handleExport('print')}
                      className="bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-slate-500 text-slate-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                      title={tr('Imprimir Planilha', 'Print Spreadsheet', 'Imprimir Planilla')}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{tr('Imprimir', 'Print', 'Imprimir')}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Add Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAddSalaryExpense}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                    title={tr('Adicionar conta de fim de mês ou débito do salário', 'Add month-end bill or salary payment', 'Añadir factura de fin de mes o pago del sueldo')}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{tr('+ Conta de Salário', '+ Payday Bill', '+ Factura de Sueldo')}</span>
                  </button>

                  <button
                    onClick={handleAddDailyExpense}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                    title={tr('Adicionar compra ou despesa de rotina diária', 'Add everyday purchase or routine cost', 'Añadir compra o gasto de rutina diaria')}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{tr('+ Despesa Diária', '+ Daily Expense', '+ Gasto Diario')}</span>
                  </button>

                  <button
                    onClick={handleSeedPaydayPack}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition cursor-pointer"
                    title={tr('Inserir pacote rápido com 8 contas típicas pagas ao receber salário', 'Insert starter pack with 8 typical payday bills', 'Insertar paquete rápido con 8 gastos típicos del sueldo')}
                  >
                    <span>⚡ {tr('Pacote Salário', 'Payday Pack', 'Pack Sueldo')}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(tr(
                        'Tem certeza de que deseja redefinir os dados da planilha para o padrão completo?',
                        'Are you sure you want to reset the spreadsheet data to the complete default?',
                        '¿Está seguro de restablecer los datos de la planilla al conjunto predeterminado?'
                      ))) {
                        const defaults = getDefaultExcelRows(language);
                        setExcelRows(defaults);
                        onShowNotification(
                          tr('Sucesso', 'Success', 'Éxito'),
                          tr('Planilha redefinida com valores padrão nas 3 línguas', 'Spreadsheet reset with complete 3-language defaults', 'Planilla restablecida con valores predeterminados en los 3 idiomas'),
                          'success'
                        );
                      }
                    }}
                    className="bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                    id="excel-reset"
                    title={tr('Redefinir para modelo padrão', 'Reset to default template', 'Restablecer a plantilla predeterminada')}
                  >
                    {tr('Redefinir', 'Reset', 'Restablecer')}
                  </button>
                </div>
              </div>
            </div>

            {/* KPI Metric Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {tr('Total Previsto', 'Total Planned', 'Total Planificado')}
                </span>
                <div className="text-lg font-mono font-bold text-indigo-400 mt-1">
                  {formatCurrency(totalPlanned, language)}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {excelRows.length} {tr('itens cadastrados', 'registered items', 'ítems registrados')}
                </span>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {tr('Total Realizado / Pago', 'Total Paid / Actual', 'Total Pagado / Real')}
                </span>
                <div className="text-lg font-mono font-bold text-rose-400 mt-1">
                  {formatCurrency(totalActual, language)}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {paidCount} {tr('contas quitadas', 'bills settled', 'facturas pagadas')}
                </span>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {tr('Economia / Saldo', 'Savings / Balance', 'Ahorro / Saldo')}
                </span>
                <div className={`text-lg font-mono font-bold mt-1 ${totalDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalDiff >= 0 ? `+ ${formatCurrency(totalDiff, language)}` : `- ${formatCurrency(Math.abs(totalDiff), language)}`}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {totalDiff >= 0 
                    ? tr('Dentro do planejado', 'Within planned target', 'Dentro de lo planificado')
                    : tr('Acima do teto previsto', 'Above planned ceiling', 'Por encima del tope')}
                </span>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {tr('Contas Quitadas', 'Bills Settled', 'Facturas Pagadas')}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">{completionRate}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  {paidCount} {tr('pagas', 'paid', 'pagadas')} • {pendingCount} {tr('pendentes', 'pending', 'pendientes')}
                </span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/20 border border-slate-800/60 p-3 rounded-xl">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400">
                  {tr('Filtrar Categoria:', 'Filter Category:', 'Filtrar Categoría:')}
                </span>
                <select
                  value={excelCategoryFilter}
                  onChange={(e) => setExcelCategoryFilter(e.target.value)}
                  className="bg-slate-850 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">
                    🌐 {tr('Todas as Categorias', 'All Categories', 'Todas las Categorías')} ({excelRows.length})
                  </option>
                  <optgroup label={tr('--- Contas de Salário & Fim de Mês ---', '--- Payday & Month-End Bills ---', '--- Facturas de Sueldo y Fin de Mes ---')}>
                    {EXCEL_BUDGET_CATEGORIES.filter(c => c.group === 'salary_bills' || c.group === 'wealth_goals').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {isPt ? cat.labelPt : isEs ? cat.labelEs : cat.labelEn}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={tr('--- Dia a Dia & Rotina ---', '--- Daily Life & Routine ---', '--- Día a Día y Rutina ---')}>
                    {EXCEL_BUDGET_CATEGORIES.filter(c => c.group === 'daily_life' || c.group === 'lifestyle').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {isPt ? cat.labelPt : isEs ? cat.labelEs : cat.labelEn}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {excelCategoryFilter !== 'all' && (
                <button
                  onClick={() => setExcelCategoryFilter('all')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
                >
                  {tr('Limpar filtro (Ver todas)', 'Clear filter (Show all)', 'Limpiar filtro (Ver todas)')}
                </button>
              )}

              <div className="text-xs text-slate-400 font-mono">
                {tr('Exibindo', 'Showing', 'Mostrando')} <span className="font-bold text-white">{filteredRows.length}</span> {tr('de', 'of', 'de')} <span className="font-bold text-white">{excelRows.length}</span> {tr('linhas', 'rows', 'filas')}
              </div>
            </div>

            {/* Interactive Spreadsheet Grid */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl" id="excel-grid-container">
              <div className="overflow-x-auto text-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800 select-none">
                      <th className="py-3 px-4 w-12 text-center">{tr('Ref', 'Ref', 'Ref')}</th>
                      <th className="py-3 px-4 min-w-[240px]">{tr('Item / Descrição', 'Item / Description', 'Ítem / Descripción')}</th>
                      <th className="py-3 px-4 min-w-[200px]">{tr('Categoria de Vida', 'Life Category', 'Categoría de Vida')}</th>
                      <th className="py-3 px-4 text-right w-36">{tr('Previsto', 'Planned', 'Planificado')} ({currencySymbol})</th>
                      <th className="py-3 px-4 text-right w-36">{tr('Realizado', 'Actual', 'Real')} ({currencySymbol})</th>
                      <th className="py-3 px-4 text-right w-36">{tr('Diferença', 'Difference', 'Diferencia')} ({currencySymbol})</th>
                      <th className="py-3 px-4 text-center w-36">{tr('Status', 'Status', 'Estado')}</th>
                      <th className="py-3 px-4 min-w-[220px]">{tr('Notas / Observações', 'Notes / Comments', 'Notas / Observaciones')}</th>
                      <th className="py-3 px-4 text-center w-12">{tr('Ação', 'Action', 'Acción')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs font-mono">
                    {filteredRows.map((row, index) => {
                      const diff = (row.planned || 0) - (row.actual || 0);
                      const diffColor = diff > 0 ? 'text-emerald-400 font-bold' : diff < 0 ? 'text-rose-400 font-bold' : 'text-slate-500';
                      const isCompleted = isCompletedStatus(row.status);

                      const updateField = (field: keyof ExcelRow, value: any) => {
                        const updated = excelRows.map(r => r.id === row.id ? { ...r, [field]: value } : r);
                        setExcelRows(updated);
                      };

                      const toggleStatus = () => {
                        const nextStatus = isCompleted 
                          ? (isPt ? 'Pendente' : isEs ? 'Pendiente' : 'Pending')
                          : (isPt ? 'Concluído' : isEs ? 'Concluido' : 'Completed');
                        updateField('status', nextStatus);
                      };

                      return (
                        <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-2.5 px-4 text-center text-slate-500 bg-slate-900/20 border-r border-slate-850 font-bold">
                            {String.fromCharCode(65 + (index % 26))}{index + 1}
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.description || ''}
                              onChange={(e) => updateField('description', e.target.value)}
                              placeholder={tr('Nome da conta ou despesa...', 'Bill or expense name...', 'Nombre del gasto o factura...')}
                              className="w-full bg-transparent text-slate-100 px-3 py-1.5 focus:outline-none focus:bg-slate-850 focus:ring-1 focus:ring-emerald-500 rounded font-sans text-xs"
                            />
                          </td>
                          <td className="p-1.5">
                            <select
                              value={row.category}
                              onChange={(e) => updateField('category', e.target.value)}
                              className="w-full bg-slate-900/80 border border-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg focus:outline-none focus:bg-slate-850 focus:ring-1 focus:ring-emerald-500 font-sans text-xs cursor-pointer"
                            >
                              <optgroup label={tr('--- Salário & Contas de Fim de Mês ---', '--- Payday & Month-End Bills ---', '--- Facturas de Sueldo y Fin de Mes ---')}>
                                {EXCEL_BUDGET_CATEGORIES.filter(c => c.group === 'salary_bills' || c.group === 'wealth_goals').map(cat => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.icon} {isPt ? cat.labelPt : isEs ? cat.labelEs : cat.labelEn}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label={tr('--- Dia a Dia & Rotina ---', '--- Daily Life & Routine ---', '--- Día a Día y Rutina ---')}>
                                {EXCEL_BUDGET_CATEGORIES.filter(c => c.group === 'daily_life' || c.group === 'lifestyle').map(cat => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.icon} {isPt ? cat.labelPt : isEs ? cat.labelEs : cat.labelEn}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </td>
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              value={row.planned !== undefined && row.planned !== null ? row.planned : ''}
                              onChange={(e) => updateField('planned', parseFloat(e.target.value) || 0)}
                              className="w-full bg-transparent text-right text-indigo-400 font-semibold px-3 py-1.5 focus:outline-none focus:bg-slate-850 focus:ring-1 focus:ring-emerald-500 rounded"
                            />
                          </td>
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              value={row.actual !== undefined && row.actual !== null ? row.actual : ''}
                              onChange={(e) => updateField('actual', parseFloat(e.target.value) || 0)}
                              className="w-full bg-transparent text-right text-rose-400 font-semibold px-3 py-1.5 focus:outline-none focus:bg-slate-850 focus:ring-1 focus:ring-emerald-500 rounded"
                            />
                          </td>
                          <td className={`py-2 px-4 text-right ${diffColor}`}>
                            {diff >= 0 ? `+ ${formatCurrency(diff, language)}` : `- ${formatCurrency(Math.abs(diff), language)}`}
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              onClick={toggleStatus}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase inline-flex items-center space-x-1 border cursor-pointer transition-all ${
                                isCompleted
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                                  : 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                              }`}
                            >
                              <span>{isCompleted ? '✓' : '⏳'}</span>
                              <span>{getStatusLabel(row.status)}</span>
                            </button>
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.notes || ''}
                              onChange={(e) => updateField('notes', e.target.value)}
                              className="w-full bg-transparent text-slate-350 px-3 py-1.5 focus:outline-none focus:bg-slate-850 focus:ring-1 focus:ring-emerald-500 rounded font-sans text-xs"
                              placeholder={tr('Adicionar observações...', 'Add notes...', 'Añadir notas...')}
                            />
                          </td>
                          <td className="py-2 px-4 text-center">
                            <button
                              onClick={() => {
                                const filtered = excelRows.filter(r => r.id !== row.id);
                                setExcelRows(filtered);
                                onShowNotification(
                                  tr('Sucesso', 'Success', 'Éxito'),
                                  tr('Item removido da planilha', 'Item removed from spreadsheet', 'Ítem eliminado de la planilla'),
                                  'info'
                                );
                              }}
                              className="text-slate-600 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                              title={tr('Remover linha', 'Remove row', 'Eliminar fila')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-500 text-xs">
                          {tr('Nenhuma despesa encontrada nesta categoria.', 'No expenses found in this category.', 'No se encontraron gastos en esta categoría.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900/60 text-xs font-bold border-t-2 border-slate-800">
                      <td colSpan={3} className="py-3.5 px-4 text-slate-300 uppercase text-[11px] font-sans">
                        {tr('Totais Consolidados', 'Consolidated Totals', 'Totales Consolidados')}
                        {excelCategoryFilter !== 'all' && (
                          <span className="text-slate-500 ml-1.5 lowercase font-normal">
                            ({tr('filtrado', 'filtered', 'filtrado')})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-indigo-400 font-bold font-mono">
                        {formatCurrency(filteredPlanned, language)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-400 font-bold font-mono">
                        {formatCurrency(filteredActual, language)}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold font-mono ${filteredDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {filteredDiff >= 0 ? `+ ${formatCurrency(filteredDiff, language)}` : `- ${formatCurrency(Math.abs(filteredDiff), language)}`}
                      </td>
                      <td colSpan={3} className="py-3.5 px-4 text-slate-500 text-right text-[11px] font-normal">
                        {filteredRows.filter(r => isCompletedStatus(r.status)).length} / {filteredRows.length} {tr('concluídos', 'completed', 'concluidos')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW 4: PLANNER UNIVERSAL */}
      {activeTab === 'planner-universal' && (() => {
        const sheet = plannerSheets[selectedPlannerCategory] || DEFAULT_PLANNER_SHEET();
        
        const sumIncome = sheet.income.reduce((sum, item) => sum + (item.amount || 0), 0);
        const sumFixed = sheet.fixedExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
        const sumOther = sheet.otherExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
        const sumBills = sheet.bills.reduce((sum, item) => sum + (item.amount || 0), 0);
        
        const actualSpent = sumFixed + sumOther + sumBills;
        const actualDebt = sheet.recapGoals.debt; 
        const actualSaved = sumIncome - actualSpent - actualDebt;
        
        const diffEarnt = sumIncome - sheet.recapGoals.earnt;
        const diffSpent = sheet.recapGoals.spent - actualSpent;
        const diffDebt = sheet.recapGoals.debt - actualDebt;
        const diffSaved = actualSaved - sheet.recapGoals.saved;

        const updateField = (listKey: 'income' | 'fixedExpenses' | 'otherExpenses' | 'bills', index: number, field: 'date' | 'description' | 'amount', value: any) => {
          setPlannerSheets(prev => {
            const currentCat = prev[selectedPlannerCategory] || DEFAULT_PLANNER_SHEET();
            const updatedList = [...currentCat[listKey]];
            updatedList[index] = { ...updatedList[index], [field]: value };
            return {
              ...prev,
              [selectedPlannerCategory]: {
                ...currentCat,
                [listKey]: updatedList
              }
            };
          });
        };

        const renderTable = (title: string, listKey: 'income' | 'fixedExpenses' | 'otherExpenses' | 'bills', items: PlannerItem[], totalVal: number) => {
          return (
            <div className="bg-transparent border border-black rounded-sm overflow-hidden flex flex-col">
              <div className="bg-slate-200/50 border-b border-black text-[12px] font-sans font-bold text-slate-900 py-1 px-2 text-left uppercase tracking-wider">
                {title}
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/30 text-[10px] font-bold text-slate-850 uppercase border-b border-black">
                    <th className="py-1 px-1.5 border-r border-black w-[20%] text-center">Date</th>
                    <th className="py-1 px-1.5 border-r border-black w-[55%]">Description</th>
                    <th className="py-1 px-1.5 text-right w-[25%]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/40">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-black/5">
                      <td className="p-0 border-r border-black">
                        <input 
                          type="text" 
                          value={item.date} 
                          onChange={(e) => updateField(listKey, idx, 'date', e.target.value)}
                          className="w-full bg-transparent text-slate-900 font-mono text-center text-xs py-0.5 px-1 focus:outline-none focus:bg-white"
                          placeholder="Ex: 05/07"
                        />
                      </td>
                      <td className="p-0 border-r border-black">
                        <input 
                          type="text" 
                          value={item.description} 
                          onChange={(e) => updateField(listKey, idx, 'description', e.target.value)}
                          className="w-full bg-transparent text-slate-900 font-sans text-xs py-0.5 px-1.5 focus:outline-none focus:bg-white"
                          placeholder="Descrição..."
                        />
                      </td>
                      <td className="p-0">
                        <input 
                          type="number" 
                          value={item.amount || ''} 
                          onChange={(e) => updateField(listKey, idx, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-slate-900 font-mono text-right text-xs py-0.5 px-1.5 focus:outline-none focus:bg-white"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-slate-100/30 border-t border-black font-bold">
                    <td colSpan={2} className="py-1 px-2 border-r border-black text-xs uppercase text-slate-800">
                      Total
                    </td>
                    <td className="py-1 px-1.5 text-right font-mono text-xs text-slate-900 bg-slate-100/30">
                      {formatCurrency(totalVal, language)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        };

        return (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6" id="planner-universal-root">
            {/* Left Category Selector Sidebar */}
            <div className="xl:col-span-1 bg-slate-900/30 border border-slate-800 rounded-2xl p-4 h-fit">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">{t('universalPlanner', 'Planner Universal')}</h3>
              <div className="space-y-1">
                {PLANNER_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedPlannerCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      selectedPlannerCategory === cat
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <span>{t(`plannerCat.${cat}`, cat)}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedPlannerCategory === cat ? 'bg-white' : 'bg-slate-650'}`}></span>
                  </button>
                ))}
              </div>
              
              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                <button
                  onClick={() => handlePrintPlanner(selectedPlannerCategory, sheet)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>{t('printPlannerPdf', 'Imprimir Planner / PDF')}</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Tem certeza de que deseja limpar os dados de "${selectedPlannerCategory}"?`)) {
                      setPlannerSheets(prev => ({
                        ...prev,
                        [selectedPlannerCategory]: DEFAULT_PLANNER_SHEET()
                      }));
                      onShowNotification(t('success', 'Sucesso'), `Dados de "${selectedPlannerCategory}" limpos com sucesso!`, 'info');
                    }
                  }}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-rose-400 border border-rose-500/10 hover:border-rose-500/20 text-xs font-medium py-2 px-3 rounded-xl transition"
                >
                  {t('clearSpreadsheet', 'Limpar Planilha')}
                </button>
              </div>
            </div>

            {/* Right Printable Sheet */}
            <div className="xl:col-span-3">
              <div className="bg-[#FAF8F5] border border-slate-300 p-6 md:p-8 rounded-xl shadow-xl text-slate-900 max-w-4xl mx-auto font-serif min-h-[900px] flex flex-col justify-between">
                <div>
                  <div className="text-center pb-2 border-b border-black">
                    <p className="text-[10px] font-sans font-bold tracking-widest text-slate-500 uppercase">{t(`plannerCat.${selectedPlannerCategory}`, selectedPlannerCategory)}</p>
                    <h2 className="text-3xl font-black tracking-widest text-black uppercase mt-1" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                      {t('monthlyBudgetPlanner', 'Monthly Budget Planner')}
                    </h2>
                  </div>

                  {/* Goal and Month Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-6 px-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-sans font-bold text-black text-xs uppercase tracking-wider">{t('budgetGoalLabel', 'Budget Goal:')}</span>
                      <input 
                        type="text" 
                        value={sheet.budgetGoal}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPlannerSheets(prev => ({
                            ...prev,
                            [selectedPlannerCategory]: { ...prev[selectedPlannerCategory], budgetGoal: val }
                          }));
                        }}
                        className="flex-1 bg-transparent border-b border-black text-slate-900 font-sans text-sm focus:outline-none px-1 py-0.5"
                        placeholder={t('writeMainGoalPlaceholder', 'Escreva a meta principal...')}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-sans font-bold text-black text-xs uppercase tracking-wider">{t('monthLabel', 'Month:')}</span>
                      <input 
                        type="text" 
                        value={sheet.month}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPlannerSheets(prev => ({
                            ...prev,
                            [selectedPlannerCategory]: { ...prev[selectedPlannerCategory], month: val }
                          }));
                        }}
                        className="flex-1 bg-transparent border-b border-black text-slate-900 font-sans text-sm focus:outline-none px-1 py-0.5"
                        placeholder={t('monthExamplePlaceholder', 'Ex: Julho / 2026')}
                      />
                    </div>
                  </div>

                  {/* 2x2 Tables Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {renderTable('Income', 'income', sheet.income, sumIncome)}
                    {renderTable('Fixed Expenses', 'fixedExpenses', sheet.fixedExpenses, sumFixed)}
                    {renderTable('Other Expenses', 'otherExpenses', sheet.otherExpenses, sumOther)}
                    {renderTable('Bills', 'bills', sheet.bills, sumBills)}
                  </div>
                </div>

                {/* Recap Table Section */}
                <div className="mt-8 border-t border-black/30 pt-6">
                  <div className="bg-slate-200/50 border border-black text-[12px] font-sans font-bold text-slate-900 py-1.5 px-3 text-left uppercase tracking-wider">
                    Recap
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-black border-t-0 text-xs">
                      <thead>
                        <tr className="bg-slate-100/30 font-bold border-b border-black text-[11px] text-slate-800">
                          <th className="py-2 px-3 border-r border-black w-[25%]"></th>
                          <th className="py-2 px-3 border-r border-black w-[25%] text-right">{t('goal', 'Goal')} ({currencySymbol})</th>
                          <th className="py-2 px-3 border-r border-black w-[25%] text-right">{t('actual', 'Actual')} ({currencySymbol})</th>
                          <th className="py-2 px-3 w-[25%] text-right">{t('difference', 'Difference')} ({currencySymbol})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/60">
                        {/* Earnt */}
                        <tr className="hover:bg-black/5">
                          <td className="py-1.5 px-3 border-r border-black font-sans font-bold text-slate-900">{t('earnt', 'Earnt')}</td>
                          <td className="p-0 border-r border-black">
                            <input 
                              type="number" 
                              value={sheet.recapGoals.earnt || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPlannerSheets(prev => {
                                  const c = prev[selectedPlannerCategory] || DEFAULT_PLANNER_SHEET();
                                  return { ...prev, [selectedPlannerCategory]: { ...c, recapGoals: { ...c.recapGoals, earnt: val } } };
                                });
                              }}
                              className="w-full bg-transparent text-right font-mono py-1 px-3 focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="py-1.5 px-3 border-r border-black text-right font-mono text-slate-900 bg-slate-100/10">{sumIncome.toFixed(2)}</td>
                          <td className={`py-1.5 px-3 text-right font-mono font-bold ${diffEarnt >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {diffEarnt >= 0 ? '+' : ''}{diffEarnt.toFixed(2)}
                          </td>
                        </tr>

                        {/* Spent */}
                        <tr className="hover:bg-black/5">
                          <td className="py-1.5 px-3 border-r border-black font-sans font-bold text-slate-900">{t('spent', 'Spent')}</td>
                          <td className="p-0 border-r border-black">
                            <input 
                              type="number" 
                              value={sheet.recapGoals.spent || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPlannerSheets(prev => {
                                  const c = prev[selectedPlannerCategory] || DEFAULT_PLANNER_SHEET();
                                  return { ...prev, [selectedPlannerCategory]: { ...c, recapGoals: { ...c.recapGoals, spent: val } } };
                                });
                              }}
                              className="w-full bg-transparent text-right font-mono py-1 px-3 focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="py-1.5 px-3 border-r border-black text-right font-mono text-slate-900 bg-slate-100/10">{actualSpent.toFixed(2)}</td>
                          <td className={`py-1.5 px-3 text-right font-mono font-bold ${diffSpent >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {diffSpent >= 0 ? '+' : ''}{diffSpent.toFixed(2)}
                          </td>
                        </tr>

                        {/* Debt */}
                        <tr className="hover:bg-black/5">
                          <td className="py-1.5 px-3 border-r border-black font-sans font-bold text-slate-900">{t('debt', 'Debt')}</td>
                          <td className="p-0 border-r border-black">
                            <input 
                              type="number" 
                              value={sheet.recapGoals.debt || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPlannerSheets(prev => {
                                  const c = prev[selectedPlannerCategory] || DEFAULT_PLANNER_SHEET();
                                  return { ...prev, [selectedPlannerCategory]: { ...c, recapGoals: { ...c.recapGoals, debt: val } } };
                                });
                              }}
                              className="w-full bg-transparent text-right font-mono py-1 px-3 focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="py-1.5 px-3 border-r border-black text-right font-mono text-slate-900 bg-slate-100/10">{actualDebt.toFixed(2)}</td>
                          <td className={`py-1.5 px-3 text-right font-mono font-bold ${diffDebt >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {diffDebt >= 0 ? '+' : ''}{diffDebt.toFixed(2)}
                          </td>
                        </tr>

                        {/* Saved */}
                        <tr className="bg-slate-100/10 hover:bg-black/5">
                          <td className="py-1.5 px-3 border-r border-black font-sans font-bold text-slate-900">{t('saved', 'Saved')}</td>
                          <td className="p-0 border-r border-black">
                            <input 
                              type="number" 
                              value={sheet.recapGoals.saved || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPlannerSheets(prev => {
                                  const c = prev[selectedPlannerCategory] || DEFAULT_PLANNER_SHEET();
                                  return { ...prev, [selectedPlannerCategory]: { ...c, recapGoals: { ...c.recapGoals, saved: val } } };
                                });
                              }}
                              className="w-full bg-transparent text-right font-mono py-1 px-3 focus:outline-none"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="py-1.5 px-3 border-r border-black text-right font-mono text-slate-900 font-bold bg-slate-200/20">{actualSaved.toFixed(2)}</td>
                          <td className={`py-1.5 px-3 text-right font-mono font-bold ${diffSaved >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {diffSaved >= 0 ? 'Poupou +' : ''}{diffSaved.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW 5: PAYCHECK PLANNER (IA) */}
      {activeTab === 'paycheck-planner' && (
        <PaycheckPlannerView />
      )}

      {/* Life4Billion Open Banking & Card Connect Modal */}
      <Life4BillionConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        language={language}
        onShowNotification={onShowNotification}
      />

    </div>
  );
}
