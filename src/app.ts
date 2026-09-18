import express from 'express';
import { businessRequestsRouter } from './api/businessRequests';
import { workflowRouter } from './api/workflows';
import { evidenceRouter } from './api/evidence';
import { idempotencyRouter } from './api/idempotency';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/', (_req, res) => res.json({
    app: 'BABCO Labs ERP V2 - Week 1',
    status: 'running',
    projects: {
      project1: '/api/v1/business-requests',
      project2: '/api/v1/workflow-definitions',
      project3: '/api/v1/evidence',
      project4: '/api/v1/inventory-adjustments'
    }
  }));
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', week: 1, projects: [1,2,3,4] }));

  app.use('/api/v1/business-requests', businessRequestsRouter);
  app.use('/api/v1', workflowRouter);
  app.use('/api/v1', evidenceRouter);
  app.use('/api/v1', idempotencyRouter);
  return app;
}
