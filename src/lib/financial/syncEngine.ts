import { 
  FinancialConnection, 
  NormalizedAccount, 
  NormalizedTransaction, 
  FinancialSyncLog, 
  FinancialProviderType,
  ConnectionStatus 
} from '../../types/financial';
import { getFinancialAdapter, selectFinancialProvider } from './providers';
import { decryptToken, encryptToken } from './encryption';
import { createClient } from '@supabase/supabase-js';

// Helper to initialize Supabase client dynamically if credentials exist
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch (err) {
    return null;
  }
}

// Persist financial records to Supabase (scoped strictly by user)
async function persistToSupabase(table: string, keyName: string, payload: any) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { error } = await client.from(table).upsert(payload, { onConflict: 'id' });
    if (error) {
      await client.from('life4billion_store').upsert({
        user_id: payload.user_id || null,
        key: keyName,
        value: payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,key' });
    }
  } catch (e) {
    console.warn(`[Supabase Financial Persist Warning]:`, e);
  }
}

// User-Isolated In-Memory store fallback when Supabase client is offline or running in mock mode
const memoryConnections = new Map<string, FinancialConnection & { accessTokenEncrypted?: string }>();
const memoryAccounts = new Map<string, NormalizedAccount>();
const memoryTransactions = new Map<string, NormalizedTransaction>(); // Keyed strictly by `${userId}:${provider}:${provider_transaction_id}`
const memorySyncLogs: FinancialSyncLog[] = [];

/**
 * Idempotently saves or updates a financial connection for a specific authenticated user.
 */
export async function saveConnection(
  userId: string,
  connData: {
    provider: FinancialProviderType;
    providerConnectionId: string;
    institutionName: string;
    institutionLogo?: string;
    country?: string;
    status?: ConnectionStatus;
    accessToken: string;
  }
): Promise<FinancialConnection> {
  const now = new Date().toISOString();
  const connId = `conn_${userId}_${connData.provider}_${connData.providerConnectionId}`;
  const encryptedToken = encryptToken(connData.accessToken);

  const connRecord: FinancialConnection & { accessTokenEncrypted?: string } = {
    id: connId,
    user_id: userId,
    provider: connData.provider,
    provider_connection_id: connData.providerConnectionId,
    institution_name: connData.institutionName,
    institution_logo: connData.institutionLogo || '',
    country: connData.country || 'US',
    status: connData.status || 'connected',
    last_synced_at: now,
    created_at: now,
    updated_at: now,
    accessTokenEncrypted: encryptedToken
  };

  memoryConnections.set(connId, connRecord);
  await persistToSupabase('financial_connections', `conn_${connId}`, connRecord);
  return connRecord;
}

/**
 * Saves a failed connection attempt (status = 'not_connected').
 */
export async function saveFailedConnection(
  userId: string,
  connData: {
    provider: FinancialProviderType;
    institutionName: string;
    country?: string;
    errorMessage?: string;
  }
): Promise<FinancialConnection> {
  const now = new Date().toISOString();
  const connId = `conn_${userId}_${connData.provider}_fail_${Date.now()}`;

  const connRecord: FinancialConnection = {
    id: connId,
    user_id: userId,
    provider: connData.provider,
    provider_connection_id: `fail_${Date.now()}`,
    institution_name: connData.institutionName,
    institution_logo: '',
    country: connData.country || 'US',
    status: 'not_connected',
    last_synced_at: now,
    created_at: now,
    updated_at: now
  };

  memoryConnections.set(connId, connRecord);
  await persistToSupabase('financial_connections', `conn_${connId}`, connRecord);
  return connRecord;
}

/**
 * Returns all active financial connections for a specific user.
 * ZERO data is returned from other accounts.
 */
export async function getUserConnections(userId: string): Promise<FinancialConnection[]> {
  if (!userId) return [];
  const result: FinancialConnection[] = [];
  for (const conn of memoryConnections.values()) {
    if (conn.user_id === userId) {
      result.push(conn);
    }
  }
  return result;
}

/**
 * Disconnects an existing connection safely.
 */
export async function disconnectUserConnection(userId: string, connectionId: string): Promise<boolean> {
  const conn = memoryConnections.get(connectionId);
  if (!conn || conn.user_id !== userId) return false;

  // Revoke token via provider adapter
  try {
    const token = conn.accessTokenEncrypted ? decryptToken(conn.accessTokenEncrypted) : 'mock_token';
    const adapter = getFinancialAdapter(conn.provider);
    await adapter.disconnect(connectionId, token);
  } catch (err) {
    console.warn('[Disconnect warning]:', err);
  }

  // Mark connection inactive & update memory
  conn.status = 'disconnected';
  conn.updated_at = new Date().toISOString();
  memoryConnections.set(connectionId, conn);

  // Inactivate accounts for this connection
  for (const [accId, acc] of memoryAccounts.entries()) {
    if (acc.connection_id === connectionId && acc.user_id === userId) {
      acc.is_active = false;
      memoryAccounts.set(accId, acc);
    }
  }

  return true;
}

/**
 * IDEMPOTENT TRANSACTION UPSERT ENGINE
 * Prevents duplicates by keying on `${userId}:${provider}:${provider_transaction_id}`.
 * Preserves user custom category overrides and strictly isolates data per user.
 */
export async function upsertTransactions(
  userId: string,
  transactions: NormalizedTransaction[]
): Promise<{ inserted: number; updated: number; total: number }> {
  let inserted = 0;
  let updated = 0;
  const nowIso = new Date().toISOString();

  for (const tx of transactions) {
    const key = `${userId}:${tx.provider || 'mock'}:${tx.provider_transaction_id}`;
    const existing = memoryTransactions.get(key);

    if (existing) {
      // PRESERVE MANUAL CATEGORY CORRECTION BY USER
      const effectiveCategory = existing.user_custom_category || tx.category || existing.category;

      const updatedTx: NormalizedTransaction = {
        ...existing,
        merchant_name: tx.merchant_name || existing.merchant_name,
        description: tx.description || existing.description,
        amount: tx.amount,
        currency: tx.currency || existing.currency,
        transaction_date: tx.transaction_date,
        authorized_date: tx.authorized_date || existing.authorized_date,
        category: effectiveCategory,
        subcategory: tx.subcategory || existing.subcategory,
        user_custom_category: existing.user_custom_category,
        pending: tx.pending,
        recurring: tx.recurring,
        is_income_detected: tx.is_income_detected ?? existing.is_income_detected,
        income_confidence: tx.income_confidence ?? existing.income_confidence,
        updated_at: nowIso
      };

      memoryTransactions.set(key, updatedTx);
      updated++;
    } else {
      const newTx: NormalizedTransaction = {
        ...tx,
        user_id: userId,
        created_at: tx.created_at || nowIso,
        updated_at: nowIso
      };

      memoryTransactions.set(key, newTx);
      inserted++;
    }
  }

  const userTxs = await getUserTransactions(userId);
  return { inserted, updated, total: userTxs.length };
}

/**
 * Upserts financial accounts idempotently for a user.
 */
export async function upsertAccounts(
  userId: string,
  accounts: NormalizedAccount[]
): Promise<NormalizedAccount[]> {
  const nowIso = new Date().toISOString();
  const result: NormalizedAccount[] = [];

  for (const acc of accounts) {
    const accKey = `${userId}:${acc.id}`;
    const accRecord: NormalizedAccount = {
      ...acc,
      id: acc.id,
      user_id: userId,
      updated_at: nowIso
    };
    memoryAccounts.set(accKey, accRecord);
    result.push(accRecord);
  }

  return result;
}

/**
 * Performs full end-to-end synchronization for a connection.
 */
export async function syncConnection(
  userId: string,
  connectionId: string
): Promise<{
  connection: FinancialConnection;
  accounts: NormalizedAccount[];
  transactions: NormalizedTransaction[];
  syncSummary: { inserted: number; updated: number; total: number };
  syncLog: FinancialSyncLog;
}> {
  const conn = memoryConnections.get(connectionId);
  if (!conn || conn.user_id !== userId) {
    throw new Error(`Financial connection ${connectionId} not found or not owned by user.`);
  }

  const startTime = new Date().toISOString();
  const token = conn.accessTokenEncrypted ? decryptToken(conn.accessTokenEncrypted) : 'mock_token';
  const adapter = getFinancialAdapter(conn.provider);

  try {
    const { accounts, transactions } = await adapter.sync(connectionId, token);

    // Idempotent upserts
    await upsertAccounts(userId, accounts);
    const syncSummary = await upsertTransactions(userId, transactions);

    conn.last_synced_at = new Date().toISOString();
    conn.status = 'active';
    memoryConnections.set(connectionId, conn);

    const syncLog: FinancialSyncLog = {
      id: `log_${Date.now()}`,
      user_id: userId,
      connection_id: connectionId,
      provider: conn.provider,
      status: 'success',
      started_at: startTime,
      completed_at: new Date().toISOString(),
      transactions_imported: syncSummary.inserted + syncSummary.updated
    };

    memorySyncLogs.push(syncLog);

    // Return synced user transactions strictly isolated
    const userTxList = await getUserTransactions(userId);
    const userAccounts = await getUserAccounts(userId);

    return {
      connection: conn,
      accounts: userAccounts,
      transactions: userTxList,
      syncSummary,
      syncLog
    };
  } catch (err: any) {
    conn.status = 'error';
    memoryConnections.set(connectionId, conn);

    const failLog: FinancialSyncLog = {
      id: `log_${Date.now()}`,
      user_id: userId,
      connection_id: connectionId,
      provider: conn.provider,
      status: 'failed',
      started_at: startTime,
      completed_at: new Date().toISOString(),
      transactions_imported: 0,
      error_message: err.message || 'Synchronization failed'
    };
    memorySyncLogs.push(failLog);

    throw err;
  }
}

/**
 * Retrieves all accounts for a specific user.
 */
export async function getUserAccounts(userId: string): Promise<NormalizedAccount[]> {
  if (!userId) return [];
  const result: NormalizedAccount[] = [];
  for (const acc of memoryAccounts.values()) {
    if (acc.user_id === userId) {
      result.push(acc);
    }
  }
  return result;
}

/**
 * Retrieves all normalized transactions for a specific user.
 */
export async function getUserTransactions(userId: string): Promise<NormalizedTransaction[]> {
  if (!userId) return [];
  const result: NormalizedTransaction[] = [];
  for (const tx of memoryTransactions.values()) {
    if (tx.user_id === userId) {
      result.push(tx);
    }
  }
  // Sort descending by date
  return result.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
}

/**
 * Allows user to manually override transaction category and preserve it.
 */
export async function updateUserTransactionCategory(
  userId: string,
  transactionId: string,
  newCategory: string
): Promise<NormalizedTransaction | null> {
  if (!userId) return null;
  for (const [key, tx] of memoryTransactions.entries()) {
    if (tx.user_id === userId && (tx.id === transactionId || tx.provider_transaction_id === transactionId)) {
      tx.user_custom_category = newCategory;
      tx.category = newCategory;
      tx.updated_at = new Date().toISOString();
      memoryTransactions.set(key, tx);
      return tx;
    }
  }
  return null;
}
