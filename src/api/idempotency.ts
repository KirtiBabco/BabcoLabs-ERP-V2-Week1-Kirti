import { Router } from 'express';
import sql from 'mssql';
import { randomUUID } from 'crypto';
import { getPool } from '../data/db';
import { apiError } from './http';
import { fingerprintInventoryPayload, InventoryAdjustmentInput } from '../domain/fingerprint';

export const idempotencyRouter = Router();

function validPayload(b: any): b is InventoryAdjustmentInput {
  return !!b && typeof b.sku === 'string' && b.sku.trim().length > 0 &&
    typeof b.warehouse === 'string' && b.warehouse.trim().length > 0 &&
    typeof b.reason === 'string' && b.reason.trim().length > 0 &&
    typeof b.quantityDelta === 'number' && Number.isFinite(b.quantityDelta) && b.quantityDelta !== 0;
}

idempotencyRouter.post('/inventory-adjustments', async (req, res) => {
  const key = String(req.header('Idempotency-Key') || '').trim();
  if (!key || key.length > 160) return apiError(res, 400, 'IDEMPOTENCY_KEY_REQUIRED', 'A valid Idempotency-Key header is required');
  if (!validPayload(req.body)) return apiError(res, 400, 'VALIDATION_ERROR', 'sku, warehouse, non-zero quantityDelta and reason are required');

  const payload = req.body as InventoryAdjustmentInput;
  const fp = fingerprintInventoryPayload(payload);
  const pool = await getPool();

  for (let attempt = 0; attempt < 2; attempt++) {
    const tx = new sql.Transaction(pool);
    try {
      await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
      const existing = (await new sql.Request(tx).input('key', sql.NVarChar(160), key).query(`
        SELECT IdempotencyKey,RequestFingerprint,ProcessingStatus,ResponseJson
        FROM dbo.IdempotencyRecords WITH (UPDLOCK,HOLDLOCK) WHERE IdempotencyKey=@key`)).recordset[0];

      if (existing) {
        if (existing.RequestFingerprint !== fp) {
          await tx.rollback();
          return apiError(res, 409, 'IDEMPOTENCY_CONFLICT', 'Idempotency-Key was already used with a different payload');
        }
        if (existing.ProcessingStatus === 'COMPLETED' && existing.ResponseJson) {
          await tx.commit();
          const saved = JSON.parse(existing.ResponseJson);
          return res.status(200).json({ ...saved, replayed: true });
        }
        await tx.rollback();
        return apiError(res, 409, 'IDEMPOTENCY_IN_PROGRESS', 'The request with this key is already processing');
      }

      const now = new Date();
      const adjustmentId = randomUUID();
      await new sql.Request(tx).input('key', sql.NVarChar(160), key).input('fp', sql.Char(64), fp).input('at', sql.DateTime2, now)
        .query(`INSERT dbo.IdempotencyRecords(IdempotencyKey,RequestFingerprint,ProcessingStatus,CreatedAtUtc)
                VALUES(@key,@fp,'PROCESSING',@at)`);
      await new sql.Request(tx).input('id', sql.UniqueIdentifier, adjustmentId).input('key', sql.NVarChar(160), key)
        .input('sku', sql.NVarChar(60), payload.sku.trim()).input('wh', sql.NVarChar(30), payload.warehouse.trim())
        .input('qty', sql.Decimal(18,3), payload.quantityDelta).input('reason', sql.NVarChar(80), payload.reason.trim()).input('at', sql.DateTime2, now)
        .query(`INSERT dbo.InventoryAdjustments(AdjustmentId,IdempotencyKey,Sku,Warehouse,QuantityDelta,Reason,CreatedAtUtc)
                VALUES(@id,@key,@sku,@wh,@qty,@reason,@at)`);
      const response = { adjustment_id: adjustmentId, sku: payload.sku.trim(), warehouse: payload.warehouse.trim(), quantity_delta: payload.quantityDelta, reason: payload.reason.trim() };
      await new sql.Request(tx).input('key', sql.NVarChar(160), key).input('ref', sql.NVarChar(160), adjustmentId)
        .input('json', sql.NVarChar(sql.MAX), JSON.stringify(response)).input('at', sql.DateTime2, now)
        .query(`UPDATE dbo.IdempotencyRecords SET ProcessingStatus='COMPLETED',ResultReference=@ref,HttpStatus=201,ResponseJson=@json,CompletedAtUtc=@at WHERE IdempotencyKey=@key`);
      await tx.commit();

      if (process.env.ENABLE_TEST_HOOKS === 'true' && req.header('x-test-simulate-lost-response') === '1') {
        return req.socket.destroy();
      }
      return res.status(201).json({ ...response, replayed: false });
    } catch (e: any) {
      try { await tx.rollback(); } catch {}
      if (e?.number === 1205 && attempt === 0) continue;
      if ((e?.number === 2627 || e?.number === 2601) && attempt === 0) continue;
      console.error(e);
      return apiError(res, 500, 'IDEMPOTENCY_FAILED', 'Idempotent operation failed without a committed partial result');
    }
  }
  return apiError(res, 409, 'IDEMPOTENCY_RETRY', 'Retry the request with the same key');
});

idempotencyRouter.get('/inventory-adjustments/:adjustmentId', async (req, res) => {
  const pool = await getPool();
  const row = (await pool.request().input('id', sql.UniqueIdentifier, req.params.adjustmentId).query(`
    SELECT AdjustmentId adjustment_id,IdempotencyKey idempotency_key,Sku sku,Warehouse warehouse,
           QuantityDelta quantity_delta,Reason reason,CreatedAtUtc created_at_utc
    FROM dbo.InventoryAdjustments WHERE AdjustmentId=@id`)).recordset[0];
  if (!row) return apiError(res, 404, 'NOT_FOUND', 'Inventory adjustment not found');
  res.json(row);
});

idempotencyRouter.get('/idempotency/:idempotencyKey', async (req, res) => {
  const pool = await getPool();
  const row = (await pool.request().input('key', sql.NVarChar(160), req.params.idempotencyKey).query(`
    SELECT IdempotencyKey idempotency_key,RequestFingerprint request_fingerprint,ProcessingStatus processing_status,
           ResultReference result_reference,HttpStatus http_status,CreatedAtUtc created_at_utc,CompletedAtUtc completed_at_utc
    FROM dbo.IdempotencyRecords WHERE IdempotencyKey=@key`)).recordset[0];
  if (!row) return apiError(res, 404, 'NOT_FOUND', 'Idempotency record not found');
  res.json(row);
});
