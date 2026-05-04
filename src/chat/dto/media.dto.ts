import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class UserAudioDto {
  @IsString()
  @IsNotEmpty()
  audioBase64: string; // Base64 or Data URL

  @IsString()
  @IsOptional()
  mimeType?: string;
}

export class UserImageDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  images: string[]; // Base64 strings

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mimeTypes?: string[];
}
