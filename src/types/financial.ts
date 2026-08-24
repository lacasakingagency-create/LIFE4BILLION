export type FinancialProviderType = 'plaid' | 'tink' | 'belvo' | 'mock';

export type AccountType = 'depository' | 'credit' | 'investment' | 'loan' | 'other';

export type ConnectionStatus = 
  | 'idle' 
  | 'validating' 
  | 'connecting' 
  | 'connected' 
  | 'syncing' 
  | 'completed' 
  | 'not_connected' 
  | 'active' 
  | 'disconnected' 
  | 'error' 
  | 'pending';

export interface FinancialConnection {
  id: string;
  user_id: string;
  provider: FinancialProviderType;
  provider_connection_id: string;
  institution_name: string;
  institution_logo?: string;
  country: string;
  status: ConnectionStatus;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface NormalizedAccount {
  id: string;
  user_id: string;
  connection_id: string;
  provider_account_id: string;
  name: string;
  official_name?: string;
  account_type: AccountType;
  account_subtype?: string;
  currency: string;
  current_balance: number;
  available_balance: number;
  mask?: string;
  is_active: boolean;
  institution_name?: string;
  provider?: FinancialProviderType;
  created_at: string;
  updated_at: string;
}

export interface NormalizedTransaction {
  id: string;
  user_id: string;
  connection_id: string;
  account_id: string;
  provider?: FinancialProviderType;
  provider_transaction_id: string;
  merchant_name?: string;
  description: string;
  amount: number;
  currency: string;
  transaction_date: string;
  authorized_date?: string;
  category: string;
  subcategory?: string;
  user_custom_category?: string; // User manual override preservation
  transaction_type: 'income' | 'expense' | 'transfer';
  pending: boolean;
  recurring: boolean;
  is_income_detected?: boolean;
  income_confidence?: number;
  created_at: string;
  updated_at: string;
}

export interface NormalizedBalance {
  account_id: string;
  current_balance: number;
  available_balance: number;
  currency: string;
  updated_at: string;
}

export interface FinancialSyncLog {
  id: string;
  user_id: string;
  connection_id: string;
  provider: FinancialProviderType;
  status: 'started' | 'success' | 'failed';
  started_at: string;
  completed_at?: string;
  transactions_imported: number;
  error_message?: string;
}

export interface ConnectSessionParams {
  userId: string;
  country?: string;
  providerOverride?: FinancialProviderType;
  redirectUrl?: string;
  language?: string;
}

export interface ExchangeTokenParams {
  userId: string;
  provider: FinancialProviderType;
  publicToken?: string;
  code?: string;
  linkSessionId?: string;
  institutionId?: string;
  institutionName?: string;
  country?: string;
}

export interface ProviderSelectionResult {
  provider: FinancialProviderType;
  country: string;
  isConfigured: boolean;
  isMockFallback: boolean;
  reason: string;
}
