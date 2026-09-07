import { describe, expect, it } from 'vitest';
import {
  addMonthsClamped,
  calculateLateCharges,
  compoundAmount,
  effectiveAnnualRate,
  effectiveMonthlyRate,
  generateSchedule,
  pricePayment,
  simpleInterest,
  simulateExtraPayment,
} from './debtEngine';

describe('debtEngine', () => {
  it('converte 1% a.m. para 12,6825% a.a. efetivos', () => {
    expect(effectiveAnnualRate(1).toNumber()).toBeCloseTo(12.6825030132, 10);
    expect(effectiveMonthlyRate(effectiveAnnualRate(1)).toNumber()).toBeCloseTo(1, 12);
  });

  it('calcula juros simples e compostos sem arredondar intermediários', () => {
    expect(simpleInterest(10000, 2, 12).toFixed(2)).toBe('2400.00');
    expect(compoundAmount(10000, 2, 12).toFixed(10)).toBe('12682.4179456255');
  });

  it('calcula Price e quita o saldo sem centavo residual', () => {
    expect(pricePayment(10000, 2, 12).toFixed(10)).toBe('945.5959662295');
    const schedule = generateSchedule({ principal: 10000, annualOrPeriodRatePercent: 2, ratePeriod: 'monthly', installments: 12, system: 'price', firstDueDate: '2026-01-31' });
    expect(schedule.entries).toHaveLength(12);
    expect(schedule.entries.at(-1)?.closingBalance).toBe('0.00');
    const amortized = schedule.entries.reduce((sum, row) => sum + Number(row.amortization), 0);
    expect(amortized).toBeCloseTo(10000, 2);
  });

  it('gera SAC com amortização constante e parcelas decrescentes', () => {
    const schedule = generateSchedule({ principal: 10000, annualOrPeriodRatePercent: 2, ratePeriod: 'monthly', installments: 10, system: 'sac', firstDueDate: '2026-01-10' });
    expect(schedule.entries[0]).toMatchObject({ interest: '200.00', amortization: '1000.00', installment: '1200.00' });
    expect(schedule.entries[1]).toMatchObject({ interest: '180.00', amortization: '1000.00', installment: '1180.00' });
    expect(schedule.entries.at(-1)?.closingBalance).toBe('0.00');
  });

  it('gera parcelas sem juros e corrige fim de mês/ano bissexto', () => {
    const schedule = generateSchedule({ principal: 1200, annualOrPeriodRatePercent: 0, ratePeriod: 'monthly', installments: 12, system: 'no_interest', firstDueDate: '2028-01-31' });
    expect(schedule.entries.every((row) => row.installment === '100.00')).toBe(true);
    expect(addMonthsClamped('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonthsClamped('2027-01-31', 1)).toBe('2027-02-28');
  });

  it('separa multa única, mora e encargos', () => {
    expect(calculateLateCharges({ baseAmount: 1000, daysLate: 10, finePercent: 2, lateRatePercent: 0.1, lateRatePeriod: 'daily', otherCharges: 5 })).toEqual({ baseAmount: '1000.00', fine: '20.00', lateInterest: '10.00', otherCharges: '5.00', total: '1035.00' });
  });

  it('simula sem alterar o cronograma original', () => {
    const schedule = generateSchedule({ principal: 1000, annualOrPeriodRatePercent: 0, ratePeriod: 'monthly', installments: 10, system: 'no_interest', firstDueDate: '2026-01-10' });
    const before = JSON.stringify(schedule);
    expect(simulateExtraPayment(schedule, 2, 250)).toEqual({ previousBalance: '800.00', appliedAmount: '250.00', newBalance: '550.00' });
    expect(JSON.stringify(schedule)).toBe(before);
  });

  it.each(['0.01', '1', '999999.99'] as const)('mantém consistência no valor extremo %s', (principal) => {
    const schedule = generateSchedule({ principal, annualOrPeriodRatePercent: 0, ratePeriod: 'monthly', installments: 1, system: 'no_interest', firstDueDate: '2026-01-01' });
    expect(schedule.entries[0].amortization).toBe(Number(principal).toFixed(2));
    expect(schedule.entries[0].closingBalance).toBe('0.00');
  });
});
