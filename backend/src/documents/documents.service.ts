import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { DocumentCategoryDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  // --- Partea autentificată (contabilul) ---

  async getOrCreateUploadLink(clientId: number) {
    const existing = await this.prisma.forTenant().clientUploadLink.findFirst({
      where: { clientId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.forTenant().clientUploadLink.create({
      data: { clientId } as any, // tenantId injectat automat de forTenant()
    });
  }

  async regenerateUploadLink(clientId: number) {
    const existing = await this.prisma.forTenant().clientUploadLink.findFirst({
      where: { clientId },
    });

    if (!existing) {
      return this.getOrCreateUploadLink(clientId);
    }

    return this.prisma.forTenant().clientUploadLink.update({
      where: { id: existing.id },
      data: { token: crypto.randomUUID() },
    });
  }

  async listByClient(clientId: number, source?: 'CLIENT_UPLOAD' | 'INTERNAL') {
    return this.prisma.forTenant().document.findMany({
      where: { clientId, ...(source ? { source } : {}) },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getFileForDownload(id: number) {
    const doc = await this.prisma.forTenant().document.findFirst({
      where: { id },
    });
    if (!doc) {
      throw new NotFoundException(`Document with id ${id} not found`);
    }
    const filePath = this.storage.getFilePath(
      doc.tenantId,
      doc.clientId,
      doc.storedName,
    );
    return { doc, filePath };
  }

  // --- Partea publică (clientul, fără autentificare) ---

  async validateToken(token: string) {
    const link = await this.prisma.clientUploadLink.findUnique({
      where: { token },
      include: { client: true },
    });

    if (!link) {
      throw new NotFoundException('Link invalid sau expirat.');
    }

    return link;
  }

  async uploadPublic(
    token: string,
    file: Express.Multer.File,
    category?: DocumentCategoryDto,
  ) {
    if (!file) {
      throw new BadRequestException('Niciun fișier trimis.');
    }

    const link = await this.validateToken(token);

    const { storedName } = await this.storage.save(
      link.tenantId,
      link.clientId,
      file.originalname,
      file.buffer,
    );

    return this.prisma.document.create({
      data: {
        tenantId: link.tenantId,
        clientId: link.clientId,
        category: category ?? 'OTHER',
        source: 'CLIENT_UPLOAD',
        originalName: file.originalname,
        storedName,
        mimeType: file.mimetype,
        size: file.size,
      },
    });
  }

  async uploadInternal(
    tenantId: number,
    clientId: number,
    file: Express.Multer.File,
    category?: DocumentCategoryDto,
  ) {
    if (!file) {
      throw new BadRequestException('Niciun fișier trimis.');
    }

    const { storedName } = await this.storage.save(
      tenantId,
      clientId,
      file.originalname,
      file.buffer,
    );

    return this.prisma.forTenant().document.create({
      data: {
        clientId,
        category: category ?? 'OTHER',
        source: 'INTERNAL',
        originalName: file.originalname,
        storedName,
        mimeType: file.mimetype,
        size: file.size,
      } as any, // tenantId injectat automat de forTenant()
    });
  }
}
