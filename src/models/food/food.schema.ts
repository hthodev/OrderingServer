import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FoodCategory } from 'src/constants/foods';

export type FoodDocument = Food & Document;

@Schema({ timestamps: true })
export class Food {
  @Prop({ required: true })
  name: string;

  @Prop()
  price: number;

  @Prop()
  image?: string;

  @Prop()
  unit: string;

  @Prop()
  describe?: string;

  @Prop({ required: true })
  quantity?: number;

  @Prop({ required: true })
  category: FoodCategory;

  @Prop({ default: true })
  isSell?: boolean;
}

export const FoodSchema = SchemaFactory.createForClass(Food);