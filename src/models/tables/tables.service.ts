import { HttpException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Table, TableDocument } from './tables.schema';
import { TableLayout, TableLayoutDocument } from './tableLayout.schema';
import { Orders, OrdersDocument } from '../orders/orders.schema';
import FOOD, { FoodCategory } from 'src/constants/foods';

@Injectable()
export class TableService {
  constructor(
    @InjectModel(Table.name)
    private tableModel: Model<TableDocument>,

    @InjectModel(TableLayout.name)
    private tableLayoutModel: Model<TableLayoutDocument>,

    @InjectModel(Orders.name)
    private orderModel: Model<OrdersDocument>,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async tableList() {
    const tables = await this.tableModel.find().lean();
    const activeTableIds = tables
      .filter((t) => t.havingGuests)
      .map((a) => a._id);

    const orders = await this.orderModel.aggregate([
      { $match: { table: { $in: activeTableIds } } },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: '$table',
          latestOrder: { $first: '$$ROOT' },
        },
      },
    ]);
    const orderMap = new Map(
      orders.map((o) => [o._id.toString(), o.latestOrder]),
    );

    return tables.map((t) => ({
      ...t,
      order: orderMap.get(t._id.toString()) || null,
    }));
  }

  async tableDetail(tableId: string) {
    const table = await this.tableModel.findById(tableId).lean();
    if (!table) throw new HttpException('Không tìm thấy bàn!', 404);

    let latestOrder = null;

    if (table.havingGuests) {
      const orders = await this.orderModel
        .find({ table: table._id })
        .sort({ updatedAt: -1 })
        .limit(1)
        .lean();

      latestOrder = orders[0] || null;
    }

    return {
      ...table,
      order: latestOrder,
    };
  }

  async createTableLayout({
    layouts,
    type,
  }: {
    layouts: string[][];
    type: string;
  }) {
    await this.tableLayoutModel.create({
      layouts,
      type,
    });
    return { success: true };
  }

  async updateTableLayout(layouts: string[][], types: string[]) {}

  async removeTableLayout(_id) {}

  async tableLayout(types: string[]) {
    return this.tableLayoutModel
      .find({
        type: { $in: types },
      })
      .lean();
  }

  async createTable({ name, type }) {
    try {
      await this.tableModel.create({
        name,
        type,
      });

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async havingGuests(isGuest, _id, session) {
    return await this.tableModel.updateOne(
      { _id },
      { $set: { havingGuests: isGuest } },
      { session },
    );
  }

  async tableWithFoodOrderForKitchen() {
    const tables = await this.tableModel.find().lean();
    const activeTableIds = tables
      .filter((t) => t.havingGuests)
      .map((a) => a._id);

    const orders = (
      await this.orderModel.aggregate([
        { $match: { table: { $in: activeTableIds } } },
        { $sort: { updatedAt: -1 } },
        {
          $group: {
            _id: '$table',
            latestOrder: { $first: '$$ROOT' },
          },
        },
      ])
    ).map((order) => {
      const foods = order?.latestOrder?.foods;
      if (!foods?.length) return;
      const foodsForCooking = foods.filter(
        (food) =>
          ![
            FOOD.CATEGORY.BIA,
            FOOD.CATEGORY.NUOC,
            FOOD.CATEGORY.BANH_TRANG,
            FOOD.CATEGORY.THUC_PHAM_THEM,
          ].includes(food.category),
      );
      order.latestOrder.foods = foodsForCooking;
      return order;
    });

    const orderMap = new Map(
      orders.map((o) => [o._id.toString(), o.latestOrder]),
    );

    return tables
      .map((t) => ({
        ...t,
        order: orderMap.get(t._id.toString()) || null,
      }))
      .filter((t) => t.order && t?.order?.foods?.length)
      .sort(
        (a, b) =>
          new Date(b.order.updatedAt).getTime() -
          new Date(a.order.updatedAt).getTime(),
      );
  }
}
