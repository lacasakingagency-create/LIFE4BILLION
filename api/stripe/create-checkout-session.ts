import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import fs from "fs";
import path from "path";

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

export function resolveCurrency(options: {
  currency?: string;
  region?: string;
  country?: string;
  lang?: string;
}): 'USD' | 'EUR' | 'BRL' {
  const { currency, region, country, lang } = options || {};

  if (currency) {
    const upperCurr = currency.toUpperCase();
    if (upperCurr === 'USD' || upperCurr === 'EUR' || upperCurr === 'BRL') {
      return upperCurr as 'USD' | 'EUR' | 'BRL';
    }
  }

  const geoLoc = (region || country || '').toUpperCase();
  if (geoLoc === 'BR' || geoLoc === 'BRL') return 'BRL';
  if (['ES', 'PT', 'FR', 'DE', 'IT', 'EU', 'EUR'].includes(geoLoc)) return 'EUR';
  if (['US', 'USA', 'USD'].includes(geoLoc)) return 'USD';

  const cleanLang = (lang || 'en').toLowerCase();
  if (cleanLang.startsWith('pt')) return 'BRL';
  if (cleanLang.startsWith('es')) return 'EUR';
  
  return 'USD';
}

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
        unitAmount: 49700,
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
        unitAmount: 9900,
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
        unitAmount: 9900,
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
        unitAmount: 59880,
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
        unitAmount: 11880,
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
        unitAmount: 11988,
        productName: 'Life4Billion Annual Plan (Most Popular)',
        productDesc: 'Save 50% with annual billing. $9.99/month billed annually ($119.88/yr). 7-day money-back guarantee.',
        guaranteeMessage
      };
    }
  }

  if (currency === 'BRL') {
    return {
      priceId,
      currency: 'BRL',
      mode: 'subscription',
      recurringInterval: 'month',
      unitAmount: 9790,
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
      unitAmount: 1999,
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
      unitAmount: 1999,
      productName: 'Life4Billion Monthly Plan',
      productDesc: 'Flexible monthly access. Cancel anytime with 7-day 100% money-back guarantee.',
      guaranteeMessage
    };
  }
}

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

let stripeInstance: Stripe | null = null;
const getStripeInstance = (key: string): Stripe | null => {
  if (!stripeInstance && key) {
    try {
      stripeInstance = new Stripe(key, {
        apiVersion: "2023-10-16" as any,
      });
    } catch (err) {
      console.error("[Stripe Serverless] Error initializing Stripe:", err);
    }
  }
  return stripeInstance;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  const { lang, planId, currency, region, country, priceId } = body || {};
  const targetPlan = (planId === 'monthly' || planId === 'annual' || planId === 'founder') ? planId : 'annual';

  // Check founder spots if founder plan requested
  const spotInfo = getFounderSpots();
  if (targetPlan === 'founder' && spotInfo.remaining <= 0) {
    return res.status(400).json({
      success: false,
      error: "O Plano Fundador está esgotado (0 de 30 vagas restantes)."
    });
  }

  // Unified Plan Config
  const planConfig = resolvePlanConfig(targetPlan, { currency, region, country, lang });
  const stripePriceId = priceId || planConfig.priceId;

  let hostUrl = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!hostUrl) {
    const rawProto = req.headers["x-forwarded-proto"];
    const protocol = (Array.isArray(rawProto) ? rawProto[0] : (rawProto || "")).split(",")[0].trim() || "https";
    const host = req.headers.host || (req.headers.origin ? String(req.headers.origin).replace(/^https?:\/\//, "") : "localhost:3000");
    hostUrl = `${protocol}://${host}`;
  }
  if (!hostUrl.startsWith("http://") && !hostUrl.startsWith("https://")) {
    hostUrl = `https://${hostUrl}`;
  }

  const successUrl = `${hostUrl}/?payment=success&lang=${lang || 'en'}&plan=${targetPlan}`;
  const cancelUrl = `${hostUrl}/?payment=cancel&lang=${lang || 'en'}`;

  const secretKey = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.trim().replace(/^["']|["']$/g, '') : '';

  if (!secretKey) {
    return res.status(200).json({
      success: true,
      isConfigured: false,
      simulated: true,
      plan: targetPlan,
      remainingFounderSpots: spotInfo.remaining,
      message: "Modo simulação ativo. Servidor Vercel processou o checkout com sucesso."
    });
  }

  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16" as any,
    });

    const baseMetadata = {
      planId: targetPlan,
      currency: planConfig.currency,
      guarantee: planConfig.guaranteeMessage
    };

    const dynamicLineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      price_data: {
        currency: planConfig.currency.toLowerCase(),
        product_data: {
          name: planConfig.productName,
          description: planConfig.productDesc,
        },
        unit_amount: planConfig.unitAmount,
        ...(planConfig.mode === "subscription" && planConfig.recurringInterval
          ? { recurring: { interval: planConfig.recurringInterval } }
          : {}),
      },
      quantity: 1,
    };

    // Attempts hierarchy:
    // 1. Try predefined Stripe Price ID with explicit card payment method
    // 2. Try predefined Stripe Price ID with automatic payment methods
    // 3. Try dynamic price_data with explicit card payment method
    // 4. Try dynamic price_data with automatic payment methods
    const attempts: Array<{ lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]; useCardMethod: boolean }> = [];

    if (stripePriceId) {
      attempts.push({ lineItems: [{ price: stripePriceId, quantity: 1 }], useCardMethod: true });
      attempts.push({ lineItems: [{ price: stripePriceId, quantity: 1 }], useCardMethod: false });
    }
    attempts.push({ lineItems: [dynamicLineItem], useCardMethod: true });
    attempts.push({ lineItems: [dynamicLineItem], useCardMethod: false });

    let session: Stripe.Checkout.Session | null = null;
    let lastError: any = null;

    for (const attempt of attempts) {
      try {
        const sessionParam: Stripe.Checkout.SessionCreateParams = {
          mode: planConfig.mode,
          success_url: successUrl,
          cancel_url: cancelUrl,
          line_items: attempt.lineItems,
          metadata: baseMetadata
        };
        if (attempt.useCardMethod) {
          sessionParam.payment_method_types = ["card"];
        }

        session = await stripe.checkout.sessions.create(sessionParam);
        if (session && session.url) {
          break;
        }
      } catch (attemptErr: any) {
        console.warn("[Stripe Session Attempt Warning]:", attemptErr?.message || attemptErr);
        lastError = attemptErr;
      }
    }

    if (!session || !session.url) {
      throw lastError || new Error("Não foi possível criar a sessão de pagamento no Stripe.");
    }

    return res.status(200).json({
      success: true,
      isConfigured: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      remainingFounderSpots: spotInfo.remaining
    });

  } catch (err: any) {
    console.error("[Stripe Serverless Session Error]:", err);
    const errMessage = err.message || err.toString() || "Erro no gateway Stripe.";
    return res.status(200).json({
      success: true,
      isConfigured: false,
      simulated: true,
      plan: targetPlan,
      remainingFounderSpots: spotInfo.remaining,
      stripeError: errMessage,
      message: `Conexão Stripe: ${errMessage}. Formulário de pagamento ativado.`
    });
  }
}

