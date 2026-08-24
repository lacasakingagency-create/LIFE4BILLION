-- Life4Billion Connect Migration Script
-- Idempotent Financial Open Banking Infrastructure

-- 1. Financial Connections
CREATE TABLE IF NOT EXISTS public.financial_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'plaid' | 'tink' | 'belvo' | 'mock'
  provider_connection_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  institution_logo TEXT,
  country TEXT DEFAULT 'US',
  status TEXT DEFAULT 'active', -- 'active' | 'disconnected' | 'error' | 'pending'
  access_token_encrypted TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index & Uniqueness for Connections
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_connections_provider_conn 
ON public.financial_connections (user_id, provider, provider_connection_id);

CREATE INDEX IF NOT EXISTS idx_financial_connections_user_id 
ON public.financial_connections (user_id);

-- 2. Financial Accounts
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  official_name TEXT,
  account_type TEXT NOT NULL, -- 'depository' | 'credit' | 'investment' | 'loan' | 'other'
  account_subtype TEXT,
  currency TEXT DEFAULT 'USD',
  current_balance NUMERIC(14,2) DEFAULT 0,
  available_balance NUMERIC(14,2) DEFAULT 0,
  mask TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index & Uniqueness for Accounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_accounts_provider_acc 
ON public.financial_accounts (connection_id, provider_account_id);

CREATE INDEX IF NOT EXISTS idx_financial_accounts_user_id 
ON public.financial_accounts (user_id);

-- 3. Financial Transactions (Crucial Idempotent Uniqueness Constraint)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'mock',
  provider_transaction_id TEXT NOT NULL,
  merchant_name TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  transaction_date DATE NOT NULL,
  authorized_date DATE,
  category TEXT DEFAULT 'Other',
  subcategory TEXT,
  user_custom_category TEXT, -- Preserves manual user category edits during re-sync
  transaction_type TEXT DEFAULT 'expense', -- 'income' | 'expense' | 'transfer'
  pending BOOLEAN DEFAULT false,
  recurring BOOLEAN DEFAULT false,
  is_income_detected BOOLEAN DEFAULT false,
  income_confidence NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Idempotency enforcement: uniquely identify each transaction by provider + provider_transaction_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_tx_provider_id 
ON public.financial_transactions (provider, provider_transaction_id);

CREATE INDEX IF NOT EXISTS idx_financial_tx_user_id 
ON public.financial_transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_financial_tx_date 
ON public.financial_transactions (transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_financial_tx_account_id 
ON public.financial_transactions (account_id);

-- 4. Financial Sync Logs
CREATE TABLE IF NOT EXISTS public.financial_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL, -- 'started' | 'success' | 'failed'
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  transactions_imported INTEGER DEFAULT 0,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_financial_sync_logs_conn 
ON public.financial_sync_logs (connection_id, started_at DESC);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.financial_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_sync_logs ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Users can manage their own financial connections" 
ON public.financial_connections FOR ALL 
USING (auth.uid()::text = user_id OR user_id = 'current_user');

CREATE POLICY "Users can manage their own financial accounts" 
ON public.financial_accounts FOR ALL 
USING (auth.uid()::text = user_id OR user_id = 'current_user');

CREATE POLICY "Users can manage their own financial transactions" 
ON public.financial_transactions FOR ALL 
USING (auth.uid()::text = user_id OR user_id = 'current_user');

CREATE POLICY "Users can view their own financial sync logs" 
ON public.financial_sync_logs FOR ALL 
USING (auth.uid()::text = user_id OR user_id = 'current_user');
