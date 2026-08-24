import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Heart, 
  BarChart3, 
  MinusCircle, 
  Sparkles, 
  CheckCircle2, 
  X,
  LayoutDashboard
} from 'lucide-react';
import { useLanguageTheme } from '../../utils/i18n';
import { getThemeColorById } from '../../utils/theme';
import { DashboardType } from '../../types/schema';
import { LocalDatabase } from '../../utils/db';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDashboard: (type: DashboardType) => void;
  currentType?: DashboardType;
}

export const DashboardOnboardingModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSelectDashboard,
  currentType = 'executive'
}) => {
  const { t, language, theme, themeColor } = useLanguageTheme();
  const isLight = theme === 'light';
  const activeThemeOption = getThemeColorById(themeColor);
  const [selected, setSelected] = useState<DashboardType>(currentType);

  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

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

  const dashboardOptions: {
    id: DashboardType;
    titleKey: string;
    titleDefault: string;
    desc: string;
    purpose: string;
    icon: React.ReactNode;
    color: string;
    badge: string;
  }[] = [
    {
      id: 'executive',
      titleKey: 'dashboard.executiveOverview',
      titleDefault: tr('Painel de Visão Executiva', 'Executive Overview Dashboard', 'Panel de Vista Ejecutiva'),
      purpose: tr('Para proprietários, executivos e gestores.', 'For business owners, executives, and managers.', 'Para propietarios, ejecutivos y gestores.'),
      desc: tr('Inclui Faturamento, Lucro Líquido, Fluxo de Caixa, Taxa de Crescimento, Patrimônio e Metas.', 'Includes Revenue, Net Profit, Cash Flow, Growth Rate, Net Worth, Financial Goals, and Important Alerts.', 'Incluye Ingresos, Beneficio Neto, Flujo de Caja, Tasa de Crecimiento, Patrimonio y Metas.'),
      icon: <Briefcase className="w-5 h-5" />,
      color: isLight ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
      badge: tr('Executivo SaaS', 'Executive SaaS', 'Ejecutivo SaaS')
    },
    {
      id: 'financial_health',
      titleKey: 'dashboard.financialHealth',
      titleDefault: tr('Painel de Saúde Financeira', 'Financial Health Dashboard', 'Panel de Salud Financiera'),
      purpose: tr('Para controle de finanças pessoais e equilíbrio.', 'For personal finance users seeking balance.', 'Para control de finanzas personales y equilibrio.'),
      desc: tr('Inclui Receitas, Despesas, Taxa de Poupança, Dívidas, Investimentos e Pontuação de Saúde (0-100).', 'Includes Income, Expenses, Savings Rate, Debt Overview, Investments, Spending Categories, and Health Score (0-100).', 'Incluye Ingresos, Gastos, Tasa de Ahorro, Deudas, Inversiones y Puntuación de Salud (0-100).'),
      icon: <Heart className="w-5 h-5" />,
      color: isLight ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-rose-500/40 bg-rose-500/10 text-rose-400',
      badge: tr('Saúde Pessoal', 'Personal Health', 'Salud Personal')
    },
    {
      id: 'bi',
      titleKey: 'dashboard.businessIntelligence',
      titleDefault: tr('Painel de Inteligência de Negócios', 'Business Intelligence Dashboard', 'Panel de Inteligencia de Negocios'),
      purpose: tr('Para empresas, freelancers e empreendedores.', 'For companies, freelancers, and entrepreneurs.', 'Para empresas, autónomos y emprendedores.'),
      desc: tr('Inclui Vendas, Tendências de Receita, Margem de Lucro, Clientes, Produtos e DRE Simplificado.', 'Includes Sales Performance, Revenue Trends, Profit Margin, Expenses, Customers, Products, and Simplified P&L Statement.', 'Incluye Ventas, Tendencias de Ingresos, Margen de Beneficio, Clientes, Productos y DRE Simplificado.'),
      icon: <BarChart3 className="w-5 h-5" />,
      color: isLight ? 'border-cyan-200 bg-cyan-50 text-cyan-600' : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
      badge: tr('Analytics Corporativo', 'Corporate Analytics', 'Analítica Corporativa')
    },
    {
      id: 'minimal',
      titleKey: 'dashboard.minimal',
      titleDefault: tr('Painel Minimalista', 'Minimal Dashboard', 'Panel Minimalista'),
      purpose: tr('Para quem busca simplicidade e clareza rápida.', 'For beginners who want simplicity.', 'Para quienes buscan simplicidad y claridad rápida.'),
      desc: tr('Inclui Saldo Atual, Entradas, Saídas, Metas e Próximos Pagamentos de forma limpa.', 'Includes Current Balance, Income, Expenses, Goals, and Upcoming Payments in an ultra-clean layout.', 'Incluye Saldo Actual, Ingresos, Gastos, Metas y Próximos Pagos de forma limpia.'),
      icon: <MinusCircle className="w-5 h-5" />,
      color: isLight ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-slate-500/40 bg-slate-500/10 text-slate-300',
      badge: tr('Sem Distrações', 'Clutter-Free', 'Sin Distracciones')
    },
    {
      id: 'ai_smart',
      titleKey: 'dashboard.aiSmart',
      titleDefault: tr('Painel IA Inteligente', 'AI Smart Dashboard', 'Panel IA Inteligente'),
      purpose: tr('Assistente e mentor financeiro inteligente.', 'An intelligent financial assistant & coach.', 'Asistente y mentor financiero inteligente.'),
      desc: tr('Inclui insights de IA, análise de gastos, recomendações, previsões e alertas automáticos.', 'Includes AI-generated insights, spending analysis, financial recommendations, predictions, warnings, and opportunities.', 'Incluye insights de IA, análisis de gastos, recomendaciones, predicciones y alertas automáticas.'),
      icon: <Sparkles className="w-5 h-5" />,
      color: isLight ? 'border-purple-200 bg-purple-50 text-purple-600' : 'border-purple-500/40 bg-purple-500/10 text-purple-400',
      badge: tr('IA Autônoma', 'Autonomous AI', 'IA Autónoma')
    }
  ];

  const handleSave = () => {
    LocalDatabase.setDashboardType(selected);
    onSelectDashboard(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className={`border rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`} 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-xl transition ${
            isLight ? 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200' : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="w-5 h-5" style={{ color: activeThemeOption.hex }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: activeThemeOption.hex }}>
              {tr('Preferências do Painel', 'Dashboard Preferences', 'Preferencias del Panel')}
            </span>
          </div>
          <h2 className={`text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {t('dashboard.selectExperience', tr('Selecione a Experiência do seu Painel', 'Select Your Dashboard Experience', 'Seleccione la Experiencia de su Panel'))}
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {t('dashboard.changePreference', tr('Você pode alterar a visualização do painel a qualquer momento nas Configurações.', 'You can change your dashboard visualization preferences anytime in Settings.', 'Puede cambiar sus preferencias de visualización en Configuración.'))}
          </p>
        </div>

        {/* 5 Options Grid */}
        <div className="space-y-3">
          {dashboardOptions.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <div 
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-start space-x-4 ${
                  isSelected 
                    ? (isLight ? 'border-indigo-500 bg-indigo-50/70 shadow-md' : 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10')
                    : (isLight ? 'border-slate-200 bg-slate-50/50 hover:border-slate-300' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700')
                }`}
              >
                <div className={`p-3 rounded-xl border shrink-0 ${opt.color}`}>
                  {opt.icon}
                </div>

                <div className="flex-1 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {t(opt.titleKey, opt.titleDefault)}
                    </h3>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {opt.badge}
                    </span>
                  </div>
                  <p className={`font-medium ${isLight ? 'text-indigo-600' : 'text-indigo-300/90'}`}>{opt.purpose}</p>
                  <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>{opt.desc}</p>
                </div>

                <div className="shrink-0 pt-1">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  ) : (
                    <div className={`w-5 h-5 rounded-full border ${isLight ? 'border-slate-300' : 'border-slate-700'}`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className={`flex justify-end space-x-3 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <button 
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
              isLight ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200' : 'text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800'
            }`}
          >
            {t('cancel', tr('Cancelar', 'Cancel', 'Cancelar'))}
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-md flex items-center space-x-2"
            style={{ backgroundColor: activeThemeOption.hex }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{tr('Aplicar Experiência do Painel', 'Apply Dashboard Experience', 'Aplicar Experiencia del Panel')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
