import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BankNotificationsService {
  private readonly logger = new Logger(BankNotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleInbound(payload: any) {
    const toAddress: string = payload?.To?.[0]?.Address ?? '';
    const bodyText: string =
      payload?.RawTextBody ?? payload?.ExtractedMarkdownMessage ?? '';

    const tenant = await this.prisma.tenant.findUnique({
      where: { bankNotificationEmail: toAddress.toLowerCase() },
    });

    if (!tenant) {
      this.logger.warn(`Niciun tenant găsit pentru adresa ${toAddress}`);
      return { ignored: true };
    }

    const parsed = this.parseUniCreditEmail(bodyText);
    if (!parsed) {
      this.logger.warn(`Nu am putut parsa emailul pentru tenant ${tenant.id}`);
      await this.prisma.bankPayment.create({
        data: {
          tenantId: tenant.id,
          bankName: 'UniCredit',
          amount: 0,
          rawEmailBody: bodyText,
          status: 'UNMATCHED',
        },
      });
      return { parsed: false };
    }

    const payment = await this.prisma.bankPayment.create({
      data: {
        tenantId: tenant.id,
        bankName: 'UniCredit',
        amount: parsed.amount,
        currency: parsed.currency,
        payerName: parsed.payerName,
        referenceText: parsed.reference,
        rawEmailBody: bodyText,
        transactionDate: parsed.transactionDate,
      },
    });

    await this.tryMatch(tenant.id, payment.id);
    return { received: true, paymentId: payment.id };
  }

  private parseUniCreditEmail(body: string): {
    amount: number;
    currency: string;
    payerName: string | null;
    reference: string | null;
    transactionDate: Date | null;
  } | null {
    // PLACEHOLDER - se completează cu regex-uri reale odată ce trimiți un exemplu de email
    return null;
  }

  private async tryMatch(tenantId: number, paymentId: number) {
    const payment = await this.prisma.bankPayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) return;

    const clients = await this.prisma.client.findMany({ where: { tenantId } });

    const matchedClient = clients.find(
      (c) =>
        payment.referenceText
          ?.toLowerCase()
          .includes(c.companyName.toLowerCase()) ||
        payment.payerName?.toLowerCase().includes(c.companyName.toLowerCase()),
    );

    if (!matchedClient) return;

    const unpaidInvoice = await this.prisma.invoice.findFirst({
      where: {
        clientId: matchedClient.id,
        status: 'ISSUED',
        total: payment.amount,
      },
      orderBy: { issueDate: 'asc' },
    });

    if (!unpaidInvoice) {
      await this.prisma.bankPayment.update({
        where: { id: paymentId },
        data: { clientId: matchedClient.id },
      });
      return;
    }

    await this.prisma.$transaction([
      this.prisma.invoice.update({
        where: { id: unpaidInvoice.id },
        data: { status: 'PAID' },
      }),
      this.prisma.bankPayment.update({
        where: { id: paymentId },
        data: {
          clientId: matchedClient.id,
          invoiceId: unpaidInvoice.id,
          status: 'MATCHED',
        },
      }),
    ]);
  }

  async list(tenantId: number, status?: string) {
    return this.prisma.bankPayment.findMany({
      where: { tenantId, ...(status ? { status: status as any } : {}) },
      include: { client: true, invoice: true },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async matchManually(
    tenantId: number,
    id: number,
    clientId: number,
    invoiceId?: number,
  ) {
    const payment = await this.prisma.bankPayment.findFirst({
      where: { id, tenantId },
    });
    if (!payment) throw new NotFoundException('Plată negăsită.');

    if (invoiceId) {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID' },
      });
    }

    return this.prisma.bankPayment.update({
      where: { id },
      data: { clientId, invoiceId: invoiceId ?? null, status: 'MATCHED' },
    });
  }

  async ignore(tenantId: number, id: number) {
    const payment = await this.prisma.bankPayment.findFirst({
      where: { id, tenantId },
    });
    if (!payment) throw new NotFoundException('Plată negăsită.');

    return this.prisma.bankPayment.update({
      where: { id },
      data: { status: 'IGNORED' },
    });
  }

  async getOutstandingByClient(tenantId: number) {
    const clients = await this.prisma.client.findMany({ where: { tenantId } });
    const unpaidInvoices = await this.prisma.invoice.findMany({
      where: { tenantId, status: 'ISSUED' },
    });

    const now = new Date();

    return clients
      .map((client) => {
        const invoices = unpaidInvoices.filter((i) => i.clientId === client.id);
        const totalDue = invoices.reduce((sum, i) => sum + Number(i.total), 0);
        const overdueCount = invoices.filter(
          (i) => i.dueDate && i.dueDate < now,
        ).length;

        return {
          clientId: client.id,
          companyName: client.companyName,
          unpaidInvoiceCount: invoices.length,
          totalDue,
          overdueCount,
        };
      })
      .filter((c) => c.unpaidInvoiceCount > 0)
      .sort((a, b) => b.totalDue - a.totalDue);
  }

  async getClientOutstanding(tenantId: number, clientId: number) {
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId, clientId },
      orderBy: { issueDate: 'desc' },
    });

    const payments = await this.prisma.bankPayment.findMany({
      where: { tenantId, clientId },
      orderBy: { receivedAt: 'desc' },
    });

    return { invoices, payments };
  }
}
