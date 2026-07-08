import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  create(tenantId: number, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: { ...dto, tenantId },
    });
  }

  findAll(tenantId: number) {
    return this.prisma.client.findMany({
      where: { tenantId },
    });
  }

  async findOne(tenantId: number, id: number) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId },
    });
    if (!client) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
    return client;
  }

  async update(tenantId: number, id: number, dto: UpdateClientDto) {
    await this.findOne(tenantId, id);
    return this.prisma.client.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: number, id: number) {
    await this.findOne(tenantId, id);
    return this.prisma.client.delete({ where: { id } });
  }
}
