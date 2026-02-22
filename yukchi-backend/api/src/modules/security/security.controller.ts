import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('security')
@ApiBearerAuth()
@Roles('admin')
@Controller({ path: 'security', version: '1' })
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('logs')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('event') event?: string,
  ) {
    return this.securityService.findAll(page, limit, event);
  }
}
