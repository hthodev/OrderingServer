import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  @Prop()
  quantity?: number;
}

export const FoodSchema = SchemaFactory.createForClass(Food);
