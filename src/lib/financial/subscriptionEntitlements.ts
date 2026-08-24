export interface SubscriptionEntitlements {
  BANK_SYNC: boolean;
  maxConnections: number;
  autoSync: boolean;
  webhooksEnabled: boolean;
  aiInsightsEnabled: boolean;
  planName: string;
}

/**
 * Resolves financial bank synchronization entitlements based on user subscription plan.
 */
export function getSubscriptionEntitlements(planId: string = 'founder'): SubscriptionEntitlements {
  const normalizedPlan = (planId || 'founder').toLowerCase();

  switch (normalizedPlan) {
    case 'founder':
      return {
        BANK_SYNC: true,
        maxConnections: 10,
        autoSync: true,
        webhooksEnabled: true,
        aiInsightsEnabled: true,
        planName: 'Founder Life Time'
      };

    case 'annual':
      return {
        BANK_SYNC: true,
        maxConnections: 5,
        autoSync: true,
        webhooksEnabled: true,
        aiInsightsEnabled: true,
        planName: 'Pro Annual'
      };

    case 'monthly':
      return {
        BANK_SYNC: true, // Configurable: enabled for monthly subscribers
        maxConnections: 3,
        autoSync: true,
        webhooksEnabled: true,
        aiInsightsEnabled: true,
        planName: 'Pro Monthly'
      };

    case 'free':
    case 'trial':
    default:
      return {
        BANK_SYNC: true, // Graceful access for trial/demo testing
        maxConnections: 2,
        autoSync: false,
        webhooksEnabled: false,
        aiInsightsEnabled: true,
        planName: 'Free / Trial'
      };
  }
}
