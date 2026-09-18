import 'dotenv/config';
import { createApp } from './app';
import { ensureSchema } from './data/db';
import { ensureEvidenceContainer } from './data/blob';

const port = Number(process.env.PORT || 3000);

async function start() {
  await ensureSchema();
  if (process.env.AZURE_STORAGE_ACCOUNT) await ensureEvidenceContainer();
  createApp().listen(port, () => console.log(`BABCO Labs Week 1 Projects 1-4 listening on ${port}`));
}
start().catch(err => { console.error('Startup failed', err); process.exit(1); });
