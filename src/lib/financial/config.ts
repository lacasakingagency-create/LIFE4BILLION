import { FinancialProviderType } from '../../types/financial';

export interface FinancialConfig {
  mockMode: boolean;
  encryptionKey: string;
  plaid: {
    clientId: string;
    secret: string;
    env: 'sandbox' | 'development' | 'production';
    isConfigured: boolean;
  };
  tink: {
    clientId: string;
    clientSecret: string;
    env: 'sandbox' | 'production';
    isConfigured: boolean;
  };
  belvo: {
    clientId: string;
    clientSecret: string;
    env: 'sandbox' | 'development' | 'production';
    isConfigured: boolean;
  };
}

export function getFinancialConfig(): FinancialConfig {
  const isMockModeExplicit = process.env.FINANCIAL_MOCK_MODE === 'true';

  const plaidClientId = process.env.PLAID_CLIENT_ID || '';
  const plaidSecret = process.env.PLAID_SECRET || '';
  const plaidEnv = (process.env.PLAID_ENV as any) || 'sandbox';

  const tinkClientId = process.env.TINK_CLIENT_ID || '';
  const tinkSecret = process.env.TINK_CLIENT_SECRET || '';
  const tinkEnv = (process.env.TINK_ENV as any) || 'sandbox';

  const belvoClientId = process.env.BELVO_CLIENT_ID || '';
  const belvoSecret = process.env.BELVO_CLIENT_SECRET || '';
  const belvoEnv = (process.env.BELVO_ENV as any) || 'sandbox';

  const encryptionKey = process.env.FINANCIAL_ENCRYPTION_KEY || '';

  const plaidConfigured = Boolean(plaidClientId && plaidSecret);
  const tinkConfigured = Boolean(tinkClientId && tinkSecret);
  const belvoConfigured = Boolean(belvoClientId && belvoSecret);

  // If no providers are configured at all, force mock mode to ensure seamless experience
  const mockMode = isMockModeExplicit || (!plaidConfigured && !tinkConfigured && !belvoConfigured);

  return {
    mockMode,
    encryptionKey,
    plaid: {
      clientId: plaidClientId,
      secret: plaidSecret,
      env: plaidEnv,
      isConfigured: plaidConfigured
    },
    tink: {
      clientId: tinkClientId,
      clientSecret: tinkSecret,
      env: tinkEnv,
      isConfigured: tinkConfigured
    },
    belvo: {
      clientId: belvoClientId,
      clientSecret: belvoSecret,
      env: belvoEnv,
      isConfigured: belvoConfigured
    }
  };
}

export function isProviderConfigured(provider: FinancialProviderType): boolean {
  const cfg = getFinancialConfig();
  if (provider === 'mock') return true;
  if (provider === 'plaid') return cfg.plaid.isConfigured;
  if (provider === 'tink') return cfg.tink.isConfigured;
  if (provider === 'belvo') return cfg.belvo.isConfigured;
  return false;
}
