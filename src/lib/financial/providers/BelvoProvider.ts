import { FinancialProvider } from './FinancialProvider';
import { 
  ConnectSessionParams, 
  ExchangeTokenParams, 
  NormalizedAccount, 
  NormalizedTransaction, 
  NormalizedBalance, 
  FinancialSyncLog, 
  FinancialProviderType 
} from '../../../types/financial';
import { getFinancialConfig } from '../config';

export class BelvoProvider implements FinancialProvider {
  providerType: FinancialProviderType = 'belvo';

  private getApiBaseUrl(): string {
    const config = getFinancialConfig();
    if (config.belvo.env === 'production') return 'https://api.belvo.com';
    if (config.belvo.env === 'development') return 'https://development.belvo.com';
    return 'https://sandbox.belvo.com';
  }

  private getAuthHeader(): string {
    const config = getFinancialConfig();
    const credentials = `${config.belvo.clientId}:${config.belvo.clientSecret}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  async createConnection(params: ConnectSessionParams) {
    const config = getFinancialConfig();
    if (!config.belvo.isConfigured) {
      throw new Error('Belvo credentials (BELVO_CLIENT_ID, BELVO_CLIENT_SECRET) are not configured.');
    }

    const url = `${this.getApiBaseUrl()}/api/token/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader()
      },
      body: JSON.stringify({
        id: config.belvo.clientId,
        password: config.belvo.clientSecret,
        scopes: 'read_institutions,write_links,read_links'
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Belvo Access Token Error: ${errText}`);
    }

    const data = await res.json();
    const widgetToken = data.access;

    return {
      sessionId: `belvo_session_${Date.now()}`,
      linkToken: widgetToken,
      connectUrl: `#belvo-widget-modal?token=${widgetToken}&country=${params.country || 'BR'}`,
      provider: 'belvo' as FinancialProviderType
    };
  }

  async exchangeToken(params: ExchangeTokenParams) {
    const config = getFinancialConfig();
    if (!config.belvo.isConfigured) {
      throw new Error('Belvo credentials are not configured.');
    }

    const linkId = params.linkSessionId || params.publicToken || `belvo_link_${Date.now()}`;

    return {
      connectionId: `conn_belvo_${linkId}`,
      providerConnectionId: linkId,
      institutionName: params.institutionName || 'Banco Itaú / Open Finance BR',
      institutionLogo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=120&auto=format&fit=crop&q=80',
      country: (params.country || 'BR').toUpperCase(),
      accessToken: linkId
    };
  }

  async getAccounts(connectionId: string, accessToken: string): Promise<NormalizedAccount[]> {
    const url = `${this.getApiBaseUrl()}/api/accounts/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader()
      },
      body: JSON.stringify({
        link: accessToken,
        save_data: true
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Belvo Get Accounts Error: ${errText}`);
    }

    const data = await res.json();
    const nowIso = new Date().toISOString();

    return (Array.isArray(data) ? data : [data]).map((acc: any) => ({
      id: `acc_belvo_${acc.id}`,
      user_id: 'current_user',
      connection_id: connectionId,
      provider_account_id: acc.id,
      name: acc.name || 'Conta Corrente Open Finance',
      official_name: acc.official_name || acc.name,
      account_type: acc.category === 'CREDIT_CARD' ? 'credit' : 'depository',
      account_subtype: acc.type?.toLowerCase() || 'checking',
      currency: acc.currency || 'BRL',
      current_balance: Number(acc.balance?.current || 0),
      available_balance: Number(acc.balance?.available || acc.balance?.current || 0),
      mask: acc.number ? acc.number.slice(-4) : '0000',
      is_active: true,
      institution_name: acc.institution?.name || 'Open Finance Brasil',
      provider: 'belvo',
      created_at: nowIso,
      updated_at: nowIso
    }));
  }

  async getTransactions(
    connectionId: string, 
    accessToken: string, 
    _startDate?: string, 
    _endDate?: string
  ): Promise<NormalizedTransaction[]> {
    const url = `${this.getApiBaseUrl()}/api/transactions/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader()
      },
      body: JSON.stringify({
        link: accessToken,
        save_data: true
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Belvo Get Transactions Error: ${errText}`);
    }

    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    const nowIso = new Date().toISOString();

    return list.map((tx: any) => {
      const isIncome = tx.type === 'INFLOW' || Number(tx.amount || 0) < 0;
      const amount = Math.abs(Number(tx.amount || 0));

      return {
        id: `tx_belvo_${tx.id}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: `acc_belvo_${tx.account?.id || 'default'}`,
        provider_transaction_id: tx.id,
        merchant_name: tx.merchant?.name || tx.description || 'Lançamento',
        description: tx.description || 'Transação Belvo',
        amount,
        currency: tx.currency || 'BRL',
        transaction_date: tx.value_date || tx.accounting_date || new Date().toISOString().split('T')[0],
        category: isIncome ? 'Income' : 'Food',
        subcategory: tx.category || '',
        transaction_type: isIncome ? 'income' : 'expense',
        pending: tx.status === 'PENDING',
        recurring: false,
        is_income_detected: isIncome,
        income_confidence: isIncome ? 0.95 : 0,
        created_at: nowIso,
        updated_at: nowIso
      };
    });
  }

  async getBalances(connectionId: string, accessToken: string): Promise<NormalizedBalance[]> {
    const accs = await this.getAccounts(connectionId, accessToken);
    const nowIso = new Date().toISOString();
    return accs.map(a => ({
      account_id: a.id,
      current_balance: a.current_balance,
      available_balance: a.available_balance,
      currency: a.currency,
      updated_at: nowIso
    }));
  }

  async sync(connectionId: string, accessToken: string) {
    const accounts = await this.getAccounts(connectionId, accessToken);
    const transactions = await this.getTransactions(connectionId, accessToken);

    const syncLog: Partial<FinancialSyncLog> = {
      connection_id: connectionId,
      provider: 'belvo',
      status: 'success',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      transactions_imported: transactions.length
    };

    return { accounts, transactions, syncLog };
  }

  async disconnect(_connectionId: string, _accessToken: string) {
    return { success: true };
  }
}
