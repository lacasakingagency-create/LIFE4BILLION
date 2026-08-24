import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
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

function decrementFounderSpots(): { remaining: number; total: number; soldOut: boolean } {
  const current = getFounderSpots();
  if (current.remaining > 0) {
    founderSpotsRemaining = current.remaining - 1;
    try {
      fs.writeFileSync(FOUNDER_SPOTS_FILE, JSON.stringify({ remaining: founderSpotsRemaining, total: 30 }));
    } catch (err) {
      // ignore
    }
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
      console.error("[Stripe Webhook] Error initializing Stripe:", err);
    }
  }
  return stripeInstance;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const event = req.body;

  // Handle checkout.session.completed
  if (event && event.type === 'checkout.session.completed') {
    const session = event.data?.object as Stripe.Checkout.Session;
    const planId = session?.metadata?.planId;

    if (planId === 'founder' || session?.mode === 'payment') {
      const spotInfo = decrementFounderSpots();
      console.log(`[Stripe Webhook] Payment confirmed for Founder plan. Remaining spots: ${spotInfo.remaining}/30`);
    }
  }

  return res.status(200).json({ received: true });
}
