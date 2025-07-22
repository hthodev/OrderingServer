import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop()
  password: string;

  @Prop()
  fullName: string;

  @Prop({ enum: ['MALE', 'FEMALE'] })
  gender: 'MALE' | 'FEMALE';

  @Prop()
  phone: string;

  @Prop({ default: "https://i.imgur.com/A4rs3bu.png" })
  image: string;

  @Prop({ default: "STAFF", enum: ["STAFF", "OWNER", "MANAGER", "COOKING"] })
  position: "STAFF" | "OWNER" | "MANAGER" | "COOKING";

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);