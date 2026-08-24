/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';
import { LocalDatabase } from '../utils/db';
import { FinancialCard } from '../types/schema';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: FinancialCard[];
  onTransferCompleted: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  cards,
  onTransferCompleted,
}) => {
  const { language } = useLanguageTheme();
  const isPt = language.toLowerCase().startsWith('pt');
  const isEs = language.toLowerCase().startsWith('es');
  const tr = (ptText: string, enText: string, esText: string) => {
    if (isPt) return ptText;
    if (isEs) return esText;
    return enText;
  };

  const [fromId, setFromId] = useState<string>(cards[0]?.id || '');
  const [toId, setToId] = useState<string>(cards[1]?.id || cards[0]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError(tr('Insira um valor válido para transferência.', 'Please enter a valid transfer amount.', 'Ingrese un monto válido.'));
      return;
    }

    if (!fromId || !toId) {
      setError(tr('Selecione as contas de origem e destino.', 'Please select source and destination accounts.', 'Seleccione origen y destino.'));
      return;
    }

    if (fromId === toId) {
      setError(tr('A conta de origem não pode ser a mesma de destino.', 'Source and destination accounts cannot be the same.', 'Origen y destino no pueden ser iguais.'));
      return;
    }

    const fromCard = cards.find((c) => c.id === fromId);
    const toCard = cards.find((c) => c.id === toId);

    if (!fromCard || !toCard) {
      setError(tr('Conta não encontrada.', 'Account not found.', 'Cuenta no encontrada.'));
      return;
    }

    // Process transfer balance updates
    // Source account balance decreases
    LocalDatabase.updateCard(fromId, {
      current_balance: Math.max(0, fromCard.current_balance - val),
    });

    // Destination account balance increases
    LocalDatabase.updateCard(toId, {
      current_balance: toCard.current_balance + val,
    });

    // Record transfer transaction safely (type: 'expense' or custom transfer log)
    LocalDatabase.addTransaction({
      type: 'expense',
      amount: val,
      category: 'Transfer',
      date: date,
      description: description.trim() || `Transferência de ${fromCard.name} para ${toCard.name}`,
    });

    onTransferCompleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {tr('Transferência Entre Contas', 'Account Transfer', 'Transferencia Entre Cuentas')}
              </h3>
              <p className="text-xs text-slate-400">
                {tr(
                  'Transfira saldo sem contagem dupla no fluxo financeiro.',
                  'Safely move funds without double counting.',
                  'Transfiera saldo sin doble contabilización.'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {tr('Conta / Cartão de Origem (Debita)', 'From Account / Card (Debit)', 'Cuenta / Tarjeta de Origen (Debita)')}
            </label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  {c.name} ({c.bank || 'Bank'}) — Balance: {formatCurrency(c.current_balance, language)}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {tr('Conta / Cartão de Destino (Credita)', 'To Account / Card (Credit)', 'Cuenta / Tarjeta de Destino (Credita)')}
            </label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  {c.name} ({c.bank || 'Bank'}) — Balance: {formatCurrency(c.current_balance, language)}
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {tr('Valor', 'Amount', 'Monto')}
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {tr('Data', 'Date', 'Fecha')}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {tr('Descrição / Observações', 'Description / Notes', 'Descripción / Observaciones')}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tr('ex: Reserva de emergência', 'e.g. Emergency savings', 'ej: Reserva de emergencia')}
              className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
            >
              {tr('Cancelar', 'Cancel', 'Cancelar')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>{tr('Confirmar Transferência', 'Confirm Transfer', 'Confirmar Transferencia')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
