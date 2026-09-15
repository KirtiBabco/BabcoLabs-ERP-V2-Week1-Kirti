export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSqlConnectionString(): string {
  return requireEnv("AZURE_SQL_CONNECTION_STRING");
}

export function getStorageConnectionString(): string {
  return requireEnv("AZURE_STORAGE_CONNECTION_STRING");
}
