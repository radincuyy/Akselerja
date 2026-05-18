import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
  type ContainerClient,
} from "@azure/storage-blob";

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT;
const ACCOUNT_KEY = process.env.AZURE_STORAGE_KEY;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CV_CONTAINER ?? "cvs";

export function isBlobConfigured(): boolean {
  return Boolean(CONNECTION_STRING || (ACCOUNT_NAME && ACCOUNT_KEY));
}

function parseAccountFromConnectionString(): {
  account: string;
  key: string;
} | null {
  if (!CONNECTION_STRING) return null;
  const parts = Object.fromEntries(
    CONNECTION_STRING.split(";")
      .filter(Boolean)
      .map((kv) => {
        const idx = kv.indexOf("=");
        return [kv.slice(0, idx), kv.slice(idx + 1)];
      }),
  );
  const account = parts.AccountName;
  const key = parts.AccountKey;
  if (!account || !key) return null;
  return { account, key };
}

let _service: BlobServiceClient | null = null;
let _container: ContainerClient | null = null;

function getService(): BlobServiceClient {
  if (_service) return _service;
  if (CONNECTION_STRING) {
    _service = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
  } else if (ACCOUNT_NAME && ACCOUNT_KEY) {
    const cred = new StorageSharedKeyCredential(ACCOUNT_NAME, ACCOUNT_KEY);
    _service = new BlobServiceClient(
      `https://${ACCOUNT_NAME}.blob.core.windows.net`,
      cred,
    );
  } else {
    throw new Error(
      "Azure Blob not configured. Set AZURE_STORAGE_CONNECTION_STRING in .env.local",
    );
  }
  return _service;
}

function getContainer(): ContainerClient {
  if (_container) return _container;
  _container = getService().getContainerClient(CONTAINER_NAME);
  return _container;
}

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}._-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "cv";
}

export type UploadCvResult = {
  blobName: string;
  blobUrl: string;
  contentType: string;
  sizeBytes: number;
};

export async function uploadCv(
  data: Buffer | ArrayBuffer | Uint8Array,
  originalFilename: string,
  userId: string,
  contentType: string,
): Promise<UploadCvResult> {
  if (!isBlobConfigured()) {
    throw new Error("Blob storage is not configured");
  }
  const container = getContainer();
  const ts = Date.now();
  const safeName = sanitizeFilename(originalFilename);
  const blobName = `${userId}/${ts}-${safeName}`;
  const blockBlob = container.getBlockBlobClient(blobName);

  const buffer =
    data instanceof Buffer
      ? data
      : Buffer.from(data instanceof Uint8Array ? data : new Uint8Array(data));

  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobContentDisposition: `attachment; filename="${originalFilename.replace(/"/g, "")}"`,
    },
  });

  return {
    blobName,
    blobUrl: blockBlob.url,
    contentType,
    sizeBytes: buffer.byteLength,
  };
}

export function makeReadSasUrl(
  blobName: string,
  expiresInMinutes = 30,
): string {
  if (!isBlobConfigured()) return "";
  const parsed = parseAccountFromConnectionString();
  if (!parsed && (!ACCOUNT_NAME || !ACCOUNT_KEY)) {
    throw new Error(
      "Cannot mint SAS: no AccountKey available (connection string or AZURE_STORAGE_KEY required)",
    );
  }
  const account = parsed?.account ?? ACCOUNT_NAME!;
  const key = parsed?.key ?? ACCOUNT_KEY!;
  const cred = new StorageSharedKeyCredential(account, key);
  const startsOn = new Date(Date.now() - 60_000); // toleransi clock skew 1 menit
  const expiresOn = new Date(Date.now() + expiresInMinutes * 60_000);
  const sas = generateBlobSASQueryParameters(
    {
      containerName: CONTAINER_NAME,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn,
      expiresOn,
      protocol: SASProtocol.Https,
    },
    cred,
  ).toString();
  return `https://${account}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}?${sas}`;
}

export async function deleteBlob(blobName: string): Promise<void> {
  if (!isBlobConfigured()) return;
  const container = getContainer();
  try {
    await container.getBlockBlobClient(blobName).deleteIfExists();
  } catch {
    // Best-effort cleanup
  }
}
