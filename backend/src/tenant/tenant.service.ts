import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async findOwn(tenantId: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.bankNotificationEmail) {
      const unique = `plati-${randomUUID().slice(0, 8)}@notificari.DOMENIULTAU.ro`;
      return this.prisma.tenant.update({
        where: { id: tenantId },
        data: { bankNotificationEmail: unique },
      });
    }

    return tenant;
  }

  async updateOwn(tenantId: number, dto: UpdateTenantDto) {
    await this.findOwn(tenantId);
    return this.prisma.tenant.update({ where: { id: tenantId }, data: dto });
  }
}
