import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { AnafController } from './anaf.controller';
import { AnafService } from './anaf.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [AnafController],
  providers: [AnafService],
  exports: [AnafService],
})
export class AnafModule {}
