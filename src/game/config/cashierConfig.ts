export const CASHIER_CONFIG = { correct: 100, wrong: -40, timeout: -25, speedBonus: 50, patience: 15, minimumPatience: 9, nextMs: 600 } as const
export const groceries = [
  { id: 'milk', name: 'SỮA', price: 10000, color: 0xa8c5d5 },
  { id: 'bread', name: 'BÁNH', price: 15000, color: 0xe3b46e },
  { id: 'apple', name: 'TÁO', price: 5000, color: 0xda9283 },
  { id: 'rice', name: 'GẠO', price: 20000, color: 0xf0ddb3 },
  { id: 'tea', name: 'TRÀ', price: 25000, color: 0x93b68c },
] as const
export type Grocery = typeof groceries[number]
export const checkoutTotal = (products: readonly Grocery[]) => products.reduce((sum, item) => sum + item.price, 0)
export const checkoutPayment = (total: number) => Math.ceil((total + 1) / 50000) * 50000
export function changeOptions(total: number, payment: number): number[] {
  const change = payment - total
  return [change, change + 5000, change >= 5000 ? change - 5000 : change + 10000]
}
export const checkoutCorrect = (scanned: number, count: number, choice: number, total: number, payment: number) => scanned === count && count > 0 && choice === payment - total
export const cashierDifficulty = (served: number) => ({ count: Math.min(4, 2 + Math.floor(Math.max(0, served) / 3)), seconds: Math.max(CASHIER_CONFIG.minimumPatience, CASHIER_CONFIG.patience - Math.max(0, served) * 0.4) })

