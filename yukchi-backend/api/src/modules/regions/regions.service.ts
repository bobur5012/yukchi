import { Injectable } from '@nestjs/common';
import { PrismaService } from '@config/prisma.service';

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.region.findMany({ orderBy: { name: 'asc' } });
  }
}
