import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ClsService } from 'nestjs-cls';
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

const TENANT_SCOPED_MODELS = [
  'Client',
  'Invoice',
  'Document',
  'ClientUploadLink',
  'DeclarationSubmission',
];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly cls: ClsService) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Returnează un client Prisma "scoped" pe tenant-ul curent din context.
   * Se folosește în locul lui `this.prisma.client...` direct în services.
   */
  forTenant() {
    const tenantId = this.cls.get('tenantId');

    if (!tenantId) {
      throw new Error(
        'forTenant() called without a tenantId in context — check that the route is protected by the JWT guard.',
      );
    }

    const withTenantWhere = (args: any) => {
      args.where = { ...(args.where as Record<string, unknown>), tenantId };
      return args;
    };

    const withTenantData = (args: any) => {
      args.data = { ...(args.data as Record<string, unknown>), tenantId };
      return args;
    };

    return this.$extends({
      query: {
        $allModels: {
          async findFirst({ model, args, query }) {
            if (TENANT_SCOPED_MODELS.includes(model)) withTenantWhere(args);
            return query(args);
          },
          async findMany({ model, args, query }) {
            if (TENANT_SCOPED_MODELS.includes(model)) withTenantWhere(args);
            return query(args);
          },
          async findUnique({ model, args, query }) {
            if (TENANT_SCOPED_MODELS.includes(model)) withTenantWhere(args);
            return query(args);
          },
          async count({ model, args, query }) {
            if (TENANT_SCOPED_MODELS.includes(model)) withTenantWhere(args);
            return query(args);
          },
          async create({ model, args, query }) {
            if (TENANT_SCOPED_MODELS.includes(model)) withTenantData(args);
            return query(args);
          },
          async update({ model, args, query }) {
            if (TENANT_SCOPED_MODELS.includes(model)) withTenantWhere(args);
            return query(args);
          },
          async updateMany({ model, args, query }) {
            if (TENANT_SCOPED_MODELS.includes(model)) withTenantWhere(args);
            return query(args);
          },
          async delete({ model, args, query }) {
            if (TENANT_SCOPED_MODELS.includes(model)) withTenantWhere(args);
            return query(args);
          },
          async deleteMany({ model, args, query }) {
            if (TENANT_SCOPED_MODELS.includes(model)) withTenantWhere(args);
            return query(args);
          },
        },
      },
    });
  }
}
