import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeclarationsService } from '../declarations/declarations.service';

export interface ClientSummary {
  clientId: number;
  companyName: string;
  invoiceCount: number;
  totalInvoiced: number;
  totalPaid: number;
  totalUnpaid: number;
  documentCount: number;
  hasDocuments: boolean;
  pendingDeclarationsCount: number;
  hasPendingDeclarations: boolean;
}

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private declarationsService: DeclarationsService,
  ) {}

  async getMonthlySummary(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const [clients, invoices, documents] = await Promise.all([
      this.prisma.forTenant().client.findMany(),
      this.prisma.forTenant().invoice.findMany({
        where: { issueDate: { gte: startDate, lt: endDate } },
      }),
      this.prisma.forTenant().document.findMany({
        where: { uploadedAt: { gte: startDate, lt: endDate } },
      }),
    ]);

    const summaries: ClientSummary[] = await Promise.all(
      clients.map(async (client) => {
        const clientInvoices = invoices.filter(
          (inv) => inv.clientId === client.id,
        );
        const clientDocuments = documents.filter(
          (doc) => doc.clientId === client.id,
        );

        const totalInvoiced = clientInvoices.reduce(
          (sum, inv) => sum + Number(inv.total),
          0,
        );
        const totalPaid = clientInvoices
          .filter((inv) => inv.status === 'PAID')
          .reduce((sum, inv) => sum + Number(inv.total), 0);
        const totalUnpaid = totalInvoiced - totalPaid;

        const declarations = await this.declarationsService.getMonthlyStatus(
          client.id,
          month,
          year,
        );
        const pendingDeclarations = declarations.filter((d) => !d.submitted);

        return {
          clientId: client.id,
          companyName: client.companyName,
          invoiceCount: clientInvoices.length,
          totalInvoiced,
          totalPaid,
          totalUnpaid,
          documentCount: clientDocuments.length,
          hasDocuments: clientDocuments.length > 0,
          pendingDeclarationsCount: pendingDeclarations.length,
          hasPendingDeclarations: pendingDeclarations.length > 0,
        };
      }),
    );

    const totals = {
      totalInvoiced: summaries.reduce((sum, s) => sum + s.totalInvoiced, 0),
      totalPaid: summaries.reduce((sum, s) => sum + s.totalPaid, 0),
      totalUnpaid: summaries.reduce((sum, s) => sum + s.totalUnpaid, 0),
      totalDocuments: summaries.reduce((sum, s) => sum + s.documentCount, 0),
      clientsWithoutDocuments: summaries.filter((s) => !s.hasDocuments).length,
      clientsWithPendingDeclarations: summaries.filter(
        (s) => s.hasPendingDeclarations,
      ).length,
    };

    return { month, year, clients: summaries, totals };
  }
}
