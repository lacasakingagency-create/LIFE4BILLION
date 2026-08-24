import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

let founderSpotsRemaining = 23;
const FOUNDER_SPOTS_FILE = path.join("/tmp", ".founder_spots.json");

function getFounderSpots(): { remaining: number; total: number; soldOut: boolean } {
  try {
    if (fs.existsSync(FOUNDER_SPOTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(FOUNDER_SPOTS_FILE, "utf-8"));
      if (typeof data.remaining === "number") {
        founderSpotsRemaining = Math.max(0, data.remaining);
      }
    } else {
      try {
        fs.writeFileSync(FOUNDER_SPOTS_FILE, JSON.stringify({ remaining: 23, total: 30 }));
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    // ignore
  }

  return {
    remaining: founderSpotsRemaining,
    total: 30,
    soldOut: founderSpotsRemaining <= 0
  };
}

export interface StripePlanConfig {
  priceId: string;
  currency: 'USD' | 'EUR' | 'BRL';
  mode: 'subscription' | 'payment';
  recurringInterval: 'month' | 'year' | null;
  unitAmount: number;
  productName: string;
  productDesc: string;
  guaranteeMessage: string;
}

// Environment Variable Keys & Fallback Price IDs
export const DEFAULT_PRICE_IDS = {
  monthly: {
    USD: process.env.STRIPE_MONTHLY_PRICE_USD || "price_1TrfkaQgM79UmffPY33Spfuc",
    EUR: process.env.STRIPE_MONTHLY_PRICE_EUR || "price_1TrfnaQgM79UmffPZE43dIsx",
    BRL: process.env.STRIPE_MONTHLY_PRICE_BRL || "price_1TrfmcQgM79UmffPGSpl0cLV",
  },
  annual: {
    USD: process.env.STRIPE_ANNUAL_PRICE_USD || "price_1TwjYPQgM79UmffPVAwdKuzx",
    EUR: process.env.STRIPE_ANNUAL_PRICE_EUR || "price_1TwjeTQgM79UmffPhaXMU2q8",
    BRL: process.env.STRIPE_ANNUAL_PRICE_BRL || "price_1TwjexQgM79UmffPVcAwR8t1",
  },
  founder: {
    USD: process.env.STRIPE_FOUNDER_PRICE_USD || "price_1TwjbCQgM79UmffPLqEkAYIK",
    EUR: process.env.STRIPE_FOUNDER_PRICE_EUR || "price_1TwjbYQgM79UmffPMrbf5APr",
    BRL: process.env.STRIPE_FOUNDER_PRICE_BRL || "price_1TwjZgQgM79UmffPZaMaShnz",
  }
};

/**
 * Currency resolution logic based on priority:
 * 1. User chosen currency in SaaS (explicit 'USD', 'EUR', 'BRL')
 * 2. User location / region (country code or region code)
 * 3. Language as fallback ('pt' -> 'BRL', 'es' -> 'EUR', 'en' -> 'USD')
 */
export function resolveCurrency(options: {
  currency?: string;
  region?: string;
  country?: string;
  lang?: string;
}): 'USD' | 'EUR' | 'BRL' {
  const { currency, region, country, lang } = options || {};

  // Priority 1: Explicit user chosen currency
  if (currency) {
    const upperCurr = currency.toUpperCase();
    if (upperCurr === 'USD' || upperCurr === 'EUR' || upperCurr === 'BRL') {
      return upperCurr as 'USD' | 'EUR' | 'BRL';
    }
  }

  // Priority 2: Location / Region
  const geoLoc = (region || country || '').toUpperCase();
  if (geoLoc === 'BR' || geoLoc === 'BRL') return 'BRL';
  if (['ES', 'PT', 'FR', 'DE', 'IT', 'EU', 'EUR'].includes(geoLoc)) return 'EUR';
  if (['US', 'USA', 'USD'].includes(geoLoc)) return 'USD';

  // Priority 3: Language fallback
  const cleanLang = (lang || 'en').toLowerCase();
  if (cleanLang.startsWith('pt')) return 'BRL';
  if (cleanLang.startsWith('es')) return 'EUR';
  
  return 'USD';
}

/**
 * Get plan configuration, Price ID, Stripe mode, and details
 */
export function resolvePlanConfig(
  planId: 'monthly' | 'annual' | 'founder' | string,
  options: { currency?: string; region?: string; country?: string; lang?: string }
): StripePlanConfig {
  const targetPlan = (planId === 'monthly' || planId === 'annual' || planId === 'founder')
    ? planId
    : 'annual';

  const currency = resolveCurrency(options);
  const priceId = DEFAULT_PRICE_IDS[targetPlan][currency];

  const guaranteeMessage = "7 dias de garantia. Não gostou? Devolvemos 100% do valor, sem perguntas.";

  if (targetPlan === 'founder') {
    if (currency === 'BRL') {
      return {
        priceId,
        currency: 'BRL',
        mode: 'payment',
        recurringInterval: null,
        unitAmount: 49700, // R$ 497.00
        productName: 'Plano Fundador Life4Billion — Acesso Vitalício',
        productDesc: 'Oferta exclusiva de lançamento. Acesso vitalício sem mensalidades. 7 dias de garantia.',
        guaranteeMessage
      };
    } else if (currency === 'EUR') {
      return {
        priceId,
        currency: 'EUR',
        mode: 'payment',
        recurringInterval: null,
        unitAmount: 9900, // € 99.00
        productName: 'Plan Fundador Life4Billion — Acceso De Por Vida',
        productDesc: 'Oferta exclusiva de lanzamiento. Acceso de por vida sin cuotas mensuales. 7 días de garantía.',
        guaranteeMessage
      };
    } else {
      return {
        priceId,
        currency: 'USD',
        mode: 'payment',
        recurringInterval: null,
        unitAmount: 9900, // $ 99.00
        productName: 'Life4Billion Founder Plan — Lifetime Access',
        productDesc: 'Exclusive launch offer. Lifetime access with zero recurring fees. 7-day money-back guarantee.',
        guaranteeMessage
      };
    }
  }

  if (targetPlan === 'annual') {
    if (currency === 'BRL') {
      return {
        priceId,
        currency: 'BRL',
        mode: 'subscription',
        recurringInterval: 'year',
        unitAmount: 59880, // R$ 598.80 / ano (R$ 49.90 / mês)
        productName: 'Plano Anual Life4Billion (Mais Popular)',
        productDesc: 'Economize 50% no plano anual. R$ 49,90/mês faturados anualmente (R$ 598,80/ano). 7 dias de garantia.',
        guaranteeMessage
      };
    } else if (currency === 'EUR') {
      return {
        priceId,
        currency: 'EUR',
        mode: 'subscription',
        recurringInterval: 'year',
        unitAmount: 11880, // € 118.80 / año (€ 9.90 / mes)
        productName: 'Plan Anual Life4Billion (Más Popular)',
        productDesc: 'Ahorra 50% en el plan anual. €9.90/mes facturados anualmente (€118.80/año). 7 días de garantía.',
        guaranteeMessage
      };
    } else {
      return {
        priceId,
        currency: 'USD',
        mode: 'subscription',
        recurringInterval: 'year',
        unitAmount: 11988, // $ 119.88 / year ($ 9.99 / month)
        productName: 'Life4Billion Annual Plan (Most Popular)',
        productDesc: 'Save 50% with annual billing. $9.99/month billed annually ($119.88/yr). 7-day money-back guarantee.',
        guaranteeMessage
      };
    }
  }

  // Monthly plan default
  if (currency === 'BRL') {
    return {
      priceId,
      currency: 'BRL',
      mode: 'subscription',
      recurringInterval: 'month',
      unitAmount: 9790, // R$ 97.90 / mês
      productName: 'Plano Mensal Life4Billion',
      productDesc: 'Acesso flexível sem compromisso. Cancele quando quiser com garantia de reembolso de 7 dias.',
      guaranteeMessage
    };
  } else if (currency === 'EUR') {
    return {
      priceId,
      currency: 'EUR',
      mode: 'subscription',
      recurringInterval: 'month',
      unitAmount: 1999, // € 19.99 / mês
      productName: 'Plan Mensual Life4Billion',
      productDesc: 'Acceso flexible sin compromiso. Cancela cuando quieras con garantía de reembolso de 7 días.',
      guaranteeMessage
    };
  } else {
    return {
      priceId,
      currency: 'USD',
      mode: 'subscription',
      recurringInterval: 'month',
      unitAmount: 1999, // $ 19.99 / month
      productName: 'Life4Billion Monthly Plan',
      productDesc: 'Flexible monthly access. Cancel anytime with 7-day 100% money-back guarantee.',
      guaranteeMessage
    };
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  }

  const isConfigured = !!process.env.STRIPE_SECRET_KEY;
  const spots = getFounderSpots();

  return res.status(200).json({
    success: true,
    isConfigured,
    founderSpots: {
      remaining: spots.remaining,
      total: spots.total,
      soldOut: spots.soldOut
    },
    prices: {
      en: {
        monthly: { currency: "USD", amount: 19.99, priceId: DEFAULT_PRICE_IDS.monthly.USD },
        annual: { currency: "USD", amount: 119.88, monthlyEquivalent: 9.99, priceId: DEFAULT_PRICE_IDS.annual.USD },
        founder: { currency: "USD", amount: 99.00, priceId: DEFAULT_PRICE_IDS.founder.USD }
      },
      es: {
        monthly: { currency: "EUR", amount: 19.99, priceId: DEFAULT_PRICE_IDS.monthly.EUR },
        annual: { currency: "EUR", amount: 118.80, monthlyEquivalent: 9.90, priceId: DEFAULT_PRICE_IDS.annual.EUR },
        founder: { currency: "EUR", amount: 99.00, priceId: DEFAULT_PRICE_IDS.founder.EUR }
      },
      pt: {
        monthly: { currency: "BRL", amount: 97.90, priceId: DEFAULT_PRICE_IDS.monthly.BRL },
        annual: { currency: "BRL", amount: 598.80, monthlyEquivalent: 49.90, priceId: DEFAULT_PRICE_IDS.annual.BRL },
        founder: { currency: "BRL", amount: 497.00, priceId: DEFAULT_PRICE_IDS.founder.BRL }
      }
    }
  });
}

