import React, { useState, useEffect } from 'react';
import {
  Server,
  Key,
  Copy,
  Check,
  Zap,
  Terminal,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Bot,
  Play,
  CheckCircle2,
  AlertCircle,
  X,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  ChevronRight,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { McpIntegrationSettings } from './McpIntegrationSettings';

interface McpServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
  onShowNotification?: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const McpServerModal: React.FC<McpServerModalProps> = ({
  isOpen,
  onClose,
  language = 'pt-BR',
  onShowNotification
}) => {
  const { user, session } = useAuth();
  const [activeTab, setActiveTab] = useState<'integrations' | 'quickstart' | 'claude' | 'chatgpt' | 'tools' | 'keys'>('integrations');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mcpInfo, setMcpInfo] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState<boolean>(false);

  // Key management state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [generatingKey, setGeneratingKey] = useState<boolean>(false);
  const [activeApiKey, setActiveApiKey] = useState<string>('');

  // Tool tester state
  const [selectedTool, setSelectedTool] = useState<string>('get_financial_summary');
  const [toolParams, setToolParams] = useState<string>('{}');
  const [testingTool, setTestingTool] = useState<boolean>(false);
  const [toolResult, setToolResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://life4billion.app';
  const mcpPostUrl = `${origin}/api/mcp`;
  const mcpSseUrl = `${origin}/api/mcp/sse`;

  useEffect(() => {
    if (isOpen) {
      fetchMcpInfo();
      fetchApiKeys();
    }
  }, [isOpen]);

  const fetchMcpInfo = async () => {
    setLoadingInfo(true);
    try {
      const res = await fetch('/api/mcp/info');
      if (res.ok) {
        const data = await res.json();
        setMcpInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch MCP info', err);
    } finally {
      setLoadingInfo(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const userId = user?.id || 'demo-user';
      const res = await fetch(`/api/mcp/keys?userId=${encodeURIComponent(userId)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.keys && data.keys.length > 0) {
          setApiKeys(data.keys);
          if (!activeApiKey) {
            setActiveApiKey(data.keys[0].key);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch API keys', err);
    }
  };

  const handleGenerateKey = async () => {
    setGeneratingKey(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const userId = user?.id || 'demo-user';
      const res = await fetch('/api/mcp/keys/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, label: 'Claude/ChatGPT MCP Key' })
      });
      const data = await res.json();
      if (data.success && data.apiKey) {
        setActiveApiKey(data.apiKey);
        setApiKeys(prev => [
          { key: data.apiKey, label: 'Claude/ChatGPT MCP Key', created_at: new Date().toISOString() },
          ...prev
        ]);
        if (onShowNotification) {
          onShowNotification(
            'MCP Key Generated',
            language.startsWith('pt') ? 'Chave MCP criada com sucesso!' : 'MCP API Key created successfully!',
            'success'
          );
        }
      }
    } catch (err) {
      console.error('Failed to generate key', err);
    } finally {
      setGeneratingKey(false);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
    if (onShowNotification) {
      onShowNotification('Copiado!', text.substring(0, 35) + '...', 'info');
    }
  };

  const handleTestTool = async () => {
    setTestingTool(true);
    setTestError(null);
    setToolResult(null);

    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(toolParams || '{}');
    } catch (err: any) {
      setTestError(`JSON de argumentos inválido: ${err.message}`);
      setTestingTool(false);
      return;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeApiKey) {
        headers['Authorization'] = `Bearer ${activeApiKey}`;
      } else if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `test-${Date.now()}`,
          method: 'tools/call',
          params: {
            name: selectedTool,
            arguments: parsedArgs
          }
        })
      });

      const data = await res.json();
      if (data.error) {
        setTestError(`RPC Error (${data.error.code}): ${data.error.message}`);
      } else {
        setToolResult(data.result);
      }
    } catch (err: any) {
      setTestError(err.message || 'Falha ao executar ferramenta MCP');
    } finally {
      setTestingTool(false);
    }
  };

  const claudeDesktopJson = JSON.stringify(
    {
      mcpServers: {
        life4billion: {
          url: mcpSseUrl,
          transport: 'sse',
          headers: {
            Authorization: `Bearer ${activeApiKey || 'YOUR_L4B_MCP_KEY'}`
          }
        }
      }
    },
    null,
    2
  );

  const isPt = language.startsWith('pt');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-emerald-500/30 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-slate-950 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Life4Billion Remote MCP Server</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                  Online
                </span>
                <span className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                  Protocol 2024-11-05
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isPt
                  ? 'Conecte o Claude (Desktop/Web Connector) e o ChatGPT (Custom MCP App) diretamente aos dados do Life4Billion.'
                  : 'Connect Claude (Desktop/Web Connector) and ChatGPT (Custom MCP App) directly to Life4Billion data.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-slate-950/60 px-6 shrink-0 space-x-2 overflow-x-auto">
          {[
            { id: 'integrations', label: isPt ? 'Integrações (MCP)' : 'Integrations (MCP)', icon: Server },
            { id: 'quickstart', label: isPt ? 'Início Rápido' : 'Quickstart', icon: Zap },
            { id: 'claude', label: 'Claude Connector', icon: Bot },
            { id: 'chatgpt', label: 'ChatGPT MCP App', icon: Sparkles },
            { id: 'tools', label: isPt ? 'Ferramentas (24)' : 'Tools (24)', icon: Terminal },
            { id: 'keys', label: isPt ? 'Chaves de Acesso' : 'API Keys', icon: Key }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 text-xs font-semibold flex items-center space-x-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* TAB 0: OFFICIAL INTEGRATIONS (MCP) */}
          {activeTab === 'integrations' && (
            <McpIntegrationSettings
              language={language}
              onShowNotification={onShowNotification}
              onClose={onClose}
            />
          )}

          {/* TAB 1: QUICKSTART */}
          {activeTab === 'quickstart' && (
            <div className="space-y-5">
              {/* Endpoint Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                      Streamable HTTP (JSON-RPC 2.0)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                      POST
                    </span>
                  </div>
                  <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-2 font-mono text-[11px] text-slate-200 justify-between">
                    <span className="truncate mr-2">{mcpPostUrl}</span>
                    <button
                      onClick={() => copyToClipboard(mcpPostUrl, 'post_url')}
                      className="p-1 text-slate-400 hover:text-emerald-300"
                      title="Copiar URL"
                    >
                      {copiedField === 'post_url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isPt
                      ? 'Compatível com conectores HTTP/REST, ChatGPT Custom MCP e clientes MCP modernos.'
                      : 'Compatible with HTTP/REST connectors, ChatGPT Custom MCP, and modern MCP clients.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center">
                      <Zap className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
                      Server-Sent Events (SSE Transport)
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">
                      GET / SSE
                    </span>
                  </div>
                  <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-2 font-mono text-[11px] text-slate-200 justify-between">
                    <span className="truncate mr-2">{mcpSseUrl}</span>
                    <button
                      onClick={() => copyToClipboard(mcpSseUrl, 'sse_url')}
                      className="p-1 text-slate-400 hover:text-indigo-300"
                      title="Copiar URL SSE"
                    >
                      {copiedField === 'sse_url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isPt
                      ? 'Utilizado nativamente pelo Claude Desktop e clientes que exigem streaming bidirecional por SSE.'
                      : 'Natively used by Claude Desktop and clients requiring bidirectional SSE streaming.'}
                  </p>
                </div>
              </div>

              {/* Active API Key Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">
                      {isPt ? 'Sua Chave de Acesso Pessoal (MCP Token)' : 'Your Personal MCP Token'}
                    </span>
                  </div>
                  <button
                    onClick={handleGenerateKey}
                    disabled={generatingKey}
                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-[11px] font-semibold flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${generatingKey ? 'animate-spin' : ''}`} />
                    <span>{generatingKey ? (isPt ? 'Gerando...' : 'Generating...') : (isPt ? 'Gerar Nova Chave' : 'Generate Key')}</span>
                  </button>
                </div>

                <div className="flex items-center bg-black/50 border border-white/10 rounded-lg p-2.5 font-mono text-xs text-emerald-300 justify-between">
                  <span className="truncate mr-3">
                    {activeApiKey || (isPt ? 'Nenhuma chave gerada ainda. Clique em "Gerar Nova Chave".' : 'No key generated yet. Click "Generate Key".')}
                  </span>
                  {activeApiKey && (
                    <button
                      onClick={() => copyToClipboard(activeApiKey, 'api_key')}
                      className="p-1 text-slate-400 hover:text-emerald-400 shrink-0"
                      title="Copiar Chave"
                    >
                      {copiedField === 'api_key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {isPt
                    ? 'Esta chave concede ao Claude e ao ChatGPT acesso seguro aos seus dados do Life4Billion (finanças, metas, rotinas, tarefas). Ela pode ser revogada a qualquer momento na aba de Chaves.'
                    : 'This key grants Claude and ChatGPT secure access to your Life4Billion data (finances, goals, routines, tasks). It can be revoked at any time in the Keys tab.'}
                </p>
              </div>

              {/* Supported Clients Quick Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('claude')}
                  className="p-3.5 rounded-xl border border-white/10 bg-slate-950/40 hover:bg-slate-900/60 hover:border-emerald-500/30 transition text-left flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs group-hover:text-emerald-300">Claude Custom Connector</p>
                      <p className="text-[10px] text-slate-400">Claude Desktop, Claude Web & Custom Connectors</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                </button>

                <button
                  onClick={() => setActiveTab('chatgpt')}
                  className="p-3.5 rounded-xl border border-white/10 bg-slate-950/40 hover:bg-slate-900/60 hover:border-emerald-500/30 transition text-left flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs group-hover:text-emerald-300">ChatGPT Custom MCP App</p>
                      <p className="text-[10px] text-slate-400">OpenAI Custom Actions & GPTs com MCP</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CLAUDE CONNECTOR */}
          {activeTab === 'claude' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-orange-950/10 border border-orange-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-orange-400 font-bold text-xs">
                  <Bot className="w-4 h-4" />
                  <span>Configuração para Claude Desktop & Claude Web</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isPt
                    ? 'O Claude suporta o Model Context Protocol tanto via arquivo de configuração no Claude Desktop quanto como Custom Connector no Claude.ai.'
                    : 'Claude supports the Model Context Protocol both via configuration file in Claude Desktop and as a Custom Connector on Claude.ai.'}
                </p>
              </div>

              {/* Option A: Claude Desktop Config */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-xs">
                    1. Claude Desktop (<code className="text-emerald-400 font-mono">claude_desktop_config.json</code>)
                  </span>
                  <button
                    onClick={() => copyToClipboard(claudeDesktopJson, 'claude_json')}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-slate-200 rounded text-[11px] font-semibold flex items-center space-x-1"
                  >
                    {copiedField === 'claude_json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isPt ? 'Copiar JSON' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto">
                  {claudeDesktopJson}
                </pre>
                <p className="text-[10px] text-slate-400">
                  {isPt
                    ? 'Salve este arquivo em: macOS: ~/Library/Application Support/Claude/claude_desktop_config.json | Windows: %APPDATA%/Claude/claude_desktop_config.json'
                    : 'Save this file to: macOS: ~/Library/Application Support/Claude/claude_desktop_config.json | Windows: %APPDATA%/Claude/claude_desktop_config.json'}
                </p>
              </div>

              {/* Option B: Claude Web Custom Connector */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <span className="font-bold text-slate-300 text-xs">
                  2. Claude.ai Web Custom Connector (SSE Endpoint)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 bg-slate-950/60 border border-white/10 rounded-xl space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">URL do Conector</span>
                    <p className="font-mono text-emerald-300 truncate">{mcpSseUrl}</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-white/10 rounded-xl space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Tipo de Autenticação</span>
                    <p className="font-mono text-indigo-300 truncate">Bearer Token (Header Authorization)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHATGPT MCP APP */}
          {activeTab === 'chatgpt' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-teal-950/10 border border-teal-500/20 space-y-2">
                <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Configuração para ChatGPT Custom MCP App & Custom Actions</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isPt
                    ? 'No ChatGPT Plus/Team/Enterprise, crie um Custom GPT ou conecte o Life4Billion via MCP App usando a URL abaixo e o protocolo JSON-RPC.'
                    : 'In ChatGPT Plus/Team/Enterprise, create a Custom GPT or connect Life4Billion via MCP App using the URL below and JSON-RPC protocol.'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-950/60 border border-white/10 rounded-xl space-y-3">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Endpoint Base do ChatGPT</span>
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-2 font-mono text-xs text-teal-300 justify-between mt-1">
                      <span className="truncate mr-2">{mcpPostUrl}</span>
                      <button
                        onClick={() => copyToClipboard(mcpPostUrl, 'chatgpt_url')}
                        className="p-1 text-slate-400 hover:text-teal-300"
                      >
                        {copiedField === 'chatgpt_url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Metadata Manifest (.well-known)</span>
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-2 font-mono text-xs text-slate-300 justify-between mt-1">
                      <span className="truncate mr-2">{`${origin}/.well-known/mcp`}</span>
                      <button
                        onClick={() => copyToClipboard(`${origin}/.well-known/mcp`, 'manifest_url')}
                        className="p-1 text-slate-400 hover:text-teal-300"
                      >
                        {copiedField === 'manifest_url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-2">
                  <span className="text-slate-300 font-bold text-xs">
                    {isPt ? 'Instruções para o Custom GPT' : 'Instructions for Custom GPT'}
                  </span>
                  <div className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
                    <p>1. No editor de Custom GPTs da OpenAI, vá na aba <strong>Configure</strong>.</p>
                    <p>2. Em <strong>Actions / MCP</strong>, informe a URL base <code>{mcpPostUrl}</code>.</p>
                    <p>3. Em <strong>Authentication</strong>, selecione <strong>API Key</strong> com tipo <strong>Bearer</strong> e cole seu token do Life4Billion.</p>
                    <p>4. Todas as 23 ferramentas serão importadas automaticamente para o seu ChatGPT!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TOOLS (23 TOOLS & TESTER) */}
          {activeTab === 'tools' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
                <div>
                  <span className="font-bold text-white text-xs">
                    {isPt ? 'Catálogo de Ferramentas MCP (23 disponíveis)' : 'MCP Tools Catalog (23 available)'}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    18 Read tools + 5 Write tools (Finanças, Hábitos, Metas, Saúde, Tarefas e ERP)
                  </p>
                </div>
                <button
                  onClick={fetchMcpInfo}
                  disabled={loadingInfo}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-slate-300 rounded text-[11px] flex items-center space-x-1 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingInfo ? 'animate-spin' : ''}`} />
                  <span>{isPt ? 'Recarregar' : 'Reload'}</span>
                </button>
              </div>

              {/* Tool Tester Interface */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <Play className="w-3.5 h-3.5" />
                    <span>{isPt ? 'Testar Ferramenta MCP em Tempo Real' : 'Test MCP Tool in Real-Time'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      {isPt ? 'Selecione a Ferramenta:' : 'Select Tool:'}
                    </label>
                    <select
                      value={selectedTool}
                      onChange={(e) => setSelectedTool(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {(mcpInfo?.tools || [
                        { name: 'get_financial_summary', description: 'Resumo financeiro consolidado' },
                        { name: 'get_income', description: 'Lista de receitas' },
                        { name: 'get_expenses', description: 'Lista de despesas' },
                        { name: 'get_monthly_expenses', description: 'Histórico de despesas mensais' },
                        { name: 'get_budget', description: 'Orçamentos e limites' },
                        { name: 'get_upcoming_bills', description: 'Contas a pagar nos próximos dias' },
                        { name: 'get_net_worth', description: 'Patrimônio líquido' },
                        { name: 'get_savings_rate', description: 'Taxa de poupança' },
                        { name: 'get_daily_tasks', description: 'Tarefas do dia' },
                        { name: 'get_habits', description: 'Hábitos e streaks' },
                        { name: 'get_health_metrics', description: 'Métricas de saúde e bem-estar' },
                        { name: 'get_goals', description: 'Metas de vida e progresso' },
                        { name: 'get_company_metrics', description: 'Métricas empresariais / ERP' },
                        { name: 'add_expense', description: 'Registrar nova despesa (Write)' },
                        { name: 'add_income', description: 'Registrar nova receita (Write)' },
                        { name: 'create_task', description: 'Criar nova tarefa (Write)' },
                        { name: 'update_task_status', description: 'Atualizar status de tarefa (Write)' },
                        { name: 'log_habit', description: 'Marcar hábito diário (Write)' }
                      ]).map((t: any) => (
                        <option key={t.name} value={t.name}>
                          {t.name} - {t.description?.substring(0, 45)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      {isPt ? 'Argumentos JSON (params):' : 'JSON Arguments (params):'}
                    </label>
                    <input
                      type="text"
                      value={toolParams}
                      onChange={(e) => setToolParams(e.target.value)}
                      placeholder='{"period": "2026-09"}'
                      className="w-full bg-black/60 border border-white/15 rounded-lg p-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleTestTool}
                    disabled={testingTool}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-450 disabled:opacity-50 text-black font-bold text-xs rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{testingTool ? (isPt ? 'Executando...' : 'Running...') : (isPt ? 'Executar Teste' : 'Run Test')}</span>
                  </button>
                </div>

                {testError && (
                  <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg text-rose-300 text-[11px] flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <span className="font-mono">{testError}</span>
                  </div>
                )}

                {toolResult && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      {isPt ? 'Resultado da Ferramenta MCP (Content / JSON):' : 'MCP Tool Result (Content / JSON):'}
                    </span>
                    <pre className="p-3 bg-black/80 border border-white/10 rounded-xl font-mono text-[11px] text-emerald-300 max-h-56 overflow-y-auto">
                      {typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Tools List Cards */}
              <div className="space-y-2">
                {(mcpInfo?.tools || []).map((tool: any) => (
                  <div
                    key={tool.name}
                    className="p-3 rounded-xl bg-slate-950/40 border border-white/5 hover:border-white/15 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-200 text-xs">{tool.name}</span>
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded border ${
                            tool.type === 'write'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}
                        >
                          {tool.type || 'read'}
                        </span>
                        <span className="text-[9px] text-slate-400 bg-white/5 px-1.5 rounded">
                          {tool.category || 'general'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{tool.description}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTool(tool.name);
                        setToolParams('{}');
                        setToolResult(null);
                        setTestError(null);
                      }}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded text-[10px] font-semibold shrink-0 self-start sm:self-auto"
                    >
                      {isPt ? 'Carregar no Tester' : 'Load into Tester'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs">
                    {isPt ? 'Chaves de Acesso MCP' : 'MCP API Keys'}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {isPt
                      ? 'Tokens para autenticação Bearer com Claude, ChatGPT ou scripts externos.'
                      : 'Tokens for Bearer authentication with Claude, ChatGPT, or external scripts.'}
                  </p>
                </div>
                <button
                  onClick={handleGenerateKey}
                  disabled={generatingKey}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-450 text-black font-bold text-xs rounded-lg flex items-center space-x-1.5 transition"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{generatingKey ? (isPt ? 'Gerando...' : 'Generating...') : (isPt ? 'Criar Nova Chave' : 'Create Key')}</span>
                </button>
              </div>

              <div className="space-y-2">
                {apiKeys.map((keyObj, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between"
                  >
                    <div className="space-y-1 truncate mr-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-emerald-300 font-semibold text-xs">
                          {keyObj.key?.substring(0, 16)}••••••••••••••••
                        </span>
                        <span className="text-[9px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                          {keyObj.label || 'Claude/ChatGPT Key'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {isPt ? 'Criada em: ' : 'Created at: '}
                        {keyObj.created_at ? new Date(keyObj.created_at).toLocaleString() : 'Recent'}
                      </p>
                    </div>

                    <button
                      onClick={() => copyToClipboard(keyObj.key, `key_${idx}`)}
                      className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition"
                      title="Copiar Chave Completa"
                    >
                      {copiedField === `key_${idx}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}

                {apiKeys.length === 0 && (
                  <div className="text-center py-10 text-slate-500 space-y-2">
                    <Key className="w-8 h-8 mx-auto text-slate-700" />
                    <p className="text-xs font-semibold">
                      {isPt ? 'Nenhuma chave MCP gerada ainda' : 'No MCP keys generated yet'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isPt
                        ? 'Clique no botão acima para criar sua primeira chave de integração.'
                        : 'Click the button above to generate your first integration key.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex justify-between items-center shrink-0 text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isPt
                ? 'Conexão segura via HTTPS com isolamento total por usuário.'
                : 'Secure HTTPS connection with complete user-level isolation.'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-lg transition"
          >
            {isPt ? 'Fechar' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default McpServerModal;
