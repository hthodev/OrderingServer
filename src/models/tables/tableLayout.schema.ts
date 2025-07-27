import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TableLayoutDocument = TableLayout & Document;

@Schema({ timestamps: true })
export class TableLayout {
  @Prop({ required: true })
  layouts: string[][];
  
  @Prop({ required: true, unique: true })
  type: "OFFICIAL" | "EXTENDED"
}

export const TableLayoutSchema = SchemaFactory.createForClass(TableLayout);