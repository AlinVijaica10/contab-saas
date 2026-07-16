import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ClientTypeDto {
  SRL = 'SRL',
  PFA = 'PFA',
}

export enum FiscalRegimeDto {
  MICRO = 'MICRO',
  PROFIT = 'PROFIT',
  REAL = 'REAL',
  NORMA_VENIT = 'NORMA_VENIT',
}

export enum VatPeriodicityDto {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsOptional()
  cui?: string;

  @IsEmail()
  contactEmail: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsEnum(ClientTypeDto)
  @IsOptional()
  clientType?: ClientTypeDto;

  @IsEnum(FiscalRegimeDto)
  @IsOptional()
  fiscalRegime?: FiscalRegimeDto;

  @IsBoolean()
  @IsOptional()
  isVatPayer?: boolean;

  @IsEnum(VatPeriodicityDto)
  @IsOptional()
  vatPeriodicity?: VatPeriodicityDto;

  @IsBoolean()
  @IsOptional()
  hasEmployees?: boolean;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlyFee?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlyFeeVatRate?: number;

  @IsString()
  @IsOptional()
  monthlyFeeDescription?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
