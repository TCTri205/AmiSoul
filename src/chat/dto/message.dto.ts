import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export enum SessionType {
  INCOGNITO = 'incognito',
  PERSISTENT = 'persistent',
}

export class MessageMetadataDto {
  @IsEnum(SessionType)
  @IsOptional()
  session_type?: SessionType = SessionType.PERSISTENT;

  @IsString()
  @IsOptional()
  messageId?: string;

  @IsObject()
  @IsOptional()
  custom_data?: Record<string, any>;
}

export class MessageSentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsObject()
  metadata?: MessageMetadataDto;
}
