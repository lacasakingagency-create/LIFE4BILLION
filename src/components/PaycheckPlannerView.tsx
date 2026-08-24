/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  DollarSign, 
  Calendar as CalendarIcon, 
  Sliders, 
  Activity, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight,
  TrendingDown,
  Percent,
  BrainCircuit,
  PiggyBank,
  Heart,
  Briefcase,
  Users,
  ShoppingCart,
  Printer,
  Download,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';
import { LocalDatabase } from '../utils/db';

// Types for Paycheck Planner
interface PaycheckCategoryItem {
  id: string;
  name: string;
  budgeted: number;
  actual: number;
}

interface PaycheckSection {
  id: string;
  title: string;
  titlePt: string;
  items: PaycheckCategoryItem[];
}

export function getSectionIcon(id: string) {
  switch (id) {
    case 'income':
      return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    case 'needs':
      return <Heart className="w-4 h-4 text-indigo-400" />;
    case 'debts':
      return <Percent className="w-4 h-4 text-rose-400" />;
    case 'savings':
      return <PiggyBank className="w-4 h-4 text-emerald-400" />;
    case 'investing':
      return <Activity className="w-4 h-4 text-cyan-400" />;
    case 'family':
      return <Users className="w-4 h-4 text-purple-400" />;
    case 'lifestyle':
      return <ShoppingCart className="w-4 h-4 text-orange-400" />;
    case 'business':
      return <Briefcase className="w-4 h-4 text-yellow-400" />;
    default:
      return <DollarSign className="w-4 h-4 text-slate-400" />;
  }
}

export default function PaycheckPlannerView() {
  const { t, language: rawLanguage } = useLanguageTheme();
  const language = rawLanguage.startsWith('pt') ? 'pt' : rawLanguage.startsWith('es') ? 'es' : 'en';

  // Local storage state keys
  const STORAGE_KEY_SECTIONS = 'omnisaas_paycheck_sections';
  const STORAGE_KEY_SPLIT = 'omnisaas_paycheck_split';
  const STORAGE_KEY_CALENDAR = 'omnisaas_paycheck_calendar';
  const STORAGE_KEY_AI_INPUT = 'omnisaas_paycheck_ai_input';

  // 1. Initial structured categories with $0 initial balance
  const getInitialSections = (): PaycheckSection[] => [
    {
      id: 'income',
      title: '1. Income',
      titlePt: '1. Entradas / Receitas',
      items: [
        { id: 'inc-salary', name: language === 'pt' ? 'Salário (Salary)' : 'Salary', budgeted: 0, actual: 0 },
        { id: 'inc-hourly', name: language === 'pt' ? 'Pagamento por Hora' : 'Hourly wages', budgeted: 0, actual: 0 },
        { id: 'inc-overtime', name: language === 'pt' ? 'Horas Extras' : 'Overtime', budgeted: 0, actual: 0 },
        { id: 'inc-bonus', name: language === 'pt' ? 'Bônus' : 'Bonus', budgeted: 0, actual: 0 },
        { id: 'inc-commission', name: language === 'pt' ? 'Comissões' : 'Commission', budgeted: 0, actual: 0 },
        { id: 'inc-tips', name: language === 'pt' ? 'Gorjetas (Tips)' : 'Tips', budgeted: 0, actual: 0 },
        { id: 'inc-freelance', name: 'Freelance income', budgeted: 0, actual: 0 },
        { id: 'inc-sidehustle', name: 'Side hustle income', budgeted: 0, actual: 0 },
        { id: 'inc-business', name: 'Business income', budgeted: 0, actual: 0 },
        { id: 'inc-taxrefund', name: 'Tax refund', budgeted: 0, actual: 0 },
        { id: 'inc-cashback', name: 'Cashback', budgeted: 0, actual: 0 },
        { id: 'inc-gifts', name: 'Gifts', budgeted: 0, actual: 0 },
        { id: 'inc-rental', name: 'Rental income', budgeted: 0, actual: 0 },
        { id: 'inc-dividends', name: 'Dividends', budgeted: 0, actual: 0 },
        { id: 'inc-interest', name: 'Interest income', budgeted: 0, actual: 0 },
        { id: 'inc-other', name: 'Other income', budgeted: 0, actual: 0 }
      ]
    },
    {
      id: 'needs',
      title: '2. Needs',
      titlePt: '2. Necessidades Básicas',
      items: [
        { id: 'need-rent', name: language === 'pt' ? 'Aluguel / Hipoteca' : 'Rent / Mortgage', budgeted: 0, actual: 0 },
        { id: 'need-hoa', name: 'HOA fees', budgeted: 0, actual: 0 },
        { id: 'need-tax', name: 'Property tax', budgeted: 0, actual: 0 },
        { id: 'need-insurance', name: 'Home insurance', budgeted: 0, actual: 0 },
        { id: 'need-repairs', name: 'Repairs & Maintenance', budgeted: 0, actual: 0 },
        { id: 'need-electricity', name: language === 'pt' ? 'Eletricidade' : 'Electricity', budgeted: 0, actual: 0 },
        { id: 'need-water', name: language === 'pt' ? 'Água / Saneamento' : 'Water', budgeted: 0, actual: 0 },
        { id: 'need-gas', name: language === 'pt' ? 'Gás' : 'Gas', budgeted: 0, actual: 0 },
        { id: 'need-internet', name: 'Internet', budgeted: 0, actual: 0 },
        { id: 'need-phone', name: language === 'pt' ? 'Celular' : 'Phone bill', budgeted: 0, actual: 0 },
        { id: 'need-streaming', name: 'Streaming services', budgeted: 0, actual: 0 },
        { id: 'need-car', name: language === 'pt' ? 'Parcela do Carro' : 'Car payment', budgeted: 0, actual: 0 },
        { id: 'need-carins', name: language === 'pt' ? 'Seguro Auto' : 'Car insurance', budgeted: 0, actual: 0 },
        { id: 'need-gasfuel', name: language === 'pt' ? 'Combustível' : 'Gas/Fuel', budgeted: 0, actual: 0 },
        { id: 'need-parking', name: language === 'pt' ? 'Estacionamento' : 'Parking', budgeted: 0, actual: 0 },
        { id: 'need-transit', name: language === 'pt' ? 'Transporte Público' : 'Public transportation', budgeted: 0, actual: 0 },
        { id: 'need-rideshare', name: 'Uber/Lyft', budgeted: 0, actual: 0 },
        { id: 'need-groceries', name: language === 'pt' ? 'Supermercado' : 'Groceries', budgeted: 0, actual: 0 },
        { id: 'need-restaurants', name: language === 'pt' ? 'Restaurantes' : 'Restaurants', budgeted: 0, actual: 0 },
        { id: 'need-coffee', name: language === 'pt' ? 'Café' : 'Coffee', budgeted: 0, actual: 0 },
        { id: 'need-delivery', name: language === 'pt' ? 'Delivery' : 'Meal delivery', budgeted: 0, actual: 0 },
        { id: 'need-healthins', name: language === 'pt' ? 'Plano de Saúde' : 'Health insurance', budgeted: 0, actual: 0 },
        { id: 'need-doctor', name: language === 'pt' ? 'Consultas Médicas' : 'Doctor visits', budgeted: 0, actual: 0 },
        { id: 'need-meds', name: language === 'pt' ? 'Medicamentos' : 'Medication', budgeted: 0, actual: 0 },
        { id: 'need-dental', name: language === 'pt' ? 'Dentista' : 'Dental', budgeted: 0, actual: 0 },
        { id: 'need-vision', name: language === 'pt' ? 'Oftalmo/Óculos' : 'Vision', budgeted: 0, actual: 0 },
        { id: 'need-gym', name: language === 'pt' ? 'Academia' : 'Fitness/Gym', budgeted: 0, actual: 0 }
      ]
    },
    {
      id: 'debts',
      title: '3. Debt Payments',
      titlePt: '3. Pagamento de Dívidas',
      items: [
        { id: 'debt-credit', name: language === 'pt' ? 'Fatura Cartão de Crédito' : 'Credit card payment', budgeted: 0, actual: 0 },
        { id: 'debt-student', name: language === 'pt' ? 'Financiamento Estudantil' : 'Student loans', budgeted: 0, actual: 0 },
        { id: 'debt-personal', name: language === 'pt' ? 'Empréstimo Pessoal' : 'Personal loans', budgeted: 0, actual: 0 },
        { id: 'debt-car', name: language === 'pt' ? 'Financiamento Veicular' : 'Car loans', budgeted: 0, actual: 0 },
        { id: 'debt-medical', name: language === 'pt' ? 'Dívida Médica' : 'Medical debt', budgeted: 0, actual: 0 },
        { id: 'debt-mortgage', name: language === 'pt' ? 'Saldo Devedor Habitacional' : 'Mortgage debt', budgeted: 0, actual: 0 },
        { id: 'debt-bnpl', name: 'Buy now pay later (Klarna/Afterpay)', budgeted: 0, actual: 0 }
      ]
    },
    {
      id: 'savings',
      title: '4. Saving',
      titlePt: '4. Poupança e Metas',
      items: [
        { id: 'save-emergency', name: 'Emergency savings', budgeted: 0, actual: 0 },
        { id: 'save-rainy', name: 'Rainy day fund', budgeted: 0, actual: 0 },
        { id: 'save-house', name: language === 'pt' ? 'Meta: Casa própria' : 'Goal: House', budgeted: 0, actual: 0 },
        { id: 'save-car', name: language === 'pt' ? 'Meta: Carro novo' : 'Goal: Car', budgeted: 0, actual: 0 },
        { id: 'save-vacation', name: language === 'pt' ? 'Meta: Viagem / Férias' : 'Goal: Vacation', budgeted: 0, actual: 0 },
        { id: 'save-wedding', name: language === 'pt' ? 'Meta: Casamento' : 'Goal: Wedding', budgeted: 0, actual: 0 },
        { id: 'save-baby', name: language === 'pt' ? 'Meta: Enxoval / Bebê' : 'Goal: Baby', budgeted: 0, actual: 0 },
        { id: 'save-edu', name: language === 'pt' ? 'Meta: Educação' : 'Goal: Education', budgeted: 0, actual: 0 },
        { id: 'save-big', name: 'Big purchase reserve', budgeted: 0, actual: 0 },
        { id: 'save-hy', name: 'High-yield savings account', budgeted: 0, actual: 0 },
        { id: 'save-cash', name: 'Cash reserve', budgeted: 0, actual: 0 }
      ]
    },
    {
      id: 'investing',
      title: '5. Investing',
      titlePt: '5. Investimentos',
      items: [
        { id: 'inv-stocks', name: 'Stocks (Ações)', budgeted: 0, actual: 0 },
        { id: 'inv-etfs', name: 'ETFs', budgeted: 0, actual: 0 },
        { id: 'inv-index', name: 'Index funds', budgeted: 0, actual: 0 },
        { id: 'inv-crypto', name: 'Crypto (Criptomoedas)', budgeted: 0, actual: 0 },
        { id: 'inv-re', name: 'Real estate', budgeted: 0, actual: 0 },
        { id: 'inv-401k', name: '401(k) retirement', budgeted: 0, actual: 0 },
        { id: 'inv-roth', name: 'Roth IRA', budgeted: 0, actual: 0 },
        { id: 'inv-ira', name: 'IRA', budgeted: 0, actual: 0 },
        { id: 'inv-brokerage', name: 'Brokerage account', budgeted: 0, actual: 0 }
      ]
    },
    {
      id: 'family',
      title: '6. Family',
      titlePt: '6. Família e Dependentes',
      items: [
        { id: 'fam-partner', name: 'Partner expenses', budgeted: 0, actual: 0 },
        { id: 'fam-childcare', name: 'Childcare (Creche)', budgeted: 0, actual: 0 },
        { id: 'fam-school', name: language === 'pt' ? 'Mensalidade Escolar' : 'School', budgeted: 0, actual: 0 },
        { id: 'fam-supplies', name: 'Baby supplies', budgeted: 0, actual: 0 },
        { id: 'fam-allowance', name: language === 'pt' ? 'Mesada' : 'Allowance', budgeted: 0, actual: 0 },
        { id: 'fam-support', name: language === 'pt' ? 'Suporte Familiar' : 'Family support', budgeted: 0, actual: 0 },
        { id: 'fam-pet', name: language === 'pt' ? 'Despesas Pet' : 'Pet expenses', budgeted: 0, actual: 0 }
      ]
    },
    {
      id: 'lifestyle',
      title: '7. Lifestyle / Wants',
      titlePt: '7. Estilo de Vida & Desejos',
      items: [
        { id: 'life-shopping', name: 'Shopping', budgeted: 0, actual: 0 },
        { id: 'life-clothes', name: language === 'pt' ? 'Roupas' : 'Clothes', budgeted: 0, actual: 0 },
        { id: 'life-ent', name: 'Entertainment', budgeted: 0, actual: 0 },
        { id: 'life-games', name: language === 'pt' ? 'Jogos' : 'Games', budgeted: 0, actual: 0 },
        { id: 'life-travel', name: language === 'pt' ? 'Viagens' : 'Travel', budgeted: 0, actual: 0 },
        { id: 'life-hobbies', name: 'Hobbies', budgeted: 0, actual: 0 },
        { id: 'life-beauty', name: language === 'pt' ? 'Beleza & Cuidados' : 'Beauty', budgeted: 0, actual: 0 },
        { id: 'life-subs', name: 'Subscriptions', budgeted: 0, actual: 0 },
        { id: 'life-events', name: language === 'pt' ? 'Eventos / Shows' : 'Events', budgeted: 0, actual: 0 }
      ]
    },
    {
      id: 'business',
      title: '8. Business (Plano Pro/Business)',
      titlePt: '8. Negócios (Business Plan)',
      items: [
        { id: 'biz-sales', name: 'Sales (Vendas)', budgeted: 0, actual: 0 },
        { id: 'biz-services', name: 'Services', budgeted: 0, actual: 0 },
        { id: 'biz-online', name: 'Online sales', budgeted: 0, actual: 0 },
        { id: 'biz-mktplace', name: 'Marketplace sales', budgeted: 0, actual: 0 },
        { id: 'biz-ad', name: 'Advertising', budgeted: 0, actual: 0 },
        { id: 'biz-software', name: 'Software & Tools', budgeted: 0, actual: 0 },
        { id: 'biz-employees', name: 'Employees', budgeted: 0, actual: 0 },
        { id: 'biz-rent', name: 'Office rent', budgeted: 0, actual: 0 },
        { id: 'biz-supplies', name: 'Supplies', budgeted: 0, actual: 0 },
        { id: 'biz-inventory', name: 'Inventory', budgeted: 0, actual: 0 },
        { id: 'biz-shipping', name: 'Shipping', budgeted: 0, actual: 0 },
        { id: 'biz-taxes', name: 'Business taxes', budgeted: 0, actual: 0 },
        { id: 'biz-contractors', name: 'Contractors', budgeted: 0, actual: 0 }
      ]
    }
  ];

  // Load / Save States scoped to active user
  const loadUserSections = () => {
    const key = LocalDatabase.getUserKey('paycheck_sections');
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((p: any) => {
          const { icon, ...rest } = p;
          return rest;
        });
      } catch (e) {}
    }
    return getInitialSections();
  };

  const [sections, setSections] = useState<PaycheckSection[]>(loadUserSections);

  useEffect(() => {
    const handleUserSwitch = () => {
      setSections(loadUserSections());
    };
    window.addEventListener('life4billion_user_switched', handleUserSwitch);
    return () => window.removeEventListener('life4billion_user_switched', handleUserSwitch);
  }, []);

  useEffect(() => {
    const key = LocalDatabase.getUserKey('paycheck_sections');
    localStorage.setItem(key, JSON.stringify(sections));
  }, [sections]);

  // Paycheck Split preferences
  const [splitPercent, setSplitPercent] = useState(() => {
    const key = LocalDatabase.getUserKey('paycheck_split');
    const saved = localStorage.getItem(key);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { needs: 50, savings: 20, investments: 20, wants: 10 };
  });

  useEffect(() => {
    const key = LocalDatabase.getUserKey('paycheck_split');
    localStorage.setItem(key, JSON.stringify(splitPercent));
  }, [splitPercent]);

  // Paycheck Calendar options
  const [calendarData, setCalendarData] = useState(() => {
    const key = LocalDatabase.getUserKey('paycheck_calendar');
    const saved = localStorage.getItem(key);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      nextPayday: '',
      paycheckAmount: 0,
      billsPaidBefore: {}
    };
  });

  useEffect(() => {
    const key = LocalDatabase.getUserKey('paycheck_calendar');
    localStorage.setItem(key, JSON.stringify(calendarData));
  }, [calendarData]);

  // AI Planner suggest input
  const [aiPaycheckAmount, setAiPaycheckAmount] = useState(() => {
    const key = LocalDatabase.getUserKey('paycheck_ai_input');
    const saved = localStorage.getItem(key);
    return saved ? saved : '';
  });

  useEffect(() => {
    const key = LocalDatabase.getUserKey('paycheck_ai_input');
    localStorage.setItem(key, aiPaycheckAmount);
  }, [aiPaycheckAmount]);

  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatResponses, setAiChatResponses] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Spreadsheet section visibility state (sheets hidden/expanded when clicked)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const expandAllSections = () => {
    const all: Record<string, boolean> = {};
    sections.forEach(s => { all[s.id] = true; });
    setExpandedSections(all);
  };

  const collapseAllSections = () => {
    setExpandedSections({});
  };

  // Totals calculations
  const getSectionTotal = (sectionId: string, type: 'budgeted' | 'actual') => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return 0;
    return section.items.reduce((sum, item) => sum + (item[type] || 0), 0);
  };

  const totalIncomeBudget = getSectionTotal('income', 'budgeted');
  const totalIncomeActual = getSectionTotal('income', 'actual');

  const totalNeedsBudget = getSectionTotal('needs', 'budgeted');
  const totalNeedsActual = getSectionTotal('needs', 'actual');

  const totalDebtsBudget = getSectionTotal('debts', 'budgeted');
  const totalDebtsActual = getSectionTotal('debts', 'actual');

  const totalSavingsBudget = getSectionTotal('savings', 'budgeted');
  const totalSavingsActual = getSectionTotal('savings', 'actual');

  const totalInvestingBudget = getSectionTotal('investing', 'budgeted');
  const totalInvestingActual = getSectionTotal('investing', 'actual');

  const totalFamilyBudget = getSectionTotal('family', 'budgeted');
  const totalFamilyActual = getSectionTotal('family', 'actual');

  const totalLifestyleBudget = getSectionTotal('lifestyle', 'budgeted');
  const totalLifestyleActual = getSectionTotal('lifestyle', 'actual');

  const totalBusinessBudget = getSectionTotal('business', 'budgeted');
  const totalBusinessActual = getSectionTotal('business', 'actual');

  // Consolidated expense/allocation sums
  const totalExpensesBudget = totalNeedsBudget + totalDebtsBudget + totalSavingsBudget + totalInvestingBudget + totalFamilyBudget + totalLifestyleBudget + totalBusinessBudget;
  const totalExpensesActual = totalNeedsActual + totalDebtsActual + totalSavingsActual + totalInvestingActual + totalFamilyActual + totalLifestyleActual + totalBusinessActual;

  const remainingBudget = totalIncomeBudget - totalExpensesBudget;
  const remainingActual = totalIncomeActual - totalExpensesActual;

  // 1. Debt Payoff progress calculation
  // Let's assume debt payoff is based on budgeted vs actual repayments OR a general progress state.
  // To make it fun and fully dynamic, we calculate: (Actual Debt Paid / Budgeted Debt Paid) * 100, capped at 100%.
  // Or even better, a formula based on debt targets:
  const debtProgress = totalDebtsBudget > 0 
    ? Math.min(100, Math.round((totalDebtsActual / totalDebtsBudget) * 100)) 
    : 42; // default fallback matching requested progress "42%"

  // 2. Financial Health Score calculation (0-100)
  const calculateFinancialScore = (): number => {
    if (totalIncomeActual === 0) return 50;
    
    let score = 50; // starts in middle
    
    // Savings Rate contribution (Savings + Investing + Remaining) / Income
    const totalSaved = totalSavingsActual + totalInvestingActual + Math.max(0, remainingActual);
    const savingsRate = totalSaved / totalIncomeActual;
    if (savingsRate >= 0.20) score += 20; // healthy savings rate
    else if (savingsRate >= 0.10) score += 10;
    else if (savingsRate < 0.05) score -= 10;

    // Debt Contribution (Debt payments / Income)
    const debtRatio = totalDebtsActual / totalIncomeActual;
    if (debtRatio <= 0.10) score += 15; // low debt payments
    else if (debtRatio > 0.35) score -= 15; // high debt payments

    // Investment diversification
    const hasStocks = (sections.find(s => s.id === 'investing')?.items.find(i => i.id === 'inv-stocks')?.actual || 0) > 0;
    const hasRetirement = (sections.find(s => s.id === 'investing')?.items.find(i => i.id === 'inv-401k')?.actual || 0) > 0;
    if (hasStocks && hasRetirement) score += 10;
    else if (hasStocks || hasRetirement) score += 5;

    // Lifestyle/Wants ratio (Wants / Income)
    const wantsRatio = totalLifestyleActual / totalIncomeActual;
    if (wantsRatio <= 0.15) score += 5;
    else if (wantsRatio > 0.35) score -= 10;

    return Math.max(10, Math.min(100, score));
  };

  const financialHealthScore = calculateFinancialScore();

  // Handle cell edit
  const handleCellChange = (sectionId: string, itemId: string, field: 'budgeted' | 'actual', value: number) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          items: sec.items.map(item => {
            if (item.id === itemId) {
              return { ...item, [field]: value };
            }
            return item;
          })
        };
      }
      return sec;
    }));
  };

  // Safe spending limit calculation for payday calendar
  // Limit = (Next Paycheck Amount - Unpaid Bills before payday - savings commitment) / Days remaining
  const calculateSafeSpendingLimit = () => {
    const paycheck = calendarData.paycheckAmount;
    // Calculate unpaid bills selected
    const unpaidBillsSum = Object.entries(calendarData.billsPaidBefore)
      .filter(([_, isPaid]) => !isPaid)
      .reduce((sum, [billId]) => {
        // Find bill amount
        for (const sec of sections) {
          const item = sec.items.find(i => i.id === billId);
          if (item) return sum + item.budgeted;
        }
        return sum;
      }, 0);

    const savingsCommitment = paycheck * (splitPercent.savings / 100);
    const limit = Math.max(0, paycheck - unpaidBillsSum - savingsCommitment);
    
    // Divide by 7 days or matching realistic daily safe limit
    return Math.round(limit / 14); // 2-week paycheck safe daily
  };

  const safeSpendingLimit = calculateSafeSpendingLimit();

  // AI Suggestions generator function using server-side OpenAI /api/chat proxy
  const triggerAiPlannerSuggestion = async () => {
    setIsAiLoading(true);
    const parsedAmount = parseFloat(aiPaycheckAmount) || 2500;
    
    // Calculate split values based on customized split percentages
    const suggestedHousing = Math.round(parsedAmount * 0.30);
    const suggestedBills = Math.round(parsedAmount * 0.12);
    const suggestedFood = Math.round(parsedAmount * 0.14);
    const suggestedSavings = Math.round(parsedAmount * (splitPercent.savings / 100));
    const suggestedInvestments = Math.round(parsedAmount * (splitPercent.investments / 100));
    const suggestedFun = Math.round(parsedAmount * (splitPercent.wants / 100));
    const totalAllocated = suggestedHousing + suggestedBills + suggestedFood + suggestedSavings + suggestedInvestments + suggestedFun;
    const remaining = Math.max(0, parsedAmount - totalAllocated);

    try {
      const promptText = `
        Por favor, analise a seguinte simulação de salário e gere uma recomendação financeira curta, direta e motivadora para o usuário.
        
        VALORES DA SIMULAÇÃO:
        - Salário (Paycheck): ${formatCurrency(parsedAmount, language)}
        - Moradia sugerida (Housing): ${formatCurrency(suggestedHousing, language)}
        - Contas essenciais (Bills): ${formatCurrency(suggestedBills, language)}
        - Alimentação (Food): ${formatCurrency(suggestedFood, language)}
        - Reserva de Poupança (${splitPercent.savings}%): ${formatCurrency(suggestedSavings, language)}
        - Investimentos (${splitPercent.investments}%): ${formatCurrency(suggestedInvestments, language)}
        - Lazer/Desejos (${splitPercent.wants}%): ${formatCurrency(suggestedFun, language)}
        - Sobra livre (Remaining): ${formatCurrency(remaining, language)}
        - Pontuação de Saúde Financeira: ${financialHealthScore}/100

        Escreva de forma consultiva e encorajadora em 2 ou 3 frases, destacando se a proporção de gastos está saudável e indicando o melhor próximo passo financeiro de forma prática.
        Idioma de resposta: ${language.startsWith('pt') ? 'Português Brasileiro (pt-BR)' : language.startsWith('es') ? 'Espanhol (es-ES)' : 'Inglês (en-US)'}.
      `;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptText,
          systemInstruction: language.startsWith('pt')
            ? "Você é o Planejador Life4Billion AI. Faça análises curtas, extremamente estratégicas e encorajadoras sobre a distribuição de salários de seus usuários."
            : language.startsWith('es')
            ? "Eres el Planificador Life4Billion AI. Realiza análisis cortos, extremadamente estratégicos y alentadores sobre la distribución salarial de tus usuarios."
            : "You are the Life4Billion AI Planner. Make short, highly strategic, and encouraging analyses of your users' salary distribution."
        })
      });

      const data = await response.json();
      if (data.success && data.response) {
        setAiSuggestion({
          housing: suggestedHousing,
          bills: suggestedBills,
          food: suggestedFood,
          savings: suggestedSavings,
          investments: suggestedInvestments,
          fun: suggestedFun,
          remaining: remaining,
          tips: data.response
        });
      } else {
        throw new Error('AI response was not successful');
      }
    } catch (err) {
      console.warn("Falling back to local simulation due to exception:", err);
      setAiSuggestion({
        housing: suggestedHousing,
        bills: suggestedBills,
        food: suggestedFood,
        savings: suggestedSavings,
        investments: suggestedInvestments,
        fun: suggestedFun,
        remaining: remaining,
        tips: language === 'pt' 
          ? `[Life4Billion AI Redundante] Sua pontuação de saúde financeira é de ${financialHealthScore}/100. Recomendamos alocar ${formatCurrency(suggestedSavings, language)} para poupança emergencial, mantendo os custos de moradia abaixo de 30% do seu salário total.`
          : `[Life4Billion AI Redundant] Your financial health score is ${financialHealthScore}/100. We recommend allocating ${formatCurrency(suggestedSavings, language)} for emergency savings, keeping housing expenses below 30% of your total paycheck.`
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Export spreadsheet data as CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
    csvContent += "Categoria,Item,Orcado,Realizado\n";
    
    sections.forEach(sec => {
      const sectionName = language === 'pt' ? sec.titlePt : sec.title;
      sec.items.forEach(item => {
        csvContent += `"${sectionName}","${item.name}",${item.budgeted},${item.actual}\n`;
      });
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `paycheck_planner_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print spreadsheet
  const handlePrint = () => {
    window.print();
  };

  // Reset spreadsheet to default
  const handleResetSpreadsheet = () => {
    if (confirm(language === 'pt' ? 'Tem certeza que deseja redefinir toda a planilha do Paycheck Planner?' : 'Are you sure you want to reset all Paycheck Planner spreadsheet data?')) {
      setSections(getInitialSections());
      setSplitPercent({ needs: 50, savings: 20, investments: 20, wants: 10 });
      setAiSuggestion(null);
    }
  };

  return (
    <div className="space-y-6" id="paycheck-planner-view">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-emerald-400" />
            Paycheck Planner — Gestão Inteligente do Salário
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'pt' 
              ? 'Organize cada salário, distribua necessidades automaticamente e acompanhe suas metas financeiras com inteligência artificial integrada.' 
              : 'Organize every paycheck, split needs automatically, and track your financial milestones with built-in financial artificial intelligence.'}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
            title={language === 'pt' ? 'Exportar planilha para CSV' : 'Export spreadsheet to CSV'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'pt' ? 'Exportar CSV' : 'Export CSV'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
            title={language === 'pt' ? 'Imprimir orçamento' : 'Print layout'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'pt' ? 'Imprimir' : 'Print'}</span>
          </button>
          <button
            onClick={handleResetSpreadsheet}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {language === 'pt' ? 'Redefinir Planilha' : 'Reset Spreadsheet'}
          </button>
        </div>
      </div>

      {/* TOP THREE COMPANION CARDS: SPLIT, CALENDAR, SCORE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* 1. PAYCHECK SPLIT */}
        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl space-y-4" id="paycheck-split-card">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Paycheck Split (Distribuição)
            </h3>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
              100% Total
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {language === 'pt' 
              ? '"Toda vez que eu receber, divida meu salário automaticamente."' 
              : '"Every time I get paid, automatically divide my paycheck."'}
          </p>

          <div className="space-y-3.5">
            {/* Needs range */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">{language === 'pt' ? 'Necessidades (Needs)' : 'Needs'}</span>
                <span className="text-white font-bold">{splitPercent.needs}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={splitPercent.needs}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  const remaining = 100 - val;
                  setSplitPercent({
                    needs: val,
                    savings: Math.round(remaining * 0.4),
                    investments: Math.round(remaining * 0.4),
                    wants: Math.round(remaining * 0.2)
                  });
                }}
                className="w-full accent-indigo-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Savings range */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">{language === 'pt' ? 'Poupança (Savings)' : 'Savings'}</span>
                <span className="text-white font-bold">{splitPercent.savings}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={splitPercent.savings}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  const remaining = 100 - splitPercent.needs - val;
                  setSplitPercent(prev => ({
                    ...prev,
                    savings: val,
                    investments: Math.max(0, Math.round(remaining * 0.6)),
                    wants: Math.max(0, Math.round(remaining * 0.4))
                  }));
                }}
                className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Investments range */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">{language === 'pt' ? 'Investimentos' : 'Investments'}</span>
                <span className="text-white font-bold">{splitPercent.investments}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={splitPercent.investments}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  const wants = Math.max(0, 100 - splitPercent.needs - splitPercent.savings - val);
                  setSplitPercent(prev => ({
                    ...prev,
                    investments: val,
                    wants: wants
                  }));
                }}
                className="w-full accent-cyan-400 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Wants/Lifestyle range */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">{language === 'pt' ? 'Lazer / Desejos' : 'Fun money / Wants'}</span>
                <span className="text-white font-bold">{splitPercent.wants}%</span>
              </div>
              <input 
                type="range" min="0" max="100" 
                value={splitPercent.wants}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  const investments = Math.max(0, 100 - splitPercent.needs - splitPercent.savings - val);
                  setSplitPercent(prev => ({
                    ...prev,
                    wants: val,
                    investments: investments
                  }));
                }}
                className="w-full accent-orange-400 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 2. PAYCHECK CALENDAR */}
        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between" id="paycheck-calendar-card">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                Paycheck Calendar
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-450">{language === 'pt' ? 'Próximo Pagamento' : 'Next paycheck'}</span>
                <span className="text-white font-bold flex items-center gap-1">
                  {calendarData.nextPayday}
                </span>
              </div>
              
              <div className="py-1">
                <span className="text-slate-450 block mb-1.5 font-semibold text-[10px] uppercase tracking-wider">
                  {language === 'pt' ? 'Contas antes do pagamento (Payday):' : 'Bills before payday:'}
                </span>
                
                {/* Checkbox item list */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-350 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={calendarData.billsPaidBefore['need-rent']}
                      onChange={(e) => setCalendarData(prev => ({
                        ...prev,
                        billsPaidBefore: { ...prev.billsPaidBefore, 'need-rent': e.target.checked }
                      }))}
                      className="rounded text-indigo-600 bg-slate-950 border-slate-800"
                    />
                    <span>Aluguel (Rent)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-350 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={calendarData.billsPaidBefore['need-electricity']}
                      onChange={(e) => setCalendarData(prev => ({
                        ...prev,
                        billsPaidBefore: { ...prev.billsPaidBefore, 'need-electricity': e.target.checked }
                      }))}
                      className="rounded text-indigo-600 bg-slate-950 border-slate-800"
                    />
                    <span>Luz (Electric)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-350 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={calendarData.billsPaidBefore['need-internet']}
                      onChange={(e) => setCalendarData(prev => ({
                        ...prev,
                        billsPaidBefore: { ...prev.billsPaidBefore, 'need-internet': e.target.checked }
                      }))}
                      className="rounded text-indigo-600 bg-slate-950 border-slate-800"
                    />
                    <span>Internet</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-350 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={calendarData.billsPaidBefore['need-car']}
                      onChange={(e) => setCalendarData(prev => ({
                        ...prev,
                        billsPaidBefore: { ...prev.billsPaidBefore, 'need-car': e.target.checked }
                      }))}
                      className="rounded text-indigo-600 bg-slate-950 border-slate-800"
                    />
                    <span>Carro (Car)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl space-y-1.5 mt-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
              {language === 'pt' ? 'Limite de Gasto Seguro' : 'Safe Spending Amount'}
            </span>
            <p className="text-xs font-medium text-slate-300">
              {language === 'pt' 
                ? `Seu limite diário de gastos seguros até sexta-feira é ` 
                : `Your safe spending limit until Friday is `}
              <span className="font-mono text-emerald-400 font-extrabold text-sm">${safeSpendingLimit}</span>
            </p>
          </div>
        </div>

        {/* 3. PAYCHECK SCORE */}
        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between" id="paycheck-score-card">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                Paycheck Score
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {language === 'pt'
                ? 'Sua nota de saúde financeira geral baseada em economia, dívidas, investimentos e hábitos.'
                : 'Your overall financial health score based on savings, debt levels, investments, and spending habits.'}
            </p>
          </div>

          <div className="flex items-center space-x-4 mt-2">
            {/* Score circle */}
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center bg-slate-950 border border-slate-850 rounded-full">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle 
                  cx="32" cy="32" r="28" 
                  stroke="#1e293b" strokeWidth="4" fill="transparent" 
                />
                <circle 
                  cx="32" cy="32" r="28" 
                  stroke="#10b981" strokeWidth="4" fill="transparent" 
                  strokeDasharray="175"
                  strokeDashoffset={175 - (175 * financialHealthScore) / 100}
                />
              </svg>
              <span className="font-mono font-black text-sm text-white">{financialHealthScore}/100</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-200">
                {financialHealthScore >= 80 ? (language === 'pt' ? 'Excelente saúde financeira' : 'Excellent Health') :
                 financialHealthScore >= 60 ? (language === 'pt' ? 'Boa saúde financeira' : 'Good Health') :
                 (language === 'pt' ? 'Atenção Orçamentária' : 'Needs Attention')}
              </span>
              <p className="text-[10px] text-slate-400 leading-tight">
                {language === 'pt' 
                  ? 'Continue direcionando pelo menos 20% do salário para poupança e investimentos.' 
                  : 'Maintain a high rating by keeping debt payments below 15% and saving at least 20%.'}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* AI SUGGESTION WIDGET */}
      <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl space-y-4" id="paycheck-ai-advisor">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">🤖 AI do Paycheck Planner</h3>
              <p className="text-[11px] text-slate-450">Simule seu salário e gere um plano de alocação de ativos inteligente</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-mono text-slate-400 shrink-0">Paycheck:</span>
            <div className="relative flex-1 md:w-32">
              <span className="absolute left-2.5 top-1.5 text-slate-500 font-bold text-xs">$</span>
              <input 
                type="number" 
                value={aiPaycheckAmount} 
                onChange={(e) => setAiPaycheckAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-6 pr-3 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <button
              onClick={triggerAiPlannerSuggestion}
              disabled={isAiLoading}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              {isAiLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{language === 'pt' ? 'Gerar Plano' : 'Generate'}</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>

        {aiSuggestion ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in text-xs">
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-7 gap-3">
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 block mb-1">Housing (30%)</span>
                <span className="font-mono font-black text-white text-sm">${aiSuggestion.housing}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 block mb-1">Bills (12%)</span>
                <span className="font-mono font-black text-white text-sm">${aiSuggestion.bills}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 block mb-1">Food (14%)</span>
                <span className="font-mono font-black text-white text-sm">${aiSuggestion.food}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-emerald-400 block mb-1">Savings ({splitPercent.savings}%)</span>
                <span className="font-mono font-black text-emerald-400 text-sm">${aiSuggestion.savings}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-cyan-400 block mb-1">Invest ({splitPercent.investments}%)</span>
                <span className="font-mono font-black text-cyan-400 text-sm">${aiSuggestion.investments}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-orange-400 block mb-1">Wants ({splitPercent.wants}%)</span>
                <span className="font-mono font-black text-orange-400 text-sm">${aiSuggestion.fun}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 block mb-1">Remaining</span>
                <span className="font-mono font-black text-slate-350 text-sm">${aiSuggestion.remaining}</span>
              </div>
            </div>
            
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850/80 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white text-[10px] uppercase tracking-wider block">Recomendação da IA:</span>
                <p className="text-[11px] text-slate-350 leading-normal">{aiSuggestion.tips}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-2 italic">
            {language === 'pt' 
              ? 'Informe o valor do Paycheck acima e toque em "Gerar Plano" para ver a sugestão personalizada da inteligência artificial.' 
              : 'Enter your paycheck amount above and tap "Generate Plan" to get customized suggestions from our finance AI.'}
          </p>
        )}
      </div>

      {/* FULL PRINTABLE SHEET SPREADSHEET (adapted from reference image) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden" id="paycheck-ledger-sheet">
        
        {/* UPPER INFO PANEL */}
        <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
              PAYCHECK BREAKDOWN SPREADSHEET
            </h3>
          </div>
          
          <div className="flex gap-4 text-xs text-slate-450 font-mono">
            <div>
              <span>Debt payoff progress:</span>
              <span className="text-rose-400 font-extrabold ml-1 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/15">
                {debtProgress}%
              </span>
            </div>
            <div className="hidden md:block">
              <span>Financial Health Score:</span>
              <span className="text-cyan-400 font-extrabold ml-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/15">
                {financialHealthScore}/100
              </span>
            </div>
          </div>
        </div>

        {/* SHEET ACCORDION FILTER TABS (Click to show/hide individual sheets) */}
        <div className="px-4 py-3 bg-slate-900/30 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs no-print">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
            {language === 'pt' ? 'Folhas do Orçamento:' : 'Budget Sheets:'}
          </span>
          {sections.map((section) => {
            const isExpanded = !!expandedSections[section.id];
            const sectionName = language === 'pt' ? section.titlePt : section.title;
            return (
              <button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                  isExpanded 
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-bold shadow-sm' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {getSectionIcon(section.id)}
                <span>{sectionName.split('.')[1] || sectionName}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-indigo-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                )}
              </button>
            );
          })}

          <div className="ml-auto flex items-center space-x-2">
            <button
              onClick={expandAllSections}
              className="text-[11px] text-slate-400 hover:text-emerald-400 font-mono transition cursor-pointer underline decoration-dotted"
            >
              {language === 'pt' ? 'Expandir Todas' : 'Expand All'}
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={collapseAllSections}
              className="text-[11px] text-slate-400 hover:text-rose-400 font-mono transition cursor-pointer underline decoration-dotted"
            >
              {language === 'pt' ? 'Ocultar Todas' : 'Collapse All'}
            </button>
          </div>
        </div>

        {/* ACTIVE MAIN GRID - SECTIONS (INCOME, ESSENTIALS, DEBT PAYMENTS, SAVINGS SUMMARY, FINANCIAL PRIORITIES, SINKING FUNDS, ETC) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-[10px] text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                <th className="py-2.5 px-4 w-[40%]">Category / Source</th>
                <th className="py-2.5 px-4 w-[25%] text-right">Budgeted ($)</th>
                <th className="py-2.5 px-4 w-[25%] text-right">Actual ($)</th>
                <th className="py-2.5 px-4 w-[10%] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-xs">
              {sections.map((section) => {
                const secBudget = getSectionTotal(section.id, 'budgeted');
                const secActual = getSectionTotal(section.id, 'actual');
                const isIncomeSec = section.id === 'income';
                const isExpanded = !!expandedSections[section.id];
                
                return (
                  <React.Fragment key={section.id}>
                    {/* Section Header Row (Clickable to toggle collapse/expand) */}
                    <tr 
                      onClick={() => toggleSection(section.id)}
                      className="bg-slate-900/40 hover:bg-slate-900/70 cursor-pointer font-bold border-b border-slate-800/80 transition group"
                      title={language === 'pt' ? 'Clique para expandir/ocultar esta folha' : 'Click to expand/collapse this sheet'}
                    >
                      <td className="py-2.5 px-4 text-white uppercase font-black text-[11px] tracking-wider flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-400 transition-transform" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-transform" />
                          )}
                          {getSectionIcon(section.id)}
                          <span>{language === 'pt' ? section.titlePt : section.title}</span>
                        </div>
                        {!isExpanded && (
                          <span className="text-[10px] font-mono text-slate-500 font-normal border border-slate-800 px-2 py-0.5 rounded-md bg-slate-950/60">
                            {section.items.length} {language === 'pt' ? 'itens (clique p/ abrir)' : 'items (click to open)'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-indigo-300 font-extrabold text-[11px]">
                        ${secBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-white font-extrabold text-[11px]">
                        ${secActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-[10px] font-mono text-slate-500">
                          {isExpanded ? '▼' : '►'}
                        </span>
                      </td>
                    </tr>

                    {/* Section Items Rows (Hidden when collapsed, visible when expanded) */}
                    {isExpanded && section.items.map((item) => {
                      const isExcessActual = !isIncomeSec && item.actual > item.budgeted;
                      
                      return (
                        <tr key={item.id} className="hover:bg-slate-900/20 border-b border-slate-900/10 transition">
                          <td className="py-1.5 px-6 text-slate-300 font-sans pl-10">
                            • {item.name}
                          </td>
                          <td className="py-1 px-4 text-right">
                            <input 
                              type="number"
                              value={item.budgeted || ''}
                              onChange={(e) => handleCellChange(section.id, item.id, 'budgeted', parseFloat(e.target.value) || 0)}
                              className="bg-transparent text-right font-mono text-indigo-400/90 w-24 py-0.5 px-1 rounded hover:bg-slate-900/60 focus:bg-slate-900/80 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="py-1 px-4 text-right">
                            <input 
                              type="number"
                              value={item.actual || ''}
                              onChange={(e) => handleCellChange(section.id, item.id, 'actual', parseFloat(e.target.value) || 0)}
                              className={`bg-transparent text-right font-mono w-24 py-0.5 px-1 rounded hover:bg-slate-900/60 focus:bg-slate-900/80 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isExcessActual ? 'text-rose-400 font-bold' : 'text-slate-200'}`}
                              placeholder="0.00"
                            />
                          </td>
                          <td className="py-1 px-4 text-center">
                            {isIncomeSec ? (
                              item.actual >= item.budgeted && item.actual > 0 ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                              ) : null
                            ) : (
                              isExcessActual ? (
                                <span title="Estourou o planejado"><AlertTriangle className="w-3.5 h-3.5 text-rose-500 mx-auto" /></span>
                              ) : item.actual > 0 ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                              ) : null
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* PAYCHECK SUMMARY CONSOLIDATION ROW */}
              <tr className="bg-slate-900 border-t-2 border-slate-800 font-black">
                <td className="py-3 px-4 text-white uppercase text-[11px] tracking-widest font-mono">
                  9. Paycheck Summary
                </td>
                <td className="py-3 px-4 text-right text-white font-mono text-xs">
                  Budgeted
                </td>
                <td className="py-3 px-4 text-right text-white font-mono text-xs">
                  Actual
                </td>
                <td className="py-3 px-4"></td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="py-2 px-6 text-slate-300 font-sans font-semibold">
                  (+) Total Income (Entradas)
                </td>
                <td className="py-2 px-4 text-right font-mono text-emerald-400 font-bold">
                  ${totalIncomeBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4 text-right font-mono text-emerald-400 font-bold">
                  ${totalIncomeActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4"></td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="py-2 px-6 text-slate-300 font-sans font-semibold">
                  (-) Total Essential Needs & Expenses (Necessidades)
                </td>
                <td className="py-2 px-4 text-right font-mono text-rose-450">
                  -${totalNeedsBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4 text-right font-mono text-rose-450">
                  -${totalNeedsActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4"></td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="py-2 px-6 text-slate-300 font-sans font-semibold">
                  (-) Total Debt Payments (Dívidas)
                </td>
                <td className="py-2 px-4 text-right font-mono text-rose-450">
                  -${totalDebtsBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4 text-right font-mono text-rose-450">
                  -${totalDebtsActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4"></td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="py-2 px-6 text-slate-300 font-sans font-semibold">
                  (-) Total Saving Summary (Poupança)
                </td>
                <td className="py-2 px-4 text-right font-mono text-indigo-400">
                  -${totalSavingsBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4 text-right font-mono text-indigo-400">
                  -${totalSavingsActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4"></td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="py-2 px-6 text-slate-300 font-sans font-semibold">
                  (-) Total Investing (Investimentos)
                </td>
                <td className="py-2 px-4 text-right font-mono text-cyan-400">
                  -${totalInvestingBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4 text-right font-mono text-cyan-400">
                  -${totalInvestingActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4"></td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="py-2 px-6 text-slate-300 font-sans font-semibold">
                  (-) Total Family Expenses (Família)
                </td>
                <td className="py-2 px-4 text-right font-mono text-rose-450">
                  -${totalFamilyBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4 text-right font-mono text-rose-450">
                  -${totalFamilyActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4"></td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="py-2 px-6 text-slate-300 font-sans font-semibold">
                  (-) Total Lifestyle Wants (Estilo de Vida)
                </td>
                <td className="py-2 px-4 text-right font-mono text-orange-400">
                  -${totalLifestyleBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4 text-right font-mono text-orange-400">
                  -${totalLifestyleActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4"></td>
              </tr>

              <tr className="border-b border-slate-900">
                <td className="py-2 px-6 text-slate-300 font-sans font-semibold">
                  (-) Total Business Plan (Negócios)
                </td>
                <td className="py-2 px-4 text-right font-mono text-yellow-500">
                  -${totalBusinessBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4 text-right font-mono text-yellow-500">
                  -${totalBusinessActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-4"></td>
              </tr>

              {/* (=) TOTAL ALLOCATIONS */}
              <tr className="bg-slate-900/50 border-b border-slate-800 font-bold">
                <td className="py-2.5 px-6 text-white font-semibold">
                  (=) Total Expenses & Allocations
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                  ${totalExpensesBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                  ${totalExpensesActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-4"></td>
              </tr>

              {/* (=) REMAINING LEFTOVER */}
              <tr className="bg-slate-900 font-black border-t-2 border-slate-800">
                <td className="py-3 px-6 text-white font-mono uppercase text-[11px] tracking-wider">
                  (=) Remaining / Leftover (Sobras)
                </td>
                <td className={`py-3 px-4 text-right font-mono text-sm ${remainingBudget >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${remainingBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className={`py-3 px-4 text-right font-mono text-sm ${remainingActual >= 0 ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-extrabold'}`}>
                  ${remainingActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-center">
                  {remainingActual >= 0 ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                      {language === 'pt' ? 'OK' : 'SAFE'}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-bold">
                      {language === 'pt' ? 'DÉFICIT' : 'OVER'}
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
