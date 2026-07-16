import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  Request,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request as ExpressRequest } from 'express';
import { createReadStream } from 'fs';
import { existsSync } from 'fs';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadDocumentDto } from './dto/upload-document.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: { tenantId: number; sub: number; email: string; role: string };
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // --- Rute autentificate (contabilul) ---

  @UseGuards(JwtAuthGuard)
  @Get('client/:clientId/upload-link')
  async getUploadLink(@Param('clientId') clientId: string) {
    return this.documentsService.getOrCreateUploadLink(+clientId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('client/:clientId/upload-link/regenerate')
  async regenerateUploadLink(@Param('clientId') clientId: string) {
    return this.documentsService.regenerateUploadLink(+clientId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('client/:clientId')
  async listByClient(
    @Param('clientId') clientId: string,
    @Query('source') source?: 'CLIENT_UPLOAD' | 'INTERNAL',
  ) {
    return this.documentsService.listByClient(+clientId, source);
  }

  @UseGuards(JwtAuthGuard)
  @Post('client/:clientId/internal-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadInternal(
    @Request() req: AuthenticatedRequest,
    @Param('clientId') clientId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.uploadInternal(
      req.user.tenantId,
      +clientId,
      file,
      dto.category,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { doc, filePath } =
      await this.documentsService.getFileForDownload(+id);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Fișierul nu mai există pe disc.');
    }

    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${doc.originalName}"`,
    });

    createReadStream(filePath).pipe(res);
  }

  // --- Rută publică (clientul, fără autentificare) ---

  @Get('public/:token')
  async getPublicInfo(@Param('token') token: string) {
    const link = await this.documentsService.validateToken(token);
    return {
      clientName: link.client.companyName,
    };
  }

  @Post('public/:token/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPublic(
    @Param('token') token: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.uploadPublic(token, file, dto.category);
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-monthly')
  async requestMonthly(@Body() body: { month: number; year: number }) {
    return this.documentsService.requestMonthlyDocuments(body.month, body.year);
  }

  @UseGuards(JwtAuthGuard)
  @Get('request-history')
  async getRequestHistory(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.documentsService.getRequestHistory(
      month ? +month : undefined,
      year ? +year : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('client/:clientId/send-email-request')
  async sendEmailRequest(@Param('clientId') clientId: string) {
    return this.documentsService.sendDocumentRequestEmail(+clientId);
  }
}
