export const startupState = {
  sql: 'pending' as 'pending' | 'running' | 'ready' | 'failed',
  storage: 'pending' as 'pending' | 'running' | 'ready' | 'skipped' | 'failed',
  ready: false,
  error: null as string | null
};

export function recordStartupError(error: unknown): void {
  startupState.error = error instanceof Error ? error.message : String(error);
  startupState.ready = false;
}
