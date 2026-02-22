import { Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '@config/prisma.service';
import { ExchangeRatesService } from '@modules/exchange-rates/exchange-rates.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRates: ExchangeRatesService,
  ) {}

  findByTrip(tripId: string) {
    return this.prisma.expense.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async create(dto: CreateExpenseDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      select: { id: true, exchangeRate: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');

    const tripRate = new Decimal(trip.exchangeRate.toString());
    const amount = new Decimal(dto.amount);

    let amountUsd: Decimal;
    if (dto.currency === 'USD') {
      amountUsd = amount;
    } else {
      const rateStr = await this.exchangeRates.getRate(dto.currency, 'USD');
      const rate = new Decimal(rateStr);
      amountUsd = amount.mul(rate);
    }

    return this.prisma.expense.create({
      data: {
        tripId: dto.tripId,
        description: dto.description,
        amount: amount.toFixed(2),
        amountUsd: amountUsd.toFixed(2),
        currency: dto.currency,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.expense.delete({ where: { id } });
    return { message: 'Expense deleted' };
  }
}
