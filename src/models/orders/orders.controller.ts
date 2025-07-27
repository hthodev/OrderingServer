import { Body, Controller, Get, HttpCode, Param, Post, Put, Req } from '@nestjs/common';
import { OrdersService } from './Orders.service';
import { User } from 'src/commons/decorators/user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @HttpCode(201)
  @Post('newOrder')
  async newOrder(@Body() { foods, table_id }, @User() user) {
    return await this.ordersService.newOrder({ foods, table_id }, user);
  }

  @HttpCode(200)
  @Put('orderMore/:_id')
  async orderMore(@Body() { foods }, @Param('_id') _id, @User() user) {
    return await this.ordersService.orderMore(_id, { foods }, user)
  }

  @HttpCode(200)
  @Get('order/:_id')
  async order(@Param('_id') _id) {
    return await this.ordersService.order(_id)
  }

  @HttpCode(200)
  @Post('checkInvoice/:_id')
  async customerPaymentInvoice(@Body() { returnFoods }, @Param('_id') _id) {
    return await this.ordersService.customerPaymentInvoice(_id, returnFoods);
  }

  @HttpCode(200)
  @Put('paid/:_id')
  async customerPaid(@Param('_id') _id) {
    return await this.ordersService.customerPaid(_id)
  }
}
