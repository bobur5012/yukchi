import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { AddDebtDto } from './dto/add-debt.dto';

@ApiTags('shops')
@ApiBearerAuth()
@Controller({ path: 'shops', version: '1' })
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.shopsService.findAll(page, limit, includeInactive);
  }

  @Get('debtors')
  findDebtors(@Query('minDebt') minDebt?: string) {
    return this.shopsService.findDebtors(minDebt || '0');
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shopsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateShopDto) {
    return this.shopsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateShopDto>) {
    return this.shopsService.update(id, dto);
  }

  @Post(':id/debt')
  addDebt(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddDebtDto) {
    return this.shopsService.addDebtEntry(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.shopsService.remove(id);
  }
}
