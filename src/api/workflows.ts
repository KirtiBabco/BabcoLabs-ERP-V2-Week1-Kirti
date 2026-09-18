import { Router } from 'express';
import sql from 'mssql';
import { randomUUID } from 'crypto';
import { getPool } from '../data/db';
import { apiError } from './http';

export const workflowRouter = Router();

workflowRouter.get('/workflow-definitions', async (_req, res) => {
  const pool = await getPool();
  const rows = (await pool.request().query(`
    SELECT DefinitionId definition_id, DefinitionKey definition_key, Version version,
           DisplayName display_name, InitialStateKey initial_state
    FROM dbo.WorkflowDefinitions ORDER BY DefinitionKey, Version`)).recordset;
  res.json(rows);
});

workflowRouter.post('/workflow-instances', async (req, res) => {
  const key = String(req.body?.definition_key || '').trim();
  const version = Number(req.body?.version || 1);
  if (!key) return apiError(res, 400, 'VALIDATION_ERROR', 'definition_key is required');
  const pool = await getPool();
  const def = (await pool.request().input('key', sql.NVarChar(80), key).input('version', sql.Int, version)
    .query('SELECT TOP 1 DefinitionId, InitialStateKey FROM dbo.WorkflowDefinitions WHERE DefinitionKey=@key AND Version=@version')).recordset[0];
  if (!def) return apiError(res, 400, 'INVALID_DEFINITION', 'Workflow definition not found');
  const id = randomUUID();
  const now = new Date();
  await pool.request().input('id', sql.UniqueIdentifier, id).input('def', sql.UniqueIdentifier, def.DefinitionId)
    .input('state', sql.NVarChar(80), def.InitialStateKey).input('now', sql.DateTime2, now)
    .query('INSERT dbo.WorkflowInstances(InstanceId,DefinitionId,CurrentStateKey,Revision,CreatedAtUtc,UpdatedAtUtc) VALUES(@id,@def,@state,0,@now,@now)');
  res.status(201).json({ instance_id: id, definition_key: key, current_state: def.InitialStateKey, revision: 0 });
});

workflowRouter.get('/workflow-instances/:instanceId', async (req, res) => {
  const pool = await getPool();
  const row = (await pool.request().input('id', sql.UniqueIdentifier, req.params.instanceId).query(`
    SELECT i.InstanceId instance_id,d.DefinitionKey definition_key,d.Version version,
           i.CurrentStateKey current_state,i.Revision revision,i.CreatedAtUtc created_at_utc,i.UpdatedAtUtc updated_at_utc
    FROM dbo.WorkflowInstances i JOIN dbo.WorkflowDefinitions d ON d.DefinitionId=i.DefinitionId
    WHERE i.InstanceId=@id`)).recordset[0];
  if (!row) return apiError(res, 404, 'NOT_FOUND', 'Workflow instance not found');
  res.json(row);
});

workflowRouter.post('/workflow-instances/:instanceId/transitions', async (req, res) => {
  const transition = String(req.body?.transition || '').trim();
  const expected = String(req.body?.expectedCurrentState || '').trim();
  const actor = String(req.body?.actorRef || '').trim();
  const reason = req.body?.reason == null ? null : String(req.body.reason);
  if (!transition || !expected || !actor) return apiError(res, 400, 'VALIDATION_ERROR', 'transition, expectedCurrentState and actorRef are required');

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    const locked = (await new sql.Request(tx).input('id', sql.UniqueIdentifier, req.params.instanceId).query(`
      SELECT i.InstanceId,i.DefinitionId,i.CurrentStateKey,i.Revision
      FROM dbo.WorkflowInstances i WITH (UPDLOCK,HOLDLOCK) WHERE i.InstanceId=@id`)).recordset[0];
    if (!locked) { await tx.rollback(); return apiError(res, 404, 'NOT_FOUND', 'Workflow instance not found'); }
    if (locked.CurrentStateKey !== expected) { await tx.rollback(); return apiError(res, 409, 'STALE_STATE', 'expectedCurrentState does not match current state'); }

    const edge = (await new sql.Request(tx)
      .input('def', sql.UniqueIdentifier, locked.DefinitionId)
      .input('transition', sql.NVarChar(80), transition)
      .input('fromState', sql.NVarChar(80), locked.CurrentStateKey)
      .query(`SELECT TOP 1 ToStateKey FROM dbo.WorkflowTransitions
              WHERE DefinitionId=@def AND TransitionKey=@transition AND FromStateKey=@fromState`)).recordset[0];
    if (!edge) { await tx.rollback(); return apiError(res, 409, 'INVALID_TRANSITION', 'Transition is not allowed from current state'); }

    const now = new Date();
    await new sql.Request(tx).input('id', sql.UniqueIdentifier, req.params.instanceId)
      .input('state', sql.NVarChar(80), edge.ToStateKey).input('now', sql.DateTime2, now)
      .query('UPDATE dbo.WorkflowInstances SET CurrentStateKey=@state, Revision=Revision+1, UpdatedAtUtc=@now WHERE InstanceId=@id');

    if (process.env.ENABLE_TEST_HOOKS === 'true' && req.header('x-test-force-history-failure') === '1') {
      throw new Error('Forced history failure');
    }

    await new sql.Request(tx)
      .input('hid', sql.UniqueIdentifier, randomUUID()).input('iid', sql.UniqueIdentifier, req.params.instanceId)
      .input('tk', sql.NVarChar(80), transition).input('from', sql.NVarChar(80), locked.CurrentStateKey)
      .input('to', sql.NVarChar(80), edge.ToStateKey).input('actor', sql.NVarChar(120), actor)
      .input('reason', sql.NVarChar(500), reason).input('at', sql.DateTime2, now)
      .query(`INSERT dbo.WorkflowTransitionHistory(HistoryId,InstanceId,TransitionKey,FromStateKey,ToStateKey,ActorRef,Reason,OccurredAtUtc)
              VALUES(@hid,@iid,@tk,@from,@to,@actor,@reason,@at)`);
    await tx.commit();
    res.json({ instance_id: req.params.instanceId, from_state: locked.CurrentStateKey, to_state: edge.ToStateKey, transition, revision: Number(locked.Revision) + 1 });
  } catch (e) {
    try { await tx.rollback(); } catch {}
    console.error(e);
    return apiError(res, 500, 'TRANSITION_FAILED', 'Transition failed and was rolled back');
  }
});

workflowRouter.get('/workflow-instances/:instanceId/history', async (req, res) => {
  const pool = await getPool();
  const exists = (await pool.request().input('id', sql.UniqueIdentifier, req.params.instanceId)
    .query('SELECT 1 ok FROM dbo.WorkflowInstances WHERE InstanceId=@id')).recordset[0];
  if (!exists) return apiError(res, 404, 'NOT_FOUND', 'Workflow instance not found');
  const rows = (await pool.request().input('id', sql.UniqueIdentifier, req.params.instanceId).query(`
    SELECT HistoryId history_id,TransitionKey transition_key,FromStateKey from_state,ToStateKey to_state,
           ActorRef actor_ref,Reason reason,OccurredAtUtc occurred_at_utc
    FROM dbo.WorkflowTransitionHistory WHERE InstanceId=@id ORDER BY OccurredAtUtc, HistoryId`)).recordset;
  res.json(rows);
});
