import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Table, TableSchema } from './tables.schema';
import { TableService } from './tables.service';
import { TableController } from './tables.controller';
import { TableLayout, TableLayoutSchema } from './tableLayout.schema';
import { Orders, OrdersSchema } from '../orders/orders.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Table.name, schema: TableSchema },
      { name: TableLayout.name, schema: TableLayoutSchema },
      { name: Orders.name, schema: OrdersSchema },
    ]),
  ],
  providers: [TableService],
  controllers: [TableController],
  exports: [TableService],
})
export class TableModule {}