import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LinkAccountDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
