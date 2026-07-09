import { IsEnum, IsOptional } from 'class-validator';

export enum DocumentCategoryDto {
  // Categorii client (upload public)
  INVOICE = 'INVOICE',
  BANK_STATEMENT = 'BANK_STATEMENT',
  CONTRACT = 'CONTRACT',

  // Categorii interne (upload contabil)
  CI_ADMINISTRATOR = 'CI_ADMINISTRATOR',
  ACTE_INFIINTARE = 'ACTE_INFIINTARE',
  DECLARATII = 'DECLARATII',
  ADEVERINTE = 'ADEVERINTE',
  PONTAJE = 'PONTAJE',
  STATE_SALARII = 'STATE_SALARII',
  BILANT = 'BILANT',

  OTHER = 'OTHER',
}

export class UploadDocumentDto {
  @IsEnum(DocumentCategoryDto)
  @IsOptional()
  category?: DocumentCategoryDto;
}
