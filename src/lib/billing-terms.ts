/**
 * The auto-renewal terms shown right next to every subscribe button (FTC
 * negative-option rule / state auto-renewal laws): price, interval, that it
 * renews until canceled, when the first charge happens and how to cancel.
 * Pure, so the pricing page, the paywall and the plan chip all say the same
 * thing as checkout (src/app/api/stripe/checkout/route.ts):
 *   - Pro is monthly. $29 while Founding seats last, and always for
 *     early-access code holders (perkFoundingPrice); $39 after.
 *   - Free access running (launch window or a code's 30 days): the card is
 *     first charged when it ends.
 *   - Otherwise one 7-day card trial; after a code's 30 days, no second
 *     trial (charged today).
 */

export const PRO_FOUNDING_PRICE = 29;
export const PRO_STANDARD_PRICE = 39;

export function proPrice(priceLocked: boolean): number {
  return priceLocked ? PRO_FOUNDING_PRICE : PRO_STANDARD_PRICE;
}

export type FirstCharge =
  | { kind: 'today' }
  | { kind: 'on'; date: string }
  | { kind: 'after-trial'; days: number };

const CANCEL = 'Cancel any time in Manage billing';

export function renewalTerms(price: number, first: FirstCharge): string {
  const renew = `$${price}/month, renews every month until you cancel`;
  const when =
    first.kind === 'today'
      ? 'first charge today'
      : first.kind === 'on'
        ? `card required, first charge ${first.date} (cancel before then and pay nothing)`
        : `card required, first charge after your ${first.days}-day trial (cancel before then and pay nothing)`;
  return `${renew} · ${when} · ${CANCEL}.`;
}
