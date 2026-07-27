import { Injectable, Logger } from '@nestjs/common';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { loadEnv } from '@urbangate/config';

export type StoredObject = {
  storageKey: string;
  absolutePath: string;
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly root: string;

  constructor() {
    const env = loadEnv();
    this.root = resolve(process.cwd(), env.STORAGE_LOCAL_PATH);
    if (env.STORAGE_DRIVER !== 'local') {
      this.logger.warn(
        `STORAGE_DRIVER=${env.STORAGE_DRIVER} not fully implemented; using local filesystem`,
      );
    }
  }

  async put(
    societyId: string,
    entityType: string,
    buffer: Buffer,
    extension: string,
  ): Promise<StoredObject> {
    const safeExt = extension.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 12) || 'bin';
    const storageKey = `${societyId}/${entityType.toLowerCase()}/${randomUUID()}.${safeExt}`;
    const absolutePath = join(this.root, storageKey);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);
    return { storageKey, absolutePath };
  }

  async get(storageKey: string): Promise<Buffer> {
    return readFile(join(this.root, storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await unlink(join(this.root, storageKey));
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') throw err;
    }
  }
}
