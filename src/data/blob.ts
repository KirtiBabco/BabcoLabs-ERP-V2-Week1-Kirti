import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

let containerClient: ContainerClient | null = null;

export function getEvidenceContainer(): ContainerClient {
  if (containerClient) return containerClient;
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  const container = process.env.AZURE_STORAGE_CONTAINER || 'week1-evidence';
  if (!account) throw new Error('AZURE_STORAGE_ACCOUNT is not configured');
  const credential = new DefaultAzureCredential({
    managedIdentityClientId: process.env.AZURE_STORAGE_CLIENT_ID || process.env.AZURE_SQL_CLIENT_ID
  });
  const service = new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
  containerClient = service.getContainerClient(container);
  return containerClient;
}

export async function ensureEvidenceContainer(): Promise<void> {
  await getEvidenceContainer().createIfNotExists();
}
