import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Orders, OrdersDocument } from './orders.schema';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Table, TableDocument } from '../tables/tables.schema';
import { SocketGateway } from 'src/websockets/socket.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Orders.name)
    private ordersModel: Model<OrdersDocument>,

    @InjectConnection()
    private readonly connection: Connection,

    @InjectModel(Table.name)
    private readonly tableModel: Model<TableDocument>,

    private readonly socketGateway: SocketGateway,
  ) {}

  async newOrder({ foods, table_id }, user) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const order = await this.ordersModel.create(
        [
          {
            table: new Types.ObjectId(table_id),
            foods: foods.map((food) => ({
              ...food,
              user: [{ name: user.fullName, orderedAt: new Date() }],
            })),
            orderer: new Types.ObjectId(user._id),
          },
        ],
        { session },
      );

      await this.tableModel.updateOne(
        { _id: new Types.ObjectId(table_id) },
        { $set: { havingGuests: true } },
        { session },
      );

      await session.commitTransaction();

      //area socket
      this.socketGateway.notifyTableUpdate();
      return order.map((o) => o.toJSON())[0];
    } catch (error) {
      await session.abortTransaction();
      return { success: false, error: error.message };
    } finally {
      session.endSession();
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

      const dbFoodsMap = new Map(order.foods.map((f) => [f._id.toString(), f]));

      const existingFoodIds = new Set(dbFoodsMap.keys());
      const changedFoods = [];

      const bulkOps = [];
      for (const food of foods) {
        food.user = food.user || [];
        food.user.push({
          name: user.fullName,
          orderedAt: new Date(),
        });

        const isExisting = existingFoodIds.has(food._id.toString());
        const dbFood = dbFoodsMap.get(food._id.toString());

        if (isExisting) {
          const addedQuantity = food.quantity - dbFood.quantity;
          if (addedQuantity > 0) {
            changedFoods.push({
              _id: food._id,
              name: food.name,
              category: food.category,
              addedQuantity,
              type: 'update',
            });
          }

          bulkOps.push({
            updateOne: {
              filter: {
                _id,
                'foods._id': food._id,
              },
              update: {
                $set: {
                  'foods.$.quantity': food.quantity,
                  'foods.$.user': food.user,
                },
              },
              session,
            },
          });
        } else {
          changedFoods.push({
            _id: food._id,
            name: food.name,
            category: food.category,
            quantity: food.quantity,
            type: 'new',
          });

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

      console.log('Foods thay đổi:', changedFoods);
      console.log(this.pushSocketToCooking(changedFoods));

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

  async order(_id) {
    return await this.ordersModel.findOne({ _id }).lean();
  }
  async customerPaymentInvoice(
    _id: string,
    returnFoods: { _id: string; returnQuantity: number }[],
  ) {
    const order = await this.ordersModel.findOne({ _id }).lean();
    if (!order) throw new HttpException('Không tìm thấy order!', 400);

    const bills = [];

    for (const food of order.foods) {
      const returnItem = returnFoods.find((r) => r._id === food._id);
      let quantity = food.quantity;

      if (returnItem) {
        // 🛑 Bug 1: Trả nhiều hơn số lượng thực tế
        if (returnItem.returnQuantity > quantity) {
          throw new HttpException(
            `Món ăn "${food.name}" có số lượng trả (${returnItem.returnQuantity}) nhiều hơn số lượng đã order (${quantity})`,
            400,
          );
        }
        quantity -= returnItem.returnQuantity;
      }

      // ✅ Bug 2: Bỏ món quantity = 0 ra khỏi DB & invoice
      if (quantity > 0) {
        bills.push({
          ...food,
          quantity,
          total: food.price * quantity,
        });
      }
    }

    // Cập nhật lại DB
    await this.ordersModel.updateOne({ _id }, { $set: { foods: bills } });

    const totalBill = bills.reduce((prev, curr) => prev + curr.total, 0);

    return {
      bills,
      totalBill,
    };
  }

  async customerPaid(_id) {
    const session: ClientSession = await this.ordersModel.db.startSession();
    session.startTransaction();

    try {
      const order = await this.ordersModel
        .findOne({ _id })
        .select('_id table')
        .session(session)
        .lean();

      if (!order) throw new HttpException('Order not existed!', 400);
      await this.ordersModel.updateOne(
        { _id },
        { $set: { isPayment: true, paymentTime: new Date() } },
        { session },
      );

      await this.tableModel.updateOne(
        { _id: order.table },
        { $set: { havingGuests: false } },
        { session },
      );
      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  pushSocketToCooking(foods: any[]) {
    const justPushIsFoods = foods.filter(
      (food) =>
        !['Bia', 'Thực phẩm thêm', 'Nước', 'Bánh tráng'].includes(
          food.category,
        ),
    );
    return justPushIsFoods;
  }
}
