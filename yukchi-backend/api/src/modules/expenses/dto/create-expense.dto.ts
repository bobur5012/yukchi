import { IsString, IsNumberString, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty()
  @IsUUID()
  tripId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(300)
  description: string;

  @ApiProperty({ example: '500.00' })
  @IsNumberString()
  amount: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @MaxLength(10)
  currency: string;
}
