import { Response } from 'express';
import { randomUUID } from 'crypto';

export function apiError(res: Response, status: number, code: string, message: string, details: unknown[] = []) {
  return res.status(status).json({ error: { code, message, details, correlationId: randomUUID() } });
}

export function isSqlUniqueConflict(e: any): boolean {
  return e?.number === 2627 || e?.number === 2601;
}
