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
import { AnafModule } from './anaf/anaf.module';
import { EfacturaModule } from './e-factura/efactura.module';
import { TenantModule } from './tenant/tenant.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { BankNotificationsModule } from './bank-notifications/bank-notifications.module';

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
    AnafModule,
    EfacturaModule,
    TenantModule,
    IntegrationsModule,
    BankNotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
