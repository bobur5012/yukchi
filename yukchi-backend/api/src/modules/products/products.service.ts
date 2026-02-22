import { Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '@config/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findByTrip(tripId: string) {
    return this.prisma.product.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      select: { id: true, exchangeRate: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');

    const rate = new Decimal(trip.exchangeRate.toString());
    const costPrice = new Decimal(dto.costPrice);
    const costPriceUsd = costPrice.mul(rate);

    return this.prisma.product.create({
      data: {
        tripId: dto.tripId,
        name: dto.name,
        quantity: dto.quantity,
        costPrice: costPrice.toFixed(2),
        costPriceUsd: costPriceUsd.toFixed(2),
        imageUrl: dto.imageUrl,
      },
    });
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    await this.findOne(id);
    const updateData: any = { ...dto };
    if (dto.costPrice) {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: { trip: { select: { exchangeRate: true } } },
      });
      const rate = new Decimal(product!.trip.exchangeRate.toString());
      const costPrice = new Decimal(dto.costPrice);
      updateData.costPrice = costPrice.toFixed(2);
      updateData.costPriceUsd = costPrice.mul(rate).toFixed(2);
    }
    delete updateData.tripId;
    return this.prisma.product.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Product deleted' };
  }
}
