import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import {
  EfacturaController,
  EfacturaMessagesController,
} from './efactura.controller';
import { EfacturaService } from './efactura.service';
import { EfacturaApiService } from './efactura-api.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AnafModule } from '../anaf/anaf.module';

@Module({
  imports: [HttpModule, PrismaModule, AnafModule],
  controllers: [EfacturaController, EfacturaMessagesController],
  providers: [EfacturaService, EfacturaApiService],
})
export class EfacturaModule {}
