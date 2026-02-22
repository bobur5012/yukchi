import { IsString, IsNumberString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddDebtDto {
  @ApiProperty({ example: '500.00' })
  @IsNumberString()
  amount: string;

  @ApiProperty({ enum: ['debt', 'payment'] })
  @IsEnum(['debt', 'payment'])
  type: 'debt' | 'payment';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
