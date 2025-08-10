import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FoodCategory } from 'src/constants/foods';
import { Table } from '../tables/tables.schema';
import { User } from '../users/users.schema';

export type OrdersDocument = Orders & Document;

@Schema({ timestamps: true })
export class Orders {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    orderer: Types.ObjectId;

    @Prop({ required: true })
    foods: {
        _id: string;
        price: number;
        name: string;
        unit: string;
        quantity: number;
        category: FoodCategory;
        user: {
            name: string;
            orderedAt: Date;
        }[],
        isCooked: boolean;
        total?: number;
    }[]

    @Prop({ type: Types.ObjectId, ref: Table.name, required: true })
    table: Types.ObjectId;

    @Prop({ default: false })
    isPayment: boolean

    @Prop()
    paymentTime?: Date

    @Prop()
    total?: number

    @Prop({ type: Types.ObjectId, ref: User.name, required: false })
    cashier?: Types.ObjectId;
    
}

export const OrdersSchema = SchemaFactory.createForClass(Orders);