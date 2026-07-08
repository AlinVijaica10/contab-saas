import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @IsEmail()
  tenantEmail: string;

  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsEmail()
  userEmail: string;

  @IsString()
  @MinLength(6)
  password: string;
}
