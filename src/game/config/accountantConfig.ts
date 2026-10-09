export const ACCOUNTANT_CONFIG = { correct: 100, perfect: 150, wrong: -40, timeout: -25, patience: 14, minimumPatience: 9, perfectRatio: .5, nextMs: 650 } as const
export interface Invoice { items: readonly { name: string; quantity: number; price: number }[]; claimed: number }
export const invoiceSamples: readonly Invoice[] = [
  { items: [{ name: 'Sổ', quantity: 2, price: 5000 }, { name: 'Bút', quantity: 1, price: 10000 }], claimed: 20000 },
  { items: [{ name: 'Giấy', quantity: 3, price: 5000 }, { name: 'Kẹp', quantity: 1, price: 5000 }], claimed: 25000 },
  { items: [{ name: 'Sổ', quantity: 1, price: 15000 }, { name: 'Bút', quantity: 2, price: 5000 }], claimed: 25000 },
  { items: [{ name: 'Hộp', quantity: 2, price: 10000 }, { name: 'Giấy', quantity: 2, price: 5000 }], claimed: 20000 },
]
export const invoiceTotal = (invoice: Invoice) => invoice.items.reduce((total, item) => total + item.quantity * item.price, 0)
export const invoiceValid = (invoice: Invoice) => invoice.claimed === invoiceTotal(invoice)
export const balanceOptions = (invoice: Invoice) => [invoiceTotal(invoice), invoiceTotal(invoice) + 5000, Math.max(0, invoiceTotal(invoice) - 5000)]
export const accountantPatience = (count: number) => Math.max(ACCOUNTANT_CONFIG.minimumPatience, ACCOUNTANT_CONFIG.patience - count * .35)
export const balancePoints = (mistakes: number, remainingRatio: number) => mistakes === 0 && remainingRatio >= ACCOUNTANT_CONFIG.perfectRatio ? ACCOUNTANT_CONFIG.perfect : ACCOUNTANT_CONFIG.correct
export const vnMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ'
