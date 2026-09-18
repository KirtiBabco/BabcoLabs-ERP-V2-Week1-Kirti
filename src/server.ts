import 'dotenv/config';
import { createApp } from './app';
import { ensureSchema } from './data/db';
import { ensureEvidenceContainer } from './data/blob';
import { recordStartupError, startupState } from './startup';

const port = Number(process.env.PORT || 3000);
const app = createApp();

app.listen(port, () => {
  console.log(`BABCO Labs Week 1 Projects 1-4 listening on ${port}`);
});

async function initializeDependencies() {
  try {
    startupState.sql = 'running';
    await ensureSchema();
    startupState.sql = 'ready';

    if (process.env.AZURE_STORAGE_ACCOUNT) {
      startupState.storage = 'running';
      await ensureEvidenceContainer();
      startupState.storage = 'ready';
    } else {
      startupState.storage = 'skipped';
    }

    startupState.ready = true;
    startupState.error = null;
    console.log('Week 1 dependencies ready');
  } catch (error) {
    if (startupState.sql === 'running') startupState.sql = 'failed';
    else if (startupState.storage === 'running') startupState.storage = 'failed';
    recordStartupError(error);
    console.error('Week 1 dependency initialization failed', error);
  }
}

void initializeDependencies();
