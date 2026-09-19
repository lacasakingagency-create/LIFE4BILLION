import React, { useState, useEffect } from 'react';
import {
  Server,
  Key,
  Copy,
  Check,
  ShieldCheck,
  Bot,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Lock,
  Unlock,
  Sliders,
  CheckCircle2,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { McpPermissions, DEFAULT_MCP_PERMISSIONS } from '../server/mcp/permissions';

interface McpIntegrationSettingsProps {
  language?: string;
  onShowNotification?: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  onClose?: () => void;
}

export const McpIntegrationSettings: React.FC<McpIntegrationSettingsProps> = ({
  language = 'pt-BR',
  onShowNotification,
  onClose
}) => {
  const { user, session } = useAuth();

  const [activeApiKey, setActiveApiKey] = useState<string>('');
  const [keyStatus, setKeyStatus] = useState<'not_connected' | 'connected' | 'revoked'>('not_connected');
  const [showKeySecret, setShowKeySecret] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [savingPermissions, setSavingPermissions] = useState<boolean>(false);
  const [revoking, setRevoking] = useState<boolean>(false);
  const [showRevokeModal, setShowRevokeModal] = useState<boolean>(false);

  // Instructions subtab
  const [aiClientTab, setAiClientTab] = useState<'claude' | 'chatgpt'>('claude');

  // Permissions state
  const [permissions, setPermissions] = useState<McpPermissions>(DEFAULT_MCP_PERMISSIONS);
  const [hasPermissionChanges, setHasPermissionChanges] = useState<boolean>(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://life4billion.app';
  const mcpServerUrl = `${origin}/api/mcp`;

  const effectiveUserId = user?.id || session?.user?.id || 'demo-user';

  // Load existing keys and permissions
  useEffect(() => {
    loadMcpData();
  }, [effectiveUserId]);

  const loadMcpData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Fetch keys
      const res = await fetch(`/api/mcp/keys?userId=${encodeURIComponent(effectiveUserId)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.keys && data.keys.length > 0) {
          // Find the newest key
          const newest = data.keys[0];
          setActiveApiKey(newest.key);
          if (newest.status === 'revoked') {
            setKeyStatus('revoked');
          } else {
            setKeyStatus('connected');
          }

          if (newest.permissions) {
            setPermissions(newest.permissions);
          }
        } else {
          setKeyStatus('not_connected');
          setActiveApiKey('');
        }
      }

      // Fetch permissions
      const permRes = await fetch(`/api/mcp/permissions?userId=${encodeURIComponent(effectiveUserId)}`, { headers });
      if (permRes.ok) {
        const permData = await permRes.json();
        if (permData.permissions) {
          setPermissions(permData.permissions);
        }
      }
    } catch (err) {
      console.error('[MCP Settings Load Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    if (onShowNotification) {
      onShowNotification('Copiado', `${field} copiado para a área de transferência!`, 'success');
    }
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleGenerateKey = async () => {
    setGenerating(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/mcp/keys/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: effectiveUserId,
          email: user?.email || session?.user?.email || 'user@life4billion.app'
        })
      });

      const data = await res.json();
      if (data.success && data.apiKey) {
        setActiveApiKey(data.apiKey);
        setKeyStatus('connected');
        setShowKeySecret(true);
        if (data.permissions) {
          setPermissions(data.permissions);
        }
        if (onShowNotification) {
          onShowNotification(
            'Conexão MCP Gerada!',
            'Sua chave pessoal foi gerada. Copie a chave e o endpoint abaixo.',
            'success'
          );
        }
      } else {
        throw new Error(data.error || 'Falha ao gerar chave MCP');
      }
    } catch (err: any) {
      if (onShowNotification) {
        onShowNotification('Erro ao gerar conexão', err.message || String(err), 'error');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleTogglePermission = (key: keyof McpPermissions) => {
    setPermissions((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      setHasPermissionChanges(true);
      return updated;
    });
  };

  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/mcp/permissions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: effectiveUserId,
          apiKey: activeApiKey || undefined,
          permissions
        })
      });

      const data = await res.json();
      if (data.success) {
        setHasPermissionChanges(false);
        if (onShowNotification) {
          onShowNotification(
            'Permissões Atualizadas',
            'As permissões da sua conexão MCP foram salvas com sucesso.',
            'success'
          );
        }
      } else {
        throw new Error(data.error || 'Falha ao salvar permissões');
      }
    } catch (err: any) {
      if (onShowNotification) {
        onShowNotification('Erro', err.message || String(err), 'error');
      }
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleRevokeConnection = async () => {
    setRevoking(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/mcp/keys/revoke', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: effectiveUserId,
          apiKey: activeApiKey || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setKeyStatus('revoked');
        setShowRevokeModal(false);
        if (onShowNotification) {
          onShowNotification(
            'Conexão MCP Revogada',
            'A chave foi invalidada. Ferramentas de IA não conseguirão mais acessar seus dados.',
            'warning'
          );
        }
      } else {
        throw new Error(data.error || 'Falha ao revogar conexão');
      }
    } catch (err: any) {
      if (onShowNotification) {
        onShowNotification('Erro ao revogar', err.message || String(err), 'error');
      }
    } finally {
      setRevoking(false);
    }
  };

  const maskedKey = activeApiKey
    ? `${activeApiKey.slice(0, 10)}${'•'.repeat(Math.max(12, activeApiKey.length - 14))}${activeApiKey.slice(-4)}`
    : 'l4b_mcp_••••••••••••••••••••';

  // Read permissions metadata (13 items)
  const readPermissionItems: Array<{ key: keyof McpPermissions; title: string; desc: string; tools: string }> = [
    {
      key: 'finances',
      title: 'Resumo Financeiro & Entradas/Saídas',
      desc: 'Consulta receitas, despesas mensais, fluxo de caixa e saldo geral.',
      tools: 'get_financial_summary, get_income, get_expenses, get_monthly_expenses'
    },
    {
      key: 'budget',
      title: 'Orçamento Mensal',
      desc: 'Consulta tetos de orçamento e percentual de consumo por categoria.',
      tools: 'get_budget'
    },
    {
      key: 'upcoming_bills',
      title: 'Contas a Pagar & Vencimentos',
      desc: 'Consulta boletos, vencimentos e contas futuras programadas.',
      tools: 'get_upcoming_bills'
    },
    {
      key: 'emergency_reserve',
      title: 'Reserva de Emergência',
      desc: 'Consulta status de cobertura e meses acumulados da reserva.',
      tools: 'get_emergency_reserve'
    },
    {
      key: 'net_worth',
      title: 'Patrimônio Líquido',
      desc: 'Consulta evolução patrimonial consolidada e distribuição de ativos.',
      tools: 'get_net_worth'
    },
    {
      key: 'goals',
      title: 'Metas Financeiras',
      desc: 'Consulta progresso, valores alvo e prazos de metas.',
      tools: 'get_goals'
    },
    {
      key: 'habits',
      title: 'Hábitos & Rotinas',
      desc: 'Consulta rotinas diárias, sequências ativas e taxa de conclusão.',
      tools: 'get_habits, get_habit_progress'
    },
    {
      key: 'calendar',
      title: 'Calendário & Compromissos',
      desc: 'Consulta eventos e compromissos agendados no calendário executivo.',
      tools: 'get_calendar_events'
    },
    {
      key: 'studies',
      title: 'Estudos & Pomodoro',
      desc: 'Consulta progresso de estudos, tópicos e sessões de foco.',
      tools: 'get_study_progress, get_study_sessions'
    },
    {
      key: 'family_budget',
      title: 'Orçamento Familiar',
      desc: 'Consulta divisão familiar de custos, dependentes e despesas conjuntas.',
      tools: 'get_family_budget, get_family_expenses'
    },
    {
      key: 'crm',
      title: 'Resumo do CRM Comercial',
      desc: 'Consulta métricas gerais de pipeline, contatos e negociações.',
      tools: 'get_crm_summary'
    },
    {
      key: 'leads',
      title: 'Leads & Oportunidades',
      desc: 'Consulta lista de prospects e estágios de qualificação comercial.',
      tools: 'get_leads'
    },
    {
      key: 'customers',
      title: 'Carteira de Clientes',
      desc: 'Consulta clientes ativos, histórico de compras e status contratual.',
      tools: 'get_customers'
    }
  ];

  // Write permissions metadata (5 items)
  const writePermissionItems: Array<{ key: keyof McpPermissions; title: string; desc: string; tool: string }> = [
    {
      key: 'create_goal',
      title: 'Criar Nova Meta Financeira',
      desc: 'Permite que a IA adicione novos objetivos financeiros à sua conta.',
      tool: 'create_goal'
    },
    {
      key: 'update_goal',
      title: 'Atualizar Meta Financeira',
      desc: 'Permite que a IA atualize valores acumulados ou status de metas existentes.',
      tool: 'update_goal'
    },
    {
      key: 'create_habit',
      title: 'Criar Novo Hábito',
      desc: 'Permite que a IA cadastre novos hábitos na sua rotina diária.',
      tool: 'create_habit'
    },
    {
      key: 'update_habit',
      title: 'Atualizar / Concluir Hábito',
      desc: 'Permite que a IA marque hábitos como feitos ou ajuste frequências.',
      tool: 'update_habit'
    },
    {
      key: 'create_calendar_event',
      title: 'Agendar Evento no Calendário',
      desc: 'Permite que a IA adicione reuniões e compromissos à sua agenda.',
      tool: 'create_calendar_event'
    }
  ];

  const claudeConfigSnippet = `{
  "mcpServers": {
    "life4billion": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-everything"
      ],
      "url": "${mcpServerUrl}",
      "headers": {
        "Authorization": "Bearer ${activeApiKey || 'l4b_mcp_SUA_CHAVE_AQUI'}"
      }
    }
  }
}`;

  return (
    <div className="space-y-6 text-slate-200" id="mcp-integrations-area">
      {/* 1. Breadcrumbs & Header */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2">
          <span>Definições</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span>Integrações</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-emerald-400 font-semibold">MCP</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  MCP — Conecte sua IA ao Life4Billion
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Permita que ferramentas de IA autorizadas consultem e executem ações permitidas nos seus dados do Life4Billion.
                </p>
              </div>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div className="shrink-0 flex items-center">
            {keyStatus === 'connected' && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
                Conectado
              </span>
            )}

            {keyStatus === 'revoked' && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm">
                <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                Revogado
              </span>
            )}

            {keyStatus === 'not_connected' && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-500 mr-2" />
                Não conectado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Connection Management Card */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 md:p-6 space-y-5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center">
              <Key className="w-4 h-4 mr-2 text-emerald-400" />
              Credenciais da Conexão MCP
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Chave de acesso exclusiva gerada para o seu perfil. As IAs autenticadas só têm acesso aos seus dados.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateKey}
            disabled={generating}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-450 disabled:opacity-50 text-black text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10 cursor-pointer shrink-0"
          >
            {generating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Key className="w-3.5 h-3.5" />
            )}
            <span>{generating ? 'Gerando chave...' : 'Gerar conexão MCP'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* MCP Server URL */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                MCP Server URL
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">Streamable HTTP / SSE</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-2 rounded-lg border border-white/5">
              <code className="text-xs font-mono text-slate-200 truncate flex-1">
                {mcpServerUrl}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(mcpServerUrl, 'MCP Server URL')}
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition shrink-0 cursor-pointer"
                title="Copiar URL"
              >
                {copiedField === 'MCP Server URL' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* MCP Key Display */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Chave MCP Exclusiva
              </label>
              <span className="text-[10px] text-indigo-400 font-mono">Bearer l4b_mcp_*</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-2 rounded-lg border border-white/5">
              <code className="text-xs font-mono text-slate-200 truncate flex-1">
                {activeApiKey
                  ? showKeySecret
                    ? activeApiKey
                    : maskedKey
                  : 'Nenhuma chave ativa gerada ainda'}
              </code>
              {activeApiKey && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition shrink-0 cursor-pointer"
                    title={showKeySecret ? 'Ocultar chave' : 'Mostrar chave'}
                  >
                    {showKeySecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeApiKey, 'Chave MCP')}
                    className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition shrink-0 cursor-pointer"
                    title="Copiar chave"
                  >
                    {copiedField === 'Chave MCP' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {keyStatus === 'connected' && (
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
            <span className="flex items-center text-emerald-400/90 font-medium">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-400" />
              Sessão protegida por isolamento rígido por usuário (UUID).
            </span>

            <button
              type="button"
              onClick={() => setShowRevokeModal(true)}
              className="text-rose-400 hover:text-rose-300 font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Revogar conexão
            </button>
          </div>
        )}
      </div>

      {/* 3. Como Conectar (Step-by-Step Instructions) */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center">
              <Bot className="w-4 h-4 mr-2 text-indigo-400" />
              Como Conectar a sua IA
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Siga o passo a passo para autorizar Claude Desktop, Claude Web ou ChatGPT.
            </p>
          </div>

          <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setAiClientTab('claude')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                aiClientTab === 'claude'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Claude (Anthropic)
            </button>
            <button
              type="button"
              onClick={() => setAiClientTab('chatgpt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                aiClientTab === 'chatgpt'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ChatGPT (OpenAI)
            </button>
          </div>
        </div>

        {/* 5 Core Steps Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs py-1">
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
              1
            </span>
            <p className="font-semibold text-slate-200 mt-1">Copie a URL</p>
            <p className="text-[11px] text-slate-400 leading-snug">Copie o MCP Server URL exibido acima.</p>
          </div>
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
              2
            </span>
            <p className="font-semibold text-slate-200 mt-1">Copie a Chave</p>
            <p className="text-[11px] text-slate-400 leading-snug">Copie sua chave exclusiva l4b_mcp_*.</p>
          </div>
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
              3
            </span>
            <p className="font-semibold text-slate-200 mt-1">Configure na IA</p>
            <p className="text-[11px] text-slate-400 leading-snug">Adicione no Claude Desktop ou GPT Custom Actions.</p>
          </div>
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
              4
            </span>
            <p className="font-semibold text-slate-200 mt-1">Autorize Conexão</p>
            <p className="text-[11px] text-slate-400 leading-snug">Habilite as ferramentas nas permissões abaixo.</p>
          </div>
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
              5
            </span>
            <p className="font-semibold text-slate-200 mt-1">Pronto para Uso</p>
            <p className="text-[11px] text-slate-400 leading-snug">Pergunte à sua IA sobre seus dados financeiros.</p>
          </div>
        </div>

        {/* AI Client Specific Guidance */}
        {aiClientTab === 'claude' ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                Arquivo de Configuração: <code className="text-emerald-400">claude_desktop_config.json</code>
              </label>
              <button
                type="button"
                onClick={() => handleCopy(claudeConfigSnippet, 'Configuração Claude')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
              >
                {copiedField === 'Configuração Claude' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Snippet JSON</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative bg-slate-950 rounded-xl p-3.5 border border-white/10 overflow-x-auto">
              <pre className="text-[11px] font-mono text-slate-300 leading-relaxed">
                {claudeConfigSnippet}
              </pre>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong>Localização do arquivo:</strong> No macOS:{' '}
              <code className="bg-black/40 px-1 py-0.5 rounded text-slate-300">
                ~/Library/Application Support/Claude/claude_desktop_config.json
              </code>{' '}
              | No Windows:{' '}
              <code className="bg-black/40 px-1 py-0.5 rounded text-slate-300">
                %APPDATA%\Claude\claude_desktop_config.json
              </code>
              . Reinicie o Claude Desktop após salvar.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="bg-slate-950 p-4 rounded-xl border border-white/10 space-y-2 text-xs">
              <p className="font-bold text-white">Configurando no ChatGPT (Custom GPT ou Custom MCP Connector):</p>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                <li>Acesse <strong>ChatGPT › Explorar GPTs › Criar GPT</strong>.</li>
                <li>Vá até a aba <strong>Configurar</strong> e clique em <strong>Criar nova ação</strong>.</li>
                <li>
                  No campo <strong>Authentication</strong>, selecione <strong>API Key</strong> com o tipo <strong>Bearer</strong> e cole a sua chave <code className="text-emerald-400">{activeApiKey || 'l4b_mcp_*'}</code>.
                </li>
                <li>
                  No endpoint da ação ou importação OpenAPI, aponte para: <code className="text-emerald-400">{mcpServerUrl}</code>.
                </li>
                <li>
                  O ChatGPT agora poderá acionar o protocolo MCP do Life4Billion em tempo real!
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* 4. Permissões da IA (Fine-grained Permissions: 13 Read, 5 Write) */}
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-5 md:p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Permissões da IA (24 Ferramentas Oficiais)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Controle exatamente o que o Claude e o ChatGPT podem ler ou executar na sua conta.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSavePermissions}
            disabled={savingPermissions || !hasPermissionChanges}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shrink-0 ${
              hasPermissionChanges
                ? 'bg-emerald-500 hover:bg-emerald-450 text-black shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-white/5 cursor-not-allowed'
            }`}
          >
            {savingPermissions ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{savingPermissions ? 'Salvando...' : 'Salvar Permissões'}</span>
          </button>
        </div>

        {/* Leitura (13 itens) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <Lock className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Permissões de Leitura (13 Ferramentas — Habilitadas por Padrão)
            </h4>
            <span className="text-[10px] text-emerald-400 font-mono">Consulta Segura</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {readPermissionItems.map((item) => {
              const isChecked = permissions[item.key] === true;
              return (
                <div
                  key={item.key}
                  onClick={() => handleTogglePermission(item.key)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start space-x-3 select-none ${
                    isChecked
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-white'
                      : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Handled by parent div
                    className="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 focus:ring-offset-0 bg-slate-950 border-white/20 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{item.title}</p>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{item.desc}</p>
                    <p className="text-[9.5px] font-mono text-slate-500 mt-1 truncate">
                      Tools: {item.tools}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Escrita (5 itens) */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <Unlock className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Permissões de Escrita & Execução (5 Ferramentas — Exigem Autorização)
            </h4>
            <span className="text-[10px] text-amber-400 font-mono">Ação Modificadora</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Ferramentas de escrita permitem que a IA crie ou altere dados em seu nome. Mantenha desativadas se desejar apenas consultas informativas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {writePermissionItems.map((item) => {
              const isChecked = permissions[item.key] === true;
              return (
                <div
                  key={item.key}
                  onClick={() => handleTogglePermission(item.key)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start space-x-3 select-none ${
                    isChecked
                      ? 'bg-amber-500/10 border-amber-500/40 text-white'
                      : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Handled by parent div
                    className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 focus:ring-offset-0 bg-slate-950 border-white/20 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{item.title}</p>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{item.desc}</p>
                    <p className="text-[9.5px] font-mono text-slate-500 mt-1 truncate">
                      Tool: {item.tool}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Revocation Confirmation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Revogar Conexão MCP?</h4>
                <p className="text-xs text-slate-400">Ação de segurança imediata</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ao revogar a conexão, a chave atual será <strong className="text-rose-300">invalidada imediatamente</strong>.
              O Claude e o ChatGPT perderão todo o acesso aos seus dados.
            </p>

            <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-[11px] text-slate-400 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Nenhum dos seus dados financeiros, metas ou cadastros será excluído.</span>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                disabled={revoking}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRevokeConnection}
                disabled={revoking}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {revoking ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{revoking ? 'Revogando...' : 'Confirmar Revogação'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
