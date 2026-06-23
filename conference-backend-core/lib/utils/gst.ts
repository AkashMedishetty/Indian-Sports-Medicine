/**
 * Calculate GST (Goods and Services Tax) at 18% on a given amount.
 * Applied on the total of all fees (registration + workshops + accompanying persons).
 * Returns the GST amount rounded to the nearest rupee.
 *
 * @param amount - The total amount to apply GST on (non-negative)
 * @returns The GST amount as a non-negative integer
 */
export function calculateGST(amount: number): number {
  return Math.round(amount * 18 / 100);
}
