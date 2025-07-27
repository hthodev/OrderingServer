import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { FoodService } from './Food.service';

@Controller('food')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Post('create')
  async create(@Body() { price, image, name, unit, describe, category }) {
    return await this.foodService.addFood({ price, image, name, unit, describe, category });
  }


  @HttpCode(200)
  @Post('foodList')
  async foodList(@Body() { search, filter }) {
    return await this.foodService.foodList(search, filter);
  }

  @Put('updateFood')
  async updateFood(@Body() body, @Param('_id') _id) {
    return await this.foodService.updateFood(_id, body);
  }

  @Delete('deleteFood')
  async deleteFood(@Param('_id') _id) {
    return await this.foodService.deleteFood(_id);
  }
}
