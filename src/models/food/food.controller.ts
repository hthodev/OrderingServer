import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import { FoodService } from './Food.service';

@Controller('food')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

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
