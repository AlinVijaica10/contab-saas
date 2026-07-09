import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DeclarationsModule } from '../declarations/declarations.module';

@Module({
  imports: [PrismaModule, DeclarationsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
