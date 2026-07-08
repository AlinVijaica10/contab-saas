import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateClientDto) {
    return this.prisma.forTenant().client.create({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: dto as any,
    });
  }

  findAll() {
    return this.prisma.forTenant().client.findMany();
  }

  async findOne(id: number) {
    const client = await this.prisma.forTenant().client.findFirst({
      where: { id },
    });
    if (!client) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
    return client;
  }

  async update(id: number, dto: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.forTenant().client.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.forTenant().client.delete({ where: { id } });
  }
}
