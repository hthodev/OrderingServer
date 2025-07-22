import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TableDocument = Table & Document;

@Schema({ timestamps: true })
export class Table {
  @Prop({ required: true })
  name: string;
  
  @Prop()
  type: "Office" | "Add"

  @Prop({ default: false })
  havingGuests: boolean
}

export const TableSchema = SchemaFactory.createForClass(Table);