import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getApplicableDeclarations, DeclarationType } from './declaration-rules';

@Injectable()
export class DeclarationsService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyStatus(clientId: number, month: number, year: number) {
    const client = await this.prisma.forTenant().client.findFirst({
      where: { id: clientId },
    });

    if (!client) {
      return [];
    }

    const applicable = getApplicableDeclarations(
      {
        clientType: client.clientType,
        fiscalRegime: client.fiscalRegime,
        isVatPayer: client.isVatPayer,
        vatPeriodicity: client.vatPeriodicity,
        hasEmployees: client.hasEmployees,
      },
      month,
    );

    const submissions = await this.prisma
      .forTenant()
      .declarationSubmission.findMany({
        where: { clientId, month, year },
      });

    return applicable.map((decl) => {
      const submission = submissions.find(
        (s) => s.declarationType === decl.type,
      );
      return {
        type: decl.type,
        label: decl.label,
        submitted: submission?.submitted ?? false,
        submittedAt: submission?.submittedAt ?? null,
      };
    });
  }

  async markSubmitted(
    clientId: number,
    declarationType: DeclarationType,
    month: number,
    year: number,
    submitted: boolean,
  ) {
    const existing = await this.prisma
      .forTenant()
      .declarationSubmission.findFirst({
        where: { clientId, declarationType, month, year },
      });

    if (existing) {
      return this.prisma.forTenant().declarationSubmission.update({
        where: { id: existing.id },
        data: { submitted, submittedAt: submitted ? new Date() : null },
      });
    }

    return this.prisma.forTenant().declarationSubmission.create({
      data: {
        clientId,
        declarationType,
        month,
        year,
        submitted,
        submittedAt: submitted ? new Date() : null,
      } as any, // tenantId injectat automat de forTenant()
    });
  }

  async getMonthlySummaryForAllClients(month: number, year: number) {
    const clients = await this.prisma.forTenant().client.findMany();

    const results = await Promise.all(
      clients.map(async (client) => {
        const declarations = await this.getMonthlyStatus(
          client.id,
          month,
          year,
        );
        const pending = declarations.filter((d) => !d.submitted);
        return {
          clientId: client.id,
          companyName: client.companyName,
          totalDeclarations: declarations.length,
          pendingCount: pending.length,
          declarations,
        };
      }),
    );

    return results;
  }
}