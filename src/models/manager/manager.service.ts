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

  async getChartData(date: string, range: 'week' | 'month' | 'year') {
    const now = moment(date);
    let startDate: Date;
    let endDate: Date;
    let labels: string[] = [];
    let getKey: (date: moment.Moment) => number;

    if (range === 'week') {
      startDate = now.clone().startOf('isoWeek').toDate(); // Monday
      endDate = now.clone().endOf('isoWeek').toDate();
      labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      getKey = (date) => parseInt(date.format('E')); // 1 (T2) to 7 (CN)
    }

    if (range === 'month') {
      startDate = now.clone().startOf('month').toDate();
      endDate = now.clone().endOf('month').toDate();
      labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5'];
      getKey = (date) => {
        const day = date.date(); // 1-31
        return Math.ceil(day / 7); // 1-5
      };
    }

    if (range === 'year') {
      startDate = now.clone().startOf('year').toDate();
      endDate = now.clone().endOf('year').toDate();
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
      getKey = (date) => parseInt(date.format('M')); // 1-12
    }

    const orders = await this.orderModel
      .find({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
        isPayment: true,
      })
      .lean();

    const grouped: { [key: number]: number } = {};

    for (const order of orders) {
      const date = moment((order as any).createdAt);
      const key = getKey(date);
      const amount = order.foods.reduce((sum, food) => {
        return sum + (food.total ?? food.price * food.quantity);
      }, 0);
      grouped[key] = (grouped[key] || 0) + amount;
    }

    const chartData = labels.map((label, index) => {
      const key = index + 1;
      return {
        label,
        total: (grouped[key] || 0) / 1000, // đơn vị nghìn
      };
    });

    return {
      range,
      chartData,
    };
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
  async invoiceListByDate(dateRaw: string | Date) {
    const TZ = 'Asia/Ho_Chi_Minh';
    const start = moment.tz(dateRaw, TZ).startOf('day').toDate();
    const nextDayStart = moment
      .tz(dateRaw, TZ)
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
      .select('_id isPayment createdAt updatedAt paymentTime total')
      .lean()
      .populate('table', '_id name')
      .populate('orderer', '_id fullName username')
      .populate('cashier', '_id fullName username');
    return orders.map(order => {
      return {
        ...order,
        total: order.total || order.foods.reduce((acc, cur) => acc + cur.total, 0)
      }
    });
  }
  escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  async accounts(search?: string, position?: string, user?: { _id: any }) {
    const filter: any = {};

    if (search && search.trim()) {
      const pattern = new RegExp(this.escapeRegex(search.trim()), 'i');
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
}
