import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '@config/prisma.service';
import { ExchangeRatesService } from '@modules/exchange-rates/exchange-rates.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

@Injectable()
export class TripsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRates: ExchangeRatesService,
  ) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [trips, total] = await Promise.all([
      this.prisma.trip.findMany({
        skip,
        take: limit,
        orderBy: { departureDate: 'desc' },
        include: {
          region: true,
          tripCouriers: { include: { courier: true } },
          _count: { select: { products: true, expenses: true } },
        },
      }),
      this.prisma.trip.count(),
    ]);
    return { trips, total, page, limit };
  }

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        region: true,
        tripCouriers: { include: { courier: true } },
        products: true,
        expenses: true,
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async create(dto: CreateTripDto) {
    const rateStr = await this.exchangeRates.getRate(dto.currency, 'USD');
    const rate = new Decimal(rateStr);
    const budget = new Decimal(dto.budget);
    const oldDebt = new Decimal(dto.oldDebt || '0');
    const budgetUsd = budget.mul(rate);

    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          name: dto.name,
          departureDate: new Date(dto.departureDate),
          returnDate: new Date(dto.returnDate),
          budget: budget.toFixed(2),
          oldDebt: oldDebt.toFixed(2),
          currency: dto.currency,
          exchangeRate: rate.toFixed(6),
          budgetUsd: budgetUsd.toFixed(2),
          regionId: dto.regionId,
        },
      });

      if (dto.courierIds?.length) {
        await tx.tripCourier.createMany({
          data: dto.courierIds.map((courierId) => ({ tripId: trip.id, courierId })),
          skipDuplicates: true,
        });
      }

      return tx.trip.findUnique({
        where: { id: trip.id },
        include: { region: true, tripCouriers: { include: { courier: true } } },
      });
    });
  }

  async update(id: string, dto: UpdateTripDto) {
    const trip = await this.findOne(id);

    if (dto.departureDate || dto.returnDate) {
      const departure = dto.departureDate ? new Date(dto.departureDate) : trip.departureDate;
      const returnDate = dto.returnDate ? new Date(dto.returnDate) : trip.returnDate;
      if (returnDate < departure) {
        throw new BadRequestException('returnDate must be on or after departureDate');
      }
    }

    const updateData: any = { ...dto };
    if (dto.departureDate) updateData.departureDate = new Date(dto.departureDate);
    if (dto.returnDate) updateData.returnDate = new Date(dto.returnDate);

    if (dto.budget) {
      const rate = new Decimal(trip.exchangeRate.toString());
      const budget = new Decimal(dto.budget);
      updateData.budget = budget.toFixed(2);
      updateData.budgetUsd = budget.mul(rate).toFixed(2);
    }

    delete updateData.courierIds;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.courierIds !== undefined) {
        await tx.tripCourier.deleteMany({ where: { tripId: id } });
        if (dto.courierIds.length > 0) {
          await tx.tripCourier.createMany({
            data: dto.courierIds.map((courierId) => ({ tripId: id, courierId })),
          });
        }
      }
      return tx.trip.update({
        where: { id },
        data: updateData,
        include: { region: true, tripCouriers: { include: { courier: true } } },
      });
    });

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.trip.delete({ where: { id } });
    return { message: 'Trip deleted' };
  }
}
