import {
  Controller,
  Post,
  Body,
  Query,
  ForbiddenException,
  UseGuards,
  Get,
  Patch,
  Param,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { BankNotificationsService } from './bank-notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { tenantId: number; sub: number; email: string; role: string };
}

@Controller('bank-notifications')
export class BankNotificationsController {
  constructor(private readonly service: BankNotificationsService) {}

  @Post('inbound')
  async inbound(@Query('token') token: string, @Body() payload: any) {
    if (token !== process.env.BANK_WEBHOOK_SECRET) {
      throw new ForbiddenException('Token invalid.');
    }
    return this.service.handleInbound(payload);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Request() req: AuthenticatedRequest, @Query('status') status?: string) {
    return this.service.list(req.user.tenantId, status);
  }

  @Get('outstanding')
  @UseGuards(JwtAuthGuard)
  outstanding(@Request() req: AuthenticatedRequest) {
    return this.service.getOutstandingByClient(req.user.tenantId);
  }

  @Get('outstanding/:clientId')
  @UseGuards(JwtAuthGuard)
  clientOutstanding(
    @Request() req: AuthenticatedRequest,
    @Param('clientId') clientId: string,
  ) {
    return this.service.getClientOutstanding(req.user.tenantId, +clientId);
  }

  @Patch(':id/match')
  @UseGuards(JwtAuthGuard)
  matchManually(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: { clientId: number; invoiceId?: number },
  ) {
    return this.service.matchManually(
      req.user.tenantId,
      +id,
      dto.clientId,
      dto.invoiceId,
    );
  }

  @Patch(':id/ignore')
  @UseGuards(JwtAuthGuard)
  ignore(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.ignore(req.user.tenantId, +id);
  }
}
