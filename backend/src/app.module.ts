import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ClsModule } from 'nestjs-cls';
import { InvoicesModule } from './invoices/invoices.module';
import { DocumentsModule } from './documents/documents.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DeclarationsModule } from './declarations/declarations.module';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    InvoicesModule,
    DocumentsModule,
    DashboardModule,
    DeclarationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
