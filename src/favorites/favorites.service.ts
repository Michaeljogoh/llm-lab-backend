import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Favorite } from './schemas/favorite.schema';
import { SyncFavoritesDto } from 'src/experiment/dto/update-experiment.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel('Favorite') private favoriteModel: Model<Favorite>,
  ) {}

  async findByClient(clientId: string): Promise<string[]> {
    const doc = await this.favoriteModel.findOne({ clientId });
    return doc?.experimentIds ?? [];
  }

  async sync(clientId: string, dto: SyncFavoritesDto) {
    return this.favoriteModel.findOneAndUpdate(
      { clientId },
      { clientId, experimentIds: dto.experimentIds },
      { upsert: true, new: true },
    );
  }

  async toggle(clientId: string, experimentId: string) {
    const doc =
      (await this.favoriteModel.findOne({ clientId })) ??
      (await this.favoriteModel.create({ clientId, experimentIds: [] }));

    const ids = new Set(doc.experimentIds);
    if (ids.has(experimentId)) ids.delete(experimentId);
    else ids.add(experimentId);

    doc.experimentIds = [...ids];
    await doc.save();
    return doc.experimentIds;
  }
}
