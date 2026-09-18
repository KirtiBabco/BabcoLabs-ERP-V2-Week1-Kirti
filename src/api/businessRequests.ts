import { Router, Request, Response } from 'express';
import sql from 'mssql';
import { randomUUID } from 'crypto';
import { getPool } from '../data/db';
import { validateCreate, validateLine, validatePatch } from '../validation/businessRequest';

export const businessRequestsRouter = Router();

function err(res: Response, status: number, code: string, message: string, details: unknown[] = []) {
  return res.status(status).json({ error: { code, message, details, correlationId: randomUUID() } });
}
function validationDetails(errors: any[] | null | undefined) {
  return (errors || []).map(e => ({ field: e.instancePath || e.params?.missingProperty || 'request', issue: e.message || 'invalid' }));
}
function isConflict(e: any) { return e?.number === 2627 || e?.number === 2601; }

businessRequestsRouter.post('/', async (req: Request, res: Response) => {
  if (!validateCreate(req.body)) return err(res, 400, 'VALIDATION_ERROR', 'Request validation failed', validationDetails(validateCreate.errors));
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();
    const id = randomUUID(); const now = new Date(); const b = req.body as any;
    await new sql.Request(tx)
      .input('id', sql.UniqueIdentifier, id).input('num', sql.NVarChar(40), b.request_number)
      .input('type', sql.NVarChar(30), b.request_type).input('title', sql.NVarChar(200), b.title)
      .input('desc', sql.NVarChar(2000), b.description ?? null).input('priority', sql.NVarChar(20), b.priority)
      .input('status', sql.NVarChar(20), b.status).input('owner', sql.NVarChar(50), b.owner_code)
      .input('created', sql.DateTime2, now).input('updated', sql.DateTime2, now)
      .query(`INSERT dbo.BusinessRequests(RequestId,RequestNumber,RequestType,Title,Description,Priority,Status,OwnerCode,CreatedAtUtc,UpdatedAtUtc) VALUES(@id,@num,@type,@title,@desc,@priority,@status,@owner,@created,@updated)`);
    for (const line of (Array.isArray(b.lines) ? b.lines : [])) {
      await new sql.Request(tx).input('lineId', sql.UniqueIdentifier, randomUUID()).input('requestId', sql.UniqueIdentifier, id)
        .input('lineNumber', sql.Int, line.line_number).input('itemCode', sql.NVarChar(60), line.item_code)
        .input('description', sql.NVarChar(300), line.description).input('quantity', sql.Decimal(18,3), line.quantity)
        .input('unit', sql.NVarChar(10), line.unit)
        .query(`INSERT dbo.BusinessRequestLines(LineId,RequestId,LineNumber,ItemCode,Description,Quantity,Unit) VALUES(@lineId,@requestId,@lineNumber,@itemCode,@description,@quantity,@unit)`);
    }
    await tx.commit(); return res.status(201).json({ request_id: id, request_number: b.request_number });
  } catch (e: any) {
    try { await tx.rollback(); } catch {}
    if (isConflict(e)) return err(res, 409, 'REQUEST_CONFLICT', 'request_number or line_number already exists');
    console.error(e); return err(res, 500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
});

businessRequestsRouter.get('/', async (req, res) => {
  const pool = await getPool(); const r = pool.request(); const where: string[] = [];
  if (req.query.status) { r.input('status', sql.NVarChar(20), String(req.query.status)); where.push('Status=@status'); }
  if (req.query.type) { r.input('type', sql.NVarChar(30), String(req.query.type)); where.push('RequestType=@type'); }
  if (req.query.ownerCode) { r.input('owner', sql.NVarChar(50), String(req.query.ownerCode)); where.push('OwnerCode=@owner'); }
  const q = `SELECT RequestId request_id,RequestNumber request_number,RequestType request_type,Title title,Description description,Priority priority,Status status,OwnerCode owner_code,CreatedAtUtc created_at_utc,UpdatedAtUtc updated_at_utc FROM dbo.BusinessRequests ${where.length ? 'WHERE '+where.join(' AND ') : ''} ORDER BY CreatedAtUtc DESC`;
  const rows = (await r.query(q)).recordset; res.json(rows);
});

businessRequestsRouter.get('/:requestId', async (req, res) => {
  const pool = await getPool();
  const header = (await pool.request().input('id', sql.UniqueIdentifier, req.params.requestId).query(`SELECT RequestId request_id,RequestNumber request_number,RequestType request_type,Title title,Description description,Priority priority,Status status,OwnerCode owner_code,CreatedAtUtc created_at_utc,UpdatedAtUtc updated_at_utc FROM dbo.BusinessRequests WHERE RequestId=@id`)).recordset[0];
  if (!header) return err(res, 404, 'NOT_FOUND', 'Business request not found');
  const lines = (await pool.request().input('id', sql.UniqueIdentifier, req.params.requestId).query(`SELECT LineId line_id,LineNumber line_number,ItemCode item_code,Description description,Quantity quantity,Unit unit FROM dbo.BusinessRequestLines WHERE RequestId=@id ORDER BY LineNumber`)).recordset;
  res.json({ ...header, lines });
});

businessRequestsRouter.patch('/:requestId', async (req, res) => {
  if (!validatePatch(req.body)) return err(res, 400, 'VALIDATION_ERROR', 'Request validation failed', validationDetails(validatePatch.errors));
  const pool = await getPool(); const sets: string[] = []; const r = pool.request().input('id', sql.UniqueIdentifier, req.params.requestId).input('updated', sql.DateTime2, new Date());
  const map: any = { title:['Title',sql.NVarChar(200)], description:['Description',sql.NVarChar(2000)], priority:['Priority',sql.NVarChar(20)], status:['Status',sql.NVarChar(20)], owner_code:['OwnerCode',sql.NVarChar(50)] };
  for (const [k,v] of Object.entries(req.body as Record<string, any>)) { const m=map[k]; if(m){ r.input(k,m[1],v as any); sets.push(`${m[0]}=@${k}`); } }
  const result = await r.query(`UPDATE dbo.BusinessRequests SET ${sets.join(',')}, UpdatedAtUtc=@updated WHERE RequestId=@id; SELECT @@ROWCOUNT affected;`);
  if (result.recordset[0]?.affected === 0) return err(res,404,'NOT_FOUND','Business request not found');
  res.json({ request_id:req.params.requestId, updated:true });
});

businessRequestsRouter.post('/:requestId/lines', async (req,res) => {
  if (!validateLine(req.body)) return err(res,400,'VALIDATION_ERROR','Line validation failed',validationDetails(validateLine.errors));
  const pool=await getPool(); const b=req.body as any; const lineId=randomUUID();
  try {
    const parent=(await pool.request().input('id',sql.UniqueIdentifier,req.params.requestId).query('SELECT 1 ok FROM dbo.BusinessRequests WHERE RequestId=@id')).recordset[0];
    if(!parent) return err(res,400,'PARENT_NOT_FOUND','Parent business request does not exist');
    await pool.request().input('lineId',sql.UniqueIdentifier,lineId).input('requestId',sql.UniqueIdentifier,req.params.requestId).input('lineNumber',sql.Int,b.line_number).input('itemCode',sql.NVarChar(60),b.item_code).input('description',sql.NVarChar(300),b.description).input('quantity',sql.Decimal(18,3),b.quantity).input('unit',sql.NVarChar(10),b.unit).query(`INSERT dbo.BusinessRequestLines(LineId,RequestId,LineNumber,ItemCode,Description,Quantity,Unit) VALUES(@lineId,@requestId,@lineNumber,@itemCode,@description,@quantity,@unit)`);
    res.status(201).json({ line_id:lineId });
  } catch(e:any){ if(isConflict(e)) return err(res,409,'LINE_CONFLICT','line_number already exists for request'); console.error(e); return err(res,500,'INTERNAL_ERROR','Unexpected server error'); }
});

businessRequestsRouter.patch('/:requestId/lines/:lineId', async (req,res) => {
  if (!validateLine(req.body)) return err(res,400,'VALIDATION_ERROR','Line validation failed',validationDetails(validateLine.errors));
  const pool=await getPool(); const b=req.body as any;
  try {
    const result=await pool.request().input('requestId',sql.UniqueIdentifier,req.params.requestId).input('lineId',sql.UniqueIdentifier,req.params.lineId).input('lineNumber',sql.Int,b.line_number).input('itemCode',sql.NVarChar(60),b.item_code).input('description',sql.NVarChar(300),b.description).input('quantity',sql.Decimal(18,3),b.quantity).input('unit',sql.NVarChar(10),b.unit).query(`UPDATE dbo.BusinessRequestLines SET LineNumber=@lineNumber,ItemCode=@itemCode,Description=@description,Quantity=@quantity,Unit=@unit WHERE RequestId=@requestId AND LineId=@lineId; SELECT @@ROWCOUNT affected;`);
    if(result.recordset[0]?.affected===0) return err(res,404,'NOT_FOUND','Line not found for parent request');
    res.json({ line_id:req.params.lineId, updated:true });
  } catch(e:any){ if(isConflict(e)) return err(res,409,'LINE_CONFLICT','line_number already exists for request'); return err(res,500,'INTERNAL_ERROR','Unexpected server error'); }
});
