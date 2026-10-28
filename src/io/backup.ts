import JSZip from 'jszip';
import { db, type StoredCard, type StoredLorebook, type ConnectionProfile, type AppSetting } from '../db';
import { decryptText } from '../utils/crypto';
import { useCardStore } from '../store/useCardStore';
import { buf2b64, b642buf } from '../utils/binaryEncoding';

const DEVICE_SECURITY_SETTING_KEYS = new Set([
  'crypto_salt',
  'crypto_hash',
  'crypto_mode',
  'crypto_recovery_salt',
  'crypto_recovery_wrapped_key',
  'crypto_recovery_confirmed',
  'passkey_credential_id',
  'passkey_wrapped_key',
  'passkey_prf_salt',
]);

export interface FullBackupData {
  version: number;
  exportedAt: string;
  cards: StoredCard[];
  lorebooks: StoredLorebook[];
  connectionProfiles: ConnectionProfile[];
  settings?: AppSetting[];
}

function normalizeAssetToUint8Array(val: any): Uint8Array | null {
  if (!val) return null;
  if (val instanceof Uint8Array) return val;
  if (typeof val === 'string') {
    try {
      // Check if data URL or base64
      const clean = val.includes(',') ? val.split(',')[1] : val;
      return b642buf(clean);
    } catch {
      return null;
    }
  }
  if (typeof val === 'object') {
    // Check if plain object with numeric keys like {"0": 137, "1": 80}
    const keys = Object.keys(val);
    if (keys.length > 0 && keys.every((k) => !isNaN(Number(k)))) {
      const arr = new Uint8Array(keys.length);
      for (let i = 0; i < keys.length; i++) {
        arr[i] = Number(val[i]);
      }
      return arr;
    }
  }
  return null;
}

export async function createFullBackupJson(includeApiKeys: boolean = false): Promise<string> {
  const cards = await db.cards.toArray();
  const lorebooks = await db.lorebooks.toArray();
  const connectionProfiles = await db.connectionProfiles.toArray();
  // Device-bound vault credentials travel only when the user explicitly includes API keys.
  const settings = (await db.settings.toArray()).filter(
    (setting) => includeApiKeys || !DEVICE_SECURITY_SETTING_KEYS.has(setting.key)
  );

  const serializableCards = cards.map((card) => {
    if (!card.embeddedAssets) return card;
    const assetsCopy: Record<string, any> = {};
    for (const [uri, binary] of Object.entries(card.embeddedAssets)) {
      if (binary instanceof Uint8Array) {
        assetsCopy[uri] = `raw.b64.${buf2b64(binary)}`;
      } else {
        const norm = normalizeAssetToUint8Array(binary);
        if (norm) {
          assetsCopy[uri] = `raw.b64.${buf2b64(norm)}`;
        }
      }
    }
    return { ...card, embeddedAssets: assetsCopy as any };
  });

  const processedProfiles = connectionProfiles.map((prof) => {
    if (includeApiKeys) {
      return prof;
    }
    const { apiKey, ...rest } = prof;
    return {
      ...rest,
      apiKey: undefined,
      ...(apiKey ? { apiKeyRedacted: true } : {}),
    };
  });

  const backup: FullBackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    cards: serializableCards,
    lorebooks,
    connectionProfiles: processedProfiles,
    settings,
  };

  return JSON.stringify(backup, null, 2);
}

export async function createFullBackupZip(includeApiKeys: boolean = false): Promise<Uint8Array> {
  const zip = new JSZip();
  const jsonStr = await createFullBackupJson(includeApiKeys);
  zip.file('backup.json', jsonStr);

  const cards = await db.cards.toArray();
  const assetsFolder = zip.folder('assets');
  if (assetsFolder) {
    for (const card of cards) {
      if (card.embeddedAssets) {
        for (const [uri, binary] of Object.entries(card.embeddedAssets)) {
          const norm = normalizeAssetToUint8Array(binary);
          if (norm) {
            const cleanPath = `${card.uuid}/${uri.replace(/^embeded:\/\//, '')}`;
            assetsFolder.file(cleanPath, norm);
          }
        }
      }
    }
  }

  return await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

export const MAX_BACKUP_PAYLOAD_SIZE = 200 * 1024 * 1024; // 200 MB

export async function parseBackupPayload(input: string | Uint8Array): Promise<FullBackupData> {
  const inputByteLength = typeof input === 'string' ? new TextEncoder().encode(input).byteLength : input.byteLength;
  if (inputByteLength > MAX_BACKUP_PAYLOAD_SIZE) {
    throw new Error(`Payload size (${Math.round(inputByteLength / 1024 / 1024)}MB) exceeds maximum limit of 200MB.`);
  }

  if (typeof input === 'string') {
    return JSON.parse(input);
  }

  if (input.length >= 4 && input[0] === 0x50 && input[1] === 0x4b && input[2] === 0x03 && input[3] === 0x04) {
    const zip = await JSZip.loadAsync(input);
    const backupFile = zip.file('backup.json');
    if (backupFile) {
      const text = await backupFile.async('text');
      return JSON.parse(text);
    }
    throw new Error('Invalid backup ZIP: backup.json not found inside archive.');
  }

  const text = new TextDecoder('utf-8').decode(input);
  return JSON.parse(text);
}

export async function restoreFullBackup(
  input: string | Uint8Array,
  mode: 'overwrite' | 'merge' = 'merge'
): Promise<{
  cardsCount: number;
  lorebooksCount: number;
  profilesCount: number;
  cardsSkipped: number;
  errors: string[];
}> {
  let backupData: FullBackupData | null = null;
  const zipAssetsMap: Record<string, Record<string, Uint8Array>> = {}; // cardUuid -> { uri -> Uint8Array }
  const errors: string[] = [];

  // Check input payload length
  const inputByteLength = typeof input === 'string' ? new TextEncoder().encode(input).byteLength : input.byteLength;
  if (inputByteLength > MAX_BACKUP_PAYLOAD_SIZE) {
    throw new Error(`Restore failed: Backup payload size (${Math.round(inputByteLength / 1024 / 1024)}MB) exceeds maximum limit of 200MB.`);
  }

  if (typeof input === 'string') {
    backupData = JSON.parse(input);
  } else {
    if (input.length >= 4 && input[0] === 0x50 && input[1] === 0x4b && input[2] === 0x03 && input[3] === 0x04) {
      const zip = await JSZip.loadAsync(input);
      const backupFile = zip.file('backup.json');
      if (backupFile) {
        const text = await backupFile.async('text');
        backupData = JSON.parse(text);
      } else {
        throw new Error('Invalid backup ZIP: backup.json not found inside archive.');
      }

      // Read assets folder entries if present
      const assetsFolder = zip.folder('assets');
      if (assetsFolder) {
        for (const [relativePath, file] of Object.entries(assetsFolder.files)) {
          if (file.dir) continue;
          // Path format: assets/<cardUuid>/<assetPath>
          const cleanPath = relativePath.replace(/^assets\//, '');
          const slashIdx = cleanPath.indexOf('/');
          if (slashIdx > 0) {
            const cardUuid = cleanPath.substring(0, slashIdx);
            const assetPath = cleanPath.substring(slashIdx + 1);
            if (assetPath) {
              const binary = await file.async('uint8array');
              const uri = assetPath.startsWith('embeded://') ? assetPath : `embeded://${assetPath}`;
              if (!zipAssetsMap[cardUuid]) {
                zipAssetsMap[cardUuid] = {};
              }
              zipAssetsMap[cardUuid][uri] = binary;
            }
          }
        }
      }
    } else {
      const text = new TextDecoder('utf-8').decode(input);
      backupData = JSON.parse(text);
    }
  }

  if (!backupData || !Array.isArray(backupData.cards)) {
    throw new Error('Invalid backup file: Missing cards list.');
  }

  let cardsCount = 0;
  let cardsSkipped = 0;
  let lorebooksCount = 0;
  let profilesCount = 0;

  await db.transaction('rw', [db.cards, db.lorebooks, db.connectionProfiles, db.settings], async () => {
    if (mode === 'overwrite') {
      await db.cards.clear();
      await db.lorebooks.clear();
      await db.connectionProfiles.clear();
    }

    if (Array.isArray(backupData.cards)) {
      for (const card of backupData.cards) {
        if (!card.uuid) {
          cardsSkipped++;
          continue;
        }
        try {
          // Restore / deserialize embedded assets
          const restoredAssets: Record<string, Uint8Array> = {};

          // First populate from JSON card.embeddedAssets
          if (card.embeddedAssets && typeof card.embeddedAssets === 'object') {
            for (const [uri, val] of Object.entries(card.embeddedAssets)) {
              let cleanVal: unknown = val;
              if (typeof val === 'string') {
                if ((val as string).startsWith('raw.b64.')) {
                  cleanVal = (val as string).substring(8);
                } else if ((val as string).startsWith('enc.b64.')) {
                  cleanVal = (val as string).substring(8);
                }
              }
              const norm = normalizeAssetToUint8Array(cleanVal);
              if (norm) {
                restoredAssets[uri] = norm;
              }
            }
          }

          // Merge zipAssetsMap if available for this card
          if (zipAssetsMap[card.uuid]) {
            for (const [uri, binary] of Object.entries(zipAssetsMap[card.uuid])) {
              restoredAssets[uri] = binary;
            }
          }

          card.embeddedAssets = restoredAssets;

          const existing = await db.cards.where('uuid').equals(card.uuid).first();
          if (existing && existing.id) {
            if (mode === 'overwrite' || mode === 'merge') {
              await db.cards.update(existing.id, {
                name: card.name,
                tags: card.tags || [],
                creator: card.creator || '',
                creation_date: card.creation_date,
                modification_date: card.modification_date,
                order: card.order,
                cardData: card.cardData,
                embeddedAssets: card.embeddedAssets,
                snapshots: card.snapshots,
              });
              cardsCount++;
            }
          } else {
            const rec = { ...card };
            delete rec.id;
            await db.cards.add(rec);
            cardsCount++;
          }
        } catch (err: any) {
          cardsSkipped++;
          errors.push(`Card '${card.name || card.uuid}' skipped: ${err.message}`);
        }
      }
    }

    if (Array.isArray(backupData.lorebooks)) {
      for (const lb of backupData.lorebooks) {
        if (!lb.uuid) continue;
        try {
          const existing = await db.lorebooks.where('uuid').equals(lb.uuid).first();
          if (existing && existing.id) {
            await db.lorebooks.update(existing.id, {
              name: lb.name,
              description: lb.description,
              lorebook: lb.lorebook,
              updatedAt: lb.updatedAt,
            });
          } else {
            const rec = { ...lb };
            delete rec.id;
            await db.lorebooks.add(rec);
          }
          lorebooksCount++;
        } catch (err: any) {
          errors.push(`Lorebook '${lb.name || lb.uuid}' skipped: ${err.message}`);
        }
      }
    }

    if (Array.isArray(backupData.connectionProfiles)) {
      for (const prof of backupData.connectionProfiles) {
        if (!prof.uuid) continue;
        try {
          const rec: ConnectionProfile & { apiKeyRedacted?: boolean } = { ...prof };
          delete rec.id;

          const isRedacted = Boolean(rec.apiKeyRedacted);
          delete rec.apiKeyRedacted;

          let keyNeedsReentry = false;

          if (isRedacted) {
            rec.apiKey = undefined;
            keyNeedsReentry = true;
          } else if (rec.apiKey && rec.apiKey.startsWith('enc.v1.')) {
            const cryptoKey = useCardStore.getState().cryptoKey;
            let canDecrypt = false;
            if (cryptoKey) {
              try {
                await decryptText(rec.apiKey, cryptoKey);
                canDecrypt = true;
              } catch {
                canDecrypt = false;
              }
            }
            if (!canDecrypt) {
              rec.apiKey = undefined;
              keyNeedsReentry = true;
            }
          }

          if (keyNeedsReentry) {
            errors.push(`Connection profile '${prof.name || prof.uuid}': API key needs to be re-entered.`);
          }

          const existing = await db.connectionProfiles.where('uuid').equals(prof.uuid).first();
          if (existing && existing.id) {
            await db.connectionProfiles.update(existing.id, rec);
          } else {
            await db.connectionProfiles.add(rec);
          }
          profilesCount++;
        } catch (err: any) {
          errors.push(`Profile '${prof.name || prof.uuid}' skipped: ${err.message}`);
        }
      }
    }

    if (Array.isArray(backupData.settings)) {
      for (const st of backupData.settings) {
        if (st.key) {
          // In merge mode, skip security/cryptographic credentials so that the receiving device's
          // own master passphrase, PBKDF2 salt, and passkey registration remain untouched. Overwriting
          // them would corrupt the local key derivation parameters and permanently render existing
          // encrypted API keys undecryptable.
          if (
            mode === 'merge' &&
            (st.key === 'crypto_salt' ||
              st.key === 'crypto_hash' ||
              st.key === 'passkey_credential_id' ||
              st.key === 'passkey_wrapped_key' ||
              st.key === 'passkey_prf_salt')
          ) {
            continue;
          }
          try {
            await db.settings.put(st);
          } catch (err: any) {
            // ignore
          }
        }
      }
    }
  });

  return { cardsCount, lorebooksCount, profilesCount, cardsSkipped, errors };
}
