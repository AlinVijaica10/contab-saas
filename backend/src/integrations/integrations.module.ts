import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { EmailModule } from '../email/email.module';
import { AnafModule } from '../anaf/anaf.module';

@Module({
  imports: [EmailModule, AnafModule],
  controllers: [IntegrationsController],
})
export class IntegrationsModule {}
