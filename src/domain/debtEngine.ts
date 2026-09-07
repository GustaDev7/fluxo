import Decimal from 'decimal.js';

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP, toExpNeg: -30, toExpPos: 40 });

export type DecimalValue = Decimal.Value;
export type AmortizationSystem = 'price' | 'sac' | 'no_interest';
export type RatePeriod = 'daily' | 'monthly' | 'annual';
export type InterestRegime = 'simple' | 'compound';

export interface DebtTerms {
  principal: DecimalValue;
  annualOrPeriodRatePercent: DecimalValue;
  ratePeriod: RatePeriod;
  installments: number;
  system: AmortizationSystem;
  firstDueDate: string;
}

export interface DebtScheduleEntry {
  number: number;
  dueDate: string;
  openingBalance: string;
  interest: string;
  amortization: string;
  installment: string;
  closingBalance: string;
}

export interface DebtSchedule {
  entries: DebtScheduleEntry[];
  principal: string;
  totalInterest: string;
  totalPaid: string;
  periodicRatePercent: string;
  calculationVersion: 'debt-engine-v1';
}

const D = (value: DecimalValue) => new Decimal(value || 0);
const money = (value: Decimal) => value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

export function effectiveRate(
  ratePercent: DecimalValue,
  from: RatePeriod,
  to: RatePeriod,
  dayBase: 360 | 365 | 366 = 365,
): Decimal {
  const rate = D(ratePercent).div(100);
  if (rate.lt(-1)) throw new Error('A taxa não pode ser inferior a -100%.');
  if (from === to) return rate;
  const periodsPerYear: Record<RatePeriod, Decimal> = {
    daily: new Decimal(dayBase),
    monthly: new Decimal(12),
    annual: new Decimal(1),
  };
  const annual = rate.plus(1).pow(periodsPerYear[from]).minus(1);
  return annual.plus(1).pow(new Decimal(1).div(periodsPerYear[to])).minus(1);
}

export const effectiveAnnualRate = (monthlyPercent: DecimalValue) =>
  effectiveRate(monthlyPercent, 'monthly', 'annual').mul(100);

export const effectiveMonthlyRate = (annualPercent: DecimalValue) =>
  effectiveRate(annualPercent, 'annual', 'monthly').mul(100);

export function simpleInterest(principal: DecimalValue, ratePercent: DecimalValue, periods: number): Decimal {
  if (periods < 0) throw new Error('O número de períodos não pode ser negativo.');
  return D(principal).mul(D(ratePercent).div(100)).mul(periods);
}

export function compoundAmount(principal: DecimalValue, ratePercent: DecimalValue, periods: number): Decimal {
  if (periods < 0) throw new Error('O número de períodos não pode ser negativo.');
  return D(principal).mul(D(ratePercent).div(100).plus(1).pow(periods));
}

export function pricePayment(principal: DecimalValue, ratePercent: DecimalValue, installments: number): Decimal {
  const pv = D(principal);
  if (pv.lt(0)) throw new Error('O principal não pode ser negativo.');
  if (!Number.isInteger(installments) || installments < 1) throw new Error('Informe ao menos uma parcela.');
  const rate = D(ratePercent).div(100);
  if (rate.isZero()) return pv.div(installments);
  const factor = rate.plus(1).pow(installments);
  return pv.mul(rate.mul(factor)).div(factor.minus(1));
}

export function addMonthsClamped(dateIso: string, months: number): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  if (!year || !month || !day) throw new Error('Data de vencimento inválida.');
  const targetFirst = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(targetFirst.getUTCFullYear(), targetFirst.getUTCMonth() + 1, 0)).getUTCDate();
  const target = new Date(Date.UTC(targetFirst.getUTCFullYear(), targetFirst.getUTCMonth(), Math.min(day, lastDay)));
  return target.toISOString().slice(0, 10);
}

export function generateSchedule(terms: DebtTerms): DebtSchedule {
  const principal = D(terms.principal);
  if (principal.lte(0)) throw new Error('O principal deve ser maior que zero.');
  if (!Number.isInteger(terms.installments) || terms.installments < 1 || terms.installments > 1000) {
    throw new Error('A quantidade de parcelas deve ficar entre 1 e 1.000.');
  }
  const rate = effectiveRate(terms.annualOrPeriodRatePercent, terms.ratePeriod, 'monthly');
  const payment = terms.system === 'price'
    ? pricePayment(principal, rate.mul(100), terms.installments)
    : principal.div(terms.installments);
  const sacAmortization = principal.div(terms.installments);
  let balance = principal;
  let totalInterest = new Decimal(0);
  let totalPaid = new Decimal(0);
  let displayedAmortization = new Decimal(0);
  const entries: DebtScheduleEntry[] = [];

  for (let index = 0; index < terms.installments; index += 1) {
    const opening = balance;
    const interest = terms.system === 'no_interest' ? new Decimal(0) : opening.mul(rate);
    let amortization = terms.system === 'sac' ? sacAmortization : payment.minus(interest);
    if (index === terms.installments - 1 || amortization.gt(opening)) amortization = opening;
    const installment = amortization.plus(interest);
    balance = opening.minus(amortization);
    if (balance.abs().lt('0.00000000000000000001')) balance = new Decimal(0);
    const shownInterest = money(interest);
    const shownAmortization = index === terms.installments - 1
      ? money(principal).minus(displayedAmortization)
      : money(amortization);
    const shownInstallment = shownAmortization.plus(shownInterest);
    displayedAmortization = displayedAmortization.plus(shownAmortization);
    totalInterest = totalInterest.plus(shownInterest);
    totalPaid = totalPaid.plus(shownInstallment);
    entries.push({
      number: index + 1,
      dueDate: addMonthsClamped(terms.firstDueDate, index),
      openingBalance: money(opening).toFixed(2),
      interest: shownInterest.toFixed(2),
      amortization: shownAmortization.toFixed(2),
      installment: shownInstallment.toFixed(2),
      closingBalance: money(balance).toFixed(2),
    });
  }

  return {
    entries,
    principal: money(principal).toFixed(2),
    totalInterest: money(totalInterest).toFixed(2),
    totalPaid: money(totalPaid).toFixed(2),
    periodicRatePercent: rate.mul(100).toSignificantDigits(20).toString(),
    calculationVersion: 'debt-engine-v1',
  };
}

export function calculateLateCharges(params: {
  baseAmount: DecimalValue;
  daysLate: number;
  finePercent?: DecimalValue;
  fixedFine?: DecimalValue;
  lateRatePercent?: DecimalValue;
  lateRatePeriod?: RatePeriod;
  regime?: InterestRegime;
  dayBase?: 360 | 365 | 366;
  otherCharges?: DecimalValue;
}) {
  const base = D(params.baseAmount);
  const days = Math.max(0, Math.trunc(params.daysLate));
  const fine = D(params.fixedFine || 0).plus(base.mul(D(params.finePercent || 0).div(100)));
  const dailyRate = effectiveRate(params.lateRatePercent || 0, params.lateRatePeriod || 'daily', 'daily', params.dayBase);
  const lateInterest = (params.regime || 'simple') === 'compound'
    ? base.mul(dailyRate.plus(1).pow(days).minus(1))
    : base.mul(dailyRate).mul(days);
  const otherCharges = D(params.otherCharges || 0);
  return {
    baseAmount: money(base).toFixed(2),
    fine: money(fine).toFixed(2),
    lateInterest: money(lateInterest).toFixed(2),
    otherCharges: money(otherCharges).toFixed(2),
    total: money(base.plus(fine).plus(lateInterest).plus(otherCharges)).toFixed(2),
  };
}

export function simulateExtraPayment(schedule: DebtSchedule, afterInstallment: number, extraAmount: DecimalValue) {
  const extra = D(extraAmount);
  if (extra.lte(0)) throw new Error('A amortização extra deve ser maior que zero.');
  const entry = afterInstallment === 0 ? null : schedule.entries[afterInstallment - 1];
  if (afterInstallment < 0 || afterInstallment > schedule.entries.length || (afterInstallment > 0 && !entry)) {
    throw new Error('Parcela de referência inválida.');
  }
  const balance = D(entry?.closingBalance ?? schedule.principal);
  const applied = Decimal.min(extra, balance);
  return {
    previousBalance: money(balance).toFixed(2),
    appliedAmount: money(applied).toFixed(2),
    newBalance: money(balance.minus(applied)).toFixed(2),
  };
}
