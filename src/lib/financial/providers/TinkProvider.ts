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

export class TinkProvider implements FinancialProvider {
  providerType: FinancialProviderType = 'tink';

  private getApiBaseUrl(): string {
    return 'https://api.tink.com/api/v1';
  }

  async createConnection(params: ConnectSessionParams) {
    const config = getFinancialConfig();
    if (!config.tink.isConfigured) {
      throw new Error('Tink credentials (TINK_CLIENT_ID, TINK_CLIENT_SECRET) are not configured.');
    }

    const market = (params.country || 'SE').toUpperCase();
    const locale = params.language === 'pt' ? 'pt_PT' : 'en_US';

    // Tink Link URL for connecting accounts
    const linkUrl = `https://link.tink.com/1.0/transactions/connect-accounts?client_id=${encodeURIComponent(config.tink.clientId)}&redirect_uri=${encodeURIComponent(params.redirectUrl || 'https://life4billion.com/callback')}&market=${market}&locale=${locale}`;

    return {
      sessionId: `tink_session_${Date.now()}`,
      linkToken: `tink_token_${Date.now()}`,
      connectUrl: linkUrl,
      provider: 'tink' as FinancialProviderType
    };
  }

  async exchangeToken(params: ExchangeTokenParams) {
    const config = getFinancialConfig();
    if (!config.tink.isConfigured) {
      throw new Error('Tink credentials are not configured.');
    }

    if (!params.code) {
      throw new Error('Tink authorization code is required.');
    }

    // Exchange authorization code for user access token
    const tokenUrl = `${this.getApiBaseUrl()}/oauth/token`;
    const bodyParams = new URLSearchParams({
      code: params.code,
      client_id: config.tink.clientId,
      client_secret: config.tink.clientSecret,
      grant_type: 'authorization_code'
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: bodyParams.toString()
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Tink Token Exchange Error: ${errText}`);
    }

    const data = await res.json();
    const accessToken = data.access_token;

    return {
      connectionId: `conn_tink_${Date.now()}`,
      providerConnectionId: `tink_user_${Date.now()}`,
      institutionName: params.institutionName || 'European Open Bank (Tink)',
      country: (params.country || 'EU').toUpperCase(),
      accessToken
    };
  }

  async getAccounts(connectionId: string, accessToken: string): Promise<NormalizedAccount[]> {
    const url = `${this.getApiBaseUrl()}/accounts/list`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Tink Get Accounts Error: ${errText}`);
    }

    const data = await res.json();
    const nowIso = new Date().toISOString();

    return (data.accounts || []).map((acc: any) => ({
      id: `acc_tink_${acc.id}`,
      user_id: 'current_user',
      connection_id: connectionId,
      provider_account_id: acc.id,
      name: acc.name || 'Tink Account',
      official_name: acc.officialTitle || acc.name,
      account_type: acc.type === 'CREDIT_CARD' ? 'credit' : 'depository',
      account_subtype: acc.type?.toLowerCase() || 'checking',
      currency: acc.currencyCode || 'EUR',
      current_balance: Number(acc.balance || 0),
      available_balance: Number(acc.availableCredit || acc.balance || 0),
      mask: acc.accountNumber ? acc.accountNumber.slice(-4) : '',
      is_active: !acc.closed,
      institution_name: 'Tink Partner Bank',
      provider: 'tink',
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
    const url = `${this.getApiBaseUrl()}/search`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ limit: 100 })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Tink Get Transactions Error: ${errText}`);
    }

    const data = await res.json();
    const nowIso = new Date().toISOString();

    return (data.results || []).map((item: any) => {
      const tx = item.transaction || item;
      const rawAmount = Number(tx.amount || 0);
      const isIncome = rawAmount > 0;
      const amount = Math.abs(rawAmount);

      return {
        id: `tx_tink_${tx.id}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: `acc_tink_${tx.accountId}`,
        provider_transaction_id: tx.id,
        merchant_name: tx.merchantName || tx.description || 'Merchant',
        description: tx.description || 'Tink Transaction',
        amount,
        currency: tx.currencyCode || 'EUR',
        transaction_date: new Date(tx.date || Date.now()).toISOString().split('T')[0],
        category: isIncome ? 'Income' : 'Bills',
        subcategory: tx.categoryType || '',
        transaction_type: isIncome ? 'income' : 'expense',
        pending: Boolean(tx.pending),
        recurring: false,
        is_income_detected: isIncome,
        income_confidence: isIncome ? 0.90 : 0,
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
      provider: 'tink',
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
