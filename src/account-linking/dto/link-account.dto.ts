import { IsNotEmpty, IsString } from 'class-validator';

export class LinkAccountDto {
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsString()
  @IsNotEmpty()
  emailAuthToken: string;
}
