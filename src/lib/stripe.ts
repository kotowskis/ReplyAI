import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const PLANS = {
  free: {
    name: "Starter",
    price: 0,
    generationsLimit: 5,
  },
  pro: {
    name: "Pro",
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
    price: 79,
    generationsLimit: -1,
  },
  agency: {
    name: "Sieć / Agencja",
    stripePriceId: process.env.STRIPE_AGENCY_PRICE_ID!,
    price: 199,
    generationsLimit: -1,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
