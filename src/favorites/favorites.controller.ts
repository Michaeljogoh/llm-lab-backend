import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Patch,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { SyncFavoritesDto } from 'src/experiment/dto/update-experiment.dto';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findAll(@Headers('x-client-id') clientId: string) {
    if (!clientId) return [];
    return this.favoritesService.findByClient(clientId);
  }

  @Post('sync')
  sync(
    @Headers('x-client-id') clientId: string,
    @Body() dto: SyncFavoritesDto,
  ) {
    if (!clientId) return { experimentIds: dto.experimentIds };
    return this.favoritesService.sync(clientId, dto);
  }

  @Patch(':experimentId/toggle')
  toggle(
    @Headers('x-client-id') clientId: string,
    @Param('experimentId') experimentId: string,
  ) {
    if (!clientId) return [];
    return this.favoritesService.toggle(clientId, experimentId);
  }
}
