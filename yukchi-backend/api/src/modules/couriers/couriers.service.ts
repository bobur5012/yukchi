import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';

@Injectable()
export class CouriersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.courier.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { status: 'active' }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const courier = await this.prisma.courier.findFirst({
      where: { id, deletedAt: null },
    });
    if (!courier) throw new NotFoundException('Courier not found');
    return courier;
  }

  async create(dto: CreateCourierDto) {
    const existing = await this.prisma.courier.findUnique({ where: { phone: dto.phone } });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('Courier with this phone already exists');
    }
    return this.prisma.courier.create({ data: dto });
  }

  async update(id: string, dto: UpdateCourierDto) {
    await this.findOne(id);

    if (dto.phone) {
      const conflict = await this.prisma.courier.findFirst({
        where: { phone: dto.phone, id: { not: id }, deletedAt: null },
      });
      if (conflict) throw new ConflictException('Phone already in use');
    }

    return this.prisma.courier.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.courier.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'inactive' },
    });
    return { message: 'Courier deleted' };
  }
}
