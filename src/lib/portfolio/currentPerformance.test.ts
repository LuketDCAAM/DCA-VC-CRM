import { expect, test } from 'bun:test';
import { computeCurrentPerformance } from './currentPerformance';

test('changing current ownership changes holding value and performance multiple', () => {
  expect(computeCurrentPerformance(100_000_00, 10_000_000_00, 0.01)).toEqual({ currentValue: 100_000_00, valueMultiple: 1 });
  expect(computeCurrentPerformance(100_000_00, 10_000_000_00, 0.02)).toEqual({ currentValue: 200_000_00, valueMultiple: 2 });
});

test('zero ownership is a zero-valued holding rather than missing performance', () => {
  expect(computeCurrentPerformance(100_000_00, 10_000_000_00, 0)).toEqual({ currentValue: 0, valueMultiple: 0 });
});

test('missing valuation or ownership cannot produce a holding multiple', () => {
  expect(computeCurrentPerformance(100_000_00, null, 0.02).valueMultiple).toBeNull();
  expect(computeCurrentPerformance(100_000_00, 10_000_000_00, null).currentValue).toBeNull();
});