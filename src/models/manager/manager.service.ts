import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Orders, OrdersDocument } from '../orders/orders.schema';
import * as moment from 'moment';
import 'moment-timezone';
import FOOD from 'src/constants/foods';
import { User, UserDocument } from '../users/users.schema';

@Injectable()
export class ManagerService {
  constructor(
    @InjectModel(Orders.name)
    private readonly orderModel: Model<OrdersDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getChartData(dateRaw: string, range: 'week' | 'month' | 'year') {
    const TZ = 'UTC';
    const now = moment
      .tz(
        dateRaw,
        [moment.ISO_8601, 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD/MM/YYYY'],
        TZ,
      )
      .startOf('day');

    if (!now.isValid()) throw new Error('Invalid dateRaw');

    let start = now.clone();
    let end = now.clone();
    let labels: string[] = [];
    let getKey: (d: moment.Moment) => number;

    if (range === 'week') {
      start = start.startOf('isoWeek');
      end = end.endOf('isoWeek');
      labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      getKey = (d) => parseInt(d.tz(TZ).format('E'), 10); // 1..7
    } else if (range === 'month') {
      start = start.startOf('month');
      end = end.endOf('month');
      const weeksInMonth = Math.ceil(now.daysInMonth() / 7);
      labels = Array.from({ length: weeksInMonth }, (_, i) => `Tuần ${i + 1}`);
      getKey = (d) => Math.ceil(d.tz(TZ).date() / 7); // 1..5
    } else {
      // year
      start = start.startOf('year');
      end = end.endOf('year');
      labels = [
        'Th1',
        'Th2',
        'Th3',
        'Th4',
        'Th5',
        'Th6',
        'Th7',
        'Th8',
        'Th9',
        'Th10',
        'Th11',
        'Th12',
      ];
      getKey = (d) => parseInt(d.tz(TZ).format('M'), 10); // 1..12
    }

    const orders = await this.orderModel
      .find({
        createdAt: { $gte: start.toDate(), $lte: end.toDate() },
        isPayment: true,
      })
      .sort({ paymentTime: -1 })
      .lean();

    const grouped: Record<number, number> = {};

    for (const order of orders) {
      const d = moment.tz((order as any).createdAt, TZ);
      const key = getKey(d);
      const amount = order.foods.reduce(
        (sum, f) => sum + (f.total || f.price * f.quantity),
        0,
      );
      grouped[key] = (grouped[key] || 0) + amount;
    }

    const chartData = labels.map((label, idx) => {
      const key = idx + 1;
      return { label, total: (grouped[key] || 0) / 1000 }; // nghìn
    });

    return { range, chartData };
  }

  async topFoods(date, range: 'week' | 'month' | 'year') {
    const now = moment(date);
    let startDate: Date;
    let endDate: Date;

    if (range === 'week') {
      startDate = now.clone().startOf('isoWeek').toDate();
      endDate = now.clone().endOf('isoWeek').toDate();
    } else if (range === 'month') {
      startDate = now.clone().startOf('month').toDate();
      endDate = now.clone().endOf('month').toDate();
    } else if (range === 'year') {
      startDate = now.clone().startOf('year').toDate();
      endDate = now.clone().endOf('year').toDate();
    }

    const excludedCategories = [
      FOOD.CATEGORY.BIA,
      FOOD.CATEGORY.THUC_PHAM_THEM,
      FOOD.CATEGORY.NUOC,
      FOOD.CATEGORY.BANH_TRANG,
    ];
    const orders = await this.orderModel
      .find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .lean();

    const foodCount: { [foodName: string]: number } = {};
    const beerCount: { [beerName: string]: number } = {};

    for (const order of orders) {
      for (const food of order.foods || []) {
        if (food.category === FOOD.CATEGORY.BIA) {
          for (const user of food.user || []) {
            const orderedAt = moment(user.orderedAt);
            if (!orderedAt.isBetween(startDate, endDate, undefined, '[]'))
              continue;

            beerCount[food.name] = (beerCount[food.name] || 0) + food.quantity;
          }
          continue;
        }

        if (excludedCategories.includes(food.category as any)) continue;

        for (const user of food.user || []) {
          const orderedAt = moment(user.orderedAt);
          if (!orderedAt.isBetween(startDate, endDate, undefined, '[]'))
            continue;

          foodCount[food.name] = (foodCount[food.name] || 0) + food.quantity;
        }
      }
    }

    const topFoods = Object.entries(foodCount)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .filter((f) => f.name);

    const topBeers = Object.entries(beerCount)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .filter((f) => f.name);

    return {
      range,
      topFoods,
      topBeers,
    };
  }
  async invoiceListByDate(dateRaw: string) {
    const TZ = 'UTC';
    const start = moment
      .tz(
        dateRaw,
        [moment.ISO_8601, 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD/MM/YYYY'],
        TZ,
      )
      .startOf('day');
    const nextDayStart = moment
      .tz(
        dateRaw,
        [moment.ISO_8601, 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD/MM/YYYY'],
        TZ,
      )
      .add(1, 'day')
      .startOf('day')
      .toDate();

    const orders = await this.orderModel
      .find({
        createdAt: {
          $gte: start,
          $lt: nextDayStart,
        },
        isPayment: true,
      })
      .sort({ paymentTime: -1 })
      .select('_id isPayment createdAt updatedAt paymentTime total foods')
      .lean()
      .populate('table', '_id name')
      .populate('orderer', '_id fullName username')
      .populate('cashier', '_id fullName username');

    return orders.map((order) => {
      const total = order.foods.reduce((acc, cur) => acc + cur.total, 0);
      delete order.foods;
      return {
        ...order,
        total: order.total || total,
      };
    });
  }

  async accounts(search?: string, position?: string, user?: { _id: any }) {
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter: any = {};

    if (search && search.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [
        { fullName: pattern },
        { username: pattern },
        { phone: pattern },
      ];
    }

    if (position && position !== 'all') {
      filter.position = position;
    }

    const users = await this.userModel.find(filter).select('-password').lean();

    const myId = String(user?._id || '');

    return users.map((u: any) => ({
      ...u,
      itsMe: String(u._id) === myId,
    }));
  }

  async reportByCategory(dateRaw) {
    const TZ = 'UTC';
    const start = moment
      .tz(
        dateRaw,
        [moment.ISO_8601, 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD/MM/YYYY'],
        TZ,
      )
      .startOf('day');
    const nextDayStart = moment
      .tz(
        dateRaw,
        [moment.ISO_8601, 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD/MM/YYYY'],
        TZ,
      )
      .add(1, 'day')
      .startOf('day')
      .toDate();

    const orders = await this.orderModel
      .find({
        createdAt: {
          $gte: start,
          $lt: nextDayStart,
        },
        isPayment: true,
      })
      .sort({ paymentTime: -1 })
      .select('_id isPayment createdAt paymentTime total foods')
      .lean();
    const foods = [];
    const beers = [];
    const alcohols = [];
    const waters = [];

    for (const order of orders) {
      order?.foods?.forEach((food) => {
        if (
          ![FOOD.CATEGORY.BIA, FOOD.CATEGORY.NUOC, FOOD.CATEGORY.RUOU].includes(
            food.category as any,
          )
        ) {
          foods.push({
            total: food.total || food.price * food.quantity,
            quantity: food.quantity,
          });
        }
        if (food.category === FOOD.CATEGORY.BIA) {
          beers.push({
            total: food.total || food.price * food.quantity,
            quantity: food.quantity,
          });
        }
        if (food.category === FOOD.CATEGORY.RUOU) {
          alcohols.push({
            total: food.total || food.price * food.quantity,
            quantity: food.quantity,
          });
        }
        if (food.category === FOOD.CATEGORY.NUOC) {
          waters.push({
            total: food.total || food.price * food.quantity,
            quantity: food.quantity,
          });
        }
      });
    }

    return {
      food: {
        totalRevenue: foods.reduce((acc, cur) => acc + cur.total, 0),
        totalQuantity: foods.reduce((acc, cur) => acc + cur.quantity, 0),
      },
      beer: {
        totalRevenue: beers.reduce((acc, cur) => acc + cur.total, 0),
        totalQuantity: beers.reduce((acc, cur) => acc + cur.quantity, 0),
      },
      water: {
        totalRevenue: waters.reduce((acc, cur) => acc + cur.total, 0),
        totalQuantity: waters.reduce((acc, cur) => acc + cur.quantity, 0),
      },
      alcohol: {
        totalRevenue: alcohols.reduce((acc, cur) => acc + cur.total, 0),
        totalQuantity: alcohols.reduce((acc, cur) => acc + cur.quantity, 0),
      },
    };
  }
}
