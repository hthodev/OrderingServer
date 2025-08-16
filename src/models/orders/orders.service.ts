import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Orders, OrdersDocument } from './orders.schema';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Table, TableDocument } from '../tables/tables.schema';
import { SocketGateway } from 'src/websockets/socket.gateway';
import FOOD from 'src/constants/foods';
import { exceptionCategory } from 'src/commons/shares';

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
      const table = await this.tableModel.findOne({ _id: table_id }).lean();
      const orders = await this.ordersModel.create(
        [
          {
            table: new Types.ObjectId(table_id),
            foods: foods.map((food) => ({
              ...food,
              ...(![
                FOOD.CATEGORY.BIA,
                FOOD.CATEGORY.NUOC,
                FOOD.CATEGORY.BANH_TRANG,
                FOOD.CATEGORY.THUC_PHAM_THEM,
              ].includes(food.category)
                ? { isCooked: false }
                : {}),
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

      const foodsForCooking = orders[0].foods.filter(
        (food) =>
          ![
            FOOD.CATEGORY.BIA,
            FOOD.CATEGORY.NUOC,
            FOOD.CATEGORY.BANH_TRANG,
            FOOD.CATEGORY.THUC_PHAM_THEM,
          ].includes(food.category as any),
      );
      if (foodsForCooking?.length) {
        this.socketGateway.newOrder({ foods: foodsForCooking, table });
      }

      return orders.map((o) => o.toJSON())[0];
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
        .select('foods table')
        .session(session)
        .lean();

      const table = await this.tableModel.findOne({ _id: order.table }).lean();
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

      
      if (bulkOps.length > 0) {
        await this.ordersModel.bulkWrite(bulkOps, { session });
      }
      
      await session.commitTransaction();
      this.pushSocketToCooking(changedFoods, table);
      this.socketGateway.notifyTableUpdate();
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
        if (returnItem.returnQuantity > quantity) {
          throw new HttpException(
            `Món ăn "${food.name}" có số lượng trả (${returnItem.returnQuantity}) nhiều hơn số lượng đã order (${quantity})`,
            400,
          );
        }
        quantity -= returnItem.returnQuantity;
      }

      if (quantity > 0) {
        bills.push({
          ...food,
          quantity,
          total: food.price * quantity,
        });
      }
    }

    await this.ordersModel.updateOne({ _id }, { $set: { foods: bills } });

    const totalBill = bills.reduce((prev, curr) => prev + curr.total, 0);

    return {
      bills,
      totalBill,
      paymentTime: order.paymentTime || null,
    };
  }

  async customerPaid(_id, user) {
    const session: ClientSession = await this.ordersModel.db.startSession();
    session.startTransaction();

    try {
      const order = await this.ordersModel
        .findOne({ _id })
        .select('_id table foods')
        .session(session)
        .lean();
      const total = order.foods.reduce((acc, cur) => acc + (cur.total || 0), 0);
      if (!order) throw new HttpException('Order not existed!', 400);
      await this.ordersModel.updateOne(
        { _id },
        {
          $set: {
            isPayment: true,
            paymentTime: new Date(),
            total,
            cashier: user._id,
          },
        },
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

  pushSocketToCooking(foods: any[], table: any) {
    const justPushIsFoods = foods.filter(
      (food) =>
        !['Bia', 'Thực phẩm thêm', 'Nước', 'Bánh tráng'].includes(
          food.category,
        ),
    );
    if (justPushIsFoods?.length) {
      this.socketGateway.newOrder({ foods: justPushIsFoods, table });
    }
  }

  async updateCookedFood(food_id, order_id) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const order = await this.ordersModel.findOne({ _id: order_id }).lean();
      if (!order) throw new HttpException('Không tìm thấy order này', 400);
      const foods = order.foods.map((food) => {
        if (food._id === food_id) {
          food.isCooked = true;
        }
        return food;
      });
      await this.ordersModel.updateOne(
        { _id: order_id },
        { $set: { foods } },
        { session, timestamps: false },
      );

      if (
        order.foods.every((f) => exceptionCategory(f.category) || f.isCooked)
      ) {
        await this.ordersModel.updateOne(
          { _id: order_id },
          { $set: { updatedAt: (order as any).createdAt } },
          { session, timestamps: false },
        );
      }

      await session.commitTransaction();

      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      return { success: false, message: error.message };
    }
  }
}
