import { 
  FinancialProvider 
} from './FinancialProvider';
import { 
  ConnectSessionParams, 
  ExchangeTokenParams, 
  NormalizedAccount, 
  NormalizedTransaction, 
  NormalizedBalance, 
  FinancialSyncLog, 
  FinancialProviderType 
} from '../../../types/financial';

export class MockFinancialProvider implements FinancialProvider {
  providerType: FinancialProviderType = 'mock';

  async createConnection(params: ConnectSessionParams) {
    const country = (params.country || 'US').toUpperCase();
    let bankName = 'Chase Bank';
    if (country === 'BR') bankName = 'Banco Itaú Personnalité';
    if (['SE', 'DE', 'FR', 'GB', 'ES'].includes(country)) bankName = 'BNP Paribas / N26';

    return {
      sessionId: `mock_session_${Date.now()}`,
      linkToken: `mock_link_token_${Math.random().toString(36).substring(2, 10)}`,
      connectUrl: `#mock-connect-modal?country=${country}&bank=${encodeURIComponent(bankName)}`,
      provider: 'mock' as FinancialProviderType
    };
  }

  async exchangeToken(params: ExchangeTokenParams) {
    const country = (params.country || 'US').toUpperCase();
    let institutionName = params.institutionName || 'Chase Bank';
    if (country === 'BR' && !params.institutionName) institutionName = 'Banco Itaú Personnalité';
    if (['SE', 'DE', 'FR', 'GB', 'ES'].includes(country) && !params.institutionName) institutionName = 'N26 Bank Europe';

    // Deterministic Failure Test Scenario
    const isFailureScenario = 
      institutionName.toLowerCase().includes('fail') || 
      institutionName.toLowerCase().includes('invalid') || 
      institutionName.toLowerCase().includes('inativo') || 
      institutionName.toLowerCase().includes('error') ||
      params.publicToken === 'pub_token_fail';

    if (isFailureScenario) {
      throw new Error("Financial provider verification failed: Unable to establish secure session with bank. Please check your credentials or bank selection and try again.");
    }

    const connId = `conn_mock_${Date.now()}`;
    return {
      connectionId: connId,
      providerConnectionId: `prov_conn_${Math.random().toString(36).substring(2, 9)}`,
      institutionName,
      institutionLogo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=120&auto=format&fit=crop&q=80',
      country,
      accessToken: `mock_access_token_${Date.now()}`
    };
  }

  async getAccounts(connectionId: string, _accessToken: string): Promise<NormalizedAccount[]> {
    const now = new Date().toISOString();
    return [
      {
        id: `acc_chk_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        provider_account_id: 'prov_acc_001',
        name: 'Premier Checking',
        official_name: 'Life4Billion High Yield Checking',
        account_type: 'depository',
        account_subtype: 'checking',
        currency: 'USD',
        current_balance: 5420.50,
        available_balance: 5200.00,
        mask: '4321',
        is_active: true,
        institution_name: 'Chase Premier',
        provider: 'mock',
        created_at: now,
        updated_at: now
      },
      {
        id: `acc_sav_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        provider_account_id: 'prov_acc_002',
        name: 'Emergency Reserve Savings',
        official_name: 'High Yield Savings Account 4.5% APY',
        account_type: 'depository',
        account_subtype: 'savings',
        currency: 'USD',
        current_balance: 18500.00,
        available_balance: 18500.00,
        mask: '8812',
        is_active: true,
        institution_name: 'Chase Premier',
        provider: 'mock',
        created_at: now,
        updated_at: now
      },
      {
        id: `acc_crd_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        provider_account_id: 'prov_acc_003',
        name: 'Sapphire Preferred Card',
        official_name: 'Rewards Visa Credit Card',
        account_type: 'credit',
        account_subtype: 'credit card',
        currency: 'USD',
        current_balance: 1240.80,
        available_balance: 8750.00,
        mask: '9014',
        is_active: true,
        institution_name: 'Chase Premier',
        provider: 'mock',
        created_at: now,
        updated_at: now
      }
    ];
  }

  async getTransactions(
    connectionId: string, 
    _accessToken: string, 
    _startDate?: string, 
    _endDate?: string
  ): Promise<NormalizedTransaction[]> {
    const now = new Date();
    const formatDate = (daysAgo: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    const chkId = `acc_chk_${connectionId}`;
    const crdId = `acc_crd_${connectionId}`;
    const nowIso = now.toISOString();

    return [
      {
        id: `tx_mock_001_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: chkId,
        provider_transaction_id: 'mock_txn_001',
        merchant_name: 'Tech Global Corp',
        description: 'Payroll Direct Deposit - Tech Global Corp',
        amount: 3450.00,
        currency: 'USD',
        transaction_date: formatDate(1),
        authorized_date: formatDate(1),
        category: 'Income',
        subcategory: 'Salary',
        transaction_type: 'income',
        pending: false,
        recurring: true,
        is_income_detected: true,
        income_confidence: 0.98,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: `tx_mock_002_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: crdId,
        provider_transaction_id: 'mock_txn_002',
        merchant_name: 'Whole Foods Market',
        description: 'Groceries & Organic Produce Whole Foods',
        amount: 142.65,
        currency: 'USD',
        transaction_date: formatDate(2),
        authorized_date: formatDate(2),
        category: 'Food',
        subcategory: 'Groceries',
        transaction_type: 'expense',
        pending: false,
        recurring: false,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: `tx_mock_003_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: crdId,
        provider_transaction_id: 'mock_txn_003',
        merchant_name: 'Electric & Power Co',
        description: 'Monthly Utility Bill Electric',
        amount: 115.40,
        currency: 'USD',
        transaction_date: formatDate(3),
        authorized_date: formatDate(3),
        category: 'Bills',
        subcategory: 'Utilities',
        transaction_type: 'expense',
        pending: false,
        recurring: true,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: `tx_mock_004_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: crdId,
        provider_transaction_id: 'mock_txn_004',
        merchant_name: 'Uber Rides & Eats',
        description: 'Urban Mobility Uber Transit',
        amount: 38.50,
        currency: 'USD',
        transaction_date: formatDate(4),
        category: 'Transport',
        subcategory: 'Rideshare',
        transaction_type: 'expense',
        pending: false,
        recurring: false,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: `tx_mock_005_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: crdId,
        provider_transaction_id: 'mock_txn_005',
        merchant_name: 'Netflix Digital',
        description: 'Monthly Premium Subscription',
        amount: 19.99,
        currency: 'USD',
        transaction_date: formatDate(5),
        category: 'Entertainment',
        subcategory: 'Subscriptions',
        transaction_type: 'expense',
        pending: false,
        recurring: true,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: `tx_mock_006_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: chkId,
        provider_transaction_id: 'mock_txn_006',
        merchant_name: 'Freelance Design Client',
        description: 'Consulting Fee Payment Received',
        amount: 850.00,
        currency: 'USD',
        transaction_date: formatDate(6),
        category: 'Income',
        subcategory: 'Freelance',
        transaction_type: 'income',
        pending: false,
        recurring: false,
        is_income_detected: true,
        income_confidence: 0.90,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: `tx_mock_007_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: crdId,
        provider_transaction_id: 'mock_txn_007',
        merchant_name: 'Equinox Fitness',
        description: 'Monthly Gym Membership',
        amount: 220.00,
        currency: 'USD',
        transaction_date: formatDate(7),
        category: 'Health',
        subcategory: 'Fitness',
        transaction_type: 'expense',
        pending: false,
        recurring: true,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: `tx_mock_008_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: crdId,
        provider_transaction_id: 'mock_txn_008',
        merchant_name: 'Blue Bottle Coffee',
        description: 'Espresso & Bakery',
        amount: 14.20,
        currency: 'USD',
        transaction_date: formatDate(8),
        category: 'Food',
        subcategory: 'Dining',
        transaction_type: 'expense',
        pending: false,
        recurring: false,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: `tx_mock_009_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: crdId,
        provider_transaction_id: 'mock_txn_009',
        merchant_name: 'Apple Store Digital Services',
        description: 'iCloud+ Storage Plan',
        amount: 9.99,
        currency: 'USD',
        transaction_date: formatDate(9),
        category: 'Entertainment',
        subcategory: 'Subscriptions',
        transaction_type: 'expense',
        pending: false,
        recurring: true,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: `tx_mock_010_${connectionId}`,
        user_id: 'current_user',
        connection_id: connectionId,
        account_id: crdId,
        provider_transaction_id: 'mock_txn_010',
        merchant_name: 'Amazon Prime',
        description: 'Household Supplies & Electronics',
        amount: 78.30,
        currency: 'USD',
        transaction_date: formatDate(10),
        category: 'Shopping',
        subcategory: 'General',
        transaction_type: 'expense',
        pending: false,
        recurring: false,
        created_at: nowIso,
        updated_at: nowIso
      }
    ];
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
      provider: 'mock',
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
