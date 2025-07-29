import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FoodCategory } from 'src/constants/foods';

export type OrdersDocument = Orders & Document;

@Schema({ timestamps: true })
export class Orders {
    @Prop({ required: true })
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
    }[]

    @Prop({ required: true })
    table: Types.ObjectId;

    @Prop({ default: false })
    isPayment: boolean

    @Prop()
    paymentTime: Date
    
}

export const OrdersSchema = SchemaFactory.createForClass(Orders);