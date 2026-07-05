import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Favorite extends Document {
  @Prop({ required: true, unique: true, index: true })
  clientId: string;

  @Prop({ type: [String], default: [] })
  experimentIds: string[];
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
