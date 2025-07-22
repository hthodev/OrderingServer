import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TableService } from './tables.service';

@Controller('tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get("list")
  async tableList() {
    return await this.tableService.tableList()
  }
}