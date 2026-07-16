import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { DocumentCategoryDto } from './dto/upload-document.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private emailService: EmailService,
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

  async requestMonthlyDocuments(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const clients = await this.prisma.forTenant().client.findMany({
      where: { status: 'active' },
    });

    const results: Array<{
      clientId: number;
      companyName: string;
      phoneNumber: string | null;
      status: string;
      emailSent: boolean;
      uploadUrl?: string;
    }> = [];

    for (const client of clients) {
      const existingDocs = await this.prisma.forTenant().document.findFirst({
        where: {
          clientId: client.id,
          source: 'CLIENT_UPLOAD',
          uploadedAt: { gte: startDate, lt: endDate },
        },
      });

      if (existingDocs) {
        const result = {
          clientId: client.id,
          companyName: client.companyName,
          phoneNumber: client.phoneNumber,
          status: 'already_has_documents',
          emailSent: false,
        };
        results.push(result);

        await this.prisma.forTenant().documentRequestLog.create({
          data: {
            clientId: client.id,
            month,
            year,
            emailSent: false,
            status: 'already_has_documents',
          } as any,
        });

        continue;
      }

      const link = await this.getOrCreateUploadLink(client.id);
      const uploadUrl = `${process.env.FRONTEND_URL}/upload/${link.token}`;

      const monthNames = [
        'Ianuarie',
        'Februarie',
        'Martie',
        'Aprilie',
        'Mai',
        'Iunie',
        'Iulie',
        'August',
        'Septembrie',
        'Octombrie',
        'Noiembrie',
        'Decembrie',
      ];
      const monthLabel = monthNames[month - 1];

      const emailHtml = `
      <p>Bună ziua,</p>
      <p>Vă rugăm să încărcați documentele contabile pentru luna <strong>${monthLabel} ${year}</strong> (facturi, extrase de cont, etc.) folosind linkul de mai jos:</p>
      <p><a href="${uploadUrl}">${uploadUrl}</a></p>
      <p>Vă mulțumim!</p>
    `;

      const emailSent = await this.emailService.sendEmail(
        client.contactEmail,
        `Solicitare documente - ${monthLabel} ${year}`,
        emailHtml,
      );

      results.push({
        clientId: client.id,
        companyName: client.companyName,
        phoneNumber: client.phoneNumber,
        uploadUrl,
        status: 'requested',
        emailSent,
      });

      await this.prisma.forTenant().documentRequestLog.create({
        data: {
          clientId: client.id,
          month,
          year,
          emailSent,
          status: 'requested',
        } as any,
      });
    }

    return results;
  }

  async getRequestHistory(month?: number, year?: number) {
    const where: any = {};
    if (month && year) {
      where.month = month;
      where.year = year;
    }

    return this.prisma.forTenant().documentRequestLog.findMany({
      where,
      include: { client: true },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async sendDocumentRequestEmail(clientId: number) {
    const client = await this.prisma.forTenant().client.findFirst({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with id ${clientId} not found`);
    }

    const link = await this.getOrCreateUploadLink(clientId);
    const uploadUrl = `${process.env.FRONTEND_URL}/upload/${link.token}`;

    const now = new Date();
    const monthNames = [
      'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
      'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
    ];
    const monthLabel = monthNames[now.getMonth()];
    const year = now.getFullYear();

    const emailHtml = `
    <p>Bună ziua,</p>
    <p>Vă rugăm să încărcați documentele contabile pentru luna <strong>${monthLabel} ${year}</strong> (facturi, extrase de cont, etc.) folosind linkul de mai jos:</p>
    <p><a href="${uploadUrl}">${uploadUrl}</a></p>
    <p>Vă mulțumim!</p>
  `;

    const emailSent = await this.emailService.sendEmail(
      client.contactEmail,
      `Solicitare documente - ${monthLabel} ${year}`,
      emailHtml,
    );

    await this.prisma.forTenant().documentRequestLog.create({
      data: {
        clientId,
        month: now.getMonth() + 1,
        year,
        emailSent,
        status: 'requested_manual',
      } as any,
    });

    return { emailSent, uploadUrl };
  }
}
