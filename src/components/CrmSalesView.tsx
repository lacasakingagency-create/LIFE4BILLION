/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  TrendingUp, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Tag, 
  X, 
  PlusCircle, 
  Search,
  ShoppingCart
} from 'lucide-react';
import { LocalDatabase } from '../utils/db';
import { Product, Inventory, Customer, Sale } from '../types/schema';
import { useLanguageTheme, formatCurrency } from '../utils/i18n';

interface CrmSalesViewProps {
  onShowNotification: (title: string, message: string, type: 'success' | 'warning' | 'info') => void;
}

export default function CrmSalesView({ onShowNotification }: CrmSalesViewProps) {
  const { language, currency, t } = useLanguageTheme();
  const currencySymbol = currency === 'BRL' ? 'R$' : currency === 'EUR' ? '€' : '$';
  const [activeTab, setActiveTab] = useState<'products' | 'customers' | 'sales'>('products');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Product Form states
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodError, setProdError] = useState('');

  // Customer Form states
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custTags, setCustTags] = useState('');
  const [custError, setCustError] = useState('');

  // Sales Form states
  const [sellProdId, setSellProdId] = useState('');
  const [sellCustId, setSellCustId] = useState('');
  const [sellQty, setSellQty] = useState('1');
  const [sellError, setSellError] = useState('');

  // Receipt Modal states
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);
  const [receiptProduct, setReceiptProduct] = useState<Product | null>(null);
  const [receiptCustomer, setReceiptCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    setProducts(LocalDatabase.getProducts());
    setInventory(LocalDatabase.getInventory());
    setCustomers(LocalDatabase.getCustomers());
    setSales(LocalDatabase.getSales());
  }, []);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      setProdError(t('crmErrNameRequired', 'O nome do produto é obrigatório.'));
      return;
    }
    if (!prodSku.trim()) {
      setProdError(t('crmErrSkuRequired', 'Informe um código SKU exclusivo.'));
      return;
    }
    const priceNum = parseFloat(prodPrice);
    const costNum = parseFloat(prodCost);

    if (isNaN(priceNum) || priceNum <= 0) {
      setProdError(t('crmErrPricePositive', 'O preço de venda deve ser maior que zero.'));
      return;
    }
    if (isNaN(costNum) || costNum < 0) {
      setProdError(t('crmErrCostPositive', 'O custo operacional deve ser maior ou igual a zero.'));
      return;
    }
    setProdError('');

    const newProd = LocalDatabase.addProduct({
      name: prodName.trim(),
      sku: prodSku.trim().toUpperCase(),
      price: priceNum,
      cost: costNum,
      description: prodDesc.trim() || t('crmNoDescription', 'Sem descrição.')
    });

    setProducts(LocalDatabase.getProducts());
    setInventory(LocalDatabase.getInventory());
    setProdName('');
    setProdSku('');
    setProdPrice('');
    setProdCost('');
    setProdDesc('');
    onShowNotification(t('crmProductCataloged', 'Produto Catalogado'), `"${newProd.name}" ${t('crmProductCatalogedDesc', 'adicionado ao inventário com 100 unidades padrão.')}`, 'success');
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      setCustError(t('crmErrCustNameRequired', 'Por favor, informe o nome do cliente.'));
      return;
    }
    if (!custEmail.trim() || !custEmail.includes('@')) {
      setCustError(t('crmErrEmailInvalid', 'Informe um e-mail de contato válido.'));
      return;
    }
    setCustError('');

    const tagsArr = custTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newCust = LocalDatabase.addCustomer({
      name: custName.trim(),
      email: custEmail.trim(),
      phone: custPhone.trim() || t('crmNotRegistered', 'Não cadastrado'),
      tags: tagsArr.length > 0 ? tagsArr : [t('crmNew', 'Novo')]
    });

    setCustomers(LocalDatabase.getCustomers());
    setCustName('');
    setCustEmail('');
    setCustPhone('');
    setCustTags('');
    onShowNotification(t('crmCustomerRegistered', 'Cliente Registrado'), `"${newCust.name}" ${t('crmCustomerRegisteredDesc', 'adicionado com sucesso ao CRM.')}`, 'success');
  };

  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellProdId) {
      setSellError(t('crmErrSelectProduct', 'Selecione um produto.'));
      return;
    }
    if (!sellCustId) {
      setSellError(t('crmErrSelectCustomer', 'Selecione um cliente para vincular a venda.'));
      return;
    }
    const qtyNum = parseInt(sellQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setSellError(t('crmErrMinQuantity', 'A quantidade vendida deve ser no mínimo 1.'));
      return;
    }

    const prod = products.find(p => p.id === sellProdId);
    const inv = inventory.find(i => i.product_id === sellProdId);
    if (prod && inv && inv.quantity < qtyNum && inv.quantity < 9999) {
      setSellError(`${t('crmErrInsufficientStock', 'Quantidade insuficiente em estoque. Disponível:')} ${inv.quantity} ${t('crmUnits', 'unidades')}.`);
      return;
    }
    setSellError('');

    const newSale = LocalDatabase.addSale({
      customer_id: sellCustId,
      product_id: sellProdId,
      quantity: qtyNum,
      status: 'completed'
    });

    // Refresh states
    setSales(LocalDatabase.getSales());
    setInventory(LocalDatabase.getInventory());

    // Auto open receipt modal
    const cust = customers.find(c => c.id === sellCustId);
    setReceiptCustomer(cust || null);
    setReceiptProduct(prod || null);
    setActiveReceipt(newSale);

    setSellProdId('');
    setSellCustId('');
    setSellQty('1');
    onShowNotification(t('crmSaleRecorded', 'Venda Registrada! 🛒'), `${t('crmSaleRecordedDesc', 'Pedido gerado com sucesso. Valor total:')} ${formatCurrency(newSale.total_amount, language)}.`, 'success');
  };

  const handleDeleteProduct = (id: string, name: string) => {
    const updated = LocalDatabase.deleteProduct(id);
    setProducts(updated);
    setInventory(LocalDatabase.getInventory());
    onShowNotification(t('crmProductDeleted', 'Produto Excluído'), `"${name}" ${t('crmProductDeletedDesc', 'removido do catálogo.')}`, 'info');
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    const updated = LocalDatabase.deleteCustomer(id);
    setCustomers(updated);
    onShowNotification(t('crmCustomerRemoved', 'Cliente Removido'), `${name} ${t('crmCustomerRemovedDesc', 'removido do CRM.')}`, 'info');
  };

  return (
    <div className="space-y-6" id="crm-sales-container">
      {/* Tabs */}
      <div className="flex border-b border-slate-800" id="crm-tabs">
        <button 
          onClick={() => setActiveTab('products')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'products' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-products"
        >
          <Package className="w-4 h-4" />
          <span>{t('crmProductsTab', 'Catálogo de Produtos & Estoque')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('customers')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'customers' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-customers"
        >
          <Users className="w-4 h-4" />
          <span>{t('crmCustomersTab', 'Gestão CRM de Clientes')}</span>
        </button>

        <button 
          onClick={() => setActiveTab('sales')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'sales' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
          id="tab-btn-sales"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{t('crmPosSalesTab', 'Ponto de Vendas (PDV) & Pedidos')}</span>
        </button>
      </div>

      {/* TELA 1: PRODUCTS (Produtos e Estoque) */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="panel-products">
          
          {/* Formulário Produto */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 h-fit">
            <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center">
              <PlusCircle className="w-4 h-4 mr-1.5 text-indigo-400" />
              {t('crmAddProduct', 'Adicionar Produto ao Catálogo')}
            </h3>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('crmProductName', 'Nome do Produto / Serviço')}</label>
                <input 
                  type="text" placeholder={t('crmProductPlaceholder', 'Ex: Licença Mensal Pro')}
                  value={prodName} onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('crmSkuCode', 'Código SKU')}</label>
                  <input 
                    type="text" placeholder="OS-PRO-M"
                    value={prodSku} onChange={(e) => setProdSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('crmSalePrice', 'Preço de Venda')} ({currencySymbol})</label>
                  <input 
                    type="number" step="0.01" placeholder="299.00"
                    value={prodPrice} onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('crmOperatingCost', 'Custo de Operação / Aquisição')} ({currencySymbol})</label>
                <input 
                  type="number" step="0.01" placeholder="45.00"
                  value={prodCost} onChange={(e) => setProdCost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('crmDescription', 'Descrição')}</label>
                <textarea 
                  rows={3} placeholder={t('crmDescPlaceholder', 'Escreva especificações técnicas ou comerciais do produto...')}
                  value={prodDesc} onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-xl transition"
              >
                {t('crmRegisterProduct', 'Cadastrar Produto')}
              </button>

              {prodError && (
                <p className="text-rose-400 text-xs flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  {prodError}
                </p>
              )}
            </form>
          </div>

          {/* Listagem */}
          <div className="xl:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-6" id="products-catalog-panel">
            <h2 className="text-sm font-bold text-white tracking-tight mb-4">{t('crmProductCatalogTitle', 'Catálogo de Produtos & Controle Físico de Estoque')}</h2>
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {products.map((p) => {
                const inv = inventory.find(i => i.product_id === p.id);
                const isLowStock = inv && inv.quantity <= inv.reorder_point;
                return (
                  <div key={p.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center hover:border-slate-800 transition">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-slate-850 border border-slate-700/50 text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded-full">{p.sku}</span>
                        <h4 className="font-bold text-white text-sm">{p.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-lg">{p.description}</p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end space-x-6 mt-4 md:mt-0 pt-3 md:pt-0 border-t border-slate-850 md:border-transparent">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block uppercase font-medium">{t('crmPrice', 'Preço')}</span>
                        <span className="text-emerald-400 font-bold text-sm">{formatCurrency(p.price, language)}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 block uppercase font-medium">{t('crmStock', 'Estoque')}</span>
                        <span className={`font-bold text-sm flex items-center ${isLowStock ? 'text-amber-400' : 'text-slate-300'}`}>
                          {isLowStock && <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500 animate-pulse" />}
                          {inv?.quantity === 9999 ? t('crmInfinite', 'Infinito') : `${inv?.quantity} un`}
                        </span>
                      </div>

                      <button 
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="text-slate-600 hover:text-rose-400 p-1.5 hover:bg-slate-800/50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {products.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-12">{t('crmNoProducts', 'Nenhum produto catalogado.')}</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TELA 2: CUSTOMERS (Gestão de Clientes CRM) */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="panel-customers">
          
          {/* Adicionar Cliente CRM */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 h-fit">
            <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center">
              <PlusCircle className="w-4 h-4 mr-1.5 text-indigo-400" />
              {t('crmAddCustomer', 'Cadastrar Cliente CRM')}
            </h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('crmFullName', 'Nome Completo')}</label>
                <input 
                  type="text" placeholder="Ex: Rodrigo Fontes"
                  value={custName} onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('crmEmail', 'E-mail de Contato')}</label>
                <input 
                  type="email" placeholder="Ex: rodrigo@fontescorp.com"
                  value={custEmail} onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('crmPhone', 'Telefone / WhatsApp')}</label>
                <input 
                  type="text" placeholder="Ex: (11) 98765-4321"
                  value={custPhone} onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('crmTags', 'Tags de Segmentação (separadas por vírgula)')}</label>
                <input 
                  type="text" placeholder="Ex: VIP, Recorrente, Lead Qualificado..."
                  value={custTags} onChange={(e) => setCustTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-xl transition"
              >
                {t('crmSaveCustomer', 'Salvar Cliente CRM')}
              </button>

              {custError && (
                <p className="text-rose-400 text-xs flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  {custError}
                </p>
              )}
            </form>
          </div>

          {/* Listagem CRM */}
          <div className="xl:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-6" id="customers-list-panel">
            <h2 className="text-sm font-bold text-white tracking-tight mb-4">{t('crmCustomerPortfolio', 'Portfólio de Clientes Ativos (CRM)')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-1">
              {customers.map((c) => (
                <div key={c.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl relative hover:border-slate-800 transition">
                  <button 
                    onClick={() => handleDeleteCustomer(c.id, c.name)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 p-1"
                    title={t('crmRemoveCustomer', 'Remover cliente')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <h4 className="font-bold text-white text-sm truncate pr-6">{c.name}</h4>
                  
                  <div className="space-y-1 mt-2.5 text-xs text-slate-450">
                    <p><span className="text-slate-500 font-medium">E-mail:</span> {c.email}</p>
                    <p><span className="text-slate-500 font-medium">WhatsApp:</span> {c.phone}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {c.tags.map((t, idx) => (
                      <span key={idx} className="bg-slate-800/70 border border-slate-700/50 text-slate-300 text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center">
                        <Tag className="w-2.5 h-2.5 mr-0.5 text-slate-500" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {customers.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-12 col-span-2">{t('crmNoCustomers', 'Nenhum cliente registrado no CRM.')}</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TELA 3: SALES (Ponto de Venda e Pedidos) */}
      {activeTab === 'sales' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="panel-sales">
          
          {/* Caixa PDV / Registrar Pedido */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 h-fit">
            <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center">
              <ShoppingCart className="w-4 h-4 mr-1.5 text-emerald-400" />
              {t('crmNewOrder', 'Ponto de Vendas PDV (Novo Pedido)')}
            </h3>
            <form onSubmit={handleRecordSale} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('crmSelectClient', 'Selecionar Cliente CRM')}</label>
                <select 
                  value={sellCustId} onChange={(e) => setSellCustId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- {t('crmSelectClientOption', 'Selecione o Cliente')} --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('crmSelectProduct', 'Selecionar Produto / Serviço')}</label>
                <select 
                  value={sellProdId} onChange={(e) => setSellProdId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- {t('crmSelectProductOption', 'Selecione o Produto')} --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price, language)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">{t('crmQuantity', 'Quantidade')}</label>
                <input 
                  type="number" min="1" placeholder="1"
                  value={sellQty} onChange={(e) => setSellQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-lg shadow-emerald-950/20 animate-pulse-once"
                id="submit-sale-btn"
              >
                {t('crmGenerateSale', 'Gerar Venda & Emitir Recibo')}
              </button>

              {sellError && (
                <p className="text-rose-400 text-xs flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  {sellError}
                </p>
              )}
            </form>
          </div>

          {/* Histórico Vendas */}
          <div className="xl:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-6" id="sales-history-panel">
            <h2 className="text-sm font-bold text-white tracking-tight mb-4">{t('crmSalesHistory', 'Registro Histórico de Pedidos ERP')}</h2>
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {sales.map((s) => {
                const prod = products.find(p => p.id === s.product_id);
                const cust = customers.find(c => c.id === s.customer_id);
                return (
                  <div key={s.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex justify-between items-center hover:border-slate-800 transition">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-900/30 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase">{t('crmCompleted', 'CONCLUÍDO')}</span>
                        <span className="text-[10px] text-slate-500">ID: #{s.id.substring(0, 6).toUpperCase()}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-200 mt-1.5">{prod?.name || t('crmCustomService', 'Serviço Personalizado')}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t('crmCustomerLabel', 'Cliente:')} <span className="font-semibold">{cust?.name || t('crmFinalConsumer', 'Venda Consumidor Final')}</span></p>
                    </div>

                    <div className="text-right flex items-center space-x-5">
                      <div>
                        <span className="text-[10px] text-slate-500 block">{t('crmQuantityLabel', 'Quantidade:')} {s.quantity}</span>
                        <span className="text-white font-bold text-sm">{formatCurrency(s.total_amount, language)}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setReceiptCustomer(cust || null);
                          setReceiptProduct(prod || null);
                          setActiveReceipt(s);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-bold text-xs cursor-pointer"
                      >
                        {t('crmReceipt', 'Recibo')}
                      </button>
                    </div>
                  </div>
                );
              })}
              {sales.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-12">{t('crmNoSales', 'Nenhum pedido faturado.')}</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* INVOICE RECEIPT MODAL (Extrema fidelidade visual SaaS) */}
      {activeReceipt && receiptProduct && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in" id="receipt-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-850 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="text-indigo-400 w-5 h-5" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">{t('crmCorporateReceipt', 'Recibo de Venda Corporativa')}</span>
              </div>
              <button 
                onClick={() => {
                  setActiveReceipt(null);
                  setReceiptProduct(null);
                  setReceiptCustomer(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-xs text-slate-300">
              {/* Receipt Header info */}
              <div className="text-center pb-4 border-b border-slate-800/80">
                <span className="bg-emerald-950/50 border border-emerald-900/30 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase">{t('crmBillingCompleted', 'Faturamento Concluído')}</span>
                <h4 className="text-sm font-bold text-white mt-3">{t('crmOrderLabel', 'Pedido')} #{activeReceipt.id.substring(0,8).toUpperCase()}</h4>
                <p className="text-slate-500 mt-0.5">{t('crmBilledOn', 'Faturado em')}: {new Date(activeReceipt.date).toLocaleString(language === 'pt-BR' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US')}</p>
              </div>

              {/* CRM Client breakdown */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-1">
                <span className="text-slate-500 block uppercase font-medium text-[9px]">{t('crmClientAcquirer', 'Cliente Adquirente')}</span>
                <p className="text-slate-200 font-bold">{receiptCustomer?.name || t('crmConsumidorGeral', 'Consumidor Geral')}</p>
                <p className="text-slate-500">{receiptCustomer?.email || 'N/A'}</p>
              </div>

              {/* Product Ledger table */}
              <div className="space-y-2 pb-2 border-b border-slate-800">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>{t('crmProductSkuLabel', 'Produto / SKU')}</span>
                  <div className="flex space-x-12">
                    <span>{t('crmQtyLabel', 'Qtd')}</span>
                    <span>{t('crmSubtotalLabel', 'Subtotal')}</span>
                  </div>
                </div>

                <div className="flex justify-between text-slate-300">
                  <div className="truncate max-w-[180px]">
                    <span className="font-semibold block">{receiptProduct.name}</span>
                    <span className="text-[10px] text-slate-500">SKU: {receiptProduct.sku}</span>
                  </div>
                  <div className="flex space-x-12 text-right">
                    <span>{activeReceipt.quantity}</span>
                    <span className="font-bold text-white">{formatCurrency(activeReceipt.total_amount, language)}</span>
                  </div>
                </div>
              </div>

              {/* Tax estimation */}
              <div className="space-y-1 text-slate-550 text-[10px]">
                <div className="flex justify-between">
                  <span>{t('crmTaxEstimate', 'Impostos Incidentes (NFS-e de Serviços)')}</span>
                  <span>{t('crmTaxIncluded', 'Incluso')} (16.5% - {formatCurrency(activeReceipt.total_amount * 0.165, language)})</span>
                </div>
                <div className="flex justify-between">
                  <span>Gateway Stripe Processing Fee</span>
                  <span>{t('crmTaxIncluded', 'Incluso')} (3.99%)</span>
                </div>
              </div>

              {/* Big Total */}
              <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-sm font-bold">
                <span className="text-white">{t('crmTotalSettled', 'TOTAL LIQUIDADO')}:</span>
                <span className="text-emerald-400 text-base">{formatCurrency(activeReceipt.total_amount, language)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-950 px-5 py-4 border-t border-slate-850 flex justify-end">
              <button 
                onClick={() => {
                  setActiveReceipt(null);
                  setReceiptProduct(null);
                  setReceiptCustomer(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                {t('crmCloseBtn', 'Concluir e Fechar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
