import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '@config/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { AddDebtDto } from './dto/add-debt.dto';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, includeInactive = false) {
    const skip = (page - 1) * limit;
    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        skip,
        take: limit,
        where: {
          deletedAt: null,
          ...(includeInactive ? {} : { status: 'active' }),
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.shop.count({ where: { deletedAt: null } }),
    ]);
    return { shops, total, page, limit };
  }

  async findDebtors(minDebt = '0') {
    return this.prisma.shop.findMany({
      where: {
        deletedAt: null,
        status: 'active',
        debt: { gt: new Decimal(minDebt).toFixed(2) },
      },
      orderBy: { debt: 'desc' },
    });
  }

  async findOne(id: string) {
    const shop = await this.prisma.shop.findFirst({
      where: { id, deletedAt: null },
      include: {
        debtEntries: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!shop) throw new NotFoundException('Shop not found');
    return shop;
  }

  async create(dto: CreateShopDto) {
    return this.prisma.shop.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateShopDto>) {
    await this.findOne(id);
    return this.prisma.shop.update({ where: { id }, data: dto });
  }

  async addDebtEntry(id: string, dto: AddDebtDto) {
    await this.findOne(id);
    const amount = new Decimal(dto.amount);
    if (amount.lte(0)) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.findUnique({ where: { id } });
      const currentDebt = new Decimal(shop!.debt.toString());

      let newDebt: Decimal;
      if (dto.type === 'debt') {
        newDebt = currentDebt.plus(amount);
      } else {
        newDebt = currentDebt.minus(amount);
      }

      const entry = await tx.shopDebtEntry.create({
        data: {
          shopId: id,
          amount: amount.toFixed(2),
          type: dto.type,
          description: dto.description,
        },
      });

      const updatedShop = await tx.shop.update({
        where: { id },
        data: { debt: newDebt.toFixed(2) },
      });

      return { entry, debt: updatedShop.debt };
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.shop.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'inactive' },
    });
    return { message: 'Shop deleted' };
  }
}
