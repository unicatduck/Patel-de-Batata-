import * as FileSystem from 'expo-file-system';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const SYNC_FILENAME = 'patel-de-batata-sync.json';

export interface DriveAudioFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
}

export async function listDriveAudioFiles(token: string): Promise<DriveAudioFile[]> {
  const q = encodeURIComponent("mimeType contains 'audio/' and trashed = false");
  const fields = encodeURIComponent('files(id,name,mimeType,size)');
  const res = await fetch(
    `${DRIVE_API}/files?q=${q}&fields=${fields}&pageSize=200`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Drive API ${res.status}`);
  const data = await res.json();
  return (data.files ?? []) as DriveAudioFile[];
}

export async function downloadDriveFile(
  token: string,
  fileId: string,
  destUri: string,
): Promise<void> {
  const dl = FileSystem.createDownloadResumable(
    `${DRIVE_API}/files/${fileId}?alt=media`,
    destUri,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const result = await dl.downloadAsync();
  if (!result || result.status !== 200) {
    throw new Error(`Download failed: ${result?.status}`);
  }
}

export async function saveSyncData(token: string, data: object): Promise<void> {
  const body = JSON.stringify(data);
  const q = encodeURIComponent(`name='${SYNC_FILENAME}'`);
  const listRes = await fetch(
    `${DRIVE_API}/files?spaces=appDataFolder&q=${q}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const listData = await listRes.json();
  const existingId: string | undefined = listData.files?.[0]?.id;

  if (existingId) {
    await fetch(`${UPLOAD_API}/files/${existingId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
    });
    return;
  }

  const boundary = 'pdb_' + Date.now().toString(36);
  const multipart = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify({ name: SYNC_FILENAME, parents: ['appDataFolder'] }),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    body,
    `--${boundary}--`,
  ].join('\r\n');

  await fetch(`${UPLOAD_API}/files?uploadType=multipart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipart,
  });
}

export async function loadSyncData(token: string): Promise<Record<string, unknown> | null> {
  const q = encodeURIComponent(`name='${SYNC_FILENAME}'`);
  const listRes = await fetch(
    `${DRIVE_API}/files?spaces=appDataFolder&q=${q}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const listData = await listRes.json();
  const fileId: string | undefined = listData.files?.[0]?.id;
  if (!fileId) return null;
  const fileRes = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!fileRes.ok) return null;
  return fileRes.json() as Promise<Record<string, unknown>>;
}
