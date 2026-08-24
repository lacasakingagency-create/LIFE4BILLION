/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Coins, 
  Flame, 
  Heart, 
  Users, 
  Building, 
  ShoppingCart, 
  Sparkles, 
  User, 
  Bell, 
  Menu, 
  X, 
  Clock, 
  ShieldCheck, 
  ShieldAlert,
  LogOut, 
  ChevronRight,
  Info
} from 'lucide-react';
import { LocalDatabase } from './utils/db';
import { Notification, Profile } from './types/schema';
import { LanguageThemeContext, translations, Language, Theme, formatCurrency, Currency, normalizeLanguage, detectDefaultCurrency } from './utils/i18n';
import { 
  ThemeColorId, 
  THEME_COLOR_OPTIONS, 
  DEFAULT_THEME_COLOR_ID, 
  getThemeColorById, 
  applyThemeColorToDOM 
} from './utils/theme';
import { Globe, Palette, Settings, Download, Printer, Edit, BookOpen, Database, Cloud, RefreshCw, AlertTriangle, Check, Copy, Sun, Moon } from 'lucide-react';

// Import our modular child views
import DashboardView from './components/DashboardView';
import FinanceView from './components/FinanceView';
import HabitsGoalsView from './components/HabitsGoalsView';
import HealthMealsView from './components/HealthMealsView';
import FamilyView from './components/FamilyView';
import CompanyPayrollView from './components/CompanyPayrollView';
import CrmSalesView from './components/CrmSalesView';
import AiCopilotView from './components/AiCopilotView';
import SubscriptionProfileView from './components/SubscriptionProfileView';
import ProductivityView from './components/ProductivityView';
import NetWorthView from './components/NetWorthView';
import CalculatorsView from './components/CalculatorsView';
import LearningHubView from './components/LearningHubView';
import { EmergencyFundView } from './components/EmergencyFundView';
import SmartCalendarView from './components/SmartCalendarView';
import LoginView from './components/LoginView';
import PricingView from './components/PricingView';
import OmniSaaSLogo from './components/OmniSaaSLogo';
import SplashScreen from './components/SplashScreen';
import { Briefcase, Calculator, Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info';
}

function AppContent() {
  const { 
    user, 
    session, 
    profile: authProfile, 
    isAuthenticated, 
    isAdmin,
    isLoading: isAuthLoading, 
    signOut 
  } = useAuth();

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('omnisaas_language');
    if (saved) return normalizeLanguage(saved);
    return normalizeLanguage(navigator.language);
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('omnisaas_currency');
    if (saved) return saved as Currency;
    return detectDefaultCurrency();
  });

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('omnisaas_currency', curr);
  };

  const setLanguage = (lang: Language) => {
    const normalized = normalizeLanguage(lang);
    setLanguageState(normalized);
    localStorage.setItem('omnisaas_language', normalized);
    // Auto align currency to the selected language if no currency was explicitly saved yet
    if (!localStorage.getItem('omnisaas_currency')) {
      const defaultCurr = normalized === 'pt-BR' ? 'BRL' : normalized === 'es' ? 'EUR' : 'USD';
      setCurrency(defaultCurr);
    }
  };
  const [theme, setTheme] = useState<Theme>('dark');
  const [themeColor, setThemeColorState] = useState<ThemeColorId>(() => {
    const saved = localStorage.getItem('omnisaas_theme_color');
    if (saved && THEME_COLOR_OPTIONS.some(c => c.id === saved)) {
      return saved as ThemeColorId;
    }
    return DEFAULT_THEME_COLOR_ID; // Navy #1B2A4A default
  });

  const setThemeColor = (colorId: ThemeColorId) => {
    setThemeColorState(colorId);
    localStorage.setItem('omnisaas_theme_color', colorId);
    const currentOption = getThemeColorById(colorId);
    applyThemeColorToDOM(currentOption);

    const title = language.startsWith('pt') ? 'Tema Atualizado' : language.startsWith('es') ? 'Tema Actualizado' : 'Theme Updated';
    const colorName = language.startsWith('pt') ? currentOption.namePt : language.startsWith('es') ? currentOption.nameEs : currentOption.nameEn;
    const message = `${language.startsWith('pt') ? 'Cor do tema alterada para' : language.startsWith('es') ? 'Color del tema cambiado a' : 'Theme color changed to'} ${colorName}`;
    handleShowNotification(title, message, 'success');
  };

  useEffect(() => {
    const currentOption = getThemeColorById(themeColor);
    applyThemeColorToDOM(currentOption);
  }, [themeColor]);

  const currentThemeColor = getThemeColorById(themeColor);
  const [isLeftProfileOpen, setIsLeftProfileOpen] = useState<boolean>(false);
  const [isRightProfileOpen, setIsRightProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [activeView, setActiveView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const path = window.location.pathname.toLowerCase().replace('/', '');
      if (hash === 'admin' || path === 'admin') {
        return 'admin';
      }
    }
    return 'dashboard';
  });

  // URL Hash Navigation Sync
  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const path = window.location.pathname.toLowerCase().replace('/', '');
      if (hash === 'admin' || path === 'admin') {
        setActiveView('admin');
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);
  const [showSplash, setShowSplash] = useState<boolean>(false);

  const handleSplashComplete = () => {
    setShowSplash(false);
    try {
      sessionStorage.setItem('omnisaas_splash_shown', 'true');
    } catch (e) {
      // Ignore
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  // Temporary UI DOM Refs for click outside detection
  const leftProfileRef = useRef<HTMLDivElement>(null);
  const rightProfileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const closeAllTemporaryUI = () => {
    setIsLeftProfileOpen(false);
    setIsRightProfileOpen(false);
    setIsNotificationsOpen(false);
    setIsMobileMenuOpen(false);
    setIsSettingsOpen(false);
  };
  
  const [profile, setProfile] = useState<Profile | null>(() => authProfile || LocalDatabase.getProfile());
  
  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile);
    }
  }, [authProfile]);

  const loggedInEmail = user?.email || profile?.email || '';
  const isOwner = isAdmin || profile?.role === 'owner' || profile?.role === 'admin';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [currentTime, setCurrentTime] = useState<string>('');

  // Subscription verification state
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isCheckingSub, setIsCheckingSub] = useState<boolean>(true);
  const [showPricingGateway, setShowPricingGateway] = useState<boolean>(false);

  const verifyUserSubscription = useCallback(async () => {
    if (!isAuthenticated || !session?.access_token) {
      setIsCheckingSub(false);
      return;
    }

    // Immediate ADMIN Bypass: If user is verified admin, grant immediate access without requiring subscription
    if (isAdmin || (authProfile?.role as string) === 'admin' || (profile?.role as string) === 'admin') {
      setIsSubscribed(true);
      setIsCheckingSub(false);
      LocalDatabase.updateSubscription({ status: 'active', tier_name: 'Enterprise' });
      return;
    }

    setIsCheckingSub(true);
    try {
      // Check if redirected from Stripe payment success
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        const planParam = urlParams.get('plan') || 'annual';
        await fetch('/api/subscription/activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ planId: planParam })
        }).catch(() => {});

        // Clean query params
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const res = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data && (data.isAdmin || data.hasActiveSubscription || isAdmin)) {
          setIsSubscribed(true);
          LocalDatabase.updateSubscription({ 
            status: 'active', 
            tier_name: (data.isAdmin || isAdmin) ? 'Enterprise' : 'Pro Plan' 
          });
        } else {
          setIsSubscribed(false);
          LocalDatabase.updateSubscription({ status: 'canceled', tier_name: 'Free' });
        }
      } else {
        if (isAdmin || (profile?.role as string) === 'admin') {
          setIsSubscribed(true);
        } else {
          setIsSubscribed(false);
        }
      }
    } catch (e) {
      if (isAdmin || (profile?.role as string) === 'admin') {
        setIsSubscribed(true);
      } else {
        setIsSubscribed(false);
      }
    } finally {
      setIsCheckingSub(false);
    }
  }, [isAuthenticated, session?.access_token, isAdmin, authProfile?.role, profile?.role]);

  useEffect(() => {
    if (isAuthenticated && session) {
      verifyUserSubscription();
    } else {
      setIsCheckingSub(false);
    }
  }, [isAuthenticated, session, verifyUserSubscription]);

  // Supabase states
  const [supabaseStatus, setSupabaseStatus] = useState<{
    success: boolean;
    configured: boolean;
    connected: boolean;
    tablesExist: boolean;
    message: string;
    sql?: string;
    url?: string;
  } | null>(null);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>(() => {
    return localStorage.getItem('omnisaas_supabase_url') || '';
  });
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState<string>(() => {
    return localStorage.getItem('omnisaas_supabase_anon_key') || '';
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [showSupabaseSql, setShowSupabaseSql] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const getSupabaseHeaders = () => {
    const url = localStorage.getItem('omnisaas_supabase_url') || '';
    const key = localStorage.getItem('omnisaas_supabase_anon_key') || '';
    const headers: Record<string, string> = {};
    if (url) headers['x-supabase-url'] = url;
    if (key) headers['x-supabase-anon-key'] = key;
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const [isCheckingSupabase, setIsCheckingSupabase] = useState<boolean>(false);

  // Accent color state with dynamic synchronization
  const [accent, setAccentState] = useState<string>(() => {
    return localStorage.getItem('omnisaas_accent') || 'blue';
  });

  const setAccent = (color: string) => {
    setAccentState(color);
    localStorage.setItem('omnisaas_accent', color);
    document.documentElement.setAttribute('data-accent', color);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  const handleSaveSupabaseCredentials = async () => {
    const trimmedUrl = supabaseUrlInput.trim();
    const trimmedKey = supabaseAnonKeyInput.trim();
    localStorage.setItem('omnisaas_supabase_url', trimmedUrl);
    localStorage.setItem('omnisaas_supabase_anon_key', trimmedKey);
    
    handleShowNotification(
      language.startsWith('pt') ? 'Salvando Credenciais' : 'Saving Credentials',
      language.startsWith('pt') ? 'Testando conexão com o Supabase...' : 'Testing connection to Supabase...',
      'info'
    );
    
    await fetchSupabaseStatus();
  };

  const fetchSupabaseStatus = async () => {
    setIsCheckingSupabase(true);
    try {
      const res = await fetch('/api/supabase/status', {
        headers: getSupabaseHeaders()
      });
      const contentType = res.headers.get('content-type');
      if (!res.ok || !contentType || !contentType.includes('application/json')) {
        setSupabaseStatus({
          success: false,
          configured: true,
          connected: false,
          tablesExist: false,
          message: language.startsWith('pt') 
            ? 'Servidor de APIs retornou um erro ou formato inválido.' 
            : 'API server returned an error or invalid format.'
        });
        return;
      }
      const data = await res.json();
      setSupabaseStatus(data);
      
      if (data.connected) {
        handleShowNotification(
          language.startsWith('pt') ? 'Supabase Conectado' : 'Supabase Connected',
          data.message,
          'success'
        );
      } else if (data.configured) {
        handleShowNotification(
          language.startsWith('pt') ? 'Falha na Conexão' : 'Connection Failed',
          data.message,
          'warning'
        );
      }
    } catch (err: any) {
      console.error('Error fetching Supabase status:', err);
      setSupabaseStatus({
        success: false,
        configured: true,
        connected: false,
        tablesExist: false,
        message: err.message || String(err)
      });
      handleShowNotification(
        language.startsWith('pt') ? 'Erro de Conexão' : 'Connection Error',
        err.message || String(err),
        'warning'
      );
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  useEffect(() => {
    if (isSettingsOpen) {
      fetchSupabaseStatus();
    }
  }, [isSettingsOpen]);

  const handleSupabasePush = async () => {
    setIsSyncing(true);
    try {
      // Gather all local storage keys to synchronize for the authenticated user
      const keys = [
        'profile', 'subscription', 'habits', 'goals', 'health_records',
        'pregnancy_records', 'meals', 'family_members', 'transactions',
        'budgets', 'companies', 'employees', 'payroll', 'products',
        'inventory', 'customers', 'sales', 'reports', 'ai_history',
        'notifications', 'debts', 'cards', 'paid_debts', 'calendar_events',
        'net_worth_items', 'emergency_fund', 'wallpaper_config'
      ];
      
      const payload: Record<string, any> = {};
      for (const key of keys) {
        const userKey = LocalDatabase.getUserKey(key);
        const stored = localStorage.getItem(userKey) || localStorage.getItem(`omnisaas_${key}`);
        if (stored) {
          try {
            payload[key] = JSON.parse(stored);
          } catch (e) {
            payload[key] = stored;
          }
        }
      }

      const response = await fetch('/api/supabase/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getSupabaseHeaders()
        },
        body: JSON.stringify({ data: payload })
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        const resErr = await response.json().catch(() => null);
        throw new Error(resErr?.error || 'O servidor de APIs não respondeu com dados JSON válidos. Certifique-se de estar autenticado.');
      }

      const resData = await response.json();
      if (resData.success) {
        handleShowNotification(
          t('successLabel', 'Sucesso'),
          t('supabaseSyncSuccess', 'Dados sincronizados com o Supabase!'),
          'success'
        );
        fetchSupabaseStatus();
      } else {
        handleShowNotification(
          'Erro de Sincronização',
          resData.error || 'Erro desconhecido ao enviar dados.',
          'warning'
        );
        if (resData.needsInitialization) {
          setSupabaseStatus(prev => prev ? { ...prev, tablesExist: false, sql: resData.sql } : null);
        }
      }
    } catch (err: any) {
      handleShowNotification(
        'Erro de Sincronização',
        err.message || 'Não foi possível conectar ao servidor.',
        'warning'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSupabasePull = async () => {
    setIsPulling(true);
    try {
      const response = await fetch('/api/supabase/pull', {
        headers: getSupabaseHeaders()
      });
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        const resErr = await response.json().catch(() => null);
        throw new Error(resErr?.error || 'O servidor de APIs não respondeu com dados JSON válidos. Certifique-se de estar autenticado.');
      }
      const resData = await response.json();
      if (resData.success && resData.data) {
        // Save back to user-scoped storage in localStorage
        for (const [key, val] of Object.entries(resData.data)) {
          const userKey = LocalDatabase.getUserKey(key);
          localStorage.setItem(userKey, JSON.stringify(val));
          localStorage.setItem(`omnisaas_${key}`, JSON.stringify(val));
        }
        // Force refresh state for standard items
        setProfile(LocalDatabase.getProfile());
        setNotifications(LocalDatabase.getNotifications());
        
        // Dispatch data sync event to update all components reactively
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('life4billion_data_sync', { detail: { key: 'all' } }));
        }

        handleShowNotification(
          t('successLabel', 'Sucesso'),
          t('supabasePullSuccess', 'Estado restaurado com sucesso!'),
          'success'
        );
        
        // Force component views updating
        const prevView = activeView;
        setActiveView('dashboard');
        setTimeout(() => setActiveView(prevView), 10);
        
        fetchSupabaseStatus();
      } else {
        handleShowNotification(
          'Erro no Download',
          resData.error || 'Nenhum dado encontrado no servidor.',
          'warning'
        );
      }
    } catch (err: any) {
      handleShowNotification(
        'Erro no Download',
        err.message || 'Não foi possível conectar ao servidor.',
        'warning'
      );
    } finally {
      setIsPulling(false);
    }
  };

  useEffect(() => {
    // Check for direct URL paths like /admin or /learning-hub on mount
    const initialPath = window.location.pathname.replace('/', '');
    if (initialPath === 'admin') {
      setActiveView('admin');
    } else if (initialPath === 'learning-hub') {
      setActiveView('learning-hub');
    }

    // Initialize standard state values
    setProfile(LocalDatabase.getProfile());
    setNotifications(LocalDatabase.getNotifications());

    // Check for Stripe redirect query params
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const paymentLang = params.get('lang');
    if (paymentStatus === 'success') {
      localStorage.setItem('omnisaas_stripe_paid', 'true');
      localStorage.setItem('omnisaas_stripe_actually_paid', 'true');
      if (paymentLang) {
        setLanguage(paymentLang as Language);
      }
      setTimeout(() => {
        handleShowNotification(
          t('successLabel', 'Sucesso'),
          t('stripePaidSuccessToast', 'Pagamento de licença verificado com sucesso pelo Stripe! Crie sua conta.'),
          'success'
        );
      }, 500);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancel') {
      setTimeout(() => {
        handleShowNotification(
          'Checkout Cancelado',
          'A ativação do seu espaço de trabalho pelo Stripe foi cancelada.',
          'info'
        );
      }, 500);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Start a real-time clock update (UTC / Local)
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Subscribe to real-time database updates across all modules
    const unsubscribeDb = LocalDatabase.subscribe(() => {
      setNotifications(LocalDatabase.getNotifications());
      setProfile(LocalDatabase.getProfile());
    });

    return () => {
      clearInterval(interval);
      unsubscribeDb();
    };
  }, []);

  // Automatically close all temporary UI elements on route/page navigation
  useEffect(() => {
    closeAllTemporaryUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeView]);

  // Global Outside Click and ESC Key Event Listeners for Temporary Menus
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (!target) return;

      if (isLeftProfileOpen && leftProfileRef.current && !leftProfileRef.current.contains(target)) {
        setIsLeftProfileOpen(false);
      }
      if (isRightProfileOpen && rightProfileRef.current && !rightProfileRef.current.contains(target)) {
        setIsRightProfileOpen(false);
      }
      if (isNotificationsOpen && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
      if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllTemporaryUI();
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLeftProfileOpen, isRightProfileOpen, isNotificationsOpen, isMobileMenuOpen, isSettingsOpen]);

  // Shared notification dispatcher
  const handleShowNotification = (title: string, message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    // 1. Add notification to central DB log (persists)
    LocalDatabase.addNotification(title, message, type);
    setNotifications(LocalDatabase.getNotifications());

    // 2. Spawn a transient visual Toast alert (auto-dismisses in ~1s for success/info)
    setToasts((prev) => {
      // Prevent stacking identical duplicate notifications
      if (prev.some((t) => t.title === title && t.message === message)) {
        return prev;
      }

      const toastId = Math.random().toString(36).substring(7);
      // Success confirmations appear for ~1 second (1000ms), errors/warnings stay for 3000ms
      const duration = (type === 'success' || type === 'info') ? 1000 : 3000;

      setTimeout(() => {
        setToasts((p) => p.filter((t) => t.id !== toastId));
      }, duration);

      return [...prev, { id: toastId, title, message, type }];
    });
  };

  const handleMarkNotifRead = (id: string) => {
    const updated = LocalDatabase.markNotificationRead(id);
    setNotifications(updated);
  };

  const handleMarkAllNotifsRead = () => {
    const updated = LocalDatabase.markAllNotificationsRead();
    setNotifications(updated);
    handleShowNotification(t('successLabel', 'Sucesso'), t('allNotifsRead', 'Todas as notificações foram lidas.'), 'info');
  };

  const handleClearNotifHistory = () => {
    const updated = LocalDatabase.clearAllNotifications();
    setNotifications(updated);
    handleShowNotification(t('alertsCleared', 'Central Limpa'), t('alertsReset', 'Histórico de alertas foi redefinido.'), 'info');
  };

  const t = (key: string, fallback?: string): string => {
    const normLang = language.toLowerCase().startsWith('pt') ? 'pt' : language.toLowerCase().startsWith('es') ? 'es' : 'en';
    const entry = translations[key];
    if (!entry) return fallback || key;
    const val = entry[normLang] || fallback || key;
    if (typeof val !== 'string') return fallback || key;
    return val;
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('light-theme', next === 'light');
      return next;
    });
  };

  // Nav Items definition for visual sidebars
  const navItems = [
    { id: 'dashboard', label: t('dashboard', 'Executive Dashboard'), icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'calendar', label: t('calendarNav', 'Smart Calendar 📅'), icon: <Calendar className="w-4 h-4 text-sky-400" /> },
    { id: 'emergency-fund', label: t('emergencyFundNav', 'Emergency Fund & Protection'), icon: <ShieldCheck className="w-4 h-4 text-rose-400" /> },
    { id: 'finance', label: t('finance', 'Finances & Budgets'), icon: <Coins className="w-4 h-4" /> },
    { id: 'net-worth', label: t('netWorth', 'Net Worth'), icon: <Briefcase className="w-4 h-4 text-indigo-400" /> },
    { id: 'calculators', label: t('calculators', 'Calculators 📊'), icon: <Calculator className="w-4 h-4 text-emerald-450" /> },
    { id: 'productivity', label: t('productivity', 'Studies & Pomodoro'), icon: <BookOpen className="w-4 h-4 text-emerald-400" /> },
    { id: 'habits', label: t('habits', 'Habits & Goals'), icon: <Flame className="w-4 h-4" /> },
    { id: 'health', label: t('health', 'Vital Signs & Diet'), icon: <Heart className="w-4 h-4" /> },
    { id: 'family', label: t('family', 'Family Management'), icon: <Users className="w-4 h-4" /> },
    { id: 'company', label: t('company', 'Company & HR Payroll'), icon: <Building className="w-4 h-4" /> },
    { id: 'crm', label: t('crm', 'Sales & CRM'), icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'ai', label: t('ai', 'Life4Billion AI'), icon: <Sparkles className="w-4 h-4 text-emerald-400" /> },
    { id: 'learning-hub', label: t('learningHub', 'Learning Hub 📚'), icon: <BookOpen className="w-4 h-4 text-amber-400" /> },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Hub ⚡', icon: <ShieldAlert className="w-4 h-4 text-rose-400" /> }] : []),
    { id: 'profile', label: t('profile', 'Subscription & Profile'), icon: <User className="w-4 h-4" /> },
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveView} onShowNotification={handleShowNotification} />;
      case 'calendar':
        return <SmartCalendarView onShowNotification={handleShowNotification} onNavigate={setActiveView} />;
      case 'emergency-fund':
        return <EmergencyFundView onShowNotification={handleShowNotification} />;
      case 'finance':
        return <FinanceView onShowNotification={handleShowNotification} />;
      case 'net-worth':
        return <NetWorthView onShowNotification={handleShowNotification} />;
      case 'calculators':
        return <CalculatorsView onShowNotification={handleShowNotification} />;
      case 'productivity':
        return <ProductivityView onShowNotification={handleShowNotification} />;
      case 'habits':
        return <HabitsGoalsView onShowNotification={handleShowNotification} />;
      case 'health':
        return <HealthMealsView onShowNotification={handleShowNotification} />;
      case 'family':
        return <FamilyView onShowNotification={handleShowNotification} />;
      case 'company':
        return <CompanyPayrollView onShowNotification={handleShowNotification} />;
      case 'crm':
        return <CrmSalesView onShowNotification={handleShowNotification} />;
      case 'ai':
        return <AiCopilotView onShowNotification={handleShowNotification} />;
      case 'learning-hub':
        return <LearningHubView onShowNotification={handleShowNotification} />;
      case 'admin':
        if (!isAdmin && profile?.role !== 'admin') {
          return (
            <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-slate-900/90 border border-rose-500/30 rounded-2xl max-w-lg mx-auto my-12 backdrop-blur-md shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">403 — Acesso Restrito</h2>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Esta área é restrita a administradores autorizados da plataforma LIFE4BILLION. Sua conta autenticada não possui permissões administrativas ativas.
              </p>
              <button
                onClick={() => setActiveView('dashboard')}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/25"
              >
                Voltar ao Dashboard
              </button>
            </div>
          );
        }
        return <LearningHubView onShowNotification={handleShowNotification} isAdminView={true} />;
      case 'profile':
        return <SubscriptionProfileView onShowNotification={handleShowNotification} />;
      default:
        return <DashboardView onNavigate={setActiveView} onShowNotification={handleShowNotification} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Authentication & Subscription Loading State
  if (isAuthLoading || (isAuthenticated && isCheckingSub)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-white">
        <OmniSaaSLogo size="lg" className="justify-center animate-pulse" />
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <div className="w-3.5 h-3.5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span>
            {language.startsWith('pt') 
              ? 'Carregando Life4Billion...' 
              : 'Loading Life4Billion...'}
          </span>
        </div>
      </div>
    );
  }

  // Strict Unauthenticated Gateway: Show Login or Public Pricing
  if (!isAuthenticated || !session) {
    return (
      <LanguageThemeContext.Provider value={{ language, setLanguage, currency, setCurrency, theme, setTheme, toggleTheme, themeColor, setThemeColor, t }}>
        <AnimatePresence mode="wait">
          {showSplash && (
            <SplashScreen key="splash" onComplete={handleSplashComplete} />
          )}
        </AnimatePresence>

        {showPricingGateway ? (
          <PricingView
            onBackToLogin={() => setShowPricingGateway(false)}
            onShowNotification={handleShowNotification}
          />
        ) : (
          <LoginView 
            onLogin={() => {
              // Real auth session is handled reactively by AuthContext
            }} 
            onViewPricing={() => setShowPricingGateway(true)}
            onShowNotification={handleShowNotification} 
          />
        )}

        {/* TOAST NOTIFICATION STACK POPUP */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full px-4 md:px-0" id="toasts-popup-stack-login">
          {toasts.map((t) => (
            <div 
              key={t.id} 
              className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start space-x-3 transition-all duration-300 transform translate-y-0 animate-fade-in bg-[#111112] ${
                t.type === 'success' ? 'border-emerald-900/80 text-emerald-300' : 
                t.type === 'warning' ? 'border-amber-900/80 text-amber-300' : 
                'border-slate-850 text-slate-200'
              }`}
            >
              <div className="flex-1 text-xs">
                <p className="font-bold text-white">{t.title}</p>
                <p className="text-slate-450 mt-1 leading-normal">{t.message}</p>
              </div>
            </div>
          ))}
        </div>
      </LanguageThemeContext.Provider>
    );
  }

  // Strict Subscription Gateway: Authenticated users without an active paid subscription must subscribe
  if (!isSubscribed) {
    return (
      <LanguageThemeContext.Provider value={{ language, setLanguage, currency, setCurrency, theme, setTheme, toggleTheme, themeColor, setThemeColor, t }}>
        <AnimatePresence mode="wait">
          {showSplash && (
            <SplashScreen key="splash" onComplete={handleSplashComplete} />
          )}
        </AnimatePresence>

        <PricingView
          onPaymentSuccess={() => {
            setIsSubscribed(true);
            LocalDatabase.updateSubscription({ status: 'active', tier_name: 'Pro Plan' });
          }}
          onShowNotification={handleShowNotification}
        />

        {/* TOAST NOTIFICATION STACK POPUP */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full px-4 md:px-0" id="toasts-popup-stack-pricing">
          {toasts.map((t) => (
            <div 
              key={t.id} 
              className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start space-x-3 transition-all duration-300 transform translate-y-0 animate-fade-in bg-[#111112] ${
                t.type === 'success' ? 'border-emerald-900/80 text-emerald-300' : 
                t.type === 'warning' ? 'border-amber-900/80 text-amber-300' : 
                'border-slate-850 text-slate-200'
              }`}
            >
              <div className="flex-1 text-xs">
                <p className="font-bold text-white">{t.title}</p>
                <p className="text-slate-450 mt-1 leading-normal">{t.message}</p>
              </div>
            </div>
          ))}
        </div>
      </LanguageThemeContext.Provider>
    );
  }

  return (
    <LanguageThemeContext.Provider value={{ language, setLanguage, currency, setCurrency, theme, setTheme, toggleTheme, themeColor, setThemeColor, t }}>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        )}
      </AnimatePresence>
      <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-200 ${
        theme === 'light' ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-300'
      }`} id="life4billion-root-layout">
        
        {/* SIDEBAR ESQUERDA (Desktop Navigation) */}
        <aside 
          className="hidden md:flex flex-col w-64 border-r border-white/10 h-screen sticky top-0 transition-colors duration-300 text-white" 
          style={{ backgroundColor: currentThemeColor.hex }}
          id="desktop-sidebar"
        >
          {/* Brand Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div 
              onClick={() => setActiveView('dashboard')} 
              className="cursor-pointer hover:opacity-80 transition"
              title={t('dashboard', 'Painel Executivo')}
            >
              <OmniSaaSLogo size="sm" />
            </div>
            <span className="bg-white/10 text-white border border-white/15 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
              v2.4
            </span>
          </div>

          {/* Navigation List */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" id="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  const targetPath = item.id === 'dashboard' ? '/' : `/${item.id}`;
                  if (window.location.pathname !== targetPath) {
                    window.history.pushState({}, '', targetPath);
                  }
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                  activeView === item.id 
                    ? 'bg-white/20 text-white border border-white/30 shadow-md font-bold' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                id={`nav-link-${item.id}`}
              >
                <div className="flex items-center space-x-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {activeView === item.id && <ChevronRight className="w-3.5 h-3.5 stroke-[3.5] text-emerald-400" />}
              </button>
            ))}
          </nav>

          {/* Footer info (RLS verified status) */}
          <div ref={leftProfileRef} className="p-4 border-t border-white/10 bg-black/20 space-y-3 relative">
            
            {/* Left Profile dropdown menu popup */}
            {isLeftProfileOpen && (
              <div className="absolute bottom-16 left-4 right-4 bg-slate-900 border border-white/10 rounded-xl p-2 shadow-2xl z-40 space-y-1 text-xs">
                <button 
                  onClick={() => {
                    setActiveView('profile');
                    setIsLeftProfileOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-white/5 rounded-lg text-slate-200 hover:text-white"
                >
                  <Edit className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('editProfile', 'Editar Perfil')}</span>
                </button>
                <button 
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsLeftProfileOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-white/5 rounded-lg text-slate-200 hover:text-white"
                >
                  <Settings className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('settings', 'Definições')}</span>
                </button>
                <div className="border-t border-white/5 my-1" />
                <button 
                  onClick={async () => {
                    setIsLeftProfileOpen(false);
                    await signOut();
                    handleShowNotification(t('logout', 'Fazer Logout'), t('logoutSuccess', 'Logout realizado com sucesso.'), 'info');
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-rose-500/10 text-rose-400 rounded-lg"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t('logout', 'Fazer Logout')}</span>
                </button>
              </div>
            )}

            <div 
              onClick={() => setIsLeftProfileOpen(!isLeftProfileOpen)}
              className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl flex items-center space-x-2 cursor-pointer hover:bg-emerald-500/10 transition"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs text-white font-medium shrink-0">
                {profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'JD'}
              </div>
              <div className="truncate flex-1">
                <span className="text-xs block font-medium text-white truncate">{profile?.full_name || t('defaultUser', 'Usuário Omni')}</span>
                <span className="text-[10px] text-emerald-400/85 uppercase tracking-wider font-semibold block mt-0.5">{t('proPlan', 'Plano Pro')}</span>
              </div>
              <Settings className="w-3.5 h-3.5 text-slate-500" />
            </div>
            
            <div className="flex items-center justify-center space-x-1 text-[9px] text-slate-500">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>{t('secureSandbox', 'Banco Sandbox Seguro')}</span>
            </div>
          </div>
        </aside>

        {/* MOBILE HEADER (Navigation) */}
        <header 
          className="md:hidden border-b border-white/10 px-4 py-3 flex justify-between items-center sticky top-0 z-40 transition-colors duration-300 text-white" 
          style={{ backgroundColor: currentThemeColor.hex }}
          id="mobile-header"
        >
          <div 
            onClick={() => {
              setActiveView('dashboard');
              setIsMobileMenuOpen(false);
            }} 
            className="cursor-pointer hover:opacity-80 transition"
            title={t('dashboard', 'Painel Executivo')}
          >
            <OmniSaaSLogo size="sm" />
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-white/90 hover:text-white rounded-lg bg-black/20 border border-white/15"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>

            {/* Notifications Bell */}
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-1.5 text-white/90 hover:text-white rounded-lg relative bg-black/20 border border-white/15"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />}
            </button>

            {/* Burger Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-white/90 hover:text-white rounded-lg bg-black/20 border border-white/15"
              id="mobile-menu-toggle-btn"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* MOBILE MENU DROPDOWN & BACKDROP */}
        {isMobileMenuOpen && (
          <>
            <div 
              className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-30 animate-fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div 
              ref={mobileMenuRef} 
              className="md:hidden fixed inset-x-0 top-[53px] max-h-[calc(100vh-53px)] overflow-y-auto border-b border-white/10 z-40 flex flex-col p-4 space-y-1 shadow-2xl animate-scale-in transition-colors duration-300 text-white" 
              style={{ backgroundColor: currentThemeColor.hex }}
              id="mobile-menu-dropdown"
            >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeView === item.id ? 'bg-white/20 text-white border border-white/30 shadow-md font-bold' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                style={{ minHeight: '44px' }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}

            {/* Divider */}
            <div className="border-t border-white/10 my-2 pt-2" />
            
            {/* Mobile Profile & Quick Settings Panel */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-3">
              {/* User Avatar & Name */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center space-x-2.5">
                  {profile?.avatar_url && profile.avatar_url.trim() !== '' ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-lg object-cover border border-emerald-500/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'LK'}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-white leading-none">{profile?.full_name || 'Usuário'}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{profile?.email || 'user@life4billion.com'}</p>
                  </div>
                </div>
                
                {/* Theme Switcher Button */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/15 text-slate-400 hover:text-white transition flex items-center justify-center"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                  title="Alterar Tema"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  )}
                </button>
              </div>

              {/* Language Selector for Mobile */}
              <div className="space-y-1.5">
                <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  <span>{t('languageLabel', 'Idioma')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'pt-BR', name: 'Português', sub: 'BR' },
                    { code: 'en-US', name: 'English', sub: 'US' },
                    { code: 'es', name: 'Español', sub: 'ES' }
                  ].map(langOption => {
                    const isSelected = language === langOption.code || (langOption.code === 'pt-BR' && language === 'pt') || (langOption.code === 'en-US' && language === 'en');
                    return (
                      <button
                        key={langOption.code}
                        onClick={() => {
                          const code = langOption.code as Language;
                          setLanguage(code);
                          const alignedCurrency = code.startsWith('pt') ? 'BRL' : code.startsWith('es') ? 'EUR' : 'USD';
                          setCurrency(alignedCurrency as Currency);
                        }}
                        className={`py-2 rounded-lg text-xs font-bold border transition flex flex-col items-center justify-center ${
                          isSelected 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-extrabold' 
                            : 'bg-white/5 text-slate-400 border-white/5 hover:text-slate-300'
                        }`}
                        style={{ minHeight: '44px' }}
                      >
                        <span className="text-[10px]">{langOption.name}</span>
                        <span className="text-[8px] opacity-60 font-mono mt-0.5">{langOption.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profile & Logout Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setActiveView('profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 rounded-lg text-xs font-semibold"
                  style={{ minHeight: '44px' }}
                >
                  <User className="w-4 h-4 text-emerald-450" />
                  <span>{t('profile', 'Perfil')}</span>
                </button>
                <button
                  onClick={async () => {
                    setIsMobileMenuOpen(false);
                    await signOut();
                    handleShowNotification(t('logout', 'Fazer Logout'), t('logoutSuccess', 'Logout realizado com sucesso.'), 'info');
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold"
                  style={{ minHeight: '44px' }}
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>{t('logout', 'Sair')}</span>
                </button>
              </div>
            </div>
          </div>
        </>
        )}

        {/* CONTEÚDO PRINCIPAL (Main Working Workspace) */}
        <main className="flex-1 flex flex-col overflow-x-hidden min-h-0 bg-slate-950" id="main-content-flow">
          
          {/* TOP BAR / UTILITIES HEADER (Desktop only) */}
          <header 
            className="hidden md:flex h-16 justify-between items-center px-8 border-b border-white/10 sticky top-0 z-20 backdrop-blur transition-colors duration-300 text-white" 
            style={{ backgroundColor: currentThemeColor.hex }}
            id="desktop-topbar"
          >
            <div className="flex items-center space-x-1.5 text-white/80 text-xs">
              <span>{t('workspaceView', 'Visão de Workspace')}</span>
              <ChevronRight className="w-3 h-3 text-white/60" />
              <span className="text-white font-medium capitalize bg-black/20 border border-white/15 px-2.5 py-0.5 rounded">
                {navItems.find(i => i.id === activeView)?.label || 'Workspace'}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              
              {/* Quick Language, Currency & Theme Switcher */}
              <div className="flex items-center space-x-2.5 bg-black/25 border border-white/15 px-2.5 py-1 rounded-lg">
                {/* Language Switcher */}
                <div className="flex items-center space-x-1 border-r border-white/15 pr-2.5">
                  <Globe className="w-3.5 h-3.5 text-white/80 mr-1" />
                  {[
                    { code: 'pt-BR', sub: 'BR' },
                    { code: 'en-US', sub: 'US' },
                    { code: 'es', sub: 'ES' }
                  ].map(langOption => {
                    const isSelected = language === langOption.code || (langOption.code === 'pt-BR' && language === 'pt') || (langOption.code === 'en-US' && language === 'en');
                    return (
                      <button
                        key={langOption.code}
                        onClick={() => {
                          const code = langOption.code as Language;
                          setLanguage(code);
                          const alignedCurrency = code.startsWith('pt') ? 'BRL' : code.startsWith('es') ? 'EUR' : 'USD';
                          setCurrency(alignedCurrency as Currency);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                          isSelected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {langOption.sub}
                      </button>
                    );
                  })}
                </div>

                {/* Currency Switcher */}
                <div className="flex items-center space-x-1 border-r border-white/15 pr-2.5">
                  <Coins className="w-3.5 h-3.5 text-white/80 mr-1" />
                  {[
                    { code: 'BRL', sub: 'BR' },
                    { code: 'USD', sub: 'US' },
                    { code: 'EUR', sub: 'ES' }
                  ].map(currencyOption => {
                    const isSelected = currency === currencyOption.code;
                    return (
                      <button
                        key={currencyOption.code}
                        onClick={() => setCurrency(currencyOption.code as Currency)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                          isSelected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {currencyOption.code}
                      </button>
                    );
                  })}
                </div>

                {/* Theme Switcher (Light / Dark) */}
                <button
                  onClick={toggleTheme}
                  className="p-1 rounded text-white/80 hover:text-white transition flex items-center justify-center"
                  title="Alternar Modo Claro / Escuro"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-indigo-300" />
                  )}
                </button>
              </div>

              {/* Live Clock */}
              <div className="flex items-center space-x-1.5 text-white/90 text-xs font-mono bg-black/25 px-3 py-1.5 rounded-lg border border-white/15">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentTime} UTC</span>
              </div>

              {/* Notification Bell */}
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 bg-slate-900 transition relative"
                id="topbar-bell-btn"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </button>

              {/* Micro Profile Icon wrapper */}
              <div ref={rightProfileRef} className="relative">
                <div 
                  onClick={() => setIsRightProfileOpen(!isRightProfileOpen)}
                  className="flex items-center space-x-2.5 pl-2 border-l border-white/5 cursor-pointer hover:opacity-80 transition"
                >
                  {profile?.avatar_url && profile.avatar_url.trim() !== '' ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-7 h-7 rounded-lg object-cover border border-emerald-500/30"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'LK'}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-350">{profile?.full_name || 'Usuário'}</span>
                </div>

                {/* Right Profile Dropdown Menu */}
                {isRightProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl p-2 shadow-2xl z-50 space-y-1 text-xs">
                    <button 
                      onClick={() => {
                        setActiveView('profile');
                        setIsRightProfileOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-white/5 rounded-lg text-slate-200 hover:text-white"
                    >
                      <Edit className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('editProfile', 'Editar Perfil')}</span>
                    </button>
                    <button 
                      onClick={() => {
                        setIsSettingsOpen(true);
                        setIsRightProfileOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-white/5 rounded-lg text-slate-200 hover:text-white"
                    >
                      <Settings className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('settings', 'Definições')}</span>
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    <button 
                      onClick={async () => {
                        setIsRightProfileOpen(false);
                        await signOut();
                        handleShowNotification(t('logout', 'Fazer Logout'), t('logoutSuccess', 'Logout realizado com sucesso.'), 'info');
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-rose-500/10 text-rose-400 rounded-lg"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t('logout', 'Fazer Logout')}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </header>

          {/* CONTAINER DINÂMICO DE VIEWS COM SUPORTE A SWIPE GESTURES */}
          <motion.div 
            className="flex-1 p-4 md:p-8 overflow-x-hidden" 
            id="active-workspace-wrapper" 
            key={`${activeView}-${language}`}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            style={{ touchAction: 'pan-y' }}
            onDragEnd={(event, info) => {
              // Only trigger slide transition if horizontal swipe is substantial
              const swipeThreshold = 100;
              if (info.offset.x < -swipeThreshold) {
                // Swiped Left -> next tab
                const currentIndex = navItems.findIndex(item => item.id === activeView);
                if (currentIndex !== -1) {
                  const nextIndex = (currentIndex + 1) % navItems.length;
                  const nextItem = navItems[nextIndex];
                  setActiveView(nextItem.id);
                  const targetPath = nextItem.id === 'dashboard' ? '/' : `/${nextItem.id}`;
                  if (window.location.pathname !== targetPath) {
                    window.history.pushState({}, '', targetPath);
                  }
                  handleShowNotification(
                    language.startsWith('pt') ? 'Navegação Omni' : 'Omni Navigation',
                    language.startsWith('pt') ? `Acessando: ${nextItem.label}` : `Accessing: ${nextItem.label}`,
                    'info'
                  );
                }
              } else if (info.offset.x > swipeThreshold) {
                // Swiped Right -> previous tab
                const currentIndex = navItems.findIndex(item => item.id === activeView);
                if (currentIndex !== -1) {
                  const prevIndex = (currentIndex - 1 + navItems.length) % navItems.length;
                  const prevItem = navItems[prevIndex];
                  setActiveView(prevItem.id);
                  const targetPath = prevItem.id === 'dashboard' ? '/' : `/${prevItem.id}`;
                  if (window.location.pathname !== targetPath) {
                    window.history.pushState({}, '', targetPath);
                  }
                  handleShowNotification(
                    language.startsWith('pt') ? 'Navegação Omni' : 'Omni Navigation',
                    language.startsWith('pt') ? `Acessando: ${prevItem.label}` : `Accessing: ${prevItem.label}`,
                    'info'
                  );
                }
              }
            }}
          >
            {renderActiveView()}
          </motion.div>

        </main>

        {/* SETTINGS MODAL (Theme and Language Configuration) */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsSettingsOpen(false)}>
            <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-950 shrink-0">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">{t('settings', 'Definições / Configurações')}</h3>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                  style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Cloud Sync Section */}
                <div className="space-y-3 pb-6 border-b border-white/5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <Cloud className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    {language.startsWith('pt') ? 'Sincronização em Nuvem' : 'Cloud Synchronization'}
                  </label>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {language.startsWith('pt')
                      ? 'Seus dados financeiros, metas e rotinas são sincronizados com segurança e isolamento total.'
                      : 'Your financial data, goals, and routines are synchronized securely with full user isolation.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1.5">
                    <button
                      onClick={handleSupabasePush}
                      disabled={isSyncing || isPulling}
                      className="py-2 px-3 bg-emerald-500 hover:bg-emerald-450 disabled:opacity-35 text-black font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{isSyncing ? 'Sincronizando...' : (language.startsWith('pt') ? 'Enviar Dados (Push)' : 'Push Data')}</span>
                    </button>
                    
                    <button
                      onClick={handleSupabasePull}
                      disabled={isSyncing || isPulling}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-750 disabled:opacity-35 text-white border border-white/5 font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isPulling ? 'Baixando...' : (language.startsWith('pt') ? 'Baixar Dados (Pull)' : 'Pull Data')}</span>
                    </button>
                  </div>
                </div>

                {/* Global Theme Color System (Profile -> Settings -> Appearance) */}
                <div className="space-y-4 pt-4 border-t border-white/5" id="settings-appearance-section">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
                      <Palette className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                      {language.startsWith('pt') ? 'Aparência — Cor do Tema' : language.startsWith('es') ? 'Apariencia — Color del Tema' : 'Appearance — Theme Color'}
                    </label>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {getThemeColorById(themeColor).hex}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {language.startsWith('pt') 
                      ? 'Defina a cor de identidade da aplicação. O Cabeçalho e a Sidebar serão sincronizados imediatamente.' 
                      : language.startsWith('es')
                      ? 'Defina el color de identidad de la aplicación. El Encabezado y la Sidebar se sincronizarán inmediatamente.'
                      : 'Set the application identity color. The Header and Sidebar will synchronize immediately.'}
                  </p>

                  {/* 5 Theme Color Swatches */}
                  <div className="grid grid-cols-5 gap-2 pt-1" id="theme-color-selector">
                    {THEME_COLOR_OPTIONS.map((c) => {
                      const isActive = themeColor === c.id;
                      const name = language.startsWith('pt') ? c.namePt : language.startsWith('es') ? c.nameEs : c.nameEn;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setThemeColor(c.id)}
                          title={`${name} (${c.hex})`}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer border ${
                            isActive 
                              ? 'bg-white/10 border-white ring-2 ring-white/50 scale-105 shadow-xl' 
                              : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          <div 
                            className="w-7 h-7 rounded-lg shadow-md flex items-center justify-center relative border border-white/20"
                            style={{ backgroundColor: c.hex }}
                          >
                            {isActive && <Check className="w-4 h-4 text-white stroke-[3.5] drop-shadow" />}
                          </div>
                          <span className={`text-[9.5px] font-medium tracking-tight mt-1.5 truncate max-w-full ${
                            isActive ? 'text-white font-bold' : 'text-slate-400'
                          }`}>
                            {name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Accent Color Customization Section */}
                <div className="space-y-3 pt-4 border-t border-white/5" id="settings-accent-color-section">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <Palette className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                    {language.startsWith('pt') ? 'Cor de Destaque' : language.startsWith('es') ? 'Color de Acento' : 'Accent Color'}
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {language.startsWith('pt') 
                      ? 'Selecione uma cor para personalizar todos os botões, links, ícones e destaques do SaaS.' 
                      : language.startsWith('es')
                      ? 'Seleccione un color para personalizar todos los botones, enlaces, iconos y detalles del SaaS.'
                      : 'Select an accent color to personalize all buttons, links, icons, and indicators in the SaaS.'}
                  </p>
                  <div className="flex items-center gap-2 pt-1" id="accent-color-selector">
                    {[
                      { id: 'blue', label: language.startsWith('pt') ? 'Azul' : language.startsWith('es') ? 'Azul' : 'Blue', color: 'bg-blue-500' },
                      { id: 'emerald', label: language.startsWith('pt') ? 'Verde' : language.startsWith('es') ? 'Esmeralda' : 'Emerald', color: 'bg-emerald-500' },
                      { id: 'rose', label: language.startsWith('pt') ? 'Rosa' : language.startsWith('es') ? 'Rosa' : 'Rose', color: 'bg-rose-500' },
                      { id: 'purple', label: language.startsWith('pt') ? 'Roxo' : language.startsWith('es') ? 'Púrpura' : 'Purple', color: 'bg-purple-500' },
                      { id: 'orange', label: language.startsWith('pt') ? 'Laranja' : language.startsWith('es') ? 'Naranja' : 'Orange', color: 'bg-orange-500' }
                    ].map((c) => {
                      const isActive = accent === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setAccent(c.id)}
                          title={c.label}
                          type="button"
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                            isActive 
                              ? 'ring-2 ring-white/45 scale-110 border-white text-white' 
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-lg ${c.color} flex items-center justify-center shadow-lg relative`}>
                            {isActive && <Check className="w-3 h-3 text-white stroke-[3.5]" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>


              <div className="p-4 bg-[#0D0D0E] border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-450 text-black text-xs font-bold rounded-lg transition"
                >
                  {t('doneBtn', 'OK / Concluído')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS PANEL SIDEBAR (Right Drawer) */}
        {isNotificationsOpen && (
          <>
            <div 
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 animate-fade-in"
              onClick={() => setIsNotificationsOpen(false)}
              aria-hidden="true"
            />
            <div ref={notificationsRef} className="fixed inset-y-0 right-0 w-80 bg-slate-900/98 border-l border-slate-800 z-50 shadow-2xl flex flex-col justify-between animate-scale-in" id="notifications-drawer">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">{t('alertsCenter', 'Central de Alertas')}</h3>
              </div>
              <button 
                onClick={() => setIsNotificationsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
                id="close-notifications-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" id="notifications-scroll-area">
              <div className="flex justify-between items-center mb-2">
                <button 
                  onClick={handleMarkAllNotifsRead}
                  className="text-[10px] font-bold text-emerald-400 hover:underline"
                >
                  {t('markAllRead', 'Marcar tudo como lido')}
                </button>
                <button 
                  onClick={handleClearNotifHistory}
                  className="text-[10px] font-bold text-rose-400 hover:underline"
                >
                  {t('clearHistory', 'Limpar histórico')}
                </button>
              </div>

              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => handleMarkNotifRead(n.id)}
                  className={`p-3.5 rounded-xl border text-xs transition cursor-pointer relative ${
                    n.read 
                      ? 'bg-slate-950/20 border-slate-900/80 text-slate-400' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-750'
                  }`}
                >
                  {!n.read && (
                    <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  )}
                  
                  <p className="font-bold pr-4">{n.title}</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[9px] text-slate-500 mt-2 block font-medium">{n.created_at || n.date}</span>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-12 text-slate-550 space-y-1">
                  <Info className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                  <p className="text-xs font-semibold">{t('everythingQuiet', 'Tudo calmo por aqui')}</p>
                  <p className="text-[10px] text-slate-500">{t('noAlertsRegistered', 'Nenhum alerta cadastrado na central de auditoria.')}</p>
                </div>
              )}
            </div>

            {/* Footer warning */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 leading-normal">
              <p>{t('alertsFooterWarning', 'Alertas são gerados dinamicamente no OmniSaaS a cada transação, pagamento do Stripe ou check-off de hábitos.')}</p>
            </div>
          </div>
        </>
        )}

        {/* TOAST NOTIFICATION STACK POPUP (Tactile Feedback Engine) */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full px-4 md:px-0" id="toasts-popup-stack">
          {toasts.map((t) => (
            <div 
              key={t.id} 
              className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start space-x-3 transition-all duration-300 transform translate-y-0 animate-fade-in ${
                t.type === 'success' ? 'bg-[#111112] border-emerald-900/80 text-emerald-300' : 
                t.type === 'warning' ? 'bg-[#111112] border-amber-900/80 text-amber-300' : 
                'bg-[#111112] border-slate-850 text-slate-200'
              }`}
            >
              <div className="flex-1 text-xs">
                <p className="font-bold text-white">{t.title}</p>
                <p className="text-slate-450 mt-1 leading-normal">{t.message}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </LanguageThemeContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
