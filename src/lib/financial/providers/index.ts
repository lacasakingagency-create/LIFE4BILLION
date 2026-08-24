import { FinancialProvider } from './FinancialProvider';
import { PlaidProvider } from './PlaidProvider';
import { TinkProvider } from './TinkProvider';
import { BelvoProvider } from './BelvoProvider';
import { MockFinancialProvider } from './MockFinancialProvider';
import { FinancialProviderType, ProviderSelectionResult } from '../../../types/financial';
import { getFinancialConfig } from '../config';

export function selectFinancialProvider(
  country: string = 'US', 
  providerOverride?: FinancialProviderType
): ProviderSelectionResult {
  const config = getFinancialConfig();
  const normalizedCountry = (country || 'US').toUpperCase();

  if (providerOverride) {
    if (providerOverride === 'mock') {
      return {
        provider: 'mock',
        country: normalizedCountry,
        isConfigured: true,
        isMockFallback: false,
        reason: 'Explicit mock provider override requested'
      };
    }
    if (providerOverride === 'plaid') {
      return {
        provider: config.plaid.isConfigured ? 'plaid' : 'mock',
        country: normalizedCountry,
        isConfigured: config.plaid.isConfigured,
        isMockFallback: !config.plaid.isConfigured,
        reason: config.plaid.isConfigured ? 'Plaid configured' : 'Plaid requested but missing credentials, fallback to mock'
      };
    }
    if (providerOverride === 'tink') {
      return {
        provider: config.tink.isConfigured ? 'tink' : 'mock',
        country: normalizedCountry,
        isConfigured: config.tink.isConfigured,
        isMockFallback: !config.tink.isConfigured,
        reason: config.tink.isConfigured ? 'Tink configured' : 'Tink requested but missing credentials, fallback to mock'
      };
    }
    if (providerOverride === 'belvo') {
      return {
        provider: config.belvo.isConfigured ? 'belvo' : 'mock',
        country: normalizedCountry,
        isConfigured: config.belvo.isConfigured,
        isMockFallback: !config.belvo.isConfigured,
        reason: config.belvo.isConfigured ? 'Belvo configured' : 'Belvo requested but missing credentials, fallback to mock'
      };
    }
  }

  // Force mock mode if FINANCIAL_MOCK_MODE=true
  if (config.mockMode) {
    let targetProvider: FinancialProviderType = 'mock';
    if (normalizedCountry === 'BR' || normalizedCountry === 'MX') targetProvider = 'belvo';
    else if (['SE', 'DE', 'FR', 'GB', 'ES', 'IT', 'NL', 'EU'].includes(normalizedCountry)) targetProvider = 'tink';
    else targetProvider = 'plaid';

    const providerConfigured = 
      (targetProvider === 'plaid' && config.plaid.isConfigured) ||
      (targetProvider === 'tink' && config.tink.isConfigured) ||
      (targetProvider === 'belvo' && config.belvo.isConfigured);

    if (providerConfigured) {
      return {
        provider: targetProvider,
        country: normalizedCountry,
        isConfigured: true,
        isMockFallback: false,
        reason: `Configured provider ${targetProvider} selected for country ${normalizedCountry}`
      };
    }

    return {
      provider: 'mock',
      country: normalizedCountry,
      isConfigured: true,
      isMockFallback: true,
      reason: 'Mock mode active or real credentials missing for target region'
    };
  }

  // Automatic provider routing based on country
  if (normalizedCountry === 'BR' || normalizedCountry === 'MX' || normalizedCountry === 'CO') {
    return {
      provider: config.belvo.isConfigured ? 'belvo' : 'mock',
      country: normalizedCountry,
      isConfigured: config.belvo.isConfigured,
      isMockFallback: !config.belvo.isConfigured,
      reason: config.belvo.isConfigured ? 'Belvo assigned for Latin America' : 'Belvo missing credentials, using mock'
    };
  }

  if (['SE', 'DE', 'FR', 'GB', 'ES', 'IT', 'NL', 'NO', 'FI', 'DK', 'AT', 'BE', 'EU'].includes(normalizedCountry)) {
    return {
      provider: config.tink.isConfigured ? 'tink' : 'mock',
      country: normalizedCountry,
      isConfigured: config.tink.isConfigured,
      isMockFallback: !config.tink.isConfigured,
      reason: config.tink.isConfigured ? 'Tink assigned for Europe' : 'Tink missing credentials, using mock'
    };
  }

  // Default North America / Global -> Plaid
  return {
    provider: config.plaid.isConfigured ? 'plaid' : 'mock',
    country: normalizedCountry,
    isConfigured: config.plaid.isConfigured,
    isMockFallback: !config.plaid.isConfigured,
    reason: config.plaid.isConfigured ? 'Plaid assigned for North America / Default' : 'Plaid missing credentials, using mock'
  };
}

export function getFinancialAdapter(provider: FinancialProviderType): FinancialProvider {
  switch (provider) {
    case 'plaid':
      return new PlaidProvider();
    case 'tink':
      return new TinkProvider();
    case 'belvo':
      return new BelvoProvider();
    case 'mock':
    default:
      return new MockFinancialProvider();
  }
}
