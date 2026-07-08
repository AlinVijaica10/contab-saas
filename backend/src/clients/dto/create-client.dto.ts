import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

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
}
