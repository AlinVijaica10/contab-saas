import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import type { Response } from 'express';
import { EfacturaService } from './efactura.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { tenantId: number; sub: number; email: string; role: string };
}

@Controller('invoices/:id/efactura')
@UseGuards(JwtAuthGuard)
export class EfacturaController {
  constructor(private readonly efactura: EfacturaService) {}

  /** Previzualizare XML generat, fără trimitere - util pt. debug înainte de a trimite bani-gheață la ANAF. */
  @Get('preview')
  async preview(@Param('id') id: string, @Res() res: Response) {
    const xml = await this.efactura.previewXml(+id);
    res.set({ 'Content-Type': 'application/xml' });
    res.send(xml);
  }

  /** Validează XML-ul la ANAF fără să-l trimită efectiv - primul pas recomandat. */
  @Post('validate')
  validate(@Param('id') id: string) {
    return this.efactura.validate(+id);
  }

  /** Trimite efectiv factura la ANAF. */
  @Post('send')
  send(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.efactura.send(req.user.tenantId, +id);
  }

  /** Verifică stadiul procesării unei facturi deja trimise. */
  @Get('status')
  checkStatus(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.efactura.checkStatus(req.user.tenantId, +id);
  }

  /** Descarcă arhiva (factură+semnătură, sau erori+semnătură) pentru un mesaj din listaMesaje. */
  @Get('download/:messageId')
  async download(
    @Request() req: AuthenticatedRequest,
    @Param('messageId') messageId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.efactura.downloadResult(
      req.user.tenantId,
      messageId,
    );
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="anaf-raspuns-${messageId}.zip"`,
    });
    res.send(buffer);
  }

  /** Descarcă arhiva folosind ID-ul salvat deja pe factură - nu trebuie să știi messageId-ul manual. */
  @Get('download-response')
  async downloadStoredResponse(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.efactura.downloadStoredResponse(
      req.user.tenantId,
      +id,
    );
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="anaf-raspuns-factura-${id}.zip"`,
    });
    res.send(buffer);
  }
}

/** Controller separat pentru listarea mesajelor la nivel de tenant (nu per factură). */
@Controller('efactura')
@UseGuards(JwtAuthGuard)
export class EfacturaMessagesController {
  constructor(private readonly efactura: EfacturaService) {}

  @Get('messages')
  listMessages(
    @Request() req: AuthenticatedRequest,
    @Query('zile') zile?: string,
  ) {
    return this.efactura.listMessages(req.user.tenantId, zile ? +zile : 10);
  }
}
