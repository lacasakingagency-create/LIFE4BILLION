import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  CreditCard, 
  Wallet, 
  Building2, 
  QrCode, 
  Receipt, 
  Trash2, 
  CheckCircle2, 
  Layers, 
  Sliders,
  DollarSign,
  AlertCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';
import { getThemeColorById } from '../utils/theme';

export interface CostChannel {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'pix' | 'invoice' | 'cash' | 'digital';
  limitMonthly: number;
  spentCurrent: number;
  active: boolean;
  notes?: string;
}

interface CostChannelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  categoryExpenses?: number;
}

export const CostChannelsModal: React.FC<CostChannelsModalProps> = ({
  isOpen,
  onClose,
  category,
  categoryExpenses = 0
}) => {
  const { t, language, theme, themeColor, currency } = useLanguageTheme();
  const isLight = theme === 'light';
  const activeThemeOption = getThemeColorById(themeColor);
  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'EUR' ? '€' : '$';

  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (pt: string, en: string, es: string) => isPt ? pt : isEs ? es : en;

  const storageKey = `omnisaas_channels_${category.toLowerCase()}`;

  // Default initial channels for any category
  const getDefaultChannels = (): CostChannel[] => [
    {
      id: 'ch-1',
      name: tr('Cartão Corporativo Principal', 'Primary Corporate Card', 'Tarjeta Corporativa Principal'),
      type: 'card',
      limitMonthly: 5000,
      spentCurrent: categoryExpenses * 0.45,
      active: true,
      notes: tr('Despesas operacionais e assinaturas recorrentes', 'Operational expenses & recurring subs', 'Gastos operativos y suscripciones')
    },
    {
      id: 'ch-2',
      name: tr('PIX / Transferência Instantânea', 'Instant Bank Transfer / PIX', 'Transferencia Bancaria Inmediata'),
      type: 'pix',
      limitMonthly: 3500,
      spentCurrent: categoryExpenses * 0.30,
      active: true,
      notes: tr('Pagamentos a prestadores e fornecedores', 'Payments to suppliers & vendors', 'Pagos a proveedores y servicios')
    },
    {
      id: 'ch-3',
      name: tr('Boleto Bancário / DDA', 'Bank Invoices / DDA', 'Facturas Bancarias / Recibos'),
      type: 'invoice',
      limitMonthly: 2500,
      spentCurrent: categoryExpenses * 0.25,
      active: true,
      notes: tr('Contratos mensais e concessionárias', 'Monthly contracts & utilities', 'Contratos mensuales y suministros')
    },
    {
      id: 'ch-4',
      name: tr('Fundo Fixo / Caixa Pequeno', 'Petty Cash / Physical Funds', 'Caja Chica / Fondos Físicos'),
      type: 'cash',
      limitMonthly: 800,
      spentCurrent: 0,
      active: false,
      notes: tr('Despesas emergenciais locais', 'Local emergency expenses', 'Gastos de emergencia locales')
    }
  ];

  const [channels, setChannels] = useState<CostChannel[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return getDefaultChannels();
  });

  // New channel form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CostChannel['type']>('card');
  const [newLimit, setNewLimit] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Persist whenever channels change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(channels));
    } catch {
      // ignore
    }
  }, [channels, storageKey]);

  if (!isOpen) return null;

  const totalAllocatedLimit = channels.reduce((sum, ch) => sum + (ch.active ? ch.limitMonthly : 0), 0);
  const totalChannelsSpent = channels.reduce((sum, ch) => sum + (ch.active ? ch.spentCurrent : 0), 0);

  const getChannelIcon = (type: CostChannel['type']) => {
    switch (type) {
      case 'card':
        return <CreditCard className="w-4 h-4 text-blue-400" />;
      case 'bank':
        return <Building2 className="w-4 h-4 text-indigo-400" />;
      case 'pix':
        return <QrCode className="w-4 h-4 text-emerald-400" />;
      case 'invoice':
        return <Receipt className="w-4 h-4 text-amber-400" />;
      case 'cash':
        return <Wallet className="w-4 h-4 text-rose-400" />;
      case 'digital':
      default:
        return <Layers className="w-4 h-4 text-purple-400" />;
    }
  };

  const getChannelTypeName = (type: CostChannel['type']) => {
    switch (type) {
      case 'card': return tr('Cartão', 'Card', 'Tarjeta');
      case 'bank': return tr('Conta Bancária', 'Bank Account', 'Cuenta Bancaria');
      case 'pix': return tr('PIX / Instantâneo', 'Instant / PIX', 'Transferencia Inmediata');
      case 'invoice': return tr('Boleto / Fatura', 'Invoice / DDA', 'Factura / Recibo');
      case 'cash': return tr('Caixa / Dinheiro', 'Cash', 'Efectivo');
      case 'digital': return tr('Carteira Digital', 'Digital Wallet', 'Billetera Digital');
    }
  };

  const handleToggleChannel = (id: string) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, active: !ch.active } : ch));
  };

  const handleDeleteChannel = (id: string) => {
    setChannels(prev => prev.filter(ch => ch.id !== id));
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const parsedLimit = parseFloat(newLimit) || 0;
    const newChan: CostChannel = {
      id: `ch-${Date.now()}`,
      name: newName.trim(),
      type: newType,
      limitMonthly: parsedLimit,
      spentCurrent: 0,
      active: true,
      notes: newNotes.trim()
    };

    setChannels(prev => [...prev, newChan]);
    setNewName('');
    setNewLimit('');
    setNewNotes('');
    setShowAddForm(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className={`border rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-xl transition ${
            isLight 
              ? 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200' 
              : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5" style={{ color: activeThemeOption.hex }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: activeThemeOption.hex }}>
              {tr('Canais de Custos & Pagamentos', 'Cost & Payment Channels', 'Canales de Costes y Pagos')}
            </span>
          </div>
          <h2 className={`text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {t('manageCostCategories', tr('Canais de Acesso & Meios de Despesa', 'Cost Categories & Access Channels', 'Canales de Acceso y Medios de Gasto'))}
          </h2>
          <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {tr(
              `Gerencie as contas, cartões e canais de pagamento autorizados para a categoria "${category}".`,
              `Manage authorized accounts, cards, and payment channels for category "${category}".`,
              `Gestione las cuentas, tarjetas y canales de pago autorizados para la categoría "${category}".`
            )}
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'}`}>
            <span className={`text-[10px] font-bold uppercase font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {tr('Canais Ativos', 'Active Channels', 'Canales Activos')}
            </span>
            <p className={`text-base font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {channels.filter(c => c.active).length} / {channels.length}
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'}`}>
            <span className={`text-[10px] font-bold uppercase font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {tr('Limite Total dos Canais', 'Total Channel Budget', 'Límite Total de Canales')}
            </span>
            <p className="text-base font-bold mt-1 font-mono" style={{ color: activeThemeOption.hex }}>
              {formatCurrency(totalAllocatedLimit, language)}
            </p>
          </div>

          <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800'}`}>
            <span className={`text-[10px] font-bold uppercase font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {tr('Volume Alocado', 'Total Allocated Volume', 'Volumen Asignado')}
            </span>
            <p className={`text-base font-bold mt-1 font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {formatCurrency(totalChannelsSpent, language)}
            </p>
          </div>
        </div>

        {/* Add Channel Button / Form */}
        {!showAddForm ? (
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {tr('Lista de Canais Vinculados', 'Linked Channels List', 'Lista de Canales Vinculados')}
            </span>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition flex items-center space-x-1.5 shadow-sm"
              style={{ backgroundColor: activeThemeOption.hex }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{tr('Novo Canal', 'Add Channel', 'Nuevo Canal')}</span>
            </button>
          </div>
        ) : (
          <form 
            onSubmit={handleAddChannel}
            className={`p-4 rounded-2xl border space-y-4 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {tr('Cadastrar Novo Canal de Custo', 'Register New Cost Channel', 'Registrar Nuevo Canal de Coste')}
              </h4>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  {tr('Nome do Canal', 'Channel Name', 'Nombre del Canal')}
                </label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ex: Cartão Nubank PJ, Débito Safra" 
                  className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500' 
                      : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  {tr('Tipo de Meio / Canal', 'Channel Type', 'Tipo de Canal')}
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as CostChannel['type'])}
                  className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500' 
                      : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                  }`}
                >
                  <option value="card">{tr('Cartão Corporativo / Crédito', 'Corporate / Credit Card', 'Tarjeta Corporativa')}</option>
                  <option value="pix">{tr('PIX / Transferência Instantânea', 'Instant Transfer / PIX', 'Transferencia Inmediata')}</option>
                  <option value="bank">{tr('Conta Bancária / Débito', 'Bank Account / Debit', 'Cuenta Bancaria')}</option>
                  <option value="invoice">{tr('Boleto / Fatura DDA', 'Invoice / DDA', 'Factura Bancaria')}</option>
                  <option value="cash">{tr('Fundo Fixo / Dinheiro', 'Cash / Petty Cash', 'Efectivo / Caja')}</option>
                  <option value="digital">{tr('Carteira Digital / Gateway', 'Digital Wallet', 'Billetera Digital')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  {tr('Limite Mensal Autorizado', 'Monthly Spending Limit', 'Límite Mensual Autorizado')} ({currencySymbol})
                </label>
                <input 
                  type="number" 
                  step="any"
                  value={newLimit}
                  onChange={e => setNewLimit(e.target.value)}
                  placeholder="0.00" 
                  className={`w-full text-xs px-3 py-2 rounded-xl border outline-none font-mono ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500' 
                      : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  {tr('Observações / Finalidade', 'Notes / Purpose', 'Observaciones / Finalidad')}
                </label>
                <input 
                  type="text" 
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Ex: Utilizado para compras diretas" 
                  className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500' 
                      : 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {t('cancel', tr('Cancelar', 'Cancel', 'Cancelar'))}
              </button>
              <button 
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white transition shadow-sm"
                style={{ backgroundColor: activeThemeOption.hex }}
              >
                {tr('Salvar Canal', 'Save Channel', 'Guardar Canal')}
              </button>
            </div>
          </form>
        )}

        {/* Channels List */}
        <div className="space-y-3">
          {channels.length === 0 ? (
            <div className={`p-6 text-center rounded-2xl border text-xs ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/40 border-slate-800 text-slate-400'
            }`}>
              {tr('Nenhum canal de acesso cadastrado para esta categoria.', 'No access channels configured for this category.', 'No hay canales de acceso configurados para esta categoría.')}
            </div>
          ) : (
            channels.map(channel => {
              const usagePercent = channel.limitMonthly > 0 ? (channel.spentCurrent / channel.limitMonthly) * 100 : 0;

              return (
                <div 
                  key={channel.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    channel.active 
                      ? (isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700') 
                      : (isLight ? 'bg-slate-100/60 border-slate-200 opacity-60' : 'bg-slate-950/20 border-slate-900 opacity-50')
                  }`}
                >
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${
                      isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}>
                      {getChannelIcon(channel.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {channel.name}
                        </h4>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                          isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {getChannelTypeName(channel.type)}
                        </span>
                      </div>

                      {channel.notes && (
                        <p className={`text-[11px] mt-0.5 truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {channel.notes}
                        </p>
                      )}

                      {/* Progress mini bar if limit exists */}
                      {channel.limitMonthly > 0 && channel.active && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                              {tr('Gasto:', 'Spent:', 'Gastado:')} {formatCurrency(channel.spentCurrent, language)}
                            </span>
                            <span className={isLight ? 'text-slate-600 font-bold' : 'text-slate-300 font-bold'}>
                              {tr('Limite:', 'Limit:', 'Límite:')} {formatCurrency(channel.limitMonthly, language)}
                            </span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-900'}`}>
                            <div 
                              className="h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(usagePercent, 100)}%`,
                                backgroundColor: usagePercent > 90 ? '#ef4444' : activeThemeOption.hex
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleToggleChannel(channel.id)}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                        channel.active 
                          ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20')
                          : (isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400')
                      }`}
                      title={channel.active ? tr('Desativar Canal', 'Deactivate Channel', 'Desactivar Canal') : tr('Ativar Canal', 'Activate Channel', 'Activar Canal')}
                    >
                      {channel.active ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">{tr('Ativo', 'Active', 'Activo')}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="text-[10px]">{tr('Inativo', 'Inactive', 'Inactivo')}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteChannel(channel.id)}
                      className={`p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition ${
                        isLight ? 'hover:bg-rose-50' : 'hover:bg-rose-500/10'
                      }`}
                      title={tr('Excluir Canal', 'Delete Channel', 'Eliminar Canal')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-between items-center pt-3 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {tr('Canais sincronizados com o plano de custos da categoria.', 'Channels synchronized with category cost plan.', 'Canales sincronizados con el plan de costes.')}
          </span>
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm"
            style={{ backgroundColor: activeThemeOption.hex }}
          >
            {tr('Concluir', 'Done', 'Hecho')}
          </button>
        </div>

      </div>
    </div>
  );
};
