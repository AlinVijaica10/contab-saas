import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Res } from '@nestjs/common';
import type { Response } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: { tenantId: number; sub: number; email: string; role: string };
}

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(req.user.tenantId, dto);
  }

  @Get()
  findAll(@Query('month') month?: string, @Query('year') year?: string) {
    return this.invoicesService.findAllFiltered(
      month ? +month : undefined,
      year ? +year : undefined,
    );
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(+id);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.invoicesService.generatePdf(+id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${id}.pdf"`,
    });
    res.send(pdfBuffer);
  }

  @Post('generate-monthly')
  generateMonthly(
    @Request() req: AuthenticatedRequest,
    @Body() body: { month: number; year: number },
  ) {
    return this.invoicesService.generateMonthlyInvoices(
      req.user.tenantId,
      body.month,
      body.year,
    );
  }
}
