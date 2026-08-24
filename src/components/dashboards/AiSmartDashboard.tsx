import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  ArrowUpRight, 
  Send, 
  Zap, 
  ShieldCheck, 
  BrainCircuit,
  MessageSquare
} from 'lucide-react';
import { useLanguageTheme, formatCurrency } from '../../utils/i18n';
import { getThemeColorById } from '../../utils/theme';
import { Transaction, Goal, Debt, EmergencyFund, FinancialCard } from '../../types/schema';

interface AiSmartProps {
  transactions: Transaction[];
  goals: Goal[];
  debts: Debt[];
  emergencyFund: EmergencyFund;
  cards: FinancialCard[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  onNavigate?: (view: string) => void;
  onShowNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const AiSmartDashboard: React.FC<AiSmartProps> = ({
  transactions,
  goals,
  debts,
  emergencyFund,
  cards,
  totalIncome,
  totalExpense,
  netBalance,
  onNavigate,
  onShowNotification
}) => {
  const { t, language, theme, themeColor } = useLanguageTheme();
  const isLight = theme === 'light';
  const activeThemeOption = getThemeColorById(themeColor);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiAnswers, setAiAnswers] = useState<string[]>([]);

  const income = totalIncome || 0;
  const expenses = totalExpense || 0;
  const net = netBalance || 0;

  // Proactive Smart AI Insights based on user real data
  const aiInsightsList = [
    {
      id: 'i1',
      type: 'warning',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      title: t('dashboard.spendingAnalysis', 'Spending Analysis'),
      text: expenses > 0 
        ? t('aiCoach.diningWarning', `Current recorded expenses are ${formatCurrency(expenses, language)}. Track upcoming subscriptions to optimize cash flow.`)
        : t('aiCoach.emptySpending', 'No expenses recorded yet. Start logging your daily expenses to receive automated AI optimization suggestions.'),
      badge: 'Action Suggested',
      color: isLight 
        ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm' 
        : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
    },
    {
      id: 'i2',
      type: 'opportunity',
      icon: <Lightbulb className="w-5 h-5 text-emerald-500" />,
      title: t('dashboard.opportunities', 'Savings & Emergency Opportunity'),
      text: emergencyFund.target_amount > 0 
        ? `Your current net balance is ${formatCurrency(net, language)}. Allocating funds to your Emergency Fund will boost completion to ${Math.round(((emergencyFund.current_balance) / (emergencyFund.target_amount || 1)) * 100)}%.`
        : `Your current net balance is ${formatCurrency(net, language)}. Setting up an Emergency Fund target provides a reliable financial cushion.`,
      badge: 'Goal Acceleration',
      color: isLight 
        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm' 
        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
    },
    {
      id: 'i3',
      type: 'prediction',
      icon: <Zap className="w-5 h-5 text-indigo-500" />,
      title: t('dashboard.predictions', '3-Month Financial Projection'),
      text: `Maintaining current income of ${formatCurrency(income, language)} and expenses of ${formatCurrency(expenses, language)} predicts a total net accumulation of ${formatCurrency(net * 3, language)} over the next 90 days.`,
      badge: 'Forecast',
      color: isLight 
        ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' 
        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
    }
  ];

  const handleSendAiPrompt = () => {
    if (!customPrompt.trim()) return;
    setIsAsking(true);
    setTimeout(() => {
      const response = `Based on your live Life4Billion database (Income: ${formatCurrency(income, language)}, Expenses: ${formatCurrency(expenses, language)}), here is my recommendation for "${customPrompt}": Maintain a 20% emergency buffer and prioritize high-interest card payoff to optimize cash flow.`;
      setAiAnswers(prev => [response, ...prev]);
      setCustomPrompt('');
      setIsAsking(false);
      if (onShowNotification) {
        onShowNotification('AI Financial Assistant', 'Analysis generated based on live financial data.', 'success');
      }
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="ai-smart-dashboard">
      
      {/* AI Smart Header Banner (Themed to match header & sidebar) */}
      <div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/15 p-6 rounded-2xl shadow-xl text-white transition-colors"
        style={{ backgroundColor: activeThemeOption.hex }}
      >
        <div className="flex items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-white/20 border border-white/30 text-white shrink-0">
            <Bot className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                {t('dashboard.aiSmart', 'AI Smart Dashboard')}
              </span>
              <span className="text-xs text-white/80 font-mono">Life4Billion AI Financial Intelligence</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Autonomous Financial Assistant & Coach
            </h2>
            <p className="text-xs text-white/80 mt-0.5 max-w-xl">
              Proactive AI insights analyzing income, spending habits, debts, emergency buffer, and predictive cash flow.
            </p>
          </div>
        </div>

        <button 
          onClick={() => onNavigate && onNavigate('ai')}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition shadow-lg flex items-center space-x-2 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Open Copilot Studio</span>
        </button>
      </div>

      {/* Interactive AI Prompt Input Bar */}
      <div className={`p-4 rounded-2xl space-y-3 border transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-900/60 border-indigo-500/20'
      }`}>
        <label className={`text-xs font-bold flex items-center space-x-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
          <BrainCircuit className="w-4 h-4 text-indigo-500" />
          <span>Ask Your Financial Assistant Anything</span>
        </label>
        <div className="flex items-center space-x-2">
          <input 
            type="text" 
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendAiPrompt()}
            placeholder="e.g. How can I optimize my monthly subscription spending to reach $20,000 net worth faster?"
            className={`flex-1 rounded-xl px-4 py-2.5 text-xs transition border focus:outline-none focus:border-indigo-500 ${
              isLight 
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' 
                : 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
            }`}
          />
          <button 
            onClick={handleSendAiPrompt}
            disabled={isAsking || !customPrompt.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition flex items-center space-x-1.5 shrink-0"
          >
            {isAsking ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Analyze</span>
          </button>
        </div>

        {/* Dynamic AI Answers List */}
        {aiAnswers.length > 0 && (
          <div className={`space-y-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            {aiAnswers.map((ans, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl border text-xs flex items-start space-x-3 ${
                isLight 
                  ? 'bg-indigo-50 border-indigo-200 text-slate-800' 
                  : 'bg-indigo-950/40 border-indigo-500/30 text-slate-200'
              }`}>
                <Bot className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className="flex-1 leading-relaxed">{ans}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proactive AI Insights Cards Grid */}
      <div className="space-y-4">
        <h3 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>{t('dashboard.aiGeneratedInsights', 'Proactive Financial Recommendations')}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsightsList.map(item => (
            <div key={item.id} className={`p-5 rounded-2xl border ${item.color} space-y-3 flex flex-col justify-between`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {item.icon}
                    <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.title}</span>
                  </div>
                  <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                    isLight ? 'bg-white text-slate-700 border border-slate-200' : 'bg-slate-900/60 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{item.text}</p>
              </div>
              
              <button 
                onClick={() => onNavigate && onNavigate('emergency-fund')}
                className={`text-xs font-semibold underline hover:opacity-80 transition text-left ${
                  isLight ? 'text-indigo-600' : 'text-white'
                }`}
              >
                Apply Recommendation &rarr;
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
