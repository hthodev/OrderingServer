import { Controller, Get, Post, Body, Param, HttpCode, Query } from '@nestjs/common';
import { TableService } from './tables.service';

@Controller('tables')
export class TableController {
  constructor(private readonly tableService: TableService) {}

  @Get("list")
  async tableList() {
    return await this.tableService.tableList()
  }

  @Get("tableById")
  async table(@Query('_id') _id) {
    return await this.tableService.tableDetail(_id)
  }

  @HttpCode(201)
  @Post("create")
  async createTable(@Body() { name, type }) {
    return await this.tableService.createTable({ name, type })
  }

  @HttpCode(201)
  @Post("createLayoutTable")
  async createLayoutTable(@Body() { layouts, type }) {
    return await this.tableService.createTableLayout({ layouts, type })
  }

  @HttpCode(200)
  @Post("layoutTable")
  async layoutTable(@Body() { types }: { types: string[]}) {
    return await this.tableService.tableLayout(types)
  }
}