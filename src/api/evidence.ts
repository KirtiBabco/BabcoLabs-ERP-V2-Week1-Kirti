import { Router } from 'express';
import multer from 'multer';
import sql from 'mssql';
import { createHash, randomUUID } from 'crypto';
import { getPool } from '../data/db';
import { getEvidenceContainer } from '../data/blob';
import { apiError } from './http';

export const evidenceRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function hash(b: Buffer) { return createHash('sha256').update(b).digest('hex'); }

evidenceRouter.post('/evidence', upload.single('file'), async (req, res) => {
  const entityType = String(req.body?.entity_type || '').trim();
  const entityId = String(req.body?.entity_id || '').trim();
  const sourceRef = req.body?.source_ref == null ? null : String(req.body.source_ref);
  if (!entityType || !entityId) return apiError(res, 400, 'VALIDATION_ERROR', 'entity_type and entity_id are required');
  if (!req.file || req.file.size === 0) return apiError(res, 400, 'EMPTY_FILE', 'A non-empty file is required');

  const evidenceId = randomUUID();
  const blobName = `${evidenceId}/${randomUUID()}`;
  const container = getEvidenceContainer();
  const block = container.getBlockBlobClient(blobName);
  const sha256 = hash(req.file.buffer);
  let uploaded = false;
  try {
    if (process.env.ENABLE_TEST_HOOKS === 'true' && req.header('x-test-force-blob-failure') === '1') throw new Error('Forced blob failure');
    await block.uploadData(req.file.buffer, { blobHTTPHeaders: { blobContentType: req.file.mimetype || 'application/octet-stream' } });
    uploaded = true;
    if (process.env.ENABLE_TEST_HOOKS === 'true' && req.header('x-test-force-sql-failure') === '1') throw new Error('Forced SQL failure');

    const pool = await getPool();
    const at = new Date();
    await pool.request().input('id', sql.UniqueIdentifier, evidenceId)
      .input('et', sql.NVarChar(80), entityType).input('eid', sql.NVarChar(120), entityId)
      .input('fn', sql.NVarChar(260), req.file.originalname).input('ct', sql.NVarChar(150), req.file.mimetype || 'application/octet-stream')
      .input('len', sql.BigInt, req.file.size).input('sha', sql.Char(64), sha256)
      .input('container', sql.NVarChar(120), container.containerName).input('blob', sql.NVarChar(500), blobName)
      .input('source', sql.NVarChar(120), sourceRef).input('at', sql.DateTime2, at)
      .query(`INSERT dbo.EvidenceItems(EvidenceId,EntityType,EntityId,OriginalFilename,ContentType,ByteLength,Sha256Hex,BlobContainer,BlobName,SourceRef,UploadedAtUtc)
              VALUES(@id,@et,@eid,@fn,@ct,@len,@sha,@container,@blob,@source,@at)`);
    res.status(201).json({ evidence_id: evidenceId, entity_type: entityType, entity_id: entityId, original_filename: req.file.originalname, byte_length: req.file.size, sha256_hex: sha256 });
  } catch (e) {
    if (uploaded) { try { await block.deleteIfExists(); } catch {} }
    console.error(e);
    return apiError(res, 500, 'EVIDENCE_STORE_FAILED', 'Evidence was not published; compensation cleanup was attempted');
  }
});

evidenceRouter.get('/evidence/:evidenceId', async (req, res) => {
  const pool = await getPool();
  const row = (await pool.request().input('id', sql.UniqueIdentifier, req.params.evidenceId).query(`
    SELECT EvidenceId evidence_id,EntityType entity_type,EntityId entity_id,OriginalFilename original_filename,
           ContentType content_type,ByteLength byte_length,Sha256Hex sha256_hex,BlobContainer blob_container,
           BlobName blob_name,SourceRef source_ref,UploadedAtUtc uploaded_at_utc
    FROM dbo.EvidenceItems WHERE EvidenceId=@id`)).recordset[0];
  if (!row) return apiError(res, 404, 'NOT_FOUND', 'Evidence item not found');
  res.json(row);
});

evidenceRouter.get('/evidence/:evidenceId/content', async (req, res) => {
  const pool = await getPool();
  const row = (await pool.request().input('id', sql.UniqueIdentifier, req.params.evidenceId)
    .query('SELECT OriginalFilename,ContentType,BlobName FROM dbo.EvidenceItems WHERE EvidenceId=@id')).recordset[0];
  if (!row) return apiError(res, 404, 'NOT_FOUND', 'Evidence item not found');
  const data = await getEvidenceContainer().getBlockBlobClient(row.BlobName).downloadToBuffer();
  res.setHeader('Content-Type', row.ContentType);
  res.setHeader('Content-Disposition', `attachment; filename="${String(row.OriginalFilename).replace(/[\r\n"]/g, '_')}"`);
  res.send(data);
});

evidenceRouter.get('/entities/:entityType/:entityId/evidence', async (req, res) => {
  const pool = await getPool();
  const rows = (await pool.request().input('et', sql.NVarChar(80), req.params.entityType).input('eid', sql.NVarChar(120), req.params.entityId).query(`
    SELECT EvidenceId evidence_id,OriginalFilename original_filename,ContentType content_type,ByteLength byte_length,
           Sha256Hex sha256_hex,SourceRef source_ref,UploadedAtUtc uploaded_at_utc
    FROM dbo.EvidenceItems WHERE EntityType=@et AND EntityId=@eid ORDER BY UploadedAtUtc`)).recordset;
  res.json(rows);
});

evidenceRouter.post('/evidence/:evidenceId/verify-integrity', async (req, res) => {
  const pool = await getPool();
  const row = (await pool.request().input('id', sql.UniqueIdentifier, req.params.evidenceId)
    .query('SELECT Sha256Hex,ByteLength,BlobName FROM dbo.EvidenceItems WHERE EvidenceId=@id')).recordset[0];
  if (!row) return apiError(res, 404, 'NOT_FOUND', 'Evidence item not found');
  const data = await getEvidenceContainer().getBlockBlobClient(row.BlobName).downloadToBuffer();
  const actual = hash(data);
  res.json({ evidence_id: req.params.evidenceId, integrity_ok: actual === row.Sha256Hex && data.length === Number(row.ByteLength), expected_sha256: row.Sha256Hex, actual_sha256: actual, expected_bytes: Number(row.ByteLength), actual_bytes: data.length });
});

evidenceRouter.post('/lab/evidence/:evidenceId/corrupt-copy-check', async (req, res) => {
  if (process.env.ENABLE_TEST_HOOKS !== 'true') return apiError(res, 404, 'NOT_FOUND', 'Not found');
  const pool = await getPool();
  const row = (await pool.request().input('id', sql.UniqueIdentifier, req.params.evidenceId)
    .query('SELECT Sha256Hex,BlobName FROM dbo.EvidenceItems WHERE EvidenceId=@id')).recordset[0];
  if (!row) return apiError(res, 404, 'NOT_FOUND', 'Evidence item not found');
  const container = getEvidenceContainer();
  const original = await container.getBlockBlobClient(row.BlobName).downloadToBuffer();
  const copyName = `lab-corrupt/${randomUUID()}`;
  const copy = container.getBlockBlobClient(copyName);
  try {
    const corrupt = Buffer.concat([original, Buffer.from('CORRUPTED')]);
    await copy.uploadData(corrupt);
    const actual = hash(await copy.downloadToBuffer());
    res.json({ original_unchanged: true, disposable_copy_integrity_ok: actual === row.Sha256Hex, expected_sha256: row.Sha256Hex, actual_sha256: actual });
  } finally {
    await copy.deleteIfExists();
  }
});
