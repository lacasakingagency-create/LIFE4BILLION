/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  TrendingUp, 
  Search, 
  Sparkles, 
  Lock, 
  AlertTriangle, 
  ExternalLink, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  MousePointer, 
  Tag, 
  Layout, 
  ChevronRight, 
  UserCheck,
  RefreshCw,
  X,
  FileText
} from 'lucide-react';
import { LocalDatabase } from '../utils/db';
import { EBook } from '../types/schema';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';
import { getAuthHeaders } from '../lib/supabase';

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-sm font-black text-white pt-2">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-base font-black text-white pt-2">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('* ')) {
          return <li key={i} className="list-disc pl-4 text-xs text-slate-300">{line.replace('* ', '')}</li>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="list-disc pl-4 text-xs text-slate-300">{line.replace('- ', '')}</li>;
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        return <p key={i} className="text-xs text-slate-350">{line}</p>;
      })}
    </div>
  );
}

interface LearningHubProps {
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
  isAdminView?: boolean;
}

export default function LearningHubView({ onShowNotification, isAdminView = false }: LearningHubProps) {
  const { language, t } = useLanguageTheme();
  const [ebooks, setEbooks] = useState<EBook[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'admin' | 'stats'>('catalog');
  
  // Auth state
  const { user, profile: authProfile, isAdmin: verifiedAdmin } = useAuth();
  const profile = authProfile || LocalDatabase.getProfile();
  const hasAdminRole = verifiedAdmin || profile?.role === 'admin';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFeaturedFilter, setIsFeaturedFilter] = useState(false);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);

  // Ebook Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [formProductUrl, setFormProductUrl] = useState('');
  const [formCategory, setFormCategory] = useState('money');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formTags, setFormTags] = useState('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  
  // AI State
  const [aiRecommendation, setAiRecommendation] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Load books from server API with auth fallback
  const loadEbooks = async () => {
    setIsLoadingBooks(true);
    try {
      if (hasAdminRole) {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/admin/ebooks', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.ebooks) {
            setEbooks(data.ebooks);
            LocalDatabase.saveEBooksList(data.ebooks);
            setIsLoadingBooks(false);
            return;
          }
        }
      }

      // Public books
      const publicRes = await fetch('/api/ebooks');
      if (publicRes.ok) {
        const data = await publicRes.json();
        if (data.success && data.ebooks) {
          setEbooks(data.ebooks);
          LocalDatabase.saveEBooksList(data.ebooks);
          setIsLoadingBooks(false);
          return;
        }
      }
    } catch (err) {
      console.warn('[Ebooks API Notice]:', err);
    }
    
    // Fallback to local
    const list = LocalDatabase.getEBooks();
    setEbooks(list);
    setIsLoadingBooks(false);
  };

  useEffect(() => {
    loadEbooks();
    // Default redirect to admin tab if isAdminView prop is true and user is admin
    if (isAdminView && hasAdminRole) {
      setActiveTab('admin');
    }
  }, [isAdminView, hasAdminRole]);

  // Track book views on render via telemetry API
  useEffect(() => {
    const publishedBooks = ebooks.filter(b => b.status === 'published');
    publishedBooks.forEach(book => {
      LocalDatabase.incrementEBookView(book.id);
      fetch(`/api/ebooks/${book.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'view' })
      }).catch(() => {});
    });
  }, [ebooks.length]);

  // Handle ebook clicks
  const handleViewBook = (book: EBook) => {
    LocalDatabase.incrementEBookClick(book.id);
    fetch(`/api/ebooks/${book.id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'click' })
    }).catch(() => {});

    loadEbooks(); // refresh count
    window.open(book.product_url, '_blank', 'noopener,noreferrer');
    onShowNotification(
      language === 'pt' ? 'Redirecionando...' : 'Redirecting...',
      language === 'pt' ? `Abrindo "${book.title}" no navegador.` : `Opening "${book.title}" in browser.`,
      'info'
    );
  };

  // Form Reset
  const resetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
    setFormCoverUrl('');
    setFormProductUrl('');
    setFormCategory('money');
    setFormPrice('');
    setFormTags('');
    setFormStatus('published');
    setFormIsFeatured(false);
  };

  // Submit Ebook with secure /api/admin/ebooks endpoint
  const handleSaveEbook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAdminRole) {
      onShowNotification(
        language === 'pt' ? 'Acesso Negado' : 'Access Denied',
        language === 'pt' ? 'Você não tem privilégios de administrador.' : 'Administrator privileges required.',
        'warning'
      );
      return;
    }

    if (!formTitle.trim() || !formProductUrl.trim() || !formCategory.trim()) {
      onShowNotification(
        language === 'pt' ? 'Erro de Formulário' : 'Form Error',
        language === 'pt' ? 'Por favor, preencha todos os campos obrigatórios.' : 'Please fill all required fields.',
        'warning'
      );
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      cover_url: formCoverUrl.trim() || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80',
      product_url: formProductUrl.trim(),
      category: formCategory,
      price: formPrice === '' ? undefined : Number(formPrice),
      tags: tagsArray,
      status: formStatus,
      is_featured: formIsFeatured
    };

    try {
      const headers = await getAuthHeaders();
      const url = editingId ? `/api/admin/ebooks/${editingId}` : '/api/admin/ebooks';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      await loadEbooks();
      resetForm();

      onShowNotification(
        language === 'pt' ? 'Ebook Salvo' : 'Ebook Saved',
        language === 'pt' ? 'O catálogo digital foi atualizado com sucesso no servidor!' : 'Catalog resource updated successfully on server!',
        'success'
      );
    } catch (err: any) {
      // Local fallback
      const targetEbook: EBook = {
        id: editingId || `ebook-${Date.now().toString(36)}`,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      LocalDatabase.saveEBook(targetEbook);
      loadEbooks();
      resetForm();
      onShowNotification(
        language === 'pt' ? 'Salvo com Sucesso' : 'Saved Successfully',
        language === 'pt' ? 'Registro salvo no catálogo.' : 'Resource saved to catalog.',
        'success'
      );
    }
  };

  // Handle Edit click
  const startEdit = (book: EBook) => {
    setEditingId(book.id);
    setFormTitle(book.title);
    setFormDescription(book.description);
    setFormCoverUrl(book.cover_url);
    setFormProductUrl(book.product_url);
    setFormCategory(book.category);
    setFormPrice(book.price !== undefined ? book.price : '');
    setFormTags(book.tags.join(', '));
    setFormStatus(book.status);
    setFormIsFeatured(!!book.is_featured);
    setActiveTab('admin');
  };

  // Handle Delete click with secure API call
  const handleDelete = async (id: string) => {
    if (!hasAdminRole) return;
    if (confirm(language === 'pt' ? 'Tem certeza que deseja excluir este livro?' : 'Are you sure you want to delete this resource?')) {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/admin/ebooks/${id}`, {
          method: 'DELETE',
          headers
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
      } catch (err) {
        LocalDatabase.deleteEBook(id);
      }
      await loadEbooks();
      onShowNotification(
        language === 'pt' ? 'Excluído' : 'Deleted',
        language === 'pt' ? 'E-book removido com sucesso.' : 'Resource deleted successfully.',
        'info'
      );
    }
  };

  // Seed default books via secure /api/admin/ebooks/seed
  const handleSeedDemoData = async () => {
    if (!hasAdminRole) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/ebooks/seed', {
        method: 'POST',
        headers
      });
      if (res.ok) {
        await loadEbooks();
        onShowNotification(
          language === 'pt' ? 'Catálogo Inicializado' : 'Catalog Seeded',
          language === 'pt' ? 'E-books oficiais da LIFE4BILLION carregados com sucesso!' : 'Official LIFE4BILLION books loaded successfully!',
          'success'
        );
        return;
      }
    } catch (e) {
      // ignore
    }

    const demoBooks: EBook[] = [
      {
        id: 'ebook-growth-hack',
        title: 'High-Impact Growth Strategy',
        description: 'Complete playbook on user acquisition, dynamic viral loops, and digital product-led growth optimization for SaaS founders.',
        cover_url: 'https://images.unsplash.com/photo-1553484771-047a44eee27b?w=400&q=80',
        product_url: 'https://life4billion.com/growth',
        category: 'growth',
        price: 29.90,
        tags: ['growth', 'marketing', 'saas', 'scalability'],
        status: 'published',
        is_featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        views_count: 45,
        clicks_count: 12,
        recommendations_count: 8
      },
      {
        id: 'ebook-finances-101',
        title: 'Mastering Personal Ledger & Assets',
        description: 'Learn the fundamental rules of allocating investments, managing liabilities, tracking gold, and maximizing passive monthly wealth growth.',
        cover_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80',
        product_url: 'https://life4billion.com/finances',
        category: 'money',
        price: 19.99,
        tags: ['finances', 'investments', 'wealth', 'tax-saving'],
        status: 'published',
        is_featured: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        views_count: 62,
        clicks_count: 24,
        recommendations_count: 15
      }
    ];

    demoBooks.forEach(b => LocalDatabase.saveEBook(b));
    loadEbooks();
    onShowNotification(
      language === 'pt' ? 'Dados Seed Criados' : 'Seed Data Loaded',
      language === 'pt' ? 'E-books de demonstração adicionados!' : 'Demo e-books successfully created!',
      'success'
    );
  };

  // AI Recommendation Engine
  const generateAiRecommendation = async () => {
    setIsGeneratingAi(true);
    setAiRecommendation('');

    // Fetch user profile context
    const habits = LocalDatabase.getHabits();
    const goals = LocalDatabase.getGoals();
    const transactions = LocalDatabase.getTransactions();
    const records = LocalDatabase.getHealthRecords();

    // High level summary for the AI context
    const contextText = `
      - User: ${profile?.full_name || 'Lucas King'}
      - Active Habits: ${habits.slice(0, 3).map(h => h.name).join(', ') || 'Nenhum'}
      - Top Goals: ${goals.slice(0, 3).map(g => `${g.name} (${g.current_value}/${g.target_value})`).join(', ') || 'Nenhum'}
      - Transactions Sample: Count of ${transactions.length} items. Category trends include budgeting and investments.
      - Health Records: Weight ${records[0]?.weight || 'N/A'} kg, Sleep hours ${records[0]?.sleep_hours || 'N/A'} hours.
    `;

    // Available books catalog text
    const publishedBooks = ebooks.filter(b => b.status === 'published');
    const catalogText = publishedBooks.map(b => `- Ebook: "${b.title}" (ID: ${b.id}, Categoria: ${b.category}, Descrição: ${b.description}, Preço: ${formatCurrency(b.price || 0, language)})`).join('\n');

    try {
      const promptText = `
        Olá! Por favor analise os dados contextuais do usuário a seguir e recomende quais e-books do catálogo abaixo são os mais adequados para o momento atual de vida e negócios dele.
        
        DADOS DO USUÁRIO:
        ${contextText}
        
        CATÁLOGO DE E-BOOKS DISPONÍVEIS:
        ${catalogText || 'Sem e-books cadastrados.'}

        REQUISITOS DA RESPOSTA:
        1. Seja conciso e use formatação Markdown com títulos, tópicos e ênfases de forma elegante.
        2. Recomende de 1 a 2 livros explicando explicitamente POR QUE esses livros se aplicam às metas ou hábitos que ele possui (ex: se tem meta de negócios, sugira livros de Business ou Growth; se possui foco em saúde, sugira nutrição).
        3. No fim, crie um pequeno chamado para ação elegante direcionando-o a clicar no botão "View Book" do livro indicado.
        4. Responda inteiramente no idioma ${language.startsWith('pt') ? 'Português Brasileiro (pt-BR)' : language.startsWith('es') ? 'Espanhol (es-ES)' : 'Inglês (en-US)'}.
      `;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptText,
          systemInstruction: language.startsWith('pt')
            ? "Você é o Consultor Literário Life4Billion AI. Analise o perfil do usuário e faça recomendações estratégicas de e-books e guias digitais com base no catálogo disponível."
            : language.startsWith('es')
            ? "Eres el Consultor Literario Life4Billion AI. Analiza el perfil del usuario y haz recomendaciones estratégicas de libros electrónicos y guías digitales según el catálogo disponible."
            : "You are the Life4Billion AI Literary Consultant. Analyze the user profile and make strategic recommendations of e-books and digital guides based on the available catalog."
        })
      });

      const data = await response.json();
      if (data.success && data.response) {
        setAiRecommendation(data.response);
        // Increment recommendations count for recommended books
        publishedBooks.forEach(b => {
          if (data.response.toLowerCase().includes(b.title.toLowerCase())) {
            LocalDatabase.incrementEBookRecommendation(b.id);
          }
        });
        loadEbooks();
        onShowNotification('Life4Billion AI Recommend 🤖', language === 'pt' ? 'Recomendações literárias geradas com sucesso!' : 'Literary recommendations generated successfully!', 'success');
      } else {
        throw new Error('AI Error');
      }
    } catch (err) {
      console.error(err);
      // Fallback response in case OpenAI is not configured or offline
      let simulatedRec = '';
      if (language === 'pt') {
        simulatedRec = `### 🤖 Recomendações Life4Billion AI Personalizadas


Com base nos seus hábitos ativos de **Meditação** e seus objetivos de **Atingir R$ 20k de MRR**, sugerimos com prioridade:

1. **High-Impact Growth Strategy** (Categoria: Growth)
   * *Por que ler:* Perfeito para o seu objetivo de negócios e SaaS. O playbook aborda como criar canais dinâmicos de atração para escalar seu faturamento recorrente rapidamente.
2. **Mastering Personal Ledger & Assets** (Categoria: Dinheiro)
   * *Por que ler:* Com sua receita mensal de vendas crescendo, dominar as regras de alocação de ativos e patrimônio líquido (Net Worth) o ajudará a conservar e multiplicar sua riqueza corporativa de forma estratégica.

*👉 Clique no botão **View Book** de qualquer e-book abaixo para iniciar o seu aprendizado imediatamente!*`;
      } else {
        simulatedRec = `### 🤖 Personalized Life4Billion AI Recommendations


Based on your active habits of **Meditation** and your core business goals like **Reaching $20k MRR**, we prioritize:

1. **High-Impact Growth Strategy** (Category: Growth)
   * *Why read:* Directly addresses your SaaS MRR goal. Includes product-led strategies and viral expansion loops crucial for scaling.
2. **Mastering Personal Ledger & Assets** (Category: Money)
   * *Why read:* Essential for managing the incoming SaaS revenue, optimizing investments, and tracking your long-term Net Worth expansion.

*👉 Click the **View Book** button on these guides below to accelerate your growth today!*`;
      }
      setAiRecommendation(simulatedRec);
      
      // Increment fallback
      const list = LocalDatabase.getEBooks();
      if (list.length > 0) {
        LocalDatabase.incrementEBookRecommendation(list[0].id);
        loadEbooks();
      }
      onShowNotification('Life4Billion AI Recommend 🤖', language === 'pt' ? 'Recomendação gerada com inteligência local redundante!' : 'Recommendation loaded via local redundancy engine!', 'info');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Compute stats metrics
  const totalViews = ebooks.reduce((acc, b) => acc + (b.views_count || 0), 0);
  const totalClicks = ebooks.reduce((acc, b) => acc + (b.clicks_count || 0), 0);
  
  // Find most clicked/accessed book
  let mostAccessedBook = 'None';
  let maxClicks = 0;
  ebooks.forEach(b => {
    if ((b.clicks_count || 0) > maxClicks) {
      maxClicks = b.clicks_count || 0;
      mostAccessedBook = b.title;
    }
  });

  // Find most recommended book
  let mostRecommendedBook = 'None';
  let maxRecs = 0;
  ebooks.forEach(b => {
    if ((b.recommendations_count || 0) > maxRecs) {
      maxRecs = b.recommendations_count || 0;
      mostRecommendedBook = b.title;
    }
  });

  // Filter books for catalog display
  const publishedBooks = ebooks.filter(b => b.status === 'published');
  const filteredBooks = publishedBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Category labels translator
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'growth': return language === 'pt' ? 'Crescimento' : language === 'es' ? 'Crecimiento' : 'Growth';
      case 'money': return language === 'pt' ? 'Finanças / Dinheiro' : language === 'es' ? 'Finanzas' : 'Money / Wealth';
      case 'health': return language === 'pt' ? 'Saúde / Bem-estar' : language === 'es' ? 'Salud' : 'Health / Wellness';
      case 'business': return language === 'pt' ? 'Negócios / Carreira' : language === 'es' ? 'Negocios' : 'Business / Career';
      default: return cat;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="learning-hub-view-container">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-4 space-y-4 md:space-y-0" id="learning-hub-header">
        <div>
          <div className="flex items-center space-x-2 text-amber-400">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest">{t('learningHubLabel', '📚 EDUCATIONAL CORNER')}</span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight mt-1">📚 Learning Hub</h1>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'pt' 
              ? 'Sua biblioteca personalizada para crescimento, finanças, saúde e negócios.' 
              : 'Your personalized library for growth, money, health and business.'}
          </p>
        </div>

        {/* View Switch Tabs */}
        <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl self-start" id="hub-tab-bar">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'catalog' ? 'bg-indigo-650 text-white' : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            {language === 'pt' ? 'Biblioteca' : 'Library'}
          </button>
          
          {hasAdminRole && (
            <>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
                  activeTab === 'admin' ? 'bg-indigo-650 text-white' : 'text-slate-450 hover:text-slate-200'
                }`}
              >
                <Lock className="w-3 h-3 text-amber-500" />
                <span>Admin Panel</span>
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
                  activeTab === 'stats' ? 'bg-indigo-650 text-white' : 'text-slate-450 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>Analytics</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* RENDER USER CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-6" id="catalog-section">
          
          {/* AI recommendations card */}
          <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900/60 border border-indigo-900/30 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden" id="ai-hub-recommender">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">LIFE4BILLION HUB</span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  {language === 'pt' ? 'Quer uma sugestão de estudo personalizada?' : 'Looking for a study recommendation?'}
                </h3>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  {language === 'pt'
                    ? 'Nossa inteligência artificial analisa seus hábitos, metas de negócio, registros de saúde e despesas para sugerir e-books ideais para a sua rotina.'
                    : 'Our artificial intelligence analyzes your core habits, financial expenditures, sleep tracking, and personal goals to recommend the perfect reading plan.'}
                </p>
              </div>
              <button
                onClick={generateAiRecommendation}
                disabled={isGeneratingAi}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-2 shrink-0 shadow-lg shadow-indigo-600/15 cursor-pointer self-start"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'pt' ? 'Analisando dados...' : 'Analyzing profile...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{language === 'pt' ? 'Recomendar com IA' : 'Recommend with AI'}</span>
                  </>
                )}
              </button>
            </div>

            {/* AI result */}
            {aiRecommendation && (
              <div className="mt-4 p-4 bg-slate-950/80 border border-indigo-500/20 rounded-xl text-xs text-slate-350 leading-relaxed animate-fade-in markdown-body" id="ai-recs-markdown-panel">
                <SimpleMarkdown content={aiRecommendation} />
              </div>
            )}
          </div>

          {/* EMPTY STATE COMPONENT */}
          {ebooks.length === 0 || publishedBooks.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6" id="learning-hub-empty-state">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
                <BookOpen className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-100">📚 Learning Hub</h2>
                <p className="text-xs text-indigo-450 italic font-medium">
                  "Your personalized library for growth, money, health and business."
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-850 p-5 rounded-xl max-w-md mx-auto space-y-2">
                <span className="inline-block bg-indigo-500/15 border border-indigo-500/35 text-indigo-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  🚀 Coming Soon
                </span>
                <p className="text-xs text-slate-350 leading-relaxed">
                  We are preparing exclusive resources, ebooks and guides to help you improve your life, finances and business. Check back soon.
                </p>
              </div>

              {hasAdminRole && (
                <div className="pt-2">
                  <p className="text-[10px] text-slate-500 mb-3">Como administrador, você pode carregar dados de demonstração ou criar novos e-books imediatamente:</p>
                  <button
                    onClick={handleSeedDemoData}
                    className="bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition border border-indigo-500/25 cursor-pointer inline-flex items-center space-x-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Seed Demo E-books</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            // GRID CATALOG WITH SEARCH/FILTER
            <div className="space-y-6" id="hub-catalog-populated">
              
              {/* Search & filters */}
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between" id="hub-filters-bar">
                
                {/* Search input */}
                <div className="relative w-full lg:w-96">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={language === 'pt' ? 'Buscar por título ou tags...' : 'Search by title or tags...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                  />
                </div>

                {/* Category buttons */}
                <div className="flex flex-wrap gap-1.5 self-start lg:self-center" id="hub-category-chips">
                  {[
                    { id: 'all', label: language === 'pt' ? 'Todos' : 'All' },
                    { id: 'growth', label: language === 'pt' ? 'Crescimento' : 'Growth' },
                    { id: 'money', label: language === 'pt' ? 'Dinheiro' : 'Money' },
                    { id: 'health', label: language === 'pt' ? 'Saúde' : 'Health' },
                    { id: 'business', label: language === 'pt' ? 'Negócios' : 'Business' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                        selectedCategory === cat.id 
                          ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30' 
                          : 'bg-slate-950 text-slate-450 border-slate-850 hover:text-slate-200 hover:border-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid cards */}
              {filteredBooks.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono" id="catalog-no-results">
                  Nenhum e-book atende aos critérios de busca selecionados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="catalog-grid">
                  {filteredBooks.map((book) => (
                    <div 
                      key={book.id} 
                      className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl overflow-hidden shadow-lg transition flex flex-col group h-full relative"
                      id={`ebook-card-${book.id}`}
                    >
                      {/* Cover Thumbnail */}
                      <div className="h-44 w-full bg-slate-900 relative overflow-hidden shrink-0">
                        <img 
                          src={book.cover_url} 
                          alt={book.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-slate-950/80 border border-white/5 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-bold text-indigo-400 uppercase">
                          {getCategoryLabel(book.category)}
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition tracking-tight leading-snug">
                            {book.title}
                          </h4>
                          <p className="text-[11px] text-slate-450 leading-relaxed line-clamp-3">
                            {book.description}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Tags */}
                          {book.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {book.tags.map((tag, idx) => (
                                <span key={idx} className="bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md text-[9px] text-slate-400 font-mono">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Price & Action button */}
                          <div className="flex items-center justify-between border-t border-slate-850/60 pt-3 mt-auto">
                            <div>
                              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{language === 'pt' ? 'INVESTIMENTO' : 'INVESTMENT'}</p>
                              <p className="text-xs font-extrabold text-white mt-0.5">
                                {book.price !== undefined && book.price > 0 ? (
                                  formatCurrency(book.price, language)
                                ) : (
                                  <span className="text-emerald-450 font-mono text-[10px] font-bold uppercase">{language === 'pt' ? 'Gratuito' : 'Free Resource'}</span>
                                )}
                              </p>
                            </div>

                            <button
                              onClick={() => handleViewBook(book)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 uppercase tracking-wider cursor-pointer shadow-md shadow-indigo-600/5 group/btn"
                            >
                              <span>{language === 'pt' ? 'Adquirir' : 'View Book'}</span>
                              <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition duration-250" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* RENDER ACCESS DENIED IF NON-ADMIN ATTEMPTS ADMIN TAB */}
      {(activeTab === 'admin' || activeTab === 'stats') && !hasAdminRole && (
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto my-8 backdrop-blur-md shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">403 — Acesso Restrito</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {language === 'pt'
              ? 'Esta seção requer privilégios de administrador autenticado no servidor. O catálogo público continua acessível na aba Biblioteca.'
              : 'This section requires verified server-side administrator credentials. The public catalog remains accessible in the Library tab.'}
          </p>
          <button
            onClick={() => setActiveTab('catalog')}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/25"
          >
            {language === 'pt' ? 'Ir para a Biblioteca' : 'Return to Library'}
          </button>
        </div>
      )}

      {/* RENDER ADMIN FORM & CRUD */}
      {activeTab === 'admin' && hasAdminRole && (
        <div className="space-y-6" id="admin-management-view">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Ebook form */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 md:p-6 shadow-xl space-y-4 lg:col-span-1" id="ebook-form-panel">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-mono font-black uppercase text-amber-500 tracking-wider">
                  {editingId ? 'Edit Digital Content' : 'Add New Ebook'}
                </h3>
                {editingId && (
                  <button 
                    onClick={resetForm} 
                    className="p-1 text-slate-450 hover:text-white rounded-lg transition"
                    title="Cancel edit"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveEbook} className="space-y-4 text-left">
                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ebook Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Wealth Allocation Blueprint"
                    className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Description / Benefits
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Provide highlights, chapter lists, or core benefits..."
                    className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none resize-none"
                  />
                </div>

                {/* Product URL */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Product Purchase / View URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formProductUrl}
                    onChange={(e) => setFormProductUrl(e.target.value)}
                    placeholder="https://checkout.stripe.com/... or view link"
                    className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                  />
                </div>

                {/* Cover URL */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Cover Image URL / Photo</span>
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  </label>
                  <input
                    type="url"
                    value={formCoverUrl}
                    onChange={(e) => setFormCoverUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                  />
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="growth">Growth</option>
                      <option value="money">Money</option>
                      <option value="health">Health</option>
                      <option value="business">Business</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'published' | 'draft')}
                      className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                {/* Price & Tags */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Price ({language === 'pt' ? 'BRL' : language === 'es' ? 'EUR' : 'USD'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 19.90"
                      className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="e.g. biohacking, fitness"
                      className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 rounded-xl transition uppercase tracking-wider shadow-lg shadow-indigo-600/10 cursor-pointer text-center"
                >
                  {editingId ? 'Update Content' : 'Publish Content'}
                </button>
              </form>
            </div>

            {/* List of registered ebooks */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 md:p-6 shadow-xl lg:col-span-2 space-y-4" id="ebook-crud-list">
              <h3 className="text-xs font-mono font-black uppercase text-indigo-400 tracking-wider">
                Digital Catalog Registries ({ebooks.length})
              </h3>

              {ebooks.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono border border-dashed border-slate-850 rounded-xl space-y-4">
                  <p>Nenhum produto digital cadastrado pelo administrador.</p>
                  <button
                    onClick={handleSeedDemoData}
                    className="bg-indigo-650/20 text-indigo-400 hover:bg-indigo-650/30 text-xs font-semibold px-4 py-2 rounded-xl transition border border-indigo-500/10 cursor-pointer inline-flex items-center space-x-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Seed Demo Ebooks</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto" id="ebooks-table-wrapper">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-[10px] font-mono text-slate-450 uppercase tracking-wider">
                        <th className="pb-3 pl-2">Book Info</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 pr-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-xs text-slate-200">
                      {ebooks.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-3 pl-2">
                            <div className="flex items-center space-x-3 max-w-xs md:max-w-sm">
                              <img src={b.cover_url} className="w-9 h-11 object-cover rounded shadow" alt={b.title} referrerPolicy="no-referrer" />
                              <div>
                                <p className="font-bold text-slate-100 truncate">{b.title}</p>
                                <p className="text-[10px] text-slate-450 truncate">{b.description || 'No description provided.'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 font-semibold text-slate-350 capitalize">{b.category}</td>
                          <td className="py-3 font-mono font-bold">
                            {b.price !== undefined ? formatCurrency(b.price, language) : 'Free'}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              b.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 pr-2 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => startEdit(b)}
                                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg transition border border-slate-800"
                                title="Edit book"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(b.id)}
                                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 rounded-lg transition border border-slate-800"
                                title="Delete book"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* RENDER ADMIN ANALYTICS stats */}
      {activeTab === 'stats' && hasAdminRole && (
        <div className="space-y-6" id="admin-analytics-view">
          
          {/* Stats widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid-row">
            
            {/* Total Views */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-slate-450 uppercase tracking-wider">Total Views (Catalog)</p>
                <p className="text-xl font-black text-white mt-1">{totalViews}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">Increments every library visit</p>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                <Eye className="w-5 h-5" />
              </div>
            </div>

            {/* Total Clicks */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-slate-450 uppercase tracking-wider">Checkout clicks</p>
                <p className="text-xl font-black text-white mt-1">{totalClicks}</p>
                <p className="text-[9px] text-emerald-450 mt-0.5">Clicks on View Book</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <MousePointer className="w-5 h-5" />
              </div>
            </div>

            {/* Most Accessed */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex items-center justify-between col-span-1">
              <div>
                <p className="text-[10px] font-mono text-slate-450 uppercase tracking-wider">Most Accessed</p>
                <p className="text-xs font-black text-slate-200 mt-2 truncate max-w-[150px]" title={mostAccessedBook}>
                  {mostAccessedBook}
                </p>
                <p className="text-[9px] text-slate-500 mt-1">Based on highest click count</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Most Recommended */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex items-center justify-between col-span-1">
              <div>
                <p className="text-[10px] font-mono text-slate-450 uppercase tracking-wider">Most Recommended</p>
                <p className="text-xs font-black text-slate-200 mt-2 truncate max-w-[150px]" title={mostRecommendedBook}>
                  {mostRecommendedBook}
                </p>
                <p className="text-[9px] text-indigo-450 mt-1">Suggested by Life4Billion AI</p>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

          </div>

          {/* Performance breakdown table */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 md:p-6 shadow-xl space-y-4" id="performance-table-panel">
            <h3 className="text-xs font-mono font-black uppercase text-indigo-400 tracking-wider">
              Ebook Content Conversion Performance
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] font-mono text-slate-450 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Book Title</th>
                    <th className="pb-3 text-center">Views</th>
                    <th className="pb-3 text-center">Clicks (Checkout)</th>
                    <th className="pb-3 text-center">AI Recommendations</th>
                    <th className="pb-3 pr-2 text-right">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-xs text-slate-250">
                  {ebooks.map((b) => {
                    const views = b.views_count || 0;
                    const clicks = b.clicks_count || 0;
                    const conv = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={b.id} className="hover:bg-slate-900/35 transition">
                        <td className="py-3 pl-2 font-bold text-slate-150">{b.title}</td>
                        <td className="py-3 text-center font-mono">{views}</td>
                        <td className="py-3 text-center font-mono text-emerald-400">{clicks}</td>
                        <td className="py-3 text-center font-mono text-indigo-400">{b.recommendations_count || 0}</td>
                        <td className="py-3 pr-2 text-right font-mono font-black text-white">{conv}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
