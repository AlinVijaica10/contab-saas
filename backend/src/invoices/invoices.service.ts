import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    // calculăm totalurile din liniile facturii
    let subtotal = 0;
    let vatTotal = 0;

    const defaultVatRate = tenant?.invoiceDefaultVatRate
      ? Number(tenant.invoiceDefaultVatRate)
      : 19;

    const items = dto.items.map((item) => {
      const vatRate = item.vatRate ?? defaultVatRate;
      const lineTotal = item.quantity * item.unitPrice;
      const lineVat = lineTotal * (vatRate / 100);
      subtotal += lineTotal;
      vatTotal += lineVat;
      return { ...item, vatRate, lineTotal };
    });

    const total = subtotal + vatTotal;

    const { seriesId, number } = await this.numbering.getNextNumber(
      tenantId,
      dto.seriesPrefix ?? tenant?.invoiceSeriesPrefix ?? 'FCT',
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
        notes: dto.notes ?? tenant?.invoiceDefaultNote ?? undefined,
        recurringMonth: dto.recurringMonth ?? null,
        recurringYear: dto.recurringYear ?? null,
        items: {
          create: items,
        },
      } as any,
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

  private readonly monthNames = [
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

  async generateMonthlyInvoices(tenantId: number, month: number, year: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    const dueDays = tenant?.invoiceDueDays ?? 30;

    const clients = await this.prisma.forTenant().client.findMany({
      where: { monthlyFee: { not: null } },
    });

    const results: Array<{
      clientId: number;
      companyName: string;
      success: boolean;
      skipped?: boolean;
      invoiceId?: number;
      error?: string;
    }> = [];

    for (const client of clients) {
      // verificăm dacă a fost deja generată o factură recurentă pentru
      // acest client + lună + an - fără asta, apăsarea repetată a butonului
      // ar crea facturi duplicate pentru aceeași lună.
      const existing = await this.prisma.forTenant().invoice.findFirst({
        where: {
          clientId: client.id,
          recurringMonth: month,
          recurringYear: year,
        },
      });

      if (existing) {
        results.push({
          clientId: client.id,
          companyName: client.companyName,
          success: false,
          skipped: true,
          error: `Factura pentru ${this.monthNames[month - 1]} ${year} a fost deja generată (nr. ${existing.number}).`,
        });
        continue;
      }

      const monthLabel = this.monthNames[month - 1];
      const description = `${client.monthlyFeeDescription ?? 'Servicii de contabilitate'} - ${monthLabel} ${year}`;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueDays);

      try {
        const invoice = await this.create(tenantId, {
          clientId: client.id,
          recurringMonth: month,
          recurringYear: year,
          dueDate,
          items: [
            {
              description,
              quantity: 1,
              unitPrice: Number(client.monthlyFee),
              vatRate: client.monthlyFeeVatRate
                ? Number(client.monthlyFeeVatRate)
                : tenant?.invoiceDefaultVatRate
                  ? Number(tenant.invoiceDefaultVatRate)
                  : 19,
            },
          ],
        });
        results.push({
          clientId: client.id,
          companyName: client.companyName,
          success: true,
          invoiceId: invoice.id,
        });
      } catch (err) {
        results.push({
          clientId: client.id,
          companyName: client.companyName,
          success: false,
          error: (err as Error).message,
        });
      }
    }

    return results;
  }
  async remove(id: number) {
    const invoice = await this.prisma.forTenant().invoice.findFirst({
      where: { id },
      include: { series: true },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException(
        'Doar facturile în stadiul DRAFT pot fi șterse.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.invoice.delete({ where: { id } });

      // reclamăm numărul doar dacă factura ștearsă era ultima din serie
      if (invoice.series.lastNumber === invoice.number) {
        await tx.invoiceSeries.update({
          where: { id: invoice.seriesId },
          data: { lastNumber: { decrement: 1 } },
        });
      }
    });

    return { success: true };
  }

  async update(id: number, dto: CreateInvoiceDto) {
    const existing = await this.prisma.forTenant().invoice.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException(
        'Doar facturile în stadiul DRAFT pot fi editate.',
      );
    }

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

    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

      return tx.invoice.update({
        where: { id },
        data: {
          clientId: dto.clientId,
          dueDate: dto.dueDate,
          currency: dto.currency ?? 'RON',
          subtotal,
          vatTotal,
          total,
          notes: dto.notes,
          items: { create: items },
        },
        include: { items: true, client: true, series: true },
      });
    });
  }

  async findAllFiltered(month?: number, year?: number) {
    const where: any = {};

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      where.issueDate = { gte: startDate, lt: endDate };
    }

    return this.prisma.forTenant().invoice.findMany({
      where,
      include: { items: true, client: true },
      orderBy: { issueDate: 'desc' },
    });
  }
}
