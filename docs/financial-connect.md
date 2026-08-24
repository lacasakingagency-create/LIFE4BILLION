# Life4Billion Connect — Idempotent Open Banking & Financial Connectivity Layer

## 1. Executive Summary

`Life4Billion Connect` is a enterprise-grade, server-side financial connectivity engine designed to aggregate bank accounts, credit cards, investments, and transaction feeds securely and idempotently across international jurisdictions.

The architecture abstracts regional Open Banking providers behind a unified provider interface (`FinancialProvider`), supporting:
- **Plaid** (United States, Canada, United Kingdom)
- **Tink** (Europe Open Banking)
- **Belvo** (Brazil & Latin America Open Finance)
- **MockFinancialProvider** (Zero-dependency testing & demonstration engine)

---

## 2. Idempotency & Duplicate Protection Architecture

Every synchronized transaction across all financial institutions is uniquely identified by the composite tuple:

$$\text{Key} = (\text{provider}, \text{provider\_transaction\_id})$$

### Idempotent Sync Algorithm:
1. **Fetch**: The server pulls raw transactions from the active provider adapter.
2. **Lookup**: The database checks for an existing record matching `(provider, provider_transaction_id)`.
3. **If Found (Existing Transaction)**:
   - Preserves user custom category overrides (`user_custom_category`).
   - Updates mutable fields (e.g. `merchant_name`, `amount`, `pending` status, `description`).
   - Updates `updated_at` timestamp without modifying the internal primary key `id`.
4. **If Not Found (New Transaction)**:
   - Inserts new normalized transaction record into `financial_transactions`.
5. **Database Enforced Constraint**:
   ```sql
   CREATE UNIQUE INDEX idx_financial_tx_provider_id 
   ON public.financial_transactions (provider, provider_transaction_id);
   ```

Whether synchronization is triggered 1 time or 100 times, **0 duplicate transactions** are created.

---

## 3. Database Schema & Migration (Supabase)

Migration SQL file: `/supabase/migrations/20260812_financial_connect.sql`

```sql
-- 1. Connections
CREATE TABLE public.financial_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_connection_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  institution_logo TEXT,
  country TEXT DEFAULT 'US',
  status TEXT DEFAULT 'active',
  access_token_encrypted TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Accounts
CREATE TABLE public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  official_name TEXT,
  account_type TEXT NOT NULL,
  account_subtype TEXT,
  currency TEXT DEFAULT 'USD',
  current_balance NUMERIC(14,2) DEFAULT 0,
  available_balance NUMERIC(14,2) DEFAULT 0,
  mask TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Transactions
CREATE TABLE public.financial_transactions (
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
  user_custom_category TEXT,
  transaction_type TEXT DEFAULT 'expense',
  pending BOOLEAN DEFAULT false,
  recurring BOOLEAN DEFAULT false,
  is_income_detected BOOLEAN DEFAULT false,
  income_confidence NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_financial_tx_provider_id 
ON public.financial_transactions (provider, provider_transaction_id);
```

---

## 4. API Reference (Server-Side)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/finance/providers` | Returns active provider config & entitlements |
| `POST` | `/api/finance/connect` | Initializes link/auth session for country/provider |
| `POST` | `/api/finance/exchange-token` | Exchanges authorization token, saves encrypted connection & syncs |
| `GET` | `/api/finance/connections` | Returns active user financial connections |
| `GET` | `/api/finance/accounts` | Returns active normalized accounts & credit cards |
| `GET` | `/api/finance/transactions` | Returns normalized transaction history |
| `POST` | `/api/finance/sync` | Manually triggers idempotent re-synchronization |
| `POST` | `/api/finance/disconnect` | Revokes connection at provider & marks inactive |
| `POST` | `/api/finance/category-override` | Persists user manual category override across re-syncs |

---

## 5. Testing `FINANCIAL_MOCK_MODE`

To test financial synchronization without live bank credentials:
1. Ensure `.env` includes: `FINANCIAL_MOCK_MODE=true`
2. Open the app in preview and click **Conectar Banco ou Cartão** in the **Card Management** or **Net Worth** views.
3. Select any bank (e.g. Chase 🇺🇸, N26 🇪🇺, or Itaú 🇧🇷).
4. Click Connect. The system will connect and import mock accounts & deterministic transactions (`mock_txn_001` through `mock_txn_010`).
5. In the modal, click **Sync Now**.
6. Observe the summary: `+0 new, 10 updated, 0 duplicates`.
7. Repeat **Sync Now** 10 times. Notice the transaction list remains strictly 10 items without any duplicate records.
