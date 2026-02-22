import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '@config/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      tripsCount,
      couriersCount,
      shopsCount,
      activeTrips,
      totalDebt,
      recentTrips,
    ] = await Promise.all([
      this.prisma.trip.count(),
      this.prisma.courier.count({ where: { deletedAt: null, status: 'active' } }),
      this.prisma.shop.count({ where: { deletedAt: null, status: 'active' } }),
      this.prisma.trip.findMany({
        where: { status: { in: ['planned', 'active'] } },
        take: 5,
        orderBy: { departureDate: 'asc' },
        include: { region: true },
      }),
      this.prisma.shop.aggregate({
        where: { deletedAt: null, status: 'active' },
        _sum: { debt: true },
      }),
      this.prisma.trip.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { region: true, _count: { select: { products: true, tripCouriers: true } } },
      }),
    ]);

    const totalBudgetResult = await this.prisma.trip.aggregate({
      _sum: { budgetUsd: true },
    });

    const totalExpensesResult = await this.prisma.expense.aggregate({
      _sum: { amountUsd: true },
    });

    const totalBudget = new Decimal(totalBudgetResult._sum.budgetUsd?.toString() || '0');
    const totalExpenses = new Decimal(totalExpensesResult._sum.amountUsd?.toString() || '0');
    const remaining = totalBudget.minus(totalExpenses);

    return {
      metrics: {
        tripsCount,
        couriersCount,
        shopsCount,
        totalBudgetUsd: totalBudget.toFixed(2),
        totalExpensesUsd: totalExpenses.toFixed(2),
        remainingUsd: remaining.toFixed(2),
        totalDebt: totalDebt._sum.debt?.toString() || '0.00',
      },
      activeTrips,
      recentTrips,
    };
  }

  async getFinancialReport(tripId?: string) {
    const whereTrip = tripId ? { tripId } : {};
    const [expenses, products] = await Promise.all([
      this.prisma.expense.groupBy({
        by: ['currency'],
        _sum: { amount: true, amountUsd: true },
        where: whereTrip,
      }),
      this.prisma.product.aggregate({
        _sum: { costPriceUsd: true },
        _count: { id: true },
        where: whereTrip,
      }),
    ]);

    return { expenses, products };
  }
}
