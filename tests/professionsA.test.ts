import { describe, expect, it } from 'vitest'
import { bugTickets, debugPoints, isLogicalStep, itPatience } from '../src/game/config/itConfig'
import { invoiceSamples, invoiceTotal, invoiceValid, balanceOptions, balancePoints, accountantPatience } from '../src/game/config/accountantConfig'
import { trafficDecision, trafficPoints, trafficPatience } from '../src/game/config/policeConfig'

describe('profession batch A', () => {
  it.each(bugTickets)('debug tickets have meaningful broken blocks, fixes and ordered steps', ticket => {
    expect(ticket.blocks[ticket.broken]).toBeTruthy(); expect(ticket.fixes[ticket.fix]).toBeTruthy()
    expect([0, 1, 2].map(i => isLogicalStep(i, i))).toEqual([true, true, true])
    expect(isLogicalStep(2, 0)).toBe(false); expect(isLogicalStep(3, 3)).toBe(false)
  })
  it('debug bonus is bounded and difficulty capped', () => {
    expect([0, 50, 100, 200].map(n => debugPoints(n, 100))).toEqual([100, 125, 150, 150])
    expect(itPatience(0)).toBe(15); expect(itPatience(100)).toBe(10)
  })
  it.each(invoiceSamples)('invoices reconcile quantities, totals and distinct bank transactions', invoice => {
    expect(new Set(balanceOptions(invoice)).size).toBe(3)
    expect(balanceOptions(invoice)).toContain(invoiceTotal(invoice))
    expect(invoiceValid(invoice)).toBe(invoice.claimed === invoiceTotal(invoice))
  })
  it('perfect balances need an error-free, timely reconciliation', () => {
    expect(balancePoints(0, .5)).toBe(150); expect(balancePoints(1, 1)).toBe(100); expect(balancePoints(0, .49)).toBe(100)
    expect(accountantPatience(100)).toBe(9)
  })
  it('traffic checks conflicting directions, violation flags and requested emergency lane', () => {
    const request = { lane: 'vertical', emergency: true, violation: false } as const
    expect(trafficDecision('horizontal', 'vertical', request)).toBe('conflict')
    expect(trafficDecision(null, 'horizontal', request)).toBe('wrong')
    expect(trafficDecision(null, 'vertical', { ...request, violation: true })).toBe('wrong')
    expect(trafficDecision(null, 'vertical', request)).toBe('safe')
    expect(trafficPoints(2200, true)).toBe(150); expect(trafficPoints(2201, true)).toBe(100); expect(trafficPoints(0, false)).toBe(100)
    expect(trafficPatience(100)).toBe(5)
  })
})
