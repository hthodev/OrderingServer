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
import { ManagerService } from './manager.service';
import { User } from 'src/commons/decorators/user.decorator';

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Get("orders/ordersByTimeRange")
  async ordersByTimeRange(@Query() { type, date }) {
    return await this.managerService.getChartData(date, type);
  }

  
  @Get("foods/topFoods")
  async topFoods(@Query() { date, type }) {
    return await this.managerService.topFoods(date, type);
  }

    
  @Get("orders/invoicesByDate")
  async invoiceListByDate(@Query() { date }) {
    return await this.managerService.invoiceListByDate(date);
  }

  @HttpCode(200)
  @Get('users/accounts')
  async accounts(@Query() {position, search }, @User() user) {
    return await this.managerService.accounts(search, position, user);
  }
}
