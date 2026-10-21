import { expect, test } from 'bun:test';

import { formatPricePerShare, priceToStoredCents, storedCentsToPrice, storedCentsToPriceNumber } from './pricePerShare';

test('a four decimal share price keeps every decimal when stored', () => {
  expect(priceToStoredCents('0.1234')).toBe(12.34);
  expect(priceToStoredCents(0.1234)).toBe(12.34);
  expect(priceToStoredCents('$ 1,250.0001')).toBe(125000.01);
});

test('whole cent and whole dollar prices still store as cents', () => {
  expect(priceToStoredCents('1.25')).toBe(125);
  expect(priceToStoredCents('1250')).toBe(125000);
  expect(priceToStoredCents(0)).toBe(0);
});

test('blank and unparseable share prices store as null', () => {
  expect(priceToStoredCents('')).toBeNull();
  expect(priceToStoredCents('   ')).toBeNull();
  expect(priceToStoredCents(null)).toBeNull();
  expect(priceToStoredCents('abc')).toBeNull();
});

test('stored cents round trip back to the entered share price', () => {
  expect(storedCentsToPrice(12.34)).toBe('0.1234');
  expect(storedCentsToPriceNumber(12.34)).toBe(0.1234);
  expect(storedCentsToPrice(null)).toBe('');
  expect(storedCentsToPriceNumber(0)).toBe(0);
});

test('displayed share prices show up to four decimals', () => {
  expect(formatPricePerShare(12.34)).toBe('$0.1234');
  expect(formatPricePerShare(125)).toBe('$1.23');
  expect(formatPricePerShare(125000)).toBe('$1,250.00');
  expect(formatPricePerShare(null)).toBe('—');
});
