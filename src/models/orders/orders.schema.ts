import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
        category: string;
        user: {
            name: string;
            orderedAt: Date;
        }[]
    }[]

    @Prop({ required: true })
    table: Types.ObjectId;

    @Prop({ default: false })
    isPayment: boolean

    @Prop()
    paymentTime: Date
    
}

export const OrdersSchema = SchemaFactory.createForClass(Orders);