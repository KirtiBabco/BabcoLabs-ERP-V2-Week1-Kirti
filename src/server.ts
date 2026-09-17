import 'dotenv/config';
import { createApp } from './app';
import { ensureSchema } from './data/db';

const port = Number(process.env.PORT || 3000);

async function start() {
  await ensureSchema();
  createApp().listen(port, () => console.log(`Week 1 Project 1 API listening on ${port}`));
}
start().catch(err => { console.error('Startup failed', err); process.exit(1); });
