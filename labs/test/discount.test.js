// test/discount.test.js
// Day1-S3 리팩토링의 안전망: 이 테스트가 green 으로 유지되면 동작이 보존된 것이다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDiscount } from '../src/billing/discount.js';

test('gold, 10만 이상 → 20% 할인', () => assert.equal(applyDiscount(100000, 'gold'), 80000));
test('gold, 10만 미만 → 10% 할인', () => assert.equal(applyDiscount(50000, 'gold'), 45000));
test('silver, 10만 이상 → 10% 할인', () => assert.equal(applyDiscount(100000, 'silver'), 90000));
test('silver, 10만 미만 → 5% 할인', () => assert.equal(applyDiscount(50000, 'silver'), 47500));
test('등급 없음 → 할인 0', () => assert.equal(applyDiscount(50000, 'none'), 50000));
