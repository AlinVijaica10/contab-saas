import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceNumberingService } from './invoice-numbering.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicePdfService } from './invoice-pdf.service';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private pdfService: InvoicePdfService,
    private numbering: InvoiceNumberingService,
  ) {}

  async create(tenantId: number, dto: CreateInvoiceDto) {
    // calculăm totalurile din liniile facturii
    let subtotal = 0;
    let vatTotal = 0;

    const items = dto.items.map((item) => {
      const vatRate = item.vatRate ?? 19;
      const lineTotal = item.quantity * item.unitPrice;
      const lineVat = lineTotal * (vatRate / 100);
      subtotal += lineTotal;
      vatTotal += lineVat;
      return { ...item, vatRate, lineTotal };
    });

    const total = subtotal + vatTotal;

    // generăm numărul de factură ATOMIC, în afara tranzacției principale de creare
    const { seriesId, number } = await this.numbering.getNextNumber(
      tenantId,
      dto.seriesPrefix ?? 'FCT',
    );

    return this.prisma.forTenant().invoice.create({
      data: {
        clientId: dto.clientId,
        seriesId,
        number,
        dueDate: dto.dueDate,
        currency: dto.currency ?? 'RON',
        subtotal,
        vatTotal,
        total,
        notes: dto.notes,
        items: {
          create: items,
        },
      } as any, // tenantId injectat automat de forTenant()
      include: { items: true, client: true, series: true },
    });
  }

  findAll() {
    return this.prisma.forTenant().invoice.findMany({
      include: { items: true, client: true },
      orderBy: { issueDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const invoice = await this.prisma.forTenant().invoice.findFirst({
      where: { id },
      include: { items: true, client: true, series: true, tenant: true },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }
    return invoice;
  }

  async generatePdf(id: number) {
    const invoice = await this.findOne(id);
    return this.pdfService.generatePdf(invoice);
  }
}
