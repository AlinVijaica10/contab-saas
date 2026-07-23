import {
  IsString,
  IsOptional,
  IsEmail,
  IsInt,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  cui?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  addressStreet?: string;

  @IsString()
  @IsOptional()
  addressCity?: string;

  @IsString()
  @IsOptional()
  addressCounty?: string;

  @IsString()
  @IsOptional()
  addressPostalCode?: string;

  @IsString()
  @IsOptional()
  addressCountry?: string;

  @IsString()
  @IsOptional()
  iban?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  documentRequestEmailSubject?: string;

  @IsString()
  @IsOptional()
  documentRequestEmailBody?: string;

  @IsString()
  @IsOptional()
  documentRequestWhatsappMessage?: string;

  @IsString()
  @IsOptional()
  brevoApiKey?: string;

  @IsEmail()
  @IsOptional()
  brevoSenderEmail?: string;

  @IsString()
  @IsOptional()
  brevoSenderName?: string;

  @IsString()
  @IsOptional()
  invoiceSeriesPrefix?: string;

  @IsInt()
  @IsOptional()
  invoiceDueDays?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  invoiceDefaultVatRate?: number;

  @IsString()
  @IsOptional()
  invoiceDefaultNote?: string;
}
