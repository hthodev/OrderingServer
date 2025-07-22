import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Food, FoodDocument } from './Food.schema';
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

    return await this.foodModel
      .find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { unit: { $regex: unit, $options: 'i' } },
          { price: { $gte: minPrice, $lte: maxPrice } },
        ],
      })
      .lean();
  }

  async addFood({ price, image, name, unit, describe }) {
    const food = await this.foodModel.findOne({ name }).lean();

    if (food) {
      throw new HttpException('Food existed!', 400);
    }
    return await this.foodModel.create({
      price,
      image,
      name,
      unit,
      describe
    });
  }

  async updateFood(
    _id: string,
    data: { price?: number; image?: string; name?: string; unit?: string, describe?: string },
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

    return await this.foodModel.updateOne(
      { _id },
      {
        $set: updateFields,
      },
    );
  }

  async deleteFood(_id: string) {
    const food = await this.foodModel.findOne({ _id }).lean();

    if (!food) {
      throw new HttpException('Food not existed!', 400);
    }
    return await this.foodModel.deleteOne({ _id });
  }
}
