import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Flame, 
  Target, 
  TrendingUp, 
  ShieldCheck, 
  Wallet,
  Check,
  Palette,
  Calendar as CalendarIcon,
  CheckSquare,
  Square,
  Layers,
  Zap,
  DollarSign
} from 'lucide-react';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';
import { LocalDatabase } from '../utils/db';
import { Transaction, Goal, Habit, CalendarEvent, WallpaperConfig } from '../types/schema';

interface DashboardWallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

type WallpaperTheme = 'midnight_gold' | 'executive_blue' | 'emerald_luxury' | 'pure_light';
type WallpaperMode = 'balanced' | 'full' | 'minimal';

export function DashboardWallpaperModal({ isOpen, onClose, onShowNotification }: DashboardWallpaperModalProps) {
  const { t, language, currency } = useLanguageTheme();
  
  // Loaded Config & Customization Toggles
  const [mode, setMode] = useState<WallpaperMode>('balanced');
  const [theme, setTheme] = useState<WallpaperTheme>('midnight_gold');
  
  // Financial Dashboard Widgets
  const [showNetWorth, setShowNetWorth] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [showIncome, setShowIncome] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showSavingsGoal, setShowSavingsGoal] = useState(true);
  const [showUpcomingEvents, setShowUpcomingEvents] = useState(true);

  // Center Today's Focus Widget
  const [showTodayFocus, setShowTodayFocus] = useState(true);
  const [customFocusText, setCustomFocusText] = useState('');

  // Bottom Daily Tracking Widgets
  const [showDailyTracking, setShowDailyTracking] = useState(true);
  const [showHabitStreak, setShowHabitStreak] = useState(true);
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);

  // General & Privacy
  const [showUserTag, setShowUserTag] = useState(true);
  const [showQuote, setShowQuote] = useState(false);
  const [maskPrivateData, setMaskPrivateData] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Real-Time Data from Life4Billion
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const profile = LocalDatabase.getProfile();

  const reloadData = () => {
    const loadedTransactions = LocalDatabase.getTransactions();
    const loadedGoals = LocalDatabase.getGoals();
    const loadedHabits = LocalDatabase.getHabits();
    const loadedEvents = LocalDatabase.getCalendarEvents();
    
    setTransactions(loadedTransactions);
    setGoals(loadedGoals);
    setHabits(loadedHabits);
    setCalendarEvents(loadedEvents);
  };

  // Load Saved Wallpaper Config & Subscribe to Real-Time Updates
  useEffect(() => {
    if (isOpen) {
      reloadData();
      const savedConfig = LocalDatabase.getWallpaperConfig();
      if (savedConfig) {
        if (savedConfig.mode) setMode(savedConfig.mode);
        if (savedConfig.theme) setTheme(savedConfig.theme as WallpaperTheme);
        if (typeof savedConfig.showNetWorth === 'boolean') setShowNetWorth(savedConfig.showNetWorth);
        if (typeof savedConfig.showBalance === 'boolean') setShowBalance(savedConfig.showBalance);
        if (typeof savedConfig.showIncome === 'boolean') setShowIncome(savedConfig.showIncome);
        if (typeof savedConfig.showExpenses === 'boolean') setShowExpenses(savedConfig.showExpenses);
        if (typeof savedConfig.showSavingsGoal === 'boolean') setShowSavingsGoal(savedConfig.showSavingsGoal);
        if (typeof savedConfig.showUpcomingEvents === 'boolean') setShowUpcomingEvents(savedConfig.showUpcomingEvents);
        if (typeof savedConfig.showTodayFocus === 'boolean') setShowTodayFocus(savedConfig.showTodayFocus);
        if (typeof savedConfig.showDailyTracking === 'boolean') setShowDailyTracking(savedConfig.showDailyTracking);
        if (typeof savedConfig.showHabitStreak === 'boolean') setShowHabitStreak(savedConfig.showHabitStreak);
        if (typeof savedConfig.maskPrivateData === 'boolean') setMaskPrivateData(savedConfig.maskPrivateData);
        if (typeof savedConfig.showUserTag === 'boolean') setShowUserTag(savedConfig.showUserTag);
        if (typeof savedConfig.showQuote === 'boolean') setShowQuote(savedConfig.showQuote);
        if (savedConfig.customFocusText !== undefined) setCustomFocusText(savedConfig.customFocusText);
        if (Array.isArray(savedConfig.selectedHabitIds)) setSelectedHabitIds(savedConfig.selectedHabitIds);
      }

      // Auto-update listener for ANY change in Life4Billion (transactions, goals, habits, calendar)
      const unsubscribe = LocalDatabase.subscribe(() => {
        reloadData();
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  // Save Config Changes
  const saveConfig = (updates: Partial<WallpaperConfig>) => {
    LocalDatabase.updateWallpaperConfig(updates);
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

  // Language Key Setup
  const activeLangKey = language.startsWith('pt') ? 'pt' : language.startsWith('es') ? 'es' : 'en';

  // Section Headers by Language
  const sectionHeaders = {
    en: {
      dashboard: 'FINANCIAL DASHBOARD',
      focus: "TODAY'S FOCUS",
      tracking: 'DAILY TRACKING',
      nextPaycheck: 'NEXT PAYCHECK',
      upcomingEvent: 'UPCOMING BILL / EVENT',
      mainGoal: 'MAIN GOAL',
      daysStreak: 'DAY STREAK',
      completed: 'COMPLETE'
    },
    pt: {
      dashboard: 'PAINEL FINANCEIRO',
      focus: 'FOCO DE HOJE',
      tracking: 'ACOMPANHAMENTO DIÁRIO',
      nextPaycheck: 'PRÓXIMO PAGAMENTO',
      upcomingEvent: 'PRÓXIMO EVENTO / CONTA',
      mainGoal: 'META PRINCIPAL',
      daysStreak: 'DIAS DE OFENSIVA',
      completed: 'CONCLUÍDO'
    },
    es: {
      dashboard: 'PANEL FINANCIERO',
      focus: 'ENFOQUE DE HOY',
      tracking: 'SEGUIMIENTO DIARIO',
      nextPaycheck: 'PRÓXIMO PAGO',
      upcomingEvent: 'PRÓXIMO EVENTO / FACTURA',
      mainGoal: 'META PRINCIPAL',
      daysStreak: 'DÍAS DE RACHA',
      completed: 'COMPLETADO'
    }
  }[activeLangKey];

  // Financial Metrics
  const income = transactions.filter(tr => tr.type === 'income').reduce((sum, tr) => sum + tr.amount, 0);
  const expense = transactions.filter(tr => tr.type === 'expense').reduce((sum, tr) => sum + tr.amount, 0);
  const balance = income - expense;
  const netWorth = balance + goals.reduce((sum, g) => sum + (g.current_value || 0), 0);
  
  const topGoal = goals[0] 
    ? { name: goals[0].name, target_value: goals[0].target_value, current_value: goals[0].current_value || 0 } 
    : { name: t('financialGoal', 'Financial Goal'), target_value: 20000, current_value: 12480 };
  
  const goalProgress = topGoal.target_value ? Math.min(100, Math.round((topGoal.current_value / topGoal.target_value) * 100)) : 0;
  
  // Next Paycheck or Event from Calendar/Transactions
  const upcomingEventItem = calendarEvents.find(e => e.type === 'payday' || e.type === 'bill' || e.type === 'savings_deposit' || e.type === 'appointment') || calendarEvents[0];
  const paycheckDisplay = upcomingEventItem
    ? `${upcomingEventItem.title} · ${formatCurrency(upcomingEventItem.amount || 2400)}`
    : `Paycheck · ${formatCurrency(2400)} · Aug 15`;

  // Habits & Daily Tracking
  const todayIso = new Date().toISOString().split('T')[0];
  const isHabitCompletedToday = (h: Habit) => {
    if (h.last_completed && h.last_completed.startsWith(todayIso)) return true;
    return false;
  };

  // Filter Displayed Habits (Selected or Default top habits)
  const displayedHabits = selectedHabitIds.length > 0
    ? habits.filter(h => selectedHabitIds.includes(h.id))
    : habits.slice(0, mode === 'minimal' ? 3 : 5);

  const completedTodayCount = displayedHabits.filter(isHabitCompletedToday).length;
  const habitStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0), 1) : 18;

  // Today's Focus Text Calculation
  const computedFocusText = customFocusText.trim() 
    ? customFocusText 
    : `${topGoal.name} (${goalProgress}%) · ${completedTodayCount}/${displayedHabits.length || 1} ${activeLangKey === 'pt' ? 'Hábitos' : activeLangKey === 'es' ? 'Hábitos' : 'Habits'}`;

  // Helper value formatting (Privacy Mask)
  const formatValue = (val: number) => {
    if (maskPrivateData) return `${currency === 'BRL' ? 'R$' : currency === 'EUR' ? '€' : '$'} ••••••`;
    return formatCurrency(val);
  };

  // Toggle habit selection for wallpaper
  const toggleHabitSelection = (habitId: string) => {
    let updated: string[];
    if (selectedHabitIds.includes(habitId)) {
      updated = selectedHabitIds.filter(id => id !== habitId);
    } else {
      updated = [...selectedHabitIds, habitId];
    }
    setSelectedHabitIds(updated);
    saveConfig({ selectedHabitIds: updated });
  };

  // Toggle habit completion live in database
  const handleToggleHabitLive = (habit: Habit) => {
    LocalDatabase.toggleHabit(habit.id);
    reloadData();
    onShowNotification(
      t('habitUpdated', 'Habit Updated'),
      t('wallpaperAutoUpdated', 'Wallpaper data updated automatically!'),
      'info'
    );
  };

  // High-Resolution 1080x1920 PNG Canvas Exporter
  const handleDownloadWallpaper = () => {
    setIsGenerating(true);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context not supported');

      // Colors setup by theme
      let bgGradient: CanvasGradient;
      let cardBg = 'rgba(24, 24, 27, 0.8)';
      let cardBorder = 'rgba(234, 179, 8, 0.25)';
      let textPrimary = '#ffffff';
      let textSecondary = '#9ca3af';
      let accentColor = '#eab308'; // Gold
      let accentGlow = 'rgba(234, 179, 8, 0.15)';

      if (theme === 'midnight_gold') {
        bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
        bgGradient.addColorStop(0, '#09090b');
        bgGradient.addColorStop(0.5, '#121118');
        bgGradient.addColorStop(1, '#050507');
        cardBg = 'rgba(24, 24, 27, 0.8)';
        cardBorder = 'rgba(234, 179, 8, 0.3)';
        textPrimary = '#ffffff';
        textSecondary = '#a1a1aa';
        accentColor = '#f59e0b';
        accentGlow = 'rgba(245, 158, 11, 0.2)';
      } else if (theme === 'executive_blue') {
        bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
        bgGradient.addColorStop(0, '#030712');
        bgGradient.addColorStop(0.5, '#0b1329');
        bgGradient.addColorStop(1, '#020617');
        cardBg = 'rgba(15, 23, 42, 0.8)';
        cardBorder = 'rgba(59, 130, 246, 0.35)';
        textPrimary = '#ffffff';
        textSecondary = '#94a3b8';
        accentColor = '#3b82f6';
        accentGlow = 'rgba(59, 130, 246, 0.2)';
      } else if (theme === 'emerald_luxury') {
        bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
        bgGradient.addColorStop(0, '#022c22');
        bgGradient.addColorStop(0.5, '#064e3b');
        bgGradient.addColorStop(1, '#021d17');
        cardBg = 'rgba(6, 78, 59, 0.7)';
        cardBorder = 'rgba(16, 185, 129, 0.35)';
        textPrimary = '#ffffff';
        textSecondary = '#a7f3d0';
        accentColor = '#10b981';
        accentGlow = 'rgba(16, 185, 129, 0.2)';
      } else {
        // Pure Light
        bgGradient = ctx.createLinearGradient(0, 0, 1080, 1920);
        bgGradient.addColorStop(0, '#f8fafc');
        bgGradient.addColorStop(0.5, '#f1f5f9');
        bgGradient.addColorStop(1, '#e2e8f0');
        cardBg = 'rgba(255, 255, 255, 0.95)';
        cardBorder = 'rgba(203, 213, 225, 0.9)';
        textPrimary = '#0f172a';
        textSecondary = '#64748b';
        accentColor = '#2563eb';
        accentGlow = 'rgba(37, 99, 235, 0.12)';
      }

      // Fill Background
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Background Radial Glow
      ctx.save();
      const glowGrad = ctx.createRadialGradient(540, 450, 20, 540, 450, 700);
      glowGrad.addColorStop(0, accentGlow);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(540, 450, 700, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Top Branding Header
      ctx.textAlign = 'center';
      ctx.font = 'black 36px Inter, sans-serif';
      ctx.fillStyle = accentColor;
      ctx.fillText('L I F E 4 B I L L I O N', 540, 140);

      if (showUserTag) {
        const userName = (profile?.full_name || t('defaultUser', 'Life4Billion Member')).toUpperCase();
        ctx.font = '600 20px Inter, sans-serif';
        ctx.fillStyle = textSecondary;
        ctx.fillText(`•  ${userName}  •`, 540, 180);
      }

      let currentY = 220;

      // Card Drawing Helper
      const drawCard = (y: number, height: number, customBg?: string, customBorder?: string) => {
        ctx.save();
        ctx.fillStyle = customBg || cardBg;
        ctx.strokeStyle = customBorder || cardBorder;
        ctx.lineWidth = 3;
        
        const x = 90;
        const w = 900;
        const r = 24;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + height, r);
        ctx.arcTo(x + w, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };

      // ==========================================
      // TOP SECTION — FINANCIAL DASHBOARD
      // ==========================================
      ctx.textAlign = 'left';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.fillStyle = accentColor;
      ctx.fillText(`━━━━  ${sectionHeaders.dashboard}`, 100, currentY);
      currentY += 35;

      if (mode === 'minimal') {
        // Minimal Mode: Just Top Goal + Progress
        drawCard(currentY, 190);
        ctx.textAlign = 'left';
        ctx.font = '600 22px Inter, sans-serif';
        ctx.fillStyle = textSecondary;
        ctx.fillText(sectionHeaders.mainGoal, 130, currentY + 55);

        ctx.textAlign = 'right';
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(`${goalProgress}% ${sectionHeaders.completed}`, 950, currentY + 55);

        // Progress Track
        const trackX = 130;
        const trackY = currentY + 90;
        const trackW = 820;
        const trackH = 22;

        ctx.fillStyle = theme === 'pure_light' ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.roundRect(trackX, trackY, trackW, trackH, 11);
        ctx.fill();

        const fillW = Math.max(22, (trackW * goalProgress) / 100);
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.roundRect(trackX, trackY, fillW, trackH, 11);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.font = '600 22px Inter, sans-serif';
        ctx.fillStyle = textPrimary;
        ctx.fillText(`${topGoal.name}: ${formatValue(topGoal.current_value)} / ${formatValue(topGoal.target_value)}`, 130, currentY + 155);

        currentY += 225;
      } else {
        // Balanced / Full Dashboard Mode
        // 1. Net Worth Card
        if (showNetWorth) {
          drawCard(currentY, 170);
          ctx.textAlign = 'center';
          ctx.font = '600 20px Inter, sans-serif';
          ctx.fillStyle = textSecondary;
          ctx.fillText('NET WORTH', 540, currentY + 50);

          ctx.font = 'extrabold 52px Inter, sans-serif';
          ctx.fillStyle = textPrimary;
          ctx.fillText(formatValue(netWorth), 540, currentY + 122);
          currentY += 200;
        }

        // 2. Financial Metrics Grid (Balance, Income, Spending)
        if (showBalance || showIncome || showExpenses) {
          const activeCols = [showBalance, showIncome, showExpenses].filter(Boolean).length;
          drawCard(currentY, 170);
          const colW = 900 / activeCols;
          let idx = 0;

          if (showBalance) {
            const cx = 90 + idx * colW + colW / 2;
            ctx.textAlign = 'center';
            ctx.font = '600 18px Inter, sans-serif';
            ctx.fillStyle = textSecondary;
            ctx.fillText('BALANCE', cx, currentY + 50);

            ctx.font = 'bold 32px Inter, sans-serif';
            ctx.fillStyle = balance >= 0 ? '#10b981' : '#f43f5e';
            ctx.fillText(formatValue(balance), cx, currentY + 115);
            idx++;
          }

          if (showIncome) {
            const cx = 90 + idx * colW + colW / 2;
            ctx.textAlign = 'center';
            ctx.font = '600 18px Inter, sans-serif';
            ctx.fillStyle = textSecondary;
            ctx.fillText('INCOME', cx, currentY + 50);

            ctx.font = 'bold 32px Inter, sans-serif';
            ctx.fillStyle = '#10b981';
            ctx.fillText(formatValue(income), cx, currentY + 115);
            idx++;
          }

          if (showExpenses) {
            const cx = 90 + idx * colW + colW / 2;
            ctx.textAlign = 'center';
            ctx.font = '600 18px Inter, sans-serif';
            ctx.fillStyle = textSecondary;
            ctx.fillText('SPENDING', cx, currentY + 50);

            ctx.font = 'bold 32px Inter, sans-serif';
            ctx.fillStyle = '#f43f5e';
            ctx.fillText(formatValue(expense), cx, currentY + 115);
            idx++;
          }

          currentY += 200;
        }

        // 3. Goal & Paycheck Widget
        if (showSavingsGoal || showUpcomingEvents) {
          drawCard(currentY, 180);

          if (showSavingsGoal) {
            ctx.textAlign = 'left';
            ctx.font = '600 20px Inter, sans-serif';
            ctx.fillStyle = textSecondary;
            ctx.fillText(`${sectionHeaders.mainGoal}: ${topGoal.name}`, 130, currentY + 50);

            ctx.textAlign = 'right';
            ctx.font = 'bold 22px Inter, sans-serif';
            ctx.fillStyle = accentColor;
            ctx.fillText(`${goalProgress}% ${sectionHeaders.completed}`, 950, currentY + 50);

            const trackX = 130;
            const trackY = currentY + 70;
            const trackW = 820;
            const trackH = 18;

            ctx.fillStyle = theme === 'pure_light' ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            ctx.roundRect(trackX, trackY, trackW, trackH, 9);
            ctx.fill();

            const fillW = Math.max(18, (trackW * goalProgress) / 100);
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.roundRect(trackX, trackY, fillW, trackH, 9);
            ctx.fill();
          }

          if (showUpcomingEvents) {
            ctx.textAlign = 'left';
            ctx.font = '600 18px Inter, sans-serif';
            ctx.fillStyle = textSecondary;
            ctx.fillText(`📅 ${sectionHeaders.nextPaycheck}:`, 130, currentY + 138);

            ctx.font = 'bold 20px Inter, sans-serif';
            ctx.fillStyle = textPrimary;
            ctx.fillText(paycheckDisplay, 450, currentY + 138);
          }

          currentY += 210;
        }
      }

      // ==========================================
      // CENTER SECTION — TODAY'S FOCUS
      // ==========================================
      if (showTodayFocus && mode !== 'minimal') {
        ctx.textAlign = 'left';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(`━━━━  ${sectionHeaders.focus}`, 100, currentY);
        currentY += 35;

        drawCard(currentY, 110, theme === 'pure_light' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(234, 179, 8, 0.08)', cardBorder);

        ctx.textAlign = 'center';
        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillStyle = textPrimary;
        ctx.fillText(`⚡  ${computedFocusText}`, 540, currentY + 65);

        currentY += 140;
      }

      // ==========================================
      // BOTTOM SECTION — DAILY TRACKING
      // ==========================================
      if (showDailyTracking) {
        ctx.textAlign = 'left';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(`━━━━  ${sectionHeaders.tracking}`, 100, currentY);
        currentY += 35;

        const habitCardHeight = 70 * Math.max(1, displayedHabits.length) + (showHabitStreak ? 90 : 30);
        drawCard(currentY, habitCardHeight);

        let habitY = currentY + 55;
        displayedHabits.forEach(habit => {
          const completed = isHabitCompletedToday(habit);

          // Checkbox Symbol
          ctx.textAlign = 'left';
          ctx.font = 'bold 30px Inter, sans-serif';
          ctx.fillStyle = completed ? '#10b981' : textSecondary;
          ctx.fillText(completed ? '☑' : '☐', 140, habitY);

          // Habit Name
          ctx.font = '600 24px Inter, sans-serif';
          ctx.fillStyle = completed ? textPrimary : textSecondary;
          ctx.fillText(habit.name, 195, habitY - 2);

          habitY += 65;
        });

        // Streak Badge
        if (showHabitStreak) {
          ctx.textAlign = 'center';
          ctx.font = 'extrabold 32px Inter, sans-serif';
          ctx.fillStyle = '#f97316'; // Orange flame
          ctx.fillText(`🔥  ${habitStreak} ${sectionHeaders.daysStreak}`, 540, habitY + 15);
        }

        currentY += habitCardHeight + 40;
      }

      // Motivational Quote (Optional)
      if (showQuote) {
        ctx.textAlign = 'center';
        ctx.font = 'italic 22px Georgia, serif';
        ctx.fillStyle = textSecondary;
        ctx.fillText('"Consistency builds fortunes. Small habits compounding daily."', 540, 1800);
      }

      // Footer Security Stamp
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillStyle = accentColor;
      ctx.fillText('L I F E 4 B I L L I O N  •  S M A R T  W A L L P A P E R', 540, 1860);

      // Trigger Direct PNG Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `life4billion-smart-wallpaper-${mode}-${theme}-${activeLangKey}.png`;
      link.href = dataUrl;
      link.click();

      onShowNotification(
        t('successLabel', 'Success'),
        t('wallpaperDownloaded', 'Smart Wallpaper generated and downloaded successfully!'),
        'success'
      );
    } catch (err: any) {
      console.error('Error generating wallpaper canvas:', err);
      onShowNotification(
        'Error',
        'Failed to generate wallpaper. Please try again.',
        'warning'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[94vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Left Side: Controls & Customization */}
        <div className="w-full md:w-1/2 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto border-b md:border-b-0 md:border-r border-white/10 space-y-5">
          
          <div>
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div className="flex items-center space-x-2.5">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-white">{t('createWallpaperTitle', 'Smart Dashboard Wallpaper')}</h3>
                  <p className="text-xs text-slate-400">{t('createWallpaperSubtitle', 'Smartphone 9:16 format with auto-sync')}</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. LAYOUT MODES (3 MODES REQUIREMENT) */}
            <div className="mt-4 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                {t('wallpaperMode', 'Layout Mode')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'balanced', label: t('modeBalanced', 'Balanced'), desc: 'Dash + Focus + Habits' },
                  { id: 'full', label: t('modeFull', 'Full Dashboard'), desc: 'All metrics + Habits' },
                  { id: 'minimal', label: t('modeMinimal', 'Minimal'), desc: 'Goal + 3 Habits' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id as WallpaperMode);
                      saveConfig({ mode: m.id as WallpaperMode });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      mode === m.id 
                        ? 'bg-indigo-600/20 border-indigo-500 text-white ring-2 ring-indigo-500/50' 
                        : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold">{m.label}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. THEME SELECTOR */}
            <div className="mt-4 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Palette className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                {t('wallpaperTheme', 'Wallpaper Theme')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'midnight_gold', name: t('themeGold', 'Midnight Gold'), color: 'bg-amber-500/20 border-amber-500/40 text-amber-300' },
                  { id: 'executive_blue', name: t('themeBlue', 'Executive Blue'), color: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
                  { id: 'emerald_luxury', name: t('themeEmerald', 'Emerald Luxury'), color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
                  { id: 'pure_light', name: t('themeLight', 'Pure Light'), color: 'bg-slate-200 border-slate-300 text-slate-800' },
                ].map(th => (
                  <button
                    key={th.id}
                    onClick={() => {
                      setTheme(th.id as WallpaperTheme);
                      saveConfig({ theme: th.id as WallpaperTheme });
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                      theme === th.id ? `${th.color} ring-2 ring-indigo-500/50` : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{th.name}</span>
                    {theme === th.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. TOP SECTION: FINANCIAL DASHBOARD WIDGETS */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                  {sectionHeaders.dashboard}
                </label>
                <button 
                  onClick={() => {
                    const next = !maskPrivateData;
                    setMaskPrivateData(next);
                    saveConfig({ maskPrivateData: next });
                  }}
                  className={`text-[10px] font-semibold flex items-center space-x-1 px-2 py-0.5 rounded-md border transition ${
                    maskPrivateData ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-white/5 text-slate-400 border-white/5'
                  }`}
                >
                  {maskPrivateData ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  <span>{maskPrivateData ? t('maskedData', 'Masked') : t('showData', 'Show')}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: t('dashboard.netWorth', 'Net Worth'), state: showNetWorth, set: setShowNetWorth, key: 'showNetWorth' },
                  { label: t('monthlyNetBalance', 'Balance'), state: showBalance, set: setShowBalance, key: 'showBalance' },
                  { label: t('goalProgressWidget', 'Goal Progress'), state: showSavingsGoal, set: setShowSavingsGoal, key: 'showSavingsGoal' },
                  { label: t('monthlySpendingWidget', 'Spending'), state: showExpenses, set: setShowExpenses, key: 'showExpenses' },
                  { label: t('nextPaycheckWidget', 'Next Paycheck'), state: showUpcomingEvents, set: setShowUpcomingEvents, key: 'showUpcomingEvents' },
                  { label: t('income', 'Income'), state: showIncome, set: setShowIncome, key: 'showIncome' },
                ].map((item, idx) => (
                  <label key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-white/5 hover:bg-slate-800/80 cursor-pointer">
                    <span className="text-slate-200 truncate">{item.label}</span>
                    <input 
                      type="checkbox" 
                      checked={item.state} 
                      onChange={(e) => {
                        item.set(e.target.checked);
                        saveConfig({ [item.key]: e.target.checked });
                      }}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* 4. CENTER SECTION: TODAY'S FOCUS CONTROL */}
            {mode !== 'minimal' && (
              <div className="mt-4 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                    {sectionHeaders.focus}
                  </span>
                  <input 
                    type="checkbox" 
                    checked={showTodayFocus} 
                    onChange={(e) => {
                      setShowTodayFocus(e.target.checked);
                      saveConfig({ showTodayFocus: e.target.checked });
                    }}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                </label>

                {showTodayFocus && (
                  <input 
                    type="text"
                    placeholder={t('customFocusLabel', 'Custom focus text (e.g. Save $25 · Complete 4 habits)')}
                    value={customFocusText}
                    onChange={(e) => {
                      setCustomFocusText(e.target.value);
                      saveConfig({ customFocusText: e.target.value });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>
            )}

            {/* 5. BOTTOM SECTION: DAILY TRACKING HABITS SELECTOR */}
            <div className="mt-4 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  {sectionHeaders.tracking} ({t('selectHabitsToDisplay', 'Selected Habits')})
                </span>
                <input 
                  type="checkbox" 
                  checked={showDailyTracking} 
                  onChange={(e) => {
                    setShowDailyTracking(e.target.checked);
                    saveConfig({ showDailyTracking: e.target.checked });
                  }}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
              </label>

              {showDailyTracking && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {habits.map(h => {
                    const isSelected = selectedHabitIds.length === 0 || selectedHabitIds.includes(h.id);
                    const isDone = isHabitCompletedToday(h);
                    return (
                      <div 
                        key={h.id}
                        onClick={() => toggleHabitSelection(h.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isSelected ? 'bg-indigo-950/40 border-indigo-500/40 text-white' : 'bg-slate-800/30 border-white/5 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          {isDone ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Square className="w-3.5 h-3.5 text-slate-500" />}
                          <span className="truncate">{h.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{isSelected ? 'Visible' : 'Hidden'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-white/10">
            <button
              onClick={handleDownloadWallpaper}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
              style={{ minHeight: '44px' }}
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? t('generatingWallpaper', 'Generating PNG...') : t('downloadWallpaperPng', 'Download Wallpaper (PNG)')}</span>
            </button>
          </div>

        </div>

        {/* Right Side: Phone 9:16 Interactive Live Preview Box */}
        <div className="w-full md:w-1/2 bg-slate-950 p-5 flex flex-col items-center justify-center relative overflow-hidden">
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 hidden md:block"
          >
            <X className="w-5 h-5" />
          </button>

          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
            <Smartphone className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            {t('wallpaperPreview', 'Live 9:16 Preview')}
          </p>

          {/* Phone Frame Mockup Container */}
          <div className={`w-[270px] h-[530px] rounded-[38px] border-4 p-3.5 shadow-2xl relative flex flex-col justify-between overflow-hidden transition-all duration-300 ${
            theme === 'midnight_gold' ? 'bg-[#09090b] border-amber-500/30 text-white' :
            theme === 'executive_blue' ? 'bg-[#030712] border-blue-500/40 text-white' :
            theme === 'emerald_luxury' ? 'bg-[#022c22] border-emerald-500/40 text-white' :
            'bg-slate-100 border-slate-300 text-slate-900'
          }`}>
            
            {/* Phone Notch */}
            <div className="w-24 h-3.5 bg-black/60 rounded-full mx-auto mb-1.5 shrink-0 border border-white/10" />

            {/* Wallpaper Content Stream */}
            <div className="flex-1 space-y-2 overflow-y-auto flex flex-col py-1 text-[9px] scrollbar-none">
              
              {/* Branding Header */}
              <div className="text-center shrink-0">
                <span className={`text-[11px] font-black tracking-widest block uppercase ${
                  theme === 'midnight_gold' ? 'text-amber-400' :
                  theme === 'executive_blue' ? 'text-blue-400' :
                  theme === 'emerald_luxury' ? 'text-emerald-400' :
                  'text-indigo-600'
                }`}>
                  Life4Billion
                </span>
                {showUserTag && (
                  <span className="text-[8px] font-semibold opacity-70 truncate block">
                    • {profile?.full_name || 'Life4Billion Member'} •
                  </span>
                )}
              </div>

              {/* ========================================== */}
              {/* TOP SECTION — FINANCIAL DASHBOARD PREVIEW */}
              {/* ========================================== */}
              <div className="space-y-1.5 shrink-0">
                <p className="text-[7.5px] font-bold uppercase tracking-wider opacity-60 flex items-center">
                  <span>{sectionHeaders.dashboard}</span>
                </p>

                {mode === 'minimal' ? (
                  /* Minimal Mode Card */
                  <div className={`p-2 rounded-xl border ${theme === 'pure_light' ? 'bg-white border-slate-300' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold opacity-80">{sectionHeaders.mainGoal}: {topGoal.name}</span>
                      <span className="font-bold text-amber-400">{goalProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${goalProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  /* Balanced / Full Mode Cards */
                  <>
                    {/* Net Worth Card */}
                    {showNetWorth && (
                      <div className={`p-2 rounded-xl border text-center ${theme === 'pure_light' ? 'bg-white border-slate-300' : 'bg-white/5 border-white/10'}`}>
                        <p className="text-[7px] font-semibold uppercase opacity-60">NET WORTH</p>
                        <p className="text-sm font-black mt-0.5">{formatValue(netWorth)}</p>
                      </div>
                    )}

                    {/* Balance / Income / Spending */}
                    {(showBalance || showIncome || showExpenses) && (
                      <div className={`p-1.5 rounded-xl border grid gap-1 text-center ${
                        [showBalance, showIncome, showExpenses].filter(Boolean).length === 3 ? 'grid-cols-3' : 'grid-cols-2'
                      } ${theme === 'pure_light' ? 'bg-white border-slate-300' : 'bg-white/5 border-white/10'}`}>
                        {showBalance && (
                          <div>
                            <p className="text-[6.5px] opacity-60 uppercase font-semibold">Balance</p>
                            <p className={`text-[9px] font-extrabold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatValue(balance)}</p>
                          </div>
                        )}
                        {showIncome && (
                          <div>
                            <p className="text-[6.5px] opacity-60 uppercase font-semibold">Income</p>
                            <p className="text-[9px] font-extrabold text-emerald-400">{formatValue(income)}</p>
                          </div>
                        )}
                        {showExpenses && (
                          <div>
                            <p className="text-[6.5px] opacity-60 uppercase font-semibold">Spending</p>
                            <p className="text-[9px] font-extrabold text-rose-400">{formatValue(expense)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Main Goal & Paycheck Widget */}
                    {(showSavingsGoal || showUpcomingEvents) && (
                      <div className={`p-2 rounded-xl border space-y-1 ${theme === 'pure_light' ? 'bg-white border-slate-300' : 'bg-white/5 border-white/10'}`}>
                        {showSavingsGoal && (
                          <div>
                            <div className="flex justify-between items-center text-[7.5px] font-semibold">
                              <span className="opacity-80 truncate">{topGoal.name}</span>
                              <span className="font-bold text-amber-400">{goalProgress}%</span>
                            </div>
                            <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden mt-0.5">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${goalProgress}%` }} />
                            </div>
                          </div>
                        )}
                        {showUpcomingEvents && (
                          <div className="flex justify-between items-center text-[7px] opacity-80 pt-0.5 border-t border-white/5">
                            <span>📅 {sectionHeaders.nextPaycheck}:</span>
                            <span className="font-bold truncate max-w-[120px]">{paycheckDisplay}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ========================================== */}
              {/* CENTER SECTION — TODAY'S FOCUS PREVIEW */}
              {/* ========================================== */}
              {showTodayFocus && mode !== 'minimal' && (
                <div className="shrink-0">
                  <p className="text-[7.5px] font-bold uppercase tracking-wider opacity-60 mb-1">
                    {sectionHeaders.focus}
                  </p>
                  <div className={`p-2 rounded-xl border text-center font-bold text-[8.5px] ${
                    theme === 'pure_light' ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                  }`}>
                    ⚡ {computedFocusText}
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* BOTTOM SECTION — DAILY TRACKING PREVIEW */}
              {/* ========================================== */}
              {showDailyTracking && (
                <div className="shrink-0 space-y-1">
                  <p className="text-[7.5px] font-bold uppercase tracking-wider opacity-60">
                    {sectionHeaders.tracking}
                  </p>

                  <div className={`p-2 rounded-xl border space-y-1 ${theme === 'pure_light' ? 'bg-white border-slate-300' : 'bg-white/5 border-white/10'}`}>
                    {displayedHabits.map(h => {
                      const isDone = isHabitCompletedToday(h);
                      return (
                        <div 
                          key={h.id}
                          onClick={() => handleToggleHabitLive(h)}
                          className="flex items-center space-x-1.5 cursor-pointer hover:opacity-80 transition"
                          title="Click to toggle habit status live!"
                        >
                          <span className={isDone ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                            {isDone ? '☑' : '☐'}
                          </span>
                          <span className={`truncate text-[8.5px] ${isDone ? 'line-through opacity-60' : 'font-semibold'}`}>
                            {h.name}
                          </span>
                        </div>
                      );
                    })}

                    {showHabitStreak && (
                      <div className="pt-1 border-t border-white/5 text-center">
                        <span className="text-[8.5px] font-extrabold text-amber-500">
                          🔥 {habitStreak} {sectionHeaders.daysStreak}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Home Bar */}
            <div className="w-20 h-1 bg-white/30 rounded-full mx-auto mt-1 shrink-0" />

          </div>

        </div>

      </div>
    </div>
  );
}
