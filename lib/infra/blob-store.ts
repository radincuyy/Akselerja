import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  type ContainerClient,
} from "@azure/storage-blob";

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT;
const ACCOUNT_KEY = process.env.AZURE_STORAGE_KEY;
const CV_CONTAINER_NAME =
  process.env.AZURE_STORAGE_CV_CONTAINER ??
  process.env.BLOB_CONTAINER_CV ??
  "cvs";
const PRACTICE_CONTAINER_NAME =
  process.env.AZURE_STORAGE_PRACTICE_CONTAINER ??
  process.env.BLOB_CONTAINER_PRACTICE ??
  "practice-evidence";

export function isBlobConfigured(): boolean {
  return Boolean(CONNECTION_STRING || (ACCOUNT_NAME && ACCOUNT_KEY));
}

let _service: BlobServiceClient | null = null;
const _containers = new Map<string, ContainerClient>();
const _ensuredContainers = new Set<string>();

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

function getStorageContainer(containerName: string): ContainerClient {
  const existing = _containers.get(containerName);
  if (existing) return existing;
  const container = getService().getContainerClient(containerName);
  _containers.set(containerName, container);
  return container;
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

async function uploadToContainer(
  containerName: string,
  folder: string,
  data: Buffer | ArrayBuffer | Uint8Array,
  originalFilename: string,
  contentType: string,
  options: { ensureContainer?: boolean } = {},
): Promise<UploadCvResult> {
  if (!isBlobConfigured()) {
    throw new Error("Blob storage is not configured");
  }
  const container = getStorageContainer(containerName);
  if (options.ensureContainer && !_ensuredContainers.has(containerName)) {
    await container.createIfNotExists({ access: undefined });
    _ensuredContainers.add(containerName);
  }
  const ts = Date.now();
  const safeName = sanitizeFilename(originalFilename);
  const safeFolder = folder
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "");
  const blobName = `${safeFolder}/${ts}-${safeName}`;
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

export async function uploadCv(
  data: Buffer | ArrayBuffer | Uint8Array,
  originalFilename: string,
  userId: string,
  contentType: string,
): Promise<UploadCvResult> {
  return uploadToContainer(
    CV_CONTAINER_NAME,
    userId,
    data,
    originalFilename,
    contentType,
  );
}

export async function uploadPracticeEvidence(
  data: Buffer | ArrayBuffer | Uint8Array,
  originalFilename: string,
  userId: string,
  contentType: string,
): Promise<UploadCvResult> {
  return uploadToContainer(
    PRACTICE_CONTAINER_NAME,
    userId,
    data,
    originalFilename,
    contentType,
    { ensureContainer: true },
  );
}

export async function deleteBlob(blobName: string): Promise<void> {
  if (!isBlobConfigured()) return;
  const container = getStorageContainer(CV_CONTAINER_NAME);
  try {
    await container.getBlockBlobClient(blobName).deleteIfExists();
  } catch {
    // Best-effort cleanup
  }
}

export async function downloadBlobToBuffer(blobName: string): Promise<{
  buffer: Buffer;
  contentType?: string;
  contentLength?: number;
}> {
  if (!isBlobConfigured()) {
    throw new Error("Blob storage is not configured");
  }
  const container = getStorageContainer(CV_CONTAINER_NAME);
  const blob = container.getBlobClient(blobName);
  const buffer = await blob.downloadToBuffer();
  const properties = await blob.getProperties();
  return {
    buffer,
    contentType: properties.contentType,
    contentLength: properties.contentLength,
  };
}
