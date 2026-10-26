import Stripe from 'stripe';
import { stripeEnv } from './stripe-env';

export { stripeEnv };

const SECRET_KEY = stripeEnv('STRIPE_SECRET_KEY');

export const stripe = SECRET_KEY ? new Stripe(SECRET_KEY) : (null as unknown as Stripe);

export const STRIPE_WEBHOOK_SECRET = stripeEnv('STRIPE_WEBHOOK_SECRET');
