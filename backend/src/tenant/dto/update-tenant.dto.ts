import { IsString, IsOptional, IsEmail } from 'class-validator';

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
}
