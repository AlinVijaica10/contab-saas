import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
  IsDate,
} from 'class-validator';

class InvoiceItemDto {
  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  unitPrice: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  vatRate?: number = 19;
}

export class CreateInvoiceDto {
  @IsInt()
  clientId: number;

  @IsString()
  @IsOptional()
  seriesPrefix?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsInt()
  @IsOptional()
  recurringMonth?: number;

  @IsInt()
  @IsOptional()
  recurringYear?: number;
}
