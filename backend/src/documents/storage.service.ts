import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_ROOT = join(process.cwd(), 'uploads');

@Injectable()
export class StorageService {
  async save(
    tenantId: number,
    clientId: number,
    originalName: string,
    buffer: Buffer,
  ): Promise<{ storedName: string; fullPath: string }> {
    const extension = originalName.split('.').pop() || 'bin';
    const storedName = `${randomUUID()}.${extension}`;

    const dir = join(UPLOAD_ROOT, `tenant-${tenantId}`, `client-${clientId}`);
    await fs.mkdir(dir, { recursive: true });

    const fullPath = join(dir, storedName);
    await fs.writeFile(fullPath, buffer);

    return { storedName, fullPath };
  }

  getFilePath(tenantId: number, clientId: number, storedName: string): string {
    return join(UPLOAD_ROOT, `tenant-${tenantId}`, `client-${clientId}`, storedName);
  }

  async delete(tenantId: number, clientId: number, storedName: string): Promise<void> {
    const path = this.getFilePath(tenantId, clientId, storedName);
    await fs.unlink(path).catch(() => {}); // ignorăm eroarea dacă fișierul nu există deja
  }
}

