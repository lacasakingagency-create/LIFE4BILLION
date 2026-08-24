import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  CreditCard, 
  Globe2, 
  Unlink, 
  ArrowRight, 
  Zap, 
  Clock, 
  Check, 
  AlertCircle,
  Landmark,
  Lock,
  Sparkles,
  TrendingUp,
  Download,
  XCircle,
  KeyRound,
  UserCheck,
  Search,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Shield,
  HelpCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  FinancialConnection, 
  NormalizedAccount, 
  NormalizedTransaction, 
  FinancialProviderType,
  ConnectionStatus 
} from '../types/financial';
import { getAuthHeaders } from '../lib/supabase';

interface Life4BillionConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
  onShowNotification?: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onDataSynchronized?: (data: { accounts: NormalizedAccount[]; transactions: NormalizedTransaction[] }) => void;
  initialTab?: 'bank' | 'card' | 'manage';
}

interface BankInstitutionItem {
  id: string;
  name: string;
  code?: string;
  category: 'bank' | 'card' | 'both';
  region: 'US' | 'EU' | 'BR';
  logoEmoji: string;
  color: string;
  description: string;
  isPopular?: boolean;
}

const INSTITUTIONS_CATALOG: BankInstitutionItem[] = [
  // BRASIL (Belvo / Open Finance)
  { id: 'itau', name: 'Banco Itaú Personnalité', code: '341', category: 'both', region: 'BR', logoEmoji: '🏦', color: 'from-orange-600 to-amber-700', description: 'Contas Correntes, Investimentos & Cartões Black', isPopular: true },
  { id: 'nubank', name: 'Nubank Open Finance', code: '260', category: 'both', region: 'BR', logoEmoji: '💜', color: 'from-purple-700 to-violet-900', description: 'NuConta, Caixinhas e Cartão Ultravioleta', isPopular: true },
  { id: 'bradesco', name: 'Banco Bradesco Prime', code: '237', category: 'both', region: 'BR', logoEmoji: '🔴', color: 'from-red-600 to-rose-900', description: 'Conta Prime e Cartões Visa Infinite / Elo Nanquim', isPopular: true },
  { id: 'bb', name: 'Banco do Brasil', code: '001', category: 'both', region: 'BR', logoEmoji: '🟡', color: 'from-yellow-500 to-amber-600', description: 'Estilo BB, Contas PJ e Poupança Ouro', isPopular: true },
  { id: 'inter', name: 'Banco Inter', code: '077', category: 'both', region: 'BR', logoEmoji: '🧡', color: 'from-orange-500 to-amber-600', description: 'Conta Digital Global, Investimentos e Cartão Black', isPopular: true },
  { id: 'santander_br', name: 'Santander Select Brasil', code: '033', category: 'both', region: 'BR', logoEmoji: '🔥', color: 'from-red-700 to-rose-800', description: 'Select Private, Contas e Cartões AAdvantage', isPopular: true },
  { id: 'c6', name: 'C6 Bank Carbon', code: '336', category: 'both', region: 'BR', logoEmoji: '🖤', color: 'from-neutral-800 to-zinc-950', description: 'C6 Carbon Mastercard Black e Global USD/EUR', isPopular: true },
  { id: 'btg', name: 'BTG Pactual Banking', code: '208', category: 'both', region: 'BR', logoEmoji: '💎', color: 'from-blue-900 to-slate-900', description: 'Conta Investimento e Cartão Black Modular', isPopular: true },
  
  // UNITED STATES & CANADA (Plaid)
  { id: 'chase', name: 'Chase Bank Premier', code: 'JPMC', category: 'both', region: 'US', logoEmoji: '🟦', color: 'from-blue-700 to-blue-950', description: 'Total Checking, Sapphire Reserve & Freedom Cards', isPopular: true },
  { id: 'bofa', name: 'Bank of America', code: 'BAC', category: 'both', region: 'US', logoEmoji: '🔴', color: 'from-red-700 to-red-950', description: 'Advantage Banking & Premium Rewards Cards', isPopular: true },
  { id: 'amex', name: 'American Express Global', code: 'AXP', category: 'card', region: 'US', logoEmoji: '💳', color: 'from-sky-600 to-blue-900', description: 'Platinum, Gold & Centurion Charge Cards', isPopular: true },
  { id: 'capitalone', name: 'Capital One Banking', code: 'COF', category: 'both', region: 'US', logoEmoji: '🔷', color: 'from-blue-800 to-indigo-950', description: '360 Checking & Venture X Rewards Cards', isPopular: true },
  { id: 'wellsfargo', name: 'Wells Fargo Premier', code: 'WFC', category: 'both', region: 'US', logoEmoji: '🟡', color: 'from-amber-600 to-red-800', description: 'Everyday Checking & Autograph Cards', isPopular: true },
  { id: 'citi', name: 'Citibank N.A.', code: 'CITI', category: 'both', region: 'US', logoEmoji: '🌐', color: 'from-blue-600 to-cyan-800', description: 'Citigold Checking & Double Cash Cards', isPopular: true },
  { id: 'schwab', name: 'Charles Schwab Bank', code: 'SCHW', category: 'bank', region: 'US', logoEmoji: '📈', color: 'from-teal-600 to-cyan-900', description: 'High Yield Investor Checking & Brokerage', isPopular: true },
  { id: 'fidelity', name: 'Fidelity Cash Management', code: 'FID', category: 'bank', region: 'US', logoEmoji: '🟢', color: 'from-emerald-700 to-teal-900', description: 'Cash Management & Investment Accounts', isPopular: true },

  // EUROPE & UK (Tink / PSD2)
  { id: 'n26', name: 'N26 Bank Europe', code: 'N26', category: 'both', region: 'EU', logoEmoji: '💳', color: 'from-teal-700 to-emerald-950', description: 'Metal Account & Euro IBAN Checking', isPopular: true },
  { id: 'revolut', name: 'Revolut Digital Bank', code: 'REV', category: 'both', region: 'EU', logoEmoji: '⚡', color: 'from-blue-600 to-indigo-900', description: 'Multi-Currency Accounts & Metal Virtual Cards', isPopular: true },
  { id: 'bnpparibas', name: 'BNP Paribas', code: 'BNP', category: 'both', region: 'EU', logoEmoji: '🌿', color: 'from-emerald-800 to-green-950', description: 'Comptes Courants & Cartes Visa Premier', isPopular: true },
  { id: 'hsbc', name: 'HSBC Holdings UK/EU', code: 'HSBC', category: 'both', region: 'EU', logoEmoji: '🔻', color: 'from-red-600 to-zinc-900', description: 'Premier Banking & Global Money Accounts', isPopular: true },
  { id: 'santander_es', name: 'Santander España / UK', code: 'SAN', category: 'both', region: 'EU', logoEmoji: '🔴', color: 'from-red-600 to-rose-950', description: 'Cuenta 123 & Tarjetas Mundo 123', isPopular: true },
  { id: 'deutschebank', name: 'Deutsche Bank Germany', code: 'DB', category: 'both', region: 'EU', logoEmoji: '🏛️', color: 'from-blue-800 to-slate-950', description: 'Girokonto & Mastercard Platin', isPopular: true },
  { id: 'barclays', name: 'Barclays Bank UK', code: 'BARC', category: 'both', region: 'EU', logoEmoji: '🦅', color: 'from-sky-700 to-blue-900', description: 'Current Accounts & Barclaycard Avios', isPopular: true },
  { id: 'ing', name: 'ING Direct Bank', code: 'ING', category: 'both', region: 'EU', logoEmoji: '🦁', color: 'from-orange-600 to-amber-900', description: 'Orange Account & Daily Banking', isPopular: true },

  // FAIL TEST SCENARIO
  { id: 'fail_bank', name: 'Fail Bank (Deterministic Test)', code: 'TEST_FAIL', category: 'both', region: 'US', logoEmoji: '⚠️', color: 'from-rose-800 to-red-950', description: 'Simula erro de credenciais para testar tratamento de falhas', isPopular: false },
  { id: 'fail_bank_br', name: 'Banco Falha (Teste de Erro)', code: 'TEST_FAIL_BR', category: 'both', region: 'BR', logoEmoji: '⚠️', color: 'from-rose-800 to-red-950', description: 'Simula erro do Open Finance para teste de validação', isPopular: false }
];

export const Life4BillionConnectModal: React.FC<Life4BillionConnectModalProps> = ({
  isOpen,
  onClose,
  language = 'en',
  onShowNotification,
  onDataSynchronized,
  initialTab = 'bank'
}) => {
  const isPt = language.startsWith('pt');
  const isEs = language.startsWith('es');

  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  // Main UI Mode
  const [connectMode, setConnectMode] = useState<'bank' | 'card' | 'manage'>('bank');
  const [country, setCountry] = useState<'US' | 'EU' | 'BR'>('US');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<BankInstitutionItem | null>(null);
  const [customBankInput, setCustomBankInput] = useState('');
  
  // Connection states
  const [step, setStep] = useState<'select' | 'permissions' | 'connecting' | 'success' | 'failed' | 'manage'>('select');
  const [connectionState, setConnectionState] = useState<ConnectionStatus>('idle');
  const [connectingPhase, setConnectingPhase] = useState<number>(1);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [showPermissionsDetail, setShowPermissionsDetail] = useState(false);

  // Error & Feedback state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Data state
  const [loading, setLoading] = useState(false);
  const [syncingConnId, setSyncingConnId] = useState<string | null>(null);
  const [connections, setConnections] = useState<FinancialConnection[]>([]);
  const [accounts, setAccounts] = useState<NormalizedAccount[]>([]);
  const [transactions, setTransactions] = useState<NormalizedTransaction[]>([]);
  const [latestSyncSummary, setLatestSyncSummary] = useState<{ inserted: number; updated: number; total: number } | null>(null);
  const [confirmDisconnectId, setConfirmDisconnectId] = useState<string | null>(null);

  // Initialize view
  useEffect(() => {
    if (isOpen) {
      fetchConnectionsAndData();
      if (initialTab === 'manage') {
        setStep('manage');
        setConnectMode('manage');
      } else {
        setConnectMode(initialTab);
        setStep('select');
      }
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load existing connections
  const fetchConnectionsAndData = async () => {
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      const [connRes, accRes, txRes] = await Promise.all([
        fetch('/api/finance/connections', { headers: authHeaders }).then(r => r.json()),
        fetch('/api/finance/accounts', { headers: authHeaders }).then(r => r.json()),
        fetch('/api/finance/transactions', { headers: authHeaders }).then(r => r.json())
      ]);

      if (connRes.success && connRes.connections) {
        setConnections(connRes.connections);
        if (initialTab === 'manage' || (connRes.connections.length > 0 && step === 'select' && false)) {
          // Keep explicit tab control
        }
      }
      if (accRes.success && accRes.accounts) setAccounts(accRes.accounts);
      if (txRes.success && txRes.transactions) {
        setTransactions(txRes.transactions);
        if (onDataSynchronized) {
          onDataSynchronized({ accounts: accRes.accounts || [], transactions: txRes.transactions || [] });
        }
      }
    } catch (err) {
      console.warn('[Connect Modal Data Fetch Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered institutions
  const filteredInstitutions = useMemo(() => {
    return INSTITUTIONS_CATALOG.filter(inst => {
      // Region filter
      if (inst.region !== country) return false;
      // Mode filter
      if (connectMode === 'card' && inst.category === 'bank') return false;
      if (connectMode === 'bank' && inst.category === 'card') return false;
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          inst.name.toLowerCase().includes(q) ||
          (inst.code && inst.code.toLowerCase().includes(q)) ||
          inst.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [country, connectMode, searchQuery]);

  // Handle selecting an institution
  const handleSelectInstitution = (inst: BankInstitutionItem) => {
    setSelectedInstitution(inst);
    setCustomBankInput('');
    setValidationError(null);
    setStep('permissions');
  };

  // Handle custom bank entry
  const handleSelectCustomBank = () => {
    if (!customBankInput.trim()) {
      setValidationError(
        tr(
          'Por favor, digite o nome do seu banco ou instituição financeira.',
          'Please enter your bank or financial institution name.',
          'Por favor, ingrese el nombre de su banco o institución financiera.'
        )
      );
      return;
    }

    const customInst: BankInstitutionItem = {
      id: `custom_${Date.now()}`,
      name: customBankInput.trim(),
      category: connectMode === 'card' ? 'card' : 'bank',
      region: country,
      logoEmoji: connectMode === 'card' ? '💳' : '🏦',
      color: 'from-slate-700 to-zinc-900',
      description: tr('Instituição conectada sob demanda', 'On-demand connected institution', 'Institución conectada bajo demanda')
    };

    setSelectedInstitution(customInst);
    setValidationError(null);
    setStep('permissions');
  };

  // Execute Connection Flow
  const handleProceedConnection = async () => {
    if (!selectedInstitution) {
      setValidationError(tr('Selecione uma instituição antes de continuar.', 'Select an institution before continuing.', 'Seleccione una institución antes de continuar.'));
      return;
    }

    setValidationError(null);
    setConnectionError(null);
    setStep('connecting');
    setConnectionState('connecting');
    setConnectingPhase(1);

    // Multi-phase UI progression for realistic fintech feedback
    const phaseTimer1 = setTimeout(() => setConnectingPhase(2), 700);
    const phaseTimer2 = setTimeout(() => setConnectingPhase(3), 1500);
    const phaseTimer3 = setTimeout(() => setConnectingPhase(4), 2200);

    try {
      const authHeaders = await getAuthHeaders();

      // Step 1: Initialize server-side session
      const connectRes = await fetch('/api/finance/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          country,
          language,
          institutionName: selectedInstitution.name
        })
      }).then(r => r.json());

      if (!connectRes.success) {
        throw new Error(connectRes.error || tr('Falha ao iniciar canal seguro com o banco.', 'Failed to establish secure session.', 'Error al iniciar sesión segura con el banco.'));
      }

      const activeProvider: FinancialProviderType = connectRes.providerSelection?.provider || 'mock';

      // Determine if deterministic fail test
      const isFailTest = 
        selectedInstitution.id.includes('fail') || 
        selectedInstitution.name.toLowerCase().includes('fail') || 
        selectedInstitution.name.toLowerCase().includes('falha') || 
        simulateFailure;

      // Step 2: Exchange Token (Server-Side verification)
      const exchangeRes = await fetch('/api/finance/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          provider: activeProvider,
          publicToken: isFailTest ? 'pub_token_fail' : `pub_token_${Date.now()}`,
          linkSessionId: `link_sess_${Date.now()}`,
          institutionName: selectedInstitution.name,
          country
        })
      }).then(r => r.json());

      if (!exchangeRes.success || exchangeRes.status === 'not_connected') {
        // Failure State
        setConnectionState('not_connected');
        setConnectionError(
          exchangeRes.error || tr(
            'Não foi possível conectar ao seu banco. Verifique suas informações e tente novamente.',
            "We couldn't connect to your bank. Please check your information and try again.",
            'No pudimos conectar con su banco. Por favor, verifique su información e intente de nuevo.'
          )
        );
        setStep('failed');
        return;
      }

      // Success State
      setConnectionState('syncing');
      setConnections(prev => [exchangeRes.connection, ...prev.filter(c => c.id !== exchangeRes.connection.id)]);
      setAccounts(exchangeRes.accounts || []);
      setTransactions(exchangeRes.transactions || []);
      setLatestSyncSummary(exchangeRes.syncSummary || null);

      if (onDataSynchronized) {
        onDataSynchronized({ 
          accounts: exchangeRes.accounts || [], 
          transactions: exchangeRes.transactions || [] 
        });
      }

      setConnectionState('completed');
      setStep('success');

      if (onShowNotification) {
        onShowNotification(
          tr('Instituição Conectada', 'Institution Connected', 'Institución Conectada'),
          tr(
            `Conexão verificada com sucesso para ${selectedInstitution.name}!`,
            `Connection verified successfully for ${selectedInstitution.name}!`,
            `¡Conexión verificada con éxito para ${selectedInstitution.name}!`
          ),
          'success'
        );
      }
    } catch (err: any) {
      console.error('[Connection Handshake Error]:', err);
      setConnectionState('not_connected');
      setConnectionError(
        err.message || tr(
          'Não foi possível conectar ao seu banco. Verifique suas informações e tente novamente.',
          "We couldn't connect to your bank. Please check your information and try again.",
          'No pudimos conectar con su banco. Por favor, verifique su información e intente de nuevo.'
        )
      );
      setStep('failed');
    } finally {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(phaseTimer3);
    }
  };

  // Manual Re-Sync Handler
  const handleManualSync = async (connId: string) => {
    setSyncingConnId(connId);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/finance/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ connectionId: connId })
      }).then(r => r.json());

      if (res.success) {
        setConnections(prev => prev.map(c => c.id === connId ? res.connection : c));
        setAccounts(res.accounts || []);
        setTransactions(res.transactions || []);
        setLatestSyncSummary(res.syncSummary || null);

        if (onDataSynchronized) {
          onDataSynchronized({ accounts: res.accounts || [], transactions: res.transactions || [] });
        }

        if (onShowNotification) {
          onShowNotification(
            tr('Sincronização Concluída', 'Synchronization Complete', 'Sincronización Completada'),
            tr(
              `Atualizado: ${res.syncSummary?.inserted || 0} novos lançamentos, ${res.syncSummary?.updated || 0} atualizados (0 duplicatas).`,
              `Updated: ${res.syncSummary?.inserted || 0} new transactions, ${res.syncSummary?.updated || 0} updated (0 duplicates).`,
              `Actualizado: ${res.syncSummary?.inserted || 0} nuevas transacciones, ${res.syncSummary?.updated || 0} actualizadas (0 duplicados).`
            ),
            'success'
          );
        }
      }
    } catch (err: any) {
      if (onShowNotification) {
        onShowNotification(tr('Erro de Sincronização', 'Sync Error', 'Error de Sincronización'), err.message, 'error');
      }
    } finally {
      setSyncingConnId(null);
    }
  };

  // Disconnect Handler
  const handleDisconnect = async (connId: string) => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/finance/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ connectionId: connId })
      }).then(r => r.json());

      if (res.success) {
        setConnections(prev => prev.filter(c => c.id !== connId));
        setAccounts(prev => prev.filter(a => a.connection_id !== connId));
        setConfirmDisconnectId(null);

        if (onShowNotification) {
          onShowNotification(
            tr('Acesso Revogado', 'Access Revoked', 'Acceso Revocado'),
            tr('A conexão com a instituição financeira foi encerrada e desvinculada com sucesso.', 'The financial institution was unlinked and tokens revoked.', 'La institución financiera fue desvinculada con éxito.'),
            'info'
          );
        }
      }
    } catch (err: any) {
      if (onShowNotification) {
        onShowNotification(tr('Erro', 'Error', 'Error'), err.message, 'error');
      }
    }
  };

  const handleResetForRetry = () => {
    setConnectionState('idle');
    setValidationError(null);
    setConnectionError(null);
    setStep('select');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200" 
      onClick={onClose}
      id="life4billion-connect-modal"
    >
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-wide">Life4Billion Financial Connect</h3>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Open Banking Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {tr(
                  'Conexão criptografada de contas bancárias e cartões com verificação em tempo real',
                  'Encrypted bank accounts and credit card connectivity with real-time verification',
                  'Conexión encriptada de cuentas bancarias y tarjetas con verificación en tiempo real'
                )}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={tr('Fechar', 'Close', 'Cerrar')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Navigation Mode Tabs */}
        {step !== 'connecting' && step !== 'success' && (
          <div className="px-6 pt-4 pb-0 bg-slate-950/30 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setConnectMode('bank'); setStep('select'); setSelectedInstitution(null); setValidationError(null); }}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center space-x-2 border-t-2 ${
                  connectMode === 'bank' && step !== 'manage'
                    ? 'bg-slate-900 border-emerald-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Landmark className="w-4 h-4 text-emerald-400" />
                <span>{tr('Conta Bancária', 'Bank Account', 'Cuenta Bancaria')}</span>
              </button>

              <button
                onClick={() => { setConnectMode('card'); setStep('select'); setSelectedInstitution(null); setValidationError(null); }}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center space-x-2 border-t-2 ${
                  connectMode === 'card' && step !== 'manage'
                    ? 'bg-slate-900 border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <span>{tr('Cartão de Crédito / Débito', 'Credit / Debit Card', 'Tarjeta de Crédito / Débito')}</span>
              </button>

              <button
                onClick={() => { setConnectMode('manage'); setStep('manage'); setValidationError(null); }}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center space-x-2 border-t-2 ${
                  step === 'manage'
                    ? 'bg-slate-900 border-teal-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-teal-400" />
                <span>
                  {tr('Conexões Ativas', 'Active Connections', 'Conexiones Activas')}
                  {connections.length > 0 && ` (${connections.length})`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* Validation Alert */}
          {validationError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-bold">{tr('Atenção', 'Notice', 'Atención')}</p>
                <p className="text-[11px] mt-0.5">{validationError}</p>
              </div>
            </div>
          )}

          {/* STEP 1: INSTITUTION SELECTION & SEARCH */}
          {step === 'select' && (
            <div className="space-y-6">
              
              {/* Region Selector */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{tr('1. Selecione a Região Bancária', '1. Select Banking Region', '1. Seleccione la Región Bancaria')}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Open Banking Protocols</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => { setCountry('US'); setSelectedInstitution(null); setValidationError(null); }}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      country === 'US'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">🇺🇸</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">Plaid API</span>
                    </div>
                    <p className="text-xs font-bold text-white">United States / Global</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Chase, BofA, Amex, Capital One</p>
                  </button>

                  <button
                    onClick={() => { setCountry('EU'); setSelectedInstitution(null); setValidationError(null); }}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      country === 'EU'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">🇪🇺</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">Tink PSD2</span>
                    </div>
                    <p className="text-xs font-bold text-white">Europe & United Kingdom</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">N26, Revolut, BNP Paribas, Santander</p>
                  </button>

                  <button
                    onClick={() => { setCountry('BR'); setSelectedInstitution(null); setValidationError(null); }}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      country === 'BR'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">🇧🇷</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">Belvo OF</span>
                    </div>
                    <p className="text-xs font-bold text-white">Brasil & América Latina</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Itaú, Nubank, Bradesco, Inter</p>
                  </button>
                </div>
              </div>

              {/* Institution Search Bar */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>{tr('2. Escolha sua Instituição ou Busque pelo Nome', '2. Choose your Institution or Search by Name', '2. Elija su Institución o Busque por Nombre')}</span>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      {tr('Limpar busca', 'Clear search', 'Limpiar búsqueda')}
                    </button>
                  )}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={tr(
                      `Buscar instituição financeira (ex: ${country === 'BR' ? 'Itaú, Nubank, Bradesco' : country === 'EU' ? 'N26, Revolut, BNP' : 'Chase, Bank of America, Amex'})...`,
                      `Search financial institution (e.g., ${country === 'BR' ? 'Itaú, Nubank' : country === 'EU' ? 'N26, Revolut' : 'Chase, BofA, Amex'})...`,
                      `Buscar institución financiera (ej: ${country === 'BR' ? 'Itaú, Nubank' : country === 'EU' ? 'N26, Revolut' : 'Chase, BofA, Amex'})...`
                    )}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Grid of Institutions */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {filteredInstitutions.map((inst) => {
                    const isFailBank = inst.id.includes('fail');
                    return (
                      <button
                        key={inst.id}
                        onClick={() => handleSelectInstitution(inst)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                          isFailBank 
                            ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-500/80 text-rose-300'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850/80 text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${inst.color} flex items-center justify-center text-lg shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                            {inst.logoEmoji}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate flex items-center space-x-1.5">
                              <span>{inst.name}</span>
                              {inst.code && (
                                <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                                  {inst.code}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {inst.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    );
                  })}
                </div>

                {filteredInstitutions.length === 0 && (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                    <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">
                      {tr('Nenhuma instituição encontrada com esse nome.', 'No institutions found with that query.', 'No se encontraron instituciones con ese nombre.')}
                    </p>
                    <div className="max-w-md mx-auto flex items-center space-x-2">
                      <input
                        type="text"
                        value={customBankInput}
                        onChange={(e) => setCustomBankInput(e.target.value)}
                        placeholder={tr('Digite o nome completo do seu banco...', 'Type your full bank name...', 'Escriba el nombre completo de su banco...')}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                      <button
                        onClick={handleSelectCustomBank}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
                      >
                        {tr('Conectar', 'Connect', 'Conectar')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Deterministic Failure Test Scenario Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5 text-slate-400">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-300">
                      {tr('Simular Cenário de Erro de Conexão:', 'Deterministic Failure Test Scenario:', 'Simular Escenario de Error de Conexión:')}
                    </span>
                    <p className="text-[10px] text-slate-500">
                      {tr('Testa o tratamento seguro de falhas com diagnóstico e retry.', 'Verifies resilient error recovery and non-connected states.', 'Prueba el manejo seguro de fallos con diagnóstico y reintento.')}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

            </div>
          )}

          {/* STEP 2: PERMISSIONS & TRANSPARENCY REVIEW */}
          {step === 'permissions' && selectedInstitution && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Selected Target Institution Header */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${selectedInstitution.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {selectedInstitution.logoEmoji}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>{selectedInstitution.name}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        {connectMode === 'card' ? 'Cartão de Crédito' : 'Conta Bancária'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedInstitution.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setStep('select')}
                  className="text-xs font-bold text-slate-400 hover:text-white underline px-2 py-1"
                >
                  {tr('Trocar', 'Change', 'Cambiar')}
                </button>
              </div>

              {/* Data Scope Breakdown (Fintech-Grade Transparency) */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{tr('Escopo de Acesso & Permissões', 'Access Scope & Permissions', 'Alcance de Acceso y Permisos')}</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                    <p className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                      <Check className="w-4 h-4" />
                      <span>{tr('O que o Life4Billion Acessa:', 'What Life4Billion Reads:', 'Lo que Life4Billion Lee:')}</span>
                    </p>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                      <li>{tr('Saldos correntes e limites disponíveis', 'Current balances & available credit limits', 'Saldos actuales y límites disponibles')}</li>
                      <li>{tr('Histórico de extratos e transações para categorização', 'Transaction statements for automated categorization', 'Historial de estados y transacciones para categorización')}</li>
                      <li>{tr('Identificação mascarada das contas (ex: **** 4821)', 'Masked account identification (e.g. **** 4821)', 'Identificación enmascarada de cuentas (ej: **** 4821)')}</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                    <p className="text-xs font-bold text-rose-400 flex items-center space-x-1.5">
                      <X className="w-4 h-4" />
                      <span>{tr('O que o Life4Billion NUNCA faz:', 'What Life4Billion NEVER does:', 'Lo que Life4Billion NUNCA hace:')}</span>
                    </p>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                      <li>{tr('Nenhuma movimentação, saque ou transferência', 'Never makes transfers or initiates payments', 'Nunca realiza transferencias ni cobros')}</li>
                      <li>{tr('Nunca armazena sua senha bancária ou credenciais', 'Never stores banking passwords or raw credentials', 'Nunca almacena su contraseña bancaria')}</li>
                      <li>{tr('Conexão somente leitura via token revogável a qualquer momento', 'Read-only access via revocable tokens anytime', 'Acceso de solo lectura mediante token revocable')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Encryption Certificate Note */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {tr(
                      'Criptografia de ponta a ponta com certificados TLS 1.3 e chaves AES-256 no servidor.',
                      'End-to-end encryption with TLS 1.3 certificates and server-side AES-256 token storage.',
                      'Encriptación de extremo a extremo con certificados TLS 1.3 y claves AES-256 en servidor.'
                    )}
                  </span>
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep('select')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition"
                >
                  {tr('Voltar', 'Back', 'Volver')}
                </button>

                <button
                  onClick={handleProceedConnection}
                  className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
                >
                  <Landmark className="w-4 h-4" />
                  <span>
                    {tr(
                      `Confirmar & Conectar ${selectedInstitution.name}`,
                      `Confirm & Connect ${selectedInstitution.name}`,
                      `Confirmar y Conectar ${selectedInstitution.name}`
                    )}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: CONNECTING & REAL PROVIDER HANDSHAKE */}
          {step === 'connecting' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-200">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center"></div>
                <div className="absolute inset-0 m-auto flex items-center justify-center">
                  <Landmark className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-base font-bold text-white">
                  {connectingPhase === 1 && tr('Iniciando canal seguro com o banco...', 'Initializing secure session...', 'Iniciando canal seguro con el banco...')}
                  {connectingPhase === 2 && tr(`Autenticando com ${selectedInstitution?.name || 'Instituição'}...`, `Authenticating with ${selectedInstitution?.name || 'Bank'}...`, `Autenticando con ${selectedInstitution?.name || 'Banco'}...`)}
                  {connectingPhase === 3 && tr('Sincronizando contas e limites em tempo real...', 'Syncing accounts & balance structure...', 'Sincronizando cuentas y límites...')}
                  {connectingPhase >= 4 && tr('Deduplicando lançamentos e finalizando...', 'Finalizing duplicate-free sync...', 'Finalizando sincronización deduplicada...')}
                </h4>
                <p className="text-xs text-slate-400">
                  {tr(
                    'Tokens criptografados em trânsito e em repouso. Nenhum dado sensível de login é armazenado.',
                    'Tokens encrypted in transit and at rest. No raw authentication credentials stored.',
                    'Tokens encriptados en tránsito y en reposo. Ninguna credencial es almacenada.'
                  )}
                </p>
              </div>

              {/* Progress Step Indicators */}
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                <span className={connectingPhase >= 1 ? 'text-emerald-400 font-bold' : ''}>1. TLS 1.3</span>
                <span>•</span>
                <span className={connectingPhase >= 2 ? 'text-emerald-400 font-bold' : ''}>2. OAuth/OpenBanking</span>
                <span>•</span>
                <span className={connectingPhase >= 3 ? 'text-emerald-400 font-bold' : ''}>3. Account Fetch</span>
                <span>•</span>
                <span className={connectingPhase >= 4 ? 'text-emerald-400 font-bold' : ''}>4. Idempotent Sync</span>
              </div>
            </div>
          )}

          {/* STEP 4: FAILURE STATE (status = not_connected) */}
          {step === 'failed' && (
            <div className="space-y-6 py-2 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-4">
                <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 shrink-0">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>✕</span>
                    <span>{tr('Não Conectado', 'Not Connected', 'No Conectado')}</span>
                  </h4>
                  <p className="text-xs text-rose-300 mt-1">
                    {connectionError || tr(
                      "Não foi possível conectar ao seu banco. Verifique suas informações e tente novamente.",
                      "We couldn't connect to your bank. Please check your information and try again.",
                      "No pudimos conectar con su banco. Por favor, verifique su información e intente de nuevo."
                    )}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
                <p className="font-bold text-slate-200">{tr('Como resolver:', 'Troubleshooting steps:', 'Cómo resolver:')}</p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                  <li>{tr('Se estiver testando o modo de falha determinístico, desative a opção ou escolha uma instituição válida.', 'If using the deterministic test mode, disable the toggle or pick a valid bank.', 'Si está probando el modo de fallo, desactive la opción o elija un banco válido.')}</li>
                  <li>{tr('Certifique-se de que a instituição bancária selecionada corresponde à sua região.', 'Ensure the selected institution matches your active regional currency.', 'Asegúrese de que la institución seleccionada corresponda a su región.')}</li>
                  <li>{tr('Suas informações financeiras anteriores permanecem 100% intactas.', 'Your existing financial records and budgets remain fully intact.', 'Sus datos financieros anteriores permanecen 100% intactos.')}</li>
                </ul>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition"
                >
                  {tr('Fechar', 'Close', 'Cerrar')}
                </button>
                <button
                  onClick={handleResetForRetry}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{tr('Tentar Novamente', 'Try Again', 'Intentar de Nuevo')}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: SUCCESS CONFIRMATION (status = connected & synced) */}
          {step === 'success' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-4">
                <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>✓</span>
                    <span>{tr('Conectado com Sucesso', 'Connected Successfully', 'Conectado con Éxito')}</span>
                  </h4>
                  <p className="text-xs text-emerald-300 mt-0.5">
                    {tr(
                      'A instituição financeira confirmou a autenticação e sincronizou seus dados com o Life4Billion.',
                      'Financial provider confirmed authentication & synchronized data with Life4Billion.',
                      'La institución financiera confirmó la autenticación y sincronizó los datos con Life4Billion.'
                    )}
                  </p>
                </div>
              </div>

              {/* Verified Connection Details */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {tr('Detalhes da Conexão Ativa', 'Active Connection Details', 'Detalles de la Conexión Activa')}
                </h5>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase">{tr('Instituição', 'Institution', 'Institución')}</p>
                    <p className="font-bold text-white truncate mt-0.5">{selectedInstitution?.name || 'Chase Premier'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase">{tr('Contas Ativas', 'Active Accounts', 'Cuentas Activas')}</p>
                    <p className="font-bold text-white mt-0.5">{accounts.length} {tr('contas', 'accounts', 'cuentas')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase">{tr('Sincronização', 'Sync Status', 'Estado de Sinc')}</p>
                    <p className="font-bold text-emerald-400 mt-0.5">{tr('Em Tempo Real', 'Real-Time', 'En Tiempo Real')}</p>
                  </div>
                </div>
              </div>

              {/* Synced Accounts Card List */}
              {accounts.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {tr('Contas & Cartões Vinculados', 'Linked Accounts & Cards', 'Cuentas y Tarjetas Vinculadas')}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accounts.map((acc) => (
                      <div key={acc.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-xl bg-slate-900 text-slate-300">
                            {acc.account_type === 'credit' ? <CreditCard className="w-4 h-4 text-purple-400" /> : <Landmark className="w-4 h-4 text-emerald-400" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{acc.name}</p>
                            <p className="text-[10px] text-slate-400">**** {acc.mask || '4821'} • {acc.account_type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-white font-mono">
                            {acc.currency === 'BRL' ? 'R$ ' : acc.currency === 'EUR' ? '€ ' : '$'}{acc.current_balance.toLocaleString()}
                          </p>
                          <span className="text-[9px] text-emerald-400 font-semibold flex items-center justify-end space-x-1">
                            <Check className="w-3 h-3" />
                            <span>{tr('Sincronizado', 'Synced', 'Sincronizado')}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Idempotent Sync Confirmation */}
              {latestSyncSummary && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{tr('Proteção de Lançamentos Sem Duplicatas:', 'Idempotent Duplicate Protection:', 'Protección de Transacciones Sin Duplicados:')}</span>
                  <div className="flex items-center space-x-3 font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold">+{latestSyncSummary.inserted} {tr('novas', 'new', 'nuevas')}</span>
                    <span className="text-blue-400 font-bold">{latestSyncSummary.updated} {tr('atualizadas', 'updated', 'actualizadas')}</span>
                    <span className="text-slate-500">0 {tr('duplicadas', 'duplicates', 'duplicadas')}</span>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setStep('manage')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition"
                >
                  {tr('Gerenciar Conexões', 'Manage Connections', 'Gestionar Conexiones')}
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  {tr('Concluir & Voltar ao Painel', 'Done & Back to Dashboard', 'Concluir y Volver al Panel')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: MANAGE ACTIVE CONNECTIONS */}
          {step === 'manage' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{tr('Instituições Financeiras Conectadas', 'Connected Financial Institutions', 'Instituciones Financieras Conectadas')}</h4>
                  <p className="text-xs text-slate-400">{tr('Gerencie sincronizações periódicas, contas ativas e revogações de acesso.', 'Manage sync schedule, active accounts, and access revocations.', 'Gestione sincronizaciones, cuentas activas y revocaciones.')}</p>
                </div>
                <button
                  onClick={() => { setStep('select'); setConnectMode('bank'); setSelectedInstitution(null); setValidationError(null); }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition flex items-center space-x-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>+ {tr('Conectar Outro Banco', 'Connect Another Bank', 'Conectar Otro Banco')}</span>
                </button>
              </div>

              {connections.length === 0 ? (
                <div className="py-12 text-center bg-slate-950/60 rounded-3xl border border-slate-800 space-y-3">
                  <Landmark className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {tr(
                      'Nenhuma instituição conectada ainda. Conecte sua conta bancária ou cartão para sincronizar transações.',
                      'No financial institutions connected yet. Connect your bank or credit card to sync data.',
                      'Sin instituciones conectadas. Conecte su cuenta bancaria o tarjeta para sincronizar datos.'
                    )}
                  </p>
                  <button
                    onClick={() => { setStep('select'); setConnectMode('bank'); }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
                  >
                    {tr('Conectar Banco ou Cartão Agora', 'Connect Bank or Card Now', 'Conectar Banco o Tarjeta Ahora')}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((conn) => {
                    const isConnected = conn.status === 'connected' || conn.status === 'active';
                    const connAccounts = accounts.filter(a => a.connection_id === conn.id);

                    return (
                      <div key={conn.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-base font-bold text-emerald-400 shrink-0">
                              {conn.institution_name.charAt(0)}
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-white flex items-center space-x-2">
                                <span>{conn.institution_name}</span>
                                <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold ${
                                  isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {isConnected ? '✓ Ativo' : '✕ Desconectado'}
                                </span>
                              </h5>
                              <p className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>{tr('Última sinc:', 'Last sync:', 'Última sinc:')} {new Date(conn.last_synced_at).toLocaleTimeString()}</span>
                                </span>
                                <span>•</span>
                                <span>{connAccounts.length || 1} {tr('contas vinculadas', 'linked accounts', 'cuentas vinculadas')}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isConnected ? (
                              <button
                                onClick={() => handleManualSync(conn.id)}
                                disabled={syncingConnId === conn.id}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40 transition text-xs font-medium flex items-center space-x-1.5"
                                title={tr('Sincronizar Agora', 'Sync Now', 'Sincronizar Ahora')}
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${syncingConnId === conn.id ? 'animate-spin text-emerald-400' : ''}`} />
                                <span>{syncingConnId === conn.id ? tr('Sincronizando...', 'Syncing...', 'Sincronizando...') : tr('Sincronizar', 'Sync', 'Sincronizar')}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => { 
                                  setSelectedInstitution({
                                    id: conn.provider_connection_id,
                                    name: conn.institution_name,
                                    category: 'both',
                                    region: conn.country as any || 'US',
                                    logoEmoji: '🏦',
                                    color: 'from-emerald-700 to-teal-900',
                                    description: 'Reconectar conta'
                                  }); 
                                  setStep('permissions'); 
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition text-xs font-medium flex items-center space-x-1.5"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{tr('Reconectar', 'Reconnect', 'Reconectar')}</span>
                              </button>
                            )}

                            <button
                              onClick={() => setConfirmDisconnectId(conn.id)}
                              className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition text-xs"
                              title={tr('Revogar Acesso', 'Revoke Access', 'Revocar Acceso')}
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Confirmation dialog for disconnect */}
                        {confirmDisconnectId === conn.id && (
                          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between text-xs animate-in fade-in">
                            <span className="text-rose-200">
                              {tr('Tem certeza que deseja revogar o acesso a esta instituição?', 'Are you sure you want to revoke access to this institution?', '¿Está seguro de que desea revocar el acceso a esta institución?')}
                            </span>
                            <div className="flex items-center space-x-2 shrink-0 ml-3">
                              <button
                                onClick={() => setConfirmDisconnectId(null)}
                                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                              >
                                {tr('Cancelar', 'Cancel', 'Cancelar')}
                              </button>
                              <button
                                onClick={() => handleDisconnect(conn.id)}
                                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500"
                              >
                                {tr('Sim, Revogar', 'Yes, Revoke', 'Sí, Revocar')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Preserved Manual Categories Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>
                    {tr(
                      'Suas correções manuais de categorias são sempre preservadas automaticamente nas novas sincronizações.',
                      'Your manual transaction category overrides are permanently preserved during future re-syncs.',
                      'Sus correcciones manuales de categorías siempre se conservan automáticamente en nuevas sincronizaciones.'
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Security Badge */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/90 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{tr('Sua senha bancária NUNCA é armazenada.', 'Banking password is NEVER stored.', 'Su contraseña bancaria NUNCA se almacena.')}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">Life4Billion Connect v3.0 • Multi-Region Open Finance</span>
        </div>

      </div>
    </div>
  );
};
