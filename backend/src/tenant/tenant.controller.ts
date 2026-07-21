import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { tenantId: number; sub: number; email: string; role: string };
}

@Controller('tenant')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('me')
  findOwn(@Request() req: AuthenticatedRequest) {
    return this.tenantService.findOwn(req.user.tenantId);
  }

  @Patch('me')
  updateOwn(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantService.updateOwn(req.user.tenantId, dto);
  }
}
