import { IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateTagsDto {
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

export class ShareExperimentDto {
  @IsBoolean()
  isPublic: boolean;
}

export class RateResponseDto {
  @IsOptional()
  @IsIn(['up', 'down', null])
  rating: 'up' | 'down' | null;
}

export class SyncFavoritesDto {
  @IsArray()
  @IsString({ each: true })
  experimentIds: string[];
}
