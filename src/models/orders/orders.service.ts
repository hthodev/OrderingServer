import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Orders, OrdersDocument } from './Orders.schema';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Table, TableDocument } from '../tables/tables.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Orders.name)
    private ordersModel: Model<OrdersDocument>,

    @InjectConnection()
    private readonly connection: Connection,

    @InjectModel(Table.name)
    private readonly tableModel: Model<TableDocument>,
  ) {}

  async newOrder({ foods, table_id }, user) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.ordersModel.create(
        {
          table: table_id,
          foods: foods.map(
            (food) =>
              (food.user = [{ name: user.fullName, orderedAt: new Date() }]),
          ),
          orderer: user._id,
        },
        { session },
      );
      await this.tableModel.updateOne(
        { _id: table_id },
        { $set: { havingGuests: true } },
      );
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
    }
  }

  async orderMore(_id: string, { foods }, user) {
    const session: ClientSession = await this.ordersModel.db.startSession();
    session.startTransaction();

    try {
      const order = await this.ordersModel
        .findOne({ _id })
        .select('foods')
        .session(session)
        .lean();

      const existingFoodIds = new Set(
        order?.foods?.map((f) => f._id.toString()) || [],
      );

      const bulkOps = [];
      for (const food of foods) {
        food.user = food.user || [];
        food.user.push({
          name: user.fullName,
          orderedAt: new Date(),
        });

        const isExisting = existingFoodIds.has(food._id.toString());

        if (isExisting) {
          bulkOps.push({
            updateOne: {
              filter: {
                _id,
                'foods._id': food._id,
              },
              update: {
                $inc: {
                  'foods.$.quantity': food.quantity,
                },
              },
              session,
            },
          });
        } else {
          bulkOps.push({
            updateOne: {
              filter: { _id },
              update: {
                $push: {
                  foods: food,
                },
              },
              session,
            },
          });
        }
      }

      if (bulkOps.length > 0) {
        await this.ordersModel.bulkWrite(bulkOps, { session });
      }

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async customerPaymentInvoice(
    _id,
    returnFoods: { _id: string; returnQuantity: number }[],
  ) {
    const order = await this.ordersModel.findOne({ _id }).lean();
    if (!order) throw new HttpException('Not found this order!', 400);

    const bills = order.foods.map((food) => {
      let quantity = food.quantity;
      returnFoods.forEach((r) => {
        if (r._id == food._id) {
          quantity -= r.returnQuantity;
        }
      });
      return {
        ...food,
        quantity,
        total: food.price * quantity,
      };
    });
    await this.ordersModel.updateOne(
      { _id },
      {
        $set: { foods: bills },
      },
    );

    const totalBill = bills.reduce((prev, curr) => prev + curr.total, 0);
    return {
      bills,
      totalBill,
    };
  }

  async customerPaid(_id) {
    await this.ordersModel.updateOne(
      { _id },
      { $set: { isPayment: true, paymentTime: new Date() } },
    );
    return { success: true };
  }
}
