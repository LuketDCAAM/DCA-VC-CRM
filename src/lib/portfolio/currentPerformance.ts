import { computePositionMetrics } from './metrics';

export function computeCurrentPerformance(totalInvested: number, valuation: number | null | undefined, ownership: number | null | undefined) {
  const currentValue = valuation != null && ownership != null ? Math.round(valuation * ownership) : null;
  const metrics = computePositionMetrics({ totalInvested, currentFmv: currentValue, realizedProceeds: 0 });
  return { currentValue, valueMultiple: currentValue == null ? null : metrics.moic };
}