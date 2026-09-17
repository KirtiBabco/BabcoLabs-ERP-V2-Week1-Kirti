import express from 'express';
import { businessRequestsRouter } from './api/businessRequests';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.get('/', (_req,res) => res.json({ app:'BABCO Labs Week 1 - Project 1 Business Record API', status:'running', endpoints:'/api/v1/business-requests' }));
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', week: 1, project: 1 }));
  app.use('/api/v1/business-requests', businessRequestsRouter);
  return app;
}
