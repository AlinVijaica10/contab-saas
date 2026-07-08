import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceNumberingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generează (sau reutilizează) seria activă pentru tenant + prefix + an curent,
   * și incrementează atomic lastNumber, garantând unicitate chiar la request-uri simultane.
   */
  async getNextNumber(
    tenantId: number,
    prefix: string,
  ): Promise<{ seriesId: number; number: number }> {
    const year = new Date().getFullYear();

    return this.prisma.$transaction(async (tx) => {
      // upsert: creează seria dacă nu există, sau o ia pe cea existentă
      const series = await tx.invoiceSeries.upsert({
        where: {
          tenantId_prefix_year: { tenantId, prefix, year },
        },
        create: {
          tenantId,
          prefix,
          year,
          lastNumber: 1,
        },
        update: {
          lastNumber: { increment: 1 },
        },
      });

      return { seriesId: series.id, number: series.lastNumber };
    });
  }
}

