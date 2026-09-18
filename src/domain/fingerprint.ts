import { createHash } from 'crypto';

export interface InventoryAdjustmentInput {
  sku: string;
  warehouse: string;
  quantityDelta: number;
  reason: string;
}

export function canonicalInventoryPayload(input: InventoryAdjustmentInput): string {
  return JSON.stringify({
    quantityDelta: Number(input.quantityDelta),
    reason: String(input.reason).trim(),
    sku: String(input.sku).trim(),
    warehouse: String(input.warehouse).trim()
  });
}

export function fingerprintInventoryPayload(input: InventoryAdjustmentInput): string {
  return createHash('sha256').update(canonicalInventoryPayload(input), 'utf8').digest('hex');
}
