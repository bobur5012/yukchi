import { IsString, IsNumberString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateExchangeRateDto {
  @ApiProperty({ example: 'USD' })
  @IsString()
  @MaxLength(10)
  baseCurrency: string;

  @ApiProperty({ example: 'UZS' })
  @IsString()
  @MaxLength(10)
  targetCurrency: string;

  @ApiProperty({ example: '12600.000000' })
  @IsNumberString()
  rate: string;
}
