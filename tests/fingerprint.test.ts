import { describe, expect, it } from 'vitest';
import { canonicalInventoryPayload, fingerprintInventoryPayload } from '../src/domain/fingerprint';

describe('Project 4 canonical fingerprint', () => {
  it('is stable for equivalent values', () => {
    const a = { sku:'SKU-1001', warehouse:'NJ', quantityDelta:-3, reason:'DAMAGE' };
    const b = { reason:'DAMAGE', quantityDelta:-3, warehouse:'NJ', sku:'SKU-1001' };
    expect(canonicalInventoryPayload(a)).toBe(canonicalInventoryPayload(b));
    expect(fingerprintInventoryPayload(a)).toBe(fingerprintInventoryPayload(b));
  });
  it('changes for a meaningful value change', () => {
    const a = { sku:'SKU-1001', warehouse:'NJ', quantityDelta:-3, reason:'DAMAGE' };
    const b = { sku:'SKU-1001', warehouse:'NJ', quantityDelta:-4, reason:'DAMAGE' };
    expect(fingerprintInventoryPayload(a)).not.toBe(fingerprintInventoryPayload(b));
  });
});
