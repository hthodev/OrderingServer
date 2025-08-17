import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Food, FoodDocument } from './food.schema';
import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class FoodService {
  constructor(
    @InjectModel(Food.name)
    private foodModel: Model<FoodDocument>,
  ) {}
  async foodList(
    search: string,
    filter: { unit?: string; minPrice?: number; maxPrice?: number },
  ) {
    const { unit = '', minPrice = 0, maxPrice = Infinity } = filter;

    return (
      await this.foodModel.find({
        name: { $regex: search, $options: 'i' },
        unit: { $regex: unit, $options: 'i' },
        price: { $gte: minPrice, $lte: maxPrice },
      })
    ).map((item) => item.toJSON());
  }

  async addFood({ price, image, name, unit, describe, category }) {
    const food = await this.foodModel.findOne({ name }).lean();

    if (food) {
      throw new HttpException('Food existed!', 400);
    }
    await this.foodModel.create({
      price,
      image,
      name,
      unit,
      describe,
      category,
    });

    return { success: true };
  }

  async updateFood(
    _id: string,
    data: {
      price?: number;
      image?: string;
      name?: string;
      unit?: string;
      describe?: string;
    },
  ) {
    const food = await this.foodModel.findOne({ _id }).lean();

    if (!food) {
      throw new HttpException('Food not existed!', 400);
    }

    const updateFields = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateFields[key] = value;
      }
    }

    await this.foodModel.updateOne(
      { _id },
      {
        $set: updateFields,
      },
    );

    return { success: true };
  }

  async deleteFood(_id: string) {
    const food = await this.foodModel.findOne({ _id }).lean();

    if (!food) {
      throw new HttpException('Food not existed!', 400);
    }
    await this.foodModel.deleteOne({ _id });
    return { success: true };
  }
}
