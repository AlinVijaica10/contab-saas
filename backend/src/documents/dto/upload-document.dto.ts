import { IsEnum, IsOptional } from 'class-validator';

export enum DocumentCategoryDto {
  INVOICE = 'INVOICE',
  BANK_STATEMENT = 'BANK_STATEMENT',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}

export class UploadDocumentDto {
  @IsEnum(DocumentCategoryDto)
  @IsOptional()
  category?: DocumentCategoryDto;
}

