import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Food, FoodSchema } from './food.schema';
import { FoodService } from './food.service';
import { FoodController } from './food.controller';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Food.name, schema: FoodSchema },
    ]),
  ],
  providers: [FoodService],
  controllers: [FoodController],
  exports: [FoodService],
})
export class FoodModule implements OnModuleInit {
  constructor(
    @InjectModel(Food.name)
    private readonly foodModel: Model<Food>
  ) {}

  async onModuleInit() {
    const exists = await this.foodModel.exists({ name: 'Bánh Tráng' });
    if (!exists) {
      await this.foodModel.create({
        _id: new Types.ObjectId('64bfbf1e8f2a4a0012d3abcd'),
        name: 'Bánh Tráng',
        price: 15000,
        unit: 'cái',
      });
    }
  }
}
