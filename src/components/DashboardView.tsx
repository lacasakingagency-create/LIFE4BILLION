import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Sliders,
  Smartphone
} from 'lucide-react';
import { LocalDatabase } from '../utils/db';
import { Transaction, Goal, Habit, Inventory, Employee, Product, DashboardType, Debt, EmergencyFund, FinancialCard, Customer, Sale, Company } from '../types/schema';
import { useLanguageTheme } from '../utils/i18n';
import { getThemeColorById } from '../utils/theme';
import { ExecutiveOverviewDashboard } from './dashboards/ExecutiveOverviewDashboard';
import { FinancialHealthDashboard } from './dashboards/FinancialHealthDashboard';
import { BusinessIntelligenceDashboard } from './dashboards/BusinessIntelligenceDashboard';
import { MinimalDashboard } from './dashboards/MinimalDashboard';
import { AiSmartDashboard } from './dashboards/AiSmartDashboard';
import { DashboardOnboardingModal } from './dashboards/DashboardOnboardingModal';
import { DashboardWallpaperModal } from './DashboardWallpaperModal';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

export default function DashboardView({ onNavigate, onShowNotification }: DashboardViewProps) {
  const { t, language, theme, themeColor } = useLanguageTheme();
  const isLight = theme === 'light';
  const activeThemeOption = getThemeColorById(themeColor);

  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const [dashboardType, setDashboardType] = useState<DashboardType>(() => LocalDatabase.getDashboardType());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund>(() => LocalDatabase.getEmergencyFund());
  const [cards, setCards] = useState<FinancialCard[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    LocalDatabase.init();
    setTransactions(LocalDatabase.getTransactions());
    setGoals(LocalDatabase.getGoals());
    setHabits(LocalDatabase.getHabits());
    setInventory(LocalDatabase.getInventory());
    setEmployees(LocalDatabase.getEmployees());
    setProducts(LocalDatabase.getProducts());
    setDebts(LocalDatabase.getDebts());
    setCards(LocalDatabase.getCards());
    setCustomers(LocalDatabase.getCustomers());
    setSales(LocalDatabase.getSales());
    setCompanies(LocalDatabase.getCompanies());
    setEmergencyFund(LocalDatabase.getEmergencyFund());
  }, []);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const handleSelectDashboard = (type: DashboardType) => {
    setDashboardType(type);
    LocalDatabase.setDashboardType(type);
    const names = {
      executive: tr('Visão Executiva', 'Executive Overview', 'Vista Ejecutiva'),
      financial_health: tr('Saúde Financeira', 'Financial Health', 'Salud Financiera'),
      bi: tr('Inteligência de Negócios', 'Business Intelligence', 'Inteligencia de Negocios'),
      minimal: tr('Minimalista', 'Minimal', 'Minimalista'),
      ai_smart: tr('IA Inteligente', 'AI Smart', 'IA Inteligente')
    };
    onShowNotification(
      tr('Preferência Salva', 'Preference Saved', 'Preferencia Guardada'),
      tr(`Painel alterado para a visualização ${names[type]}.`, `Switched to ${names[type]} dashboard view.`, `Cambiado a la vista ${names[type]}.`),
      'success'
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Dashboard Type Switcher Toolbar - Obey Theme Color Selection */}
      <div 
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl shadow-md border transition-colors ${
          isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-900/80 border-slate-800'
        }`}
        style={{ borderColor: `${activeThemeOption.hex}50` }}
      >
        <div className="flex items-center space-x-2">
          <LayoutDashboard className="w-4 h-4" style={{ color: activeThemeOption.hex }} />
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            {t('activeViewLabel', tr('Visualização Ativa:', 'Active View:', 'Vista Activa:'))}
          </span>
          <span 
            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm"
            style={{ 
              backgroundColor: `${activeThemeOption.hex}20`, 
              borderColor: `${activeThemeOption.hex}50`, 
              color: isLight ? activeThemeOption.hex : '#ffffff' 
            }}
          >
            {dashboardType === 'executive' && tr('Visão Executiva', 'Executive Overview', 'Vista Ejecutiva')}
            {dashboardType === 'financial_health' && tr('Saúde Financeira', 'Financial Health', 'Salud Financiera')}
            {dashboardType === 'bi' && tr('Inteligência de Negócios', 'Business Intelligence', 'Inteligencia de Negocios')}
            {dashboardType === 'minimal' && tr('Minimalista', 'Minimal', 'Minimalista')}
            {dashboardType === 'ai_smart' && tr('IA Inteligente', 'AI Smart', 'IA Inteligente')}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsWallpaperModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition shadow-sm flex items-center space-x-1.5 hover:opacity-90"
            style={{ 
              backgroundColor: `${activeThemeOption.hex}15`, 
              borderColor: `${activeThemeOption.hex}50`, 
              color: isLight ? activeThemeOption.hex : '#ffffff',
              minHeight: '36px' 
            }}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t('createWallpaperTitle', tr('Criar Papel de Parede', 'Create Dashboard Wallpaper', 'Crear Fondo de Pantalla'))}</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition shadow-md flex items-center space-x-1.5 hover:brightness-110"
            style={{ 
              backgroundColor: activeThemeOption.hex, 
              boxShadow: `0 4px 14px ${activeThemeOption.hex}40`,
              minHeight: '36px' 
            }}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('dashboard.switchExperience', tr('Alternar Experiência', 'Switch Dashboard Experience', 'Cambiar Experiencia'))}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Active Dashboard View */}
      {dashboardType === 'executive' && (
        <ExecutiveOverviewDashboard 
          transactions={transactions}
          goals={goals}
          debts={debts}
          netBalance={netBalance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          onNavigate={onNavigate}
        />
      )}

      {dashboardType === 'financial_health' && (
        <FinancialHealthDashboard 
          transactions={transactions}
          debts={debts}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netBalance={netBalance}
          onNavigate={onNavigate}
        />
      )}

      {dashboardType === 'bi' && (
        <BusinessIntelligenceDashboard 
          companies={companies}
          employees={employees}
          products={products}
          customers={customers}
          sales={sales}
          transactions={transactions}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netBalance={netBalance}
          onNavigate={onNavigate}
        />
      )}

      {dashboardType === 'minimal' && (
        <MinimalDashboard 
          netBalance={netBalance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          goals={goals}
          transactions={transactions}
          onNavigate={onNavigate}
        />
      )}

      {dashboardType === 'ai_smart' && (
        <AiSmartDashboard 
          transactions={transactions}
          goals={goals}
          debts={debts}
          emergencyFund={emergencyFund}
          cards={cards}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netBalance={netBalance}
          onNavigate={onNavigate}
          onShowNotification={onShowNotification}
        />
      )}

      {/* Onboarding / Experience Modal */}
      <DashboardOnboardingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectDashboard={handleSelectDashboard}
        currentType={dashboardType}
      />

      {/* Wallpaper Modal */}
      <DashboardWallpaperModal
        isOpen={isWallpaperModalOpen}
        onClose={() => setIsWallpaperModalOpen(false)}
        onShowNotification={onShowNotification}
      />

    </div>
  );
}
