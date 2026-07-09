import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { DeclarationsService } from './declarations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeclarationType } from './declaration-rules';

@Controller('declarations')
@UseGuards(JwtAuthGuard)
export class DeclarationsController {
  constructor(private readonly declarationsService: DeclarationsService) {}

  @Get('client/:clientId')
  async getClientStatus(
    @Param('clientId') clientId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.declarationsService.getMonthlyStatus(+clientId, +month, +year);
  }

  @Post('client/:clientId/mark')
  async markSubmitted(
    @Param('clientId') clientId: string,
    @Body() body: { declarationType: DeclarationType; month: number; year: number; submitted: boolean },
  ) {
    return this.declarationsService.markSubmitted(
      +clientId,
      body.declarationType,
      body.month,
      body.year,
      body.submitted,
    );
  }

  @Get('summary')
  async getSummary(@Query('month') month: string, @Query('year') year: string) {
    return this.declarationsService.getMonthlySummaryForAllClients(+month, +year);
  }
}

