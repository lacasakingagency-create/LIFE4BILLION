import { 
  ConnectSessionParams, 
  ExchangeTokenParams, 
  NormalizedAccount, 
  NormalizedTransaction, 
  NormalizedBalance, 
  FinancialSyncLog, 
  FinancialProviderType 
} from '../../../types/financial';

export interface FinancialProvider {
  providerType: FinancialProviderType;

  /**
   * Initializes a connection session (e.g., Plaid link_token, Tink authorize URL, Belvo widget token).
   */
  createConnection(params: ConnectSessionParams): Promise<{
    sessionId: string;
    linkToken?: string;
    connectUrl?: string;
    redirectUrl?: string;
    provider: FinancialProviderType;
  }>;

  /**
   * Exchanges authorization code or public_token for an encrypted access_token & connection metadata.
   */
  exchangeToken(params: ExchangeTokenParams): Promise<{
    connectionId: string;
    providerConnectionId: string;
    institutionName: string;
    institutionLogo?: string;
    country: string;
    accessToken: string;
  }>;

  /**
   * Retrieves active accounts for a given connection.
   */
  getAccounts(connectionId: string, accessToken: string): Promise<NormalizedAccount[]>;

  /**
   * Retrieves transactions for a given connection within date range.
   */
  getTransactions(
    connectionId: string, 
    accessToken: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<NormalizedTransaction[]>;

  /**
   * Retrieves current balances.
   */
  getBalances(connectionId: string, accessToken: string): Promise<NormalizedBalance[]>;

  /**
   * Performs full synchronization (accounts + balances + transactions).
   */
  sync(connectionId: string, accessToken: string): Promise<{
    accounts: NormalizedAccount[];
    transactions: NormalizedTransaction[];
    syncLog: Partial<FinancialSyncLog>;
  }>;

  /**
   * Revokes/disconnects connection on provider side.
   */
  disconnect(connectionId: string, accessToken: string): Promise<{ success: boolean }>;
}
