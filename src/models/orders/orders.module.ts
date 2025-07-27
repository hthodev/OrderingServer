import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Orders, OrdersSchema } from './Orders.schema';
import { OrdersService } from './Orders.service';
import { OrdersController } from './Orders.controller';
import { Table, TableSchema } from '../tables/tables.schema';
import { SocketGateway } from 'src/websockets/socket.gateway';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Orders.name, schema: OrdersSchema },
      { name: Table.name, schema: TableSchema },
    ]),
  ],
  providers: [OrdersService, SocketGateway],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}