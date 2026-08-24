export interface PlanPricing {
  id: 'monthly' | 'annual' | 'founder';
  name: string;
  badge?: string;
  popular?: boolean;
  priceDisplay: string;
  subText: string;
  billingDetail: string;
  amount: number;
  currency: string;
  currencySymbol: string;
  features: string[];
  refundGuarantee: string;
}

export function getCurrencyForLanguage(lang: string): { code: 'USD' | 'EUR' | 'BRL'; symbol: string } {
  if (lang.startsWith('pt')) {
    return { code: 'BRL', symbol: 'R$' };
  }
  if (lang.startsWith('es')) {
    return { code: 'EUR', symbol: '€' };
  }
  return { code: 'USD', symbol: '$' };
}

export function getPricingPlans(lang: string, founderSpotsRemaining: number = 23): PlanPricing[] {
  const isPt = lang.startsWith('pt');
  const isEs = lang.startsWith('es');

  if (isPt) {
    const plans: PlanPricing[] = [
      {
        id: 'monthly',
        name: 'Plano Mensal',
        badge: 'Sem compromisso',
        priceDisplay: 'R$ 97,90',
        subText: '/ mês',
        billingDetail: 'Cobrado mensalmente. Cancele quando quiser sem taxas.',
        amount: 97.90,
        currency: 'BRL',
        currencySymbol: 'R$',
        refundGuarantee: 'Garantia de 7 dias — Reembolso de 100%',
        features: [
          'Acesso completo ao ERP Life4Billion',
          'Gestão de Finanças, Hábitos & Metas',
          'Copiloto com Inteligência Artificial',
          'Cancelamento simples a qualquer momento',
          'Cobrança imediata no checkout'
        ]
      },
      {
        id: 'annual',
        name: 'Plano Anual',
        badge: 'MAIS POPULAR — 50% DE DESCONTO',
        popular: true,
        priceDisplay: 'R$ 49,90',
        subText: '/ mês',
        billingDetail: 'Faturado 1x por ano (R$ 598,80 / ano). Melhor custo-benefício.',
        amount: 598.80,
        currency: 'BRL',
        currencySymbol: 'R$',
        refundGuarantee: 'Garantia de 7 dias — Reembolso de 100%',
        features: [
          'Tudo do Plano Mensal incluído',
          'Equivalente a R$ 49,90/mês (Economia de 50%)',
          'Suporte prioritário VIP',
          'Relatórios financeiros avançados',
          'Sem surpresas: cobrado 1x ao ano'
        ]
      }
    ];

    if (founderSpotsRemaining > 0) {
      plans.push({
        id: 'founder',
        name: 'Plano Fundador',
        badge: `OFERTA DE LANÇAMENTO — ${founderSpotsRemaining} de 30 vagas restantes`,
        priceDisplay: 'R$ 497,00',
        subText: 'pagamento único',
        billingDetail: 'Acesso VITALÍCIO sem mensalidades para sempre. Vagas limitadas!',
        amount: 497.00,
        currency: 'BRL',
        currencySymbol: 'R$',
        refundGuarantee: '7 dias de garantia. Não gostou? Devolvemos 100% do valor, sem perguntas.',
        features: [
          'Acesso VITALÍCIO a todas as atualizações futuras',
          'Sem nenhuma mensalidade nunca mais',
          'Status exclusivo de Membro Fundador',
          'Suporte VIP via canal direto',
          'Limite estrito de 30 vagas'
        ]
      });
    }

    return plans;
  }

  if (isEs) {
    const plans: PlanPricing[] = [
      {
        id: 'monthly',
        name: 'Plan Mensual',
        badge: 'Sin compromiso',
        priceDisplay: '€19.99',
        subText: '/ mes',
        billingDetail: 'Facturado mensualmente. Cancela cuando quieras sin comisiones.',
        amount: 19.99,
        currency: 'EUR',
        currencySymbol: '€',
        refundGuarantee: 'Garantía de 7 días — 100% Reembolso',
        features: [
          'Acceso completo a ERP Life4Billion',
          'Gestión de Finanzas, Hábitos y Objetivos',
          'Copiloto con Inteligencia Artificial',
          'Cancelación flexible en cualquier momento',
          'Cobro inmediato en el checkout'
        ]
      },
      {
        id: 'annual',
        name: 'Plan Anual',
        badge: 'MÁS POPULAR — MEJOR VALOR',
        popular: true,
        priceDisplay: '€9.90',
        subText: '/ mes',
        billingDetail: 'Facturado una vez al año (€118.80 / año). Máximo ahorro.',
        amount: 118.80,
        currency: 'EUR',
        currencySymbol: '€',
        refundGuarantee: 'Garantía de 7 días — 100% Reembolso',
        features: [
          'Todo lo incluido en el Plan Mensual',
          'Equivalente a €9.90/mes (Ahorro del 50%)',
          'Soporte prioritario VIP',
          'Informes financieros avanzados',
          'Sin sorpresas: facturado 1 vez al año'
        ]
      }
    ];

    if (founderSpotsRemaining > 0) {
      plans.push({
        id: 'founder',
        name: 'Plan Fundador',
        badge: `OFERTA LIMITADA — ¡Solo ${founderSpotsRemaining} de 30 plazas restantes!`,
        priceDisplay: '€99.00',
        subText: 'pago único',
        billingDetail: 'Acceso DE POR VIDA sin mensualidades nunca más. Plazas limitadas.',
        amount: 99.00,
        currency: 'EUR',
        currencySymbol: '€',
        refundGuarantee: 'Garantía de 7 días — 100% Reembolso',
        features: [
          'Acceso DE POR VIDA a todas las actualizaciones futuras',
          'Sin mensualidades nunca más',
          'Insignia de Miembro Fundador',
          'Soporte VIP prioritario',
          'Límite estricto de 30 plazas'
        ]
      });
    }

    return plans;
  }

  // English default
  const plans: PlanPricing[] = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      badge: 'No commitment',
      priceDisplay: '$19.99',
      subText: '/ month',
      billingDetail: 'Billed monthly. Cancel anytime with zero fees.',
      amount: 19.99,
      currency: 'USD',
      currencySymbol: '$',
      refundGuarantee: '7-Day Money-Back Guarantee — 100% Refund',
      features: [
        'Full access to Life4Billion ERP Suite',
        'Finances, Habits & Goals Management',
        'AI Copilot Business Intelligence',
        'Cancel easily anytime',
        'Charged immediately upon checkout'
      ]
    },
    {
      id: 'annual',
      name: 'Annual Plan',
      badge: 'MOST POPULAR — BEST VALUE',
      popular: true,
      priceDisplay: '$9.99',
      subText: '/ month',
      billingDetail: 'Billed once per year ($119.88 / year). Save 50%.',
      amount: 119.88,
      currency: 'USD',
      currencySymbol: '$',
      refundGuarantee: '7-Day Money-Back Guarantee — 100% Refund',
      features: [
        'Everything in Monthly Plan included',
        'Equivalent to $9.99/month (50% savings)',
        'Priority VIP Support',
        'Advanced Analytics & Reports',
        'Billed once a year ($119.88/yr)'
      ]
    }
  ];

  if (founderSpotsRemaining > 0) {
    plans.push({
      id: 'founder',
      name: 'Founder Plan',
      badge: `LAUNCH OFFER — ${founderSpotsRemaining} out of 30 spots left`,
      priceDisplay: '$99.00',
      subText: 'one-time payment',
      billingDetail: 'LIFETIME ACCESS with zero recurring monthly fees forever!',
      amount: 99.00,
      currency: 'USD',
      currencySymbol: '$',
      refundGuarantee: '7-Day Money-Back Guarantee — 100% Refund',
      features: [
        'LIFETIME access to all future updates',
        'Zero monthly subscription fees forever',
        'Exclusive Founder Member status',
        'Direct VIP support line',
        'Strict limit of 30 spots'
      ]
    });
  }

  return plans;
}
