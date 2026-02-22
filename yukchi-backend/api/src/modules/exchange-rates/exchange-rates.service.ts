import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';

@Injectable()
export class ExchangeRatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.exchangeRate.findMany({ orderBy: [{ baseCurrency: 'asc' }, { targetCurrency: 'asc' }] });
  }

  async getRate(baseCurrency: string, targetCurrency: string) {
    if (baseCurrency === targetCurrency) return '1.000000';
    const rate = await this.prisma.exchangeRate.findUnique({
      where: { baseCurrency_targetCurrency: { baseCurrency, targetCurrency } },
    });
    if (!rate) throw new NotFoundException(`Exchange rate ${baseCurrency}/${targetCurrency} not found`);
    return rate.rate.toString();
  }

  async upsert(dto: UpdateExchangeRateDto) {
    return this.prisma.exchangeRate.upsert({
      where: {
        baseCurrency_targetCurrency: {
          baseCurrency: dto.baseCurrency,
          targetCurrency: dto.targetCurrency,
        },
      },
      update: { rate: dto.rate },
      create: {
        baseCurrency: dto.baseCurrency,
        targetCurrency: dto.targetCurrency,
        rate: dto.rate,
      },
    });
  }
}
