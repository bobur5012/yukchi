import { Controller, Get, Put, Body, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExchangeRatesService } from './exchange-rates.service';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';

@ApiTags('exchange-rates')
@ApiBearerAuth()
@Controller({ path: 'exchange-rates', version: '1' })
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Get()
  findAll() {
    return this.exchangeRatesService.findAll();
  }

  @Get('convert')
  getRate(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.exchangeRatesService.getRate(from, to);
  }

  @Put()
  upsert(@Body() dto: UpdateExchangeRateDto) {
    return this.exchangeRatesService.upsert(dto);
  }
}
