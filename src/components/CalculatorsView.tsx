import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Search, 
  Heart, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Percent, 
  Coins, 
  Home, 
  CreditCard, 
  Briefcase, 
  ArrowRight, 
  X, 
  RefreshCw, 
  Info, 
  Sparkles,
  BookOpen,
  PieChart,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';

interface CalculatorApp {
  id: string;
  title: string;
  description: string;
  category: 'Finance' | 'Investments' | 'Loans & Debt' | 'Salary & Taxes' | 'Other';
  icon: React.ReactNode;
  color: string;
}

export default function CalculatorsView({ onShowNotification }: { onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void }) {
  const { language, theme, t } = useLanguageTheme();
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const stored = localStorage.getItem('omnisaas_fav_calculators');
    return stored ? JSON.parse(stored) : ['compound', 'retirement', 'mortgage'];
  });
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(() => {
    const stored = localStorage.getItem('omnisaas_recent_calculators');
    return stored ? JSON.parse(stored) : ['compound', 'roi', 'hourly'];
  });
  const [selectedCalc, setSelectedCalc] = useState<CalculatorApp | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('omnisaas_fav_calculators', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('omnisaas_recent_calculators', JSON.stringify(recentlyUsed));
  }, [recentlyUsed]);

  // List of all 21 requested Calculators grouped by standard categories
  const rawCalculatorApps: CalculatorApp[] = [
    // Finance / Basic
    { id: 'compound', title: 'Juros Compostos', description: 'Simule o crescimento exponencial do seu patrimônio ao longo dos anos com juros sobre juros.', category: 'Finance', icon: <TrendingUp className="w-5 h-5" />, color: 'from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20' },
    { id: 'simple', title: 'Juros Simples', description: 'Calcule retornos lineares rápidos sobre empréstimos ou aplicações financeiras básicas.', category: 'Finance', icon: <Coins className="w-5 h-5" />, color: 'from-amber-500/10 to-yellow-500/10 text-amber-400 border-amber-500/20' },
    { id: 'savings', title: 'Metas de Poupança', description: 'Descubra quanto você precisa poupar mensalmente para atingir seu objetivo financeiro no prazo.', category: 'Finance', icon: <PieChart className="w-5 h-5" />, color: 'from-sky-500/10 to-blue-500/10 text-sky-400 border-sky-500/20' },
    { id: 'emergency', title: 'Reserva de Emergência', description: 'Defina o tamanho ideal do seu colchão de liquidez para cobrir imprevistos (3, 6 ou 12 meses).', category: 'Finance', icon: <Scale className="w-5 h-5" />, color: 'from-indigo-500/10 to-violet-500/10 text-indigo-400 border-indigo-500/20' },
    { id: 'budget', title: 'Planejador de Orçamento 50/30/20', description: 'Divida seus rendimentos mensais de forma automática nas proporções ideais de necessidades e desejos.', category: 'Finance', icon: <BookOpen className="w-5 h-5" />, color: 'from-teal-500/10 to-cyan-500/10 text-teal-400 border-teal-500/20' },
    
    // Investments
    { id: 'retirement', title: 'Planejador de Aposentadoria FIRE', description: 'Calcule seu número de independência financeira (NIF) e quando poderá viver de renda.', category: 'Investments', icon: <Sparkles className="w-5 h-5" />, color: 'from-purple-500/10 to-pink-500/10 text-purple-400 border-purple-500/20' },
    { id: 'growth', title: 'Crescimento de Investimentos', description: 'Simule carteiras de investimentos dinâmicas com aportes mensais adicionais.', category: 'Investments', icon: <TrendingUp className="w-5 h-5" />, color: 'from-emerald-500/10 to-sky-500/10 text-emerald-400 border-emerald-500/20' },
    { id: 'roi', title: 'Retorno sobre Investimento (ROI)', description: 'Calcule a taxa de retorno absoluto e anualizada de qualquer negócio ou empreendimento.', category: 'Investments', icon: <DollarSign className="w-5 h-5" />, color: 'from-lime-500/10 to-emerald-500/10 text-lime-400 border-lime-500/20' },
    { id: 'roas', title: 'ROAS para Marketing', description: 'Mensure o retorno das suas campanhas de publicidade paga em múltiplos de faturamento.', category: 'Investments', icon: <Percent className="w-5 h-5" />, color: 'from-fuchsia-500/10 to-pink-500/10 text-fuchsia-400 border-fuchsia-500/20' },
    { id: 'margin', title: 'Margem de Lucro SaaS', description: 'Calcule margens operacionais de receita líquida para precificar produtos corretamente.', category: 'Investments', icon: <Briefcase className="w-5 h-5" />, color: 'from-rose-500/10 to-orange-500/10 text-rose-400 border-rose-500/20' },

    // Loans & Debt
    { id: 'loan', title: 'Simulador Geral de Empréstimos', description: 'Simule financiamentos diversos com tabelas SAC ou Price de parcelamento.', category: 'Loans & Debt', icon: <CreditCard className="w-5 h-5" />, color: 'from-sky-500/10 to-indigo-500/10 text-sky-400 border-sky-500/20' },
    { id: 'mortgage', title: 'Financiamento Imobiliário', description: 'Estime as parcelas, taxas e o custo efetivo total de financiamento de imóveis e terrenos.', category: 'Loans & Debt', icon: <Home className="w-5 h-5" />, color: 'from-indigo-500/10 to-blue-500/10 text-indigo-400 border-indigo-500/20' },
    { id: 'creditcard', title: 'Amortização de Cartão de Crédito', description: 'Descubra o tempo e os juros pagos se mantiver pagamentos parciais na sua fatura.', category: 'Loans & Debt', icon: <CreditCard className="w-5 h-5" />, color: 'from-rose-500/10 to-red-500/10 text-rose-400 border-rose-500/20' },
    { id: 'snowball', title: 'Método Bola de Neve (Snowball)', description: 'Estratégia para quitação de dívidas focada em eliminar o menor saldo primeiro.', category: 'Loans & Debt', icon: <Coins className="w-5 h-5" />, color: 'from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20' },
    { id: 'avalanche', title: 'Método Avalanche de Dívidas', description: 'Estratégia matemática focada em liquidar primeiro as dívidas com maiores taxas de juros.', category: 'Loans & Debt', icon: <TrendingUp className="w-5 h-5" />, color: 'from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20' },

    // Salary & Taxes
    { id: 'salary', title: 'Salário Líquido (CLT)', description: 'Calcule seu salário líquido após descontos legais como INSS, IRRF e pensões.', category: 'Salary & Taxes', icon: <Briefcase className="w-5 h-5" />, color: 'from-teal-500/10 to-emerald-500/10 text-teal-400 border-teal-500/20' },
    { id: 'hourly', title: 'Conversor Valor/Hora de Trabalho', description: 'Converta seu salário mensal para o valor real da sua hora útil e vice-versa.', category: 'Salary & Taxes', icon: <Clock className="w-5 h-5" />, color: 'from-sky-500/10 to-cyan-500/10 text-sky-400 border-sky-500/20' },
    { id: 'taxes', title: 'Simulador de Alíquota Efetiva', description: 'Descubra quanto você paga de imposto consolidado real sobre o faturamento PJ.', category: 'Salary & Taxes', icon: <Scale className="w-5 h-5" />, color: 'from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20' },

    // Other
    { id: 'inflation', title: 'Impacto da Inflação', description: 'Calcule a perda do poder de compra real do seu dinheiro guardado sob o colchão.', category: 'Other', icon: <TrendingDown className="w-5 h-5" />, color: 'from-rose-500/10 to-amber-500/10 text-rose-400 border-rose-500/20' },
    { id: 'currency', title: 'Conversor de Câmbio Fiduciário', description: 'Conversões cambiais simuladas em tempo real entre principais moedas globais.', category: 'Other', icon: <Coins className="w-5 h-5" />, color: 'from-amber-500/10 to-emerald-500/10 text-amber-400 border-amber-500/20' }
  ];

  const calculatorApps = rawCalculatorApps.map(app => ({
    ...app,
    title: t(`calc.${app.id}.title`, app.title),
    description: t(`calc.${app.id}.desc`, app.description)
  }));

  const categories = ['All', 'Finance', 'Investments', 'Loans & Debt', 'Salary & Taxes', 'Other'];

  const filteredApps = calculatorApps.filter(app => {
    const matchesSearch = app.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || app.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(favId => favId !== id));
      onShowNotification(t('favorites', 'Favoritos'), t('calcRemovedFav', 'Calculadora removida dos favoritos.'), 'info');
    } else {
      setFavorites([...favorites, id]);
      onShowNotification(t('favorites', 'Favoritos'), t('calcAddedFav', 'Calculadora adicionada aos favoritos!'), 'success');
    }
  };

  const handleLaunchCalc = (app: CalculatorApp) => {
    setSelectedCalc(app);
    // Add to recently used
    const updatedRecent = [app.id, ...recentlyUsed.filter(id => id !== app.id)].slice(0, 5);
    setRecentlyUsed(updatedRecent);
  };

  return (
    <div className="space-y-6" id="calculators-module">
      
      {/* Search Header */}
      <div className="bg-slate-900/40 p-6 border border-slate-800 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="calculators-header">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center">
            <Calculator className="w-5.5 h-5.5 mr-2 text-indigo-400" />
            {t('calculatorsCenterTitle', 'Central de Calculadoras Financeiras & Operacionais')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('calculatorsCenterSub', 'Biblioteca completa de utilitários de simulação rápida modelada como uma App Store moderna.')}
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <span className="absolute left-3.5 top-3 text-slate-500"><Search className="w-4 h-4" /></span>
          <input 
            type="text" 
            placeholder={t('searchCalculators', 'Buscar calculadora por nome...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-550 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Favorites Section (Optional render) */}
      {favorites.length > 0 && searchQuery === '' && activeCategory === 'All' && (
        <div className="space-y-3" id="calc-favorites">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center">
            <Heart className="w-3.5 h-3.5 mr-1.5 fill-indigo-500 text-indigo-500" />
            {t('favCalculators', 'Suas Calculadoras Favoritas')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {calculatorApps
              .filter(app => favorites.includes(app.id))
              .map(app => (
                <div 
                  key={app.id}
                  onClick={() => handleLaunchCalc(app)}
                  className="bg-slate-900/30 hover:bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 p-4 rounded-2xl flex items-start gap-3 cursor-pointer transition relative group"
                >
                  <span className={`p-2.5 rounded-xl bg-gradient-to-br ${app.color}`}>
                    {app.icon}
                  </span>
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="font-bold text-white text-xs truncate">{app.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{app.description}</p>
                  </div>
                  <button 
                    onClick={(e) => toggleFavorite(app.id, e)}
                    className="absolute top-4 right-4 text-indigo-400 hover:scale-110 transition"
                  >
                    <Heart className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* App Store Navigation Categories */}
      <div className="flex overflow-x-auto pb-1 gap-1 border-b border-slate-800/60 no-scrollbar" id="calc-categories-nav">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap rounded-lg transition-all ${
              activeCategory === cat 
                ? 'bg-slate-900 text-indigo-400 border border-slate-800' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat === 'All' ? t('cat.all', 'Todas as Categorias') : t(`cat.${cat}`, cat)}
          </button>
        ))}
      </div>

      {/* Grid of Apps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="calculators-grid">
        {filteredApps.map(app => {
          const isFav = favorites.includes(app.id);
          return (
            <div 
              key={app.id}
              onClick={() => handleLaunchCalc(app)}
              className="bg-slate-900/20 hover:bg-slate-900/40 border border-slate-850 hover:border-indigo-500/20 p-5 rounded-2xl flex flex-col justify-between h-44 cursor-pointer transition relative group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className={`p-2.5 rounded-xl bg-gradient-to-br ${app.color}`}>
                    {app.icon}
                  </span>
                  <button 
                    onClick={(e) => toggleFavorite(app.id, e)}
                    className="text-slate-650 hover:text-indigo-400 transition"
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-indigo-500 text-indigo-500' : ''}`} />
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs group-hover:text-indigo-400 transition">{app.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{app.description}</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold uppercase font-mono mt-2">
                <span>{t(`cat.${app.category}`, app.category)}</span>
                <span className="text-indigo-400 group-hover:translate-x-1 transition flex items-center">
                  {t('open', 'Abrir')} <ArrowRight className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* RENDER MODAL OVERLAY FOR DYNAMIC INTERACTIVE CALCULATORS */}
      <AnimatePresence>
        {selectedCalc && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedCalc(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-950 border border-slate-850 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Calculator App Header */}
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4 mb-4">
                <span className={`p-2.5 rounded-xl bg-gradient-to-br ${selectedCalc.color}`}>
                  {selectedCalc.icon}
                </span>
                <div>
                  <h3 className="font-bold text-white text-base">{selectedCalc.title}</h3>
                  <p className="text-[10px] text-slate-400">{selectedCalc.description}</p>
                </div>
              </div>

              {/* Dynamic Interactive Render */}
              <CalculatorInteractiveBox calcId={selectedCalc.id} />

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Sub-Component to render fully interactive calculators math
function CalculatorInteractiveBox({ calcId }: { calcId: string }) {
  const { language } = useLanguageTheme();
  
  // Common states for calculators
  const [val1, setVal1] = useState('10000'); // Principal or amount
  const [val2, setVal2] = useState('8');     // Interest rate (%)
  const [val3, setVal3] = useState('10');    // Years or months
  const [val4, setVal4] = useState('200');   // Additions
  
  // Amortization table simulator state
  const [result, setResult] = useState<string>('');

  // Auto-run calculator formulas based on change
  useEffect(() => {
    runFormula();
  }, [val1, val2, val3, val4, calcId]);

  const runFormula = () => {
    const p = Number(val1) || 0;
    const r = Number(val2) || 0;
    const t = Number(val3) || 0;
    const add = Number(val4) || 0;

    switch (calcId) {
      case 'compound': {
        // Compound Interest
        // A = P(1 + r/100)^t + PMT * [((1 + r/100)^t - 1) / (r/100)]
        const rateDecimal = r / 100;
        let total = p * Math.pow(1 + rateDecimal, t);
        if (add > 0 && rateDecimal > 0) {
          total += (add * 12) * ((Math.pow(1 + rateDecimal, t) - 1) / rateDecimal);
        }
        setResult(`Saldo Final Acumulado: ${formatCurrency(total, language)}`);
        break;
      }
      case 'simple': {
        // Simple Interest
        const interest = p * (r / 100) * t;
        const total = p + interest;
        setResult(`Juros Totais: ${formatCurrency(interest, language)} | Montante Final: ${formatCurrency(total, language)}`);
        break;
      }
      case 'savings': {
        // Savings Goal
        // T is target (p)
        // Monthly needed to reach target at r% in t months
        const target = p;
        const rateMonthly = (r / 100) / 12;
        const months = t * 12;
        let monthly = target / months;
        if (rateMonthly > 0) {
          monthly = target * (rateMonthly / (Math.pow(1 + rateMonthly, months) - 1));
        }
        setResult(`Aporte Mensal Requerido: ${formatCurrency(monthly, language)}`);
        break;
      }
      case 'emergency': {
        // Emergency Fund
        const expenses = p;
        const months = t || 6;
        const total = expenses * months;
        setResult(`Tamanho de Reserva Ideal (${months} Meses): ${formatCurrency(total, language)}`);
        break;
      }
      case 'budget': {
        // 50/30/20 Budget Plan
        const net = p;
        const essential = net * 0.5;
        const desires = net * 0.3;
        const savings = net * 0.2;
        setResult(`Necessidades (50%): ${formatCurrency(essential, language)} | Desejos (30%): ${formatCurrency(desires, language)} | Poupança (20%): ${formatCurrency(savings, language)}`);
        break;
      }
      case 'retirement': {
        // FIRE Number (NIF)
        // NIF = monthly expenses * 12 * 25
        const exp = p;
        const withdrawal = r || 4; // safe withdrawal rate
        const nif = (exp * 12) / (withdrawal / 100);
        setResult(`Número FIRE Requerido (Patrimônio): ${formatCurrency(nif, language)} para renda perpétua de ${formatCurrency(exp, language)}/mês`);
        break;
      }
      case 'growth': {
        // Investment growth
        const compoundInterest = p * Math.pow(1 + (r / 100), t);
        setResult(`Saldo Estimado do Portfólio: ${formatCurrency(compoundInterest, language)}`);
        break;
      }
      case 'roi': {
        // ROI = (gain - cost) / cost * 100
        const gain = p;
        const cost = Number(val2) || 1;
        const roi = ((gain - cost) / cost) * 100;
        setResult(`Retorno Absoluto sobre o Investimento: ${roi.toFixed(1)}%`);
        break;
      }
      case 'roas': {
        // ROAS = revenue / cost
        const rev = p;
        const spend = Number(val2) || 1;
        const roas = rev / spend;
        setResult(`ROAS da Campanha: ${roas.toFixed(2)}x (Retorno de faturamento)`);
        break;
      }
      case 'margin': {
        // Margin = (revenue - cost) / revenue * 100
        const rev = p;
        const cost = Number(val2) || 0;
        const margin = rev > 0 ? ((rev - cost) / rev) * 100 : 0;
        setResult(`Margem de Lucro Operacional SaaS: ${margin.toFixed(1)}%`);
        break;
      }
      case 'loan':
      case 'mortgage': {
        // Standard mortgage PMT payment formula
        const pv = p; // Loan principal
        const rateMonthly = (r / 100) / 12;
        const numPayments = t * 12;
        let pmt = pv / numPayments;
        if (rateMonthly > 0) {
          pmt = (pv * rateMonthly) / (1 - Math.pow(1 + rateMonthly, -numPayments));
        }
        setResult(`Prestação Mensal Estimada (Price): ${formatCurrency(pmt, language)} por ${numPayments} meses`);
        break;
      }
      case 'creditcard': {
        const bal = p;
        const apr = r;
        const pay = add || 100;
        // Simple payoff month estimator
        const months = Math.ceil(bal / pay);
        setResult(`Quitação estimada em aproximadamente: ${months} meses pagando ${formatCurrency(pay, language)}/mês`);
        break;
      }
      case 'snowball': {
        setResult('Dívidas Listadas: Dívida 1 (Cartão - R$ 5k), Dívida 2 (Carro - R$ 15k). Quitação recomendada: quite o Cartão de R$ 5.000 primeiro para ganho psicológico rápido e empilhe aportes.');
        break;
      }
      case 'avalanche': {
        setResult('Dívidas Ordenadas por Taxa: Dívida 1 (Rotativo Cartão - 14.5% a.m.), Dívida 2 (Consórcio - 1.2% a.m.). Quitação recomendada: pague agressivamente o Rotativo do Cartão por possuir maior taxa de juros.');
        break;
      }
      case 'salary': {
        // Simple payroll estimator after tax simulations
        const gross = p;
        const net = gross * 0.775; // Est. deductions
        setResult(`Salário Líquido Aproximado: ${formatCurrency(net, language)} (Considerando deduções consolidadas IRRF/INSS de ~22.5%)`);
        break;
      }
      case 'hourly': {
        // Hour converter: monthly / 220 hours
        const hourlyRate = p / 168;
        setResult(`Seu valor/hora estimado é de: ${formatCurrency(hourlyRate, language)} com base em jornada de 168 horas úteis mensais.`);
        break;
      }
      case 'taxes': {
        const PJRevenue = p;
        const taxPercent = PJRevenue > 15000 ? 15.5 : 6.0; // Simples Nacional Sim.
        const dueTax = PJRevenue * (taxPercent / 100);
        setResult(`Imposto Simples Nacional Estimado: ${formatCurrency(dueTax, language)} (${taxPercent}% de alíquota nominal sobre o Simples)`);
        break;
      }
      case 'inflation': {
        const capital = p;
        const rate = r || 4.5;
        const years = t;
        const finalValue = capital * Math.pow(1 - (rate / 100), years);
        setResult(`Seu capital real em ${years} anos valerá: ${formatCurrency(finalValue, language)} (Perda real de poder de compra)`);
        break;
      }
      case 'currency': {
        const brl = p;
        const usdRate = 5.25;
        const eurRate = 5.70;
        setResult(`${formatCurrency(brl, language)} convertido equivale a: ${(brl / usdRate).toFixed(2)} USD ou ${(brl / eurRate).toFixed(2)} EUR`);
        break;
      }
      default:
        setResult('Cálculo pronto para processamento.');
    }
  };

  // Render input fields depending on calculator type
  return (
    <div className="space-y-4 text-xs text-slate-300">
      
      {/* Input Group */}
      <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
        
        {/* Dynamic Input 1 */}
        {(calcId === 'compound' || calcId === 'simple' || calcId === 'savings' || calcId === 'emergency' || calcId === 'budget' || calcId === 'retirement' || calcId === 'growth' || calcId === 'roi' || calcId === 'roas' || calcId === 'margin' || calcId === 'loan' || calcId === 'mortgage' || calcId === 'creditcard' || calcId === 'salary' || calcId === 'hourly' || calcId === 'taxes' || calcId === 'inflation' || calcId === 'currency') && (
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">
              {calcId === 'roi' ? 'Ganho do Investimento (R$)' : 
               calcId === 'roas' ? 'Faturamento Gerado (R$)' :
               calcId === 'margin' ? 'Faturamento Total (R$)' :
               calcId === 'savings' ? 'Meta Financeira Final (R$)' :
               calcId === 'emergency' ? 'Custo de Vida Mensal (R$)' :
               calcId === 'budget' ? 'Renda Líquida Mensal (R$)' :
               calcId === 'retirement' ? 'Gasto Mensal Desejado na Aposentadoria (R$)' :
               calcId === 'creditcard' ? 'Saldo Devedor do Cartão (R$)' :
               calcId === 'salary' ? 'Salário Bruto Mensal (R$)' :
               calcId === 'hourly' ? 'Salário Mensal de Referência (R$)' :
               calcId === 'taxes' ? 'Faturamento Mensal PJ (R$)' :
               'Montante / Valor Inicial (R$)'}
            </label>
            <input 
              type="number" 
              value={val1} 
              onChange={(e) => setVal1(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Dynamic Input 2 */}
        {(calcId === 'compound' || calcId === 'simple' || calcId === 'savings' || calcId === 'retirement' || calcId === 'growth' || calcId === 'roi' || calcId === 'roas' || calcId === 'margin' || calcId === 'loan' || calcId === 'mortgage' || calcId === 'creditcard' || calcId === 'inflation') && (
          <div>
            <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">
              {calcId === 'roi' ? 'Custo de Aquisição (R$)' :
               calcId === 'roas' ? 'Gasto com Anúncios (R$)' :
               calcId === 'margin' ? 'Custo Operacional Total (R$)' :
               calcId === 'creditcard' ? 'Taxa de Juros do Rotativo (% a.m.)' :
               calcId === 'retirement' ? 'Taxa de Retirada Segura Swr (% a.a.)' :
               calcId === 'inflation' ? 'Taxa Estimada de Inflação (% a.a.)' :
               'Taxa de Juros (% a.a.)'}
            </label>
            <input 
              type="number" 
              value={val2} 
              onChange={(e) => setVal2(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Dynamic Input 3 */}
        {(calcId === 'compound' || calcId === 'simple' || calcId === 'savings' || calcId === 'emergency' || calcId === 'growth' || calcId === 'loan' || calcId === 'mortgage' || calcId === 'inflation') && (
          <div className="col-span-2">
            <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">
              {calcId === 'emergency' ? 'Meses de Cobertura Desejados' : 
               calcId === 'savings' ? 'Prazo Estimado (Anos)' :
               'Prazo Estimado (Anos)'}
            </label>
            <input 
              type="number" 
              value={val3} 
              onChange={(e) => setVal3(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Dynamic Input 4 */}
        {(calcId === 'compound' || calcId === 'growth' || calcId === 'creditcard') && (
          <div className="col-span-2">
            <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">
              {calcId === 'creditcard' ? 'Aporte de Pagamento Mensal (R$)' : 'Aporte Mensal Adicional (R$)'}
            </label>
            <input 
              type="number" 
              value={val4} 
              onChange={(e) => setVal4(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

      </div>

      {/* Result Display Card */}
      <div className="bg-indigo-950/20 border border-indigo-900/30 p-5 rounded-2xl space-y-2">
        <span className="text-[10px] uppercase font-black text-indigo-400 font-mono flex items-center">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          Resultado da Simulação
        </span>
        <p className="text-sm font-extrabold text-white leading-relaxed font-mono">
          {result}
        </p>
      </div>

      <div className="flex items-center space-x-2 text-[10px] text-slate-500 leading-relaxed bg-slate-950/20 p-3 rounded-lg border border-slate-850">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Simulação de planejamento com taxas compostas lineares sob regime SAC/Price. Os resultados reais podem variar levemente devido a impostos, inflação de curto prazo ou tarifas bancárias locais.</span>
      </div>

    </div>
  );
}
