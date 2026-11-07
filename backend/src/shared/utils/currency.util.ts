/**
 * WasteWise Currency & Monetary Calculations Utility
 * Ensures defensive precision: converts between NPR and integer Paisa (1 NPR = 100 Paisa)
 * to prevent IEEE 754 floating-point inaccuracies during billing and gateway transactions.
 */

/**
 * Converts a Nepali Rupee (NPR) amount to integer Paisa (e.g. 150.50 -> 15050).
 * Required by Khalti API v2.
 */
export function toPaisa(nprAmount: number | string): number {
  const numeric = typeof nprAmount === 'string' ? parseFloat(nprAmount) : nprAmount;
  if (isNaN(numeric) || numeric < 0) {
    throw new Error(`Invalid monetary amount: ${nprAmount}`);
  }
  return Math.round(numeric * 100);
}

/**
 * Converts integer Paisa back to Nepali Rupees (NPR) with two decimal precision (e.g. 15050 -> 150.5).
 */
export function toNpr(paisaAmount: number): number {
  if (isNaN(paisaAmount) || paisaAmount < 0) {
    throw new Error(`Invalid paisa amount: ${paisaAmount}`);
  }
  return Math.round(paisaAmount) / 100;
}

/**
 * Rounds an NPR amount to standard 2 decimal places.
 */
export function roundNpr(amount: number | string): number {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric)) {
    throw new Error(`Invalid monetary amount: ${amount}`);
  }
  return Math.round(numeric * 100) / 100;
}

/**
 * Multiplies quantity by unit price using integer Paisa math to avoid float drift.
 */
export function calculateItemTotal(quantity: number, unitPriceNpr: number): number {
  const unitPaisa = toPaisa(unitPriceNpr);
  const totalPaisa = Math.round(quantity * unitPaisa);
  return toNpr(totalPaisa);
}

/**
 * Formats an amount into an official Nepali Rupee display string (e.g. "Rs. 1,500.00").
 */
export function formatNprDisplay(amount: number | string): string {
  const rounded = roundNpr(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(rounded)
    .replace('NPR', 'Rs.');
}

