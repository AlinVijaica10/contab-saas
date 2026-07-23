import { Module } from '@nestjs/common';
import { BankNotificationsController } from './bank-notifications.controller';
import { BankNotificationsService } from './bank-notifications.service';

@Module({
  controllers: [BankNotificationsController],
  providers: [BankNotificationsService],
})
export class BankNotificationsModule {}
