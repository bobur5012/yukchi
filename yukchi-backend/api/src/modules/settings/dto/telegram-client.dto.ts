import { IsString, IsOptional, Matches, IsNumberString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: '2FA password if required' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class SaveSessionDto {
  @ApiProperty()
  @IsString()
  encryptedSession: string;
}
