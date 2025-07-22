import { Body, Controller, Param, Post, Put, Req } from '@nestjs/common';
import { OrdersService } from './Orders.service';
import { User } from 'src/commons/decorators/user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('newOrder')
  async newOrder(@Body() { foods, table_id }, @User() user) {
    return await this.ordersService.newOrder({ foods, table_id }, user);
  }

  @Post('orderMore')
  async orderMore(@Body() { foods }, @Param('_id') _id, @User() user) {
    return await this.ordersService.orderMore(_id, { foods }, user)
  }

  @Post('checkInvoice')
  async customerPaymentInvoice(@Body() body, @Param('_id') _id) {
    return await this.ordersService.customerPaymentInvoice(_id, body);
  }

  @Put('paid')
  async customerPaid(@Param('_id') _id) {
    return await this.ordersService.customerPaid(_id)
  }
}
