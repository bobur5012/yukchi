import { PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTripDto } from './create-trip.dto';

export class UpdateTripDto extends PartialType(OmitType(CreateTripDto, ['currency'] as const)) {
  @ApiPropertyOptional({ enum: ['planned', 'active', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['planned', 'active', 'completed', 'cancelled'])
  status?: string;
}
