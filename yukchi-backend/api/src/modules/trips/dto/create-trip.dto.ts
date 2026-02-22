import {
  IsString,
  IsDateString,
  IsNumberString,
  IsUUID,
  IsArray,
  IsOptional,
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'ReturnAfterDeparture', async: false })
class ReturnAfterDeparture implements ValidatorConstraintInterface {
  validate(returnDate: string, args: ValidationArguments) {
    const dto = args.object as CreateTripDto;
    if (!dto.departureDate || !returnDate) return true;
    return new Date(returnDate) >= new Date(dto.departureDate);
  }
  defaultMessage() {
    return 'returnDate must be on or after departureDate';
  }
}

export class CreateTripDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: '2024-03-01' })
  @IsDateString()
  departureDate: string;

  @ApiProperty({ example: '2024-03-15' })
  @IsDateString()
  @Validate(ReturnAfterDeparture)
  returnDate: string;

  @ApiProperty({ example: '10000.00' })
  @IsNumberString()
  budget: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  oldDebt?: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @MaxLength(10)
  currency: string;

  @ApiProperty()
  @IsUUID()
  regionId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  courierIds?: string[];
}
