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

export class PlaidProvider implements FinancialProvider {
  providerType: FinancialProviderType = 'plaid';

  private getApiBaseUrl(): string {
    const config = getFinancialConfig();
    const env = config.plaid.env;
    if (env === 'production') return 'https://production.plaid.com';
    if (env === 'development') return 'https://development.plaid.com';
    return 'https://sandbox.plaid.com';
  }

  private getAuthHeaders() {
    const config = getFinancialConfig();
    return {
      'Content-Type': 'application/json',
      'PLAID-CLIENT-ID': config.plaid.clientId,
      'PLAID-SECRET': config.plaid.secret
    };
  }

  async createConnection(params: ConnectSessionParams) {
    const config = getFinancialConfig();
    if (!config.plaid.isConfigured) {
      throw new Error('Plaid credentials (PLAID_CLIENT_ID, PLAID_SECRET) are not configured.');
    }

    const url = `${this.getApiBaseUrl()}/link/token/create`;
    const payload = {
      client_name: 'Life4Billion',
      products: ['auth', 'transactions'],
      country_codes: [(params.country || 'US').toUpperCase()],
      language: params.language === 'pt' ? 'pt' : 'en',
      user: {
        client_user_id: params.userId || 'user_l4b'
      },
      redirect_uri: params.redirectUrl
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Plaid Link Token Error: ${errText}`);
    }

    const data = await res.json();
    return {
      sessionId: data.link_token,
      linkToken: data.link_token,
      connectUrl: `#plaid-link-modal?token=${data.link_token}`,
      provider: 'plaid' as FinancialProviderType
    };
  }

  async exchangeToken(params: ExchangeTokenParams) {
    const config = getFinancialConfig();
    if (!config.plaid.isConfigured) {
      throw new Error('Plaid credentials are not configured.');
    }

    if (!params.publicToken) {
      throw new Error('Plaid public_token is required for token exchange.');
    }

    const url = `${this.getApiBaseUrl()}/item/public_token/exchange`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ public_token: params.publicToken })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Plaid Token Exchange Error: ${errText}`);
    }

    const data = await res.json();
    const accessToken = data.access_token;
    const itemId = data.item_id;

    // Fetch Item details to obtain institution details
    let institutionName = params.institutionName || 'Plaid Connected Bank';
    let institutionLogo = '';
    try {
      const itemRes = await fetch(`${this.getApiBaseUrl()}/item/get`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ access_token: accessToken })
      });
      if (itemRes.ok) {
        const itemData = await itemRes.json();
        const instId = itemData.item?.institution_id;
        if (instId) {
          const instRes = await fetch(`${this.getApiBaseUrl()}/institutions/get_by_id`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
              institution_id: instId,
              country_codes: [(params.country || 'US').toUpperCase()],
              options: { include_optional_metadata: true }
            })
          });
          if (instRes.ok) {
            const instData = await instRes.json();
            institutionName = instData.institution?.name || institutionName;
            institutionLogo = instData.institution?.logo || '';
          }
        }
      }
    } catch (e) {
      console.warn('[Plaid] Could not fetch institution metadata:', e);
    }

    return {
      connectionId: `conn_plaid_${itemId}`,
      providerConnectionId: itemId,
      institutionName,
      institutionLogo,
      country: (params.country || 'US').toUpperCase(),
      accessToken
    };
  }

  async getAccounts(connectionId: string, accessToken: string): Promise<NormalizedAccount[]> {
    const url = `${this.getApiBaseUrl()}/accounts/get`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ access_token: accessToken })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Plaid Get Accounts Error: ${errText}`);
    }

    const data = await res.json();
    const nowIso = new Date().toISOString();

    return (data.accounts || []).map((acc: any) => {
      let accType: any = 'depository';
      if (acc.type === 'credit') accType = 'credit';
      else if (acc.type === 'investment') accType = 'investment';
      else if (acc.type === 'loan') accType = 'loan';

      return {
        id: `acc_plaid_${acc.account_id}`,
        user_id: 'current_user',
        connection_id: connectionId,
        provider_account_id: acc.account_id,
        name: acc.name || 'Plaid Account',
        official_name: acc.official_name || acc.name,
        account_type: accType,
        account_subtype: acc.subtype || '',
        currency: acc.balances?.iso_currency_code || 'USD',
        current_balance: Number(acc.balances?.current || 0),
        available_balance: Number(acc.balances?.available || acc.balances?.current || 0),
        mask: acc.mask || '',
        is_active: true,
        institution_name: 'Plaid Bank',
        provider: 'plaid',
        created_at: nowIso,
        updated_at: nowIso
      };
    });
  }

  async getTransactions(
    connectionId: string, 
    accessToken: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<NormalizedTransaction[]> {
    const now = new Date();
    const sDate = startDate || new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const eDate = endDate || now.toISOString().split('T')[0];

    const url = `${this.getApiBaseUrl()}/transactions/get`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        access_token: accessToken,
        start_date: sDate,
        end_date: eDate,
        options: { count: 100 }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Plaid Get Transactions Error: ${errText}`);
    }

    const data = await res.json();
    const nowIso = new Date().toISOString();

    return (data.transactions || []).map((tx: any) => {
      // In Plaid, positive amounts represent debits (expenses) and negative represent credits (income).
      const rawAmount = Number(tx.amount || 0);
      const isIncome = rawAmount < 0;
      const amount = Math.abs(rawAmount);

      const categoryArr = tx.category || [];
      const mainCat = categoryArr[0] || 'General';
      const subCat = categoryArr[1] || '';

      let mappedCat = 'Other';
      if (isIncome || mainCat.toLowerCase().includes('income') || mainCat.toLowerCase().includes('payroll')) mappedCat = 'Income';
      else if (mainCat.toLowerCase().includes('food') || mainCat.toLowerCase().includes('restaurant')) mappedCat = 'Food';
      else if (mainCat.toLowerCase().includes('travel') || mainCat.toLowerCase().includes('taxi')) mappedCat = 'Transport';
      else if (mainCat.toLowerCase().includes('utility') || mainCat.toLowerCase().includes('service')) mappedCat = 'Bills';

      return {
        id: `tx_plaid_${tx.transaction_id}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: `acc_plaid_${tx.account_id}`,
        provider_transaction_id: tx.transaction_id,
        merchant_name: tx.merchant_name || tx.name || 'Merchant',
        description: tx.name || 'Plaid Transaction',
        amount,
        currency: tx.iso_currency_code || 'USD',
        transaction_date: tx.date,
        authorized_date: tx.authorized_date || tx.date,
        category: mappedCat,
        subcategory: subCat,
        transaction_type: isIncome ? 'income' : 'expense',
        pending: Boolean(tx.pending),
        recurring: false,
        is_income_detected: isIncome,
        income_confidence: isIncome ? 0.95 : 0,
        created_at: nowIso,
        updated_at: nowIso
      };
    });
  }

  async getBalances(connectionId: string, accessToken: string): Promise<NormalizedBalance[]> {
    const accounts = await this.getAccounts(connectionId, accessToken);
    const nowIso = new Date().toISOString();
    return accounts.map(a => ({
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
      provider: 'plaid',
      status: 'success',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      transactions_imported: transactions.length
    };

    return { accounts, transactions, syncLog };
  }

  async disconnect(connectionId: string, accessToken: string) {
    const url = `${this.getApiBaseUrl()}/item/remove`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ access_token: accessToken })
    });
    return { success: res.ok };
  }
}
